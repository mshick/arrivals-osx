import { sync as delSync } from 'del'
import { existsSync } from 'fs'
import path from 'path'
import logger from 'winston'
import { convertAudio } from './convertAudio'
import { copyFile } from './copyFile'
import { FileJobStatus, FileJobType } from './enums'
import { isFileBusy } from './isFileBusy'
import { Tag } from './tag'

export interface WorkerOptions {
  readonly tmpPath: string
  readonly audioDestination: string
  readonly videoDestination: string
  readonly atomicparsleyPath: string
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

  public async handler(payload: any, worker: any): Promise<void> {
    const { filepath, jobType } = payload
    const tag = new Tag(filepath)

    try {
      const isBusy = await isFileBusy(filepath)

      if (isBusy) {
        logger.info(`File %s is busy, deferring...`, filepath)
        worker.failedBatch(FileJobStatus.Error)
      }

      logger.info(`Starting work for %s`, filepath)
      logger.debug(`Work type: %s`, FileJobType[jobType])

      const handled = existsSync(filepath) ? await this.handleFile(filepath, jobType) : false
      worker.finishBatch(handled ? FileJobStatus.Complete : FileJobStatus.Unhandled)
      await finalizeTagsSuccess(tag)
    } catch (err) {
      logger.error(err)
      worker.failedBatch(FileJobStatus.Error)
      await finalizeTagsFailure(tag)
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

        if (audioTmp.audio) {
          delSync([audioTmp.audio], { force: true })
        }

        if (audioTmp.hadCoverFile) {
          delSync([`${dirname}/*cover-resized-*.jpg`], {
            force: true,
          })
        }

        if (audioTmp.hadCoverFileEmbedded) {
          delSync([audioTmp.cover, `${tmpPath}/*cover-resized-*.jpg`], {
            force: true,
          })
        }

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
