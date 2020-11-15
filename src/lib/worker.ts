import { sync as delSync } from 'del'
import { existsSync } from 'fs'
import path from 'path'
import logger from 'winston'
import { Worker as BetterQueueWorker } from 'better-queue'
import { convertAudio } from './convertAudio'
import { copyFile } from './copyFile'
import { FileJobStatus, FileJobType, FileJobPayload } from './types'
import { isFileBusy } from './isFileBusy'
import { Tag } from './tag'

export interface WorkerOptions {
  readonly tmpPath: string
  readonly audioDestination: string
  readonly videoDestination: string
  readonly atomicparsleyPath: string
  readonly tagPath?: string
  readonly watchPaths: string[]
}

// Don't let the tags ruin things...
async function finalizeTagsSuccess(tag: Tag): Promise<void> {
  try {
    await tag.removeTag(`Red`)
    await tag.removeTag(`Yellow`)
    await tag.addTag(`Green`)
  } catch (err) {
    logger.debug(`tagging failure`)
  }
}

async function finalizeTagsFailure(tag: Tag): Promise<void> {
  try {
    await tag.removeTag(`Green`)
    await tag.removeTag(`Yellow`)
    await tag.addTag(`Red`)
  } catch (err) {
    logger.debug(`tagging failure`)
  }
}

export class Worker {
  private options: WorkerOptions

  constructor(options: WorkerOptions) {
    this.options = options
  }

  public async handler(payload: FileJobPayload, worker: BetterQueueWorker): Promise<void> {
    const { filepath, jobType } = payload

    try {
      const isBusy = await isFileBusy(filepath)

      if (isBusy) {
        logger.info(`File %s is busy, deferring...`, filepath)
        worker.failedBatch(FileJobStatus.Error)
      }

      logger.info(`Starting work for %s`, filepath)
      logger.debug(`Work type: %s`, FileJobType[jobType])
    } catch (err) {
      logger.error(err)
      worker.failedBatch(FileJobStatus.Error)
    }

    let tag = null

    if (this.options.tagPath) {
      tag = new Tag(filepath, this.options.tagPath)
    }

    try {
      const handled = existsSync(filepath) ? await this.handleFile(filepath, jobType) : false
      worker.finishBatch(handled ? FileJobStatus.Complete : FileJobStatus.Unhandled)

      if (tag) {
        await finalizeTagsSuccess(tag)
      }
    } catch (err) {
      logger.error(err)
      // If the error is in the handler it likely won't resolve
      worker.finishBatch(FileJobStatus.Error)

      if (tag) {
        await finalizeTagsFailure(tag)
      }
    }
  }

  private async handleFile(filepath: string, jobType: FileJobType): Promise<boolean> {
    const {
      tmpPath,
      audioDestination,
      videoDestination,
      atomicparsleyPath: atomicparsley,
    } = this.options
    const filename = path.basename(filepath)
    const dirname = path.dirname(filepath)

    switch (jobType) {
      case FileJobType.ConvertAudio: {
        logger.debug(`Converting audio file`)

        const audioTmp = await convertAudio(filepath, tmpPath, {
          atomicparsley,
        })

        logger.debug(`Temporary audio file created: %s`, audioTmp.audio)

        const outFileName = path.basename(audioTmp.audio)

        await copyFile(audioTmp.audio, `${audioDestination}/${outFileName}`)

        const deleteFiles = [
          `${dirname}/*cover-resized-*.jpg`,
          `${tmpPath}/*cover-resized-*.jpg`,
          audioTmp.audio,
        ]

        if (audioTmp.cover) {
          deleteFiles.push(audioTmp.cover)
        }

        // Clean up, we blindly delete temporary files...
        delSync(deleteFiles, {
          force: true,
        })

        return true
      }

      case FileJobType.ConvertVideo: {
        logger.debug(`Converting video file`)
        logger.info(`VIDEO CONVERSION IS DISABLED`)
        return true
      }

      case FileJobType.CopyAudio: {
        logger.debug(`Copying audio file`)
        await copyFile(filepath, `${audioDestination}/${filename}`)
        return true
      }

      case FileJobType.CopyVideo: {
        logger.debug(`Copying video file`)
        await copyFile(filepath, `${videoDestination}/${filename}`)
        return true
      }

      default:
        return false
    }
  }
}

export function createWorker(options: WorkerOptions): Worker {
  return new Worker(options)
}
