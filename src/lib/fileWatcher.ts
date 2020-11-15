import chokidar, { FSWatcher } from 'chokidar'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import logger from 'winston'

import { Dispatcher } from './dispatcher'
import { FileJobType } from './types'

const lstat = promisify(fs.lstat)

export interface FileWatcherOptions {
  readonly dispatcher: Dispatcher
  readonly cwd: string
  readonly watchPath: string
  readonly convertAudioExtensions: string[]
  readonly convertVideoExtensions: string[]
  readonly copyAudioExtensions: string[]
  readonly copyVideoExtensions: string[]
}

export class FileWatcher {
  private options: FileWatcherOptions
  private dispatcher: Dispatcher
  private fswatcher: FSWatcher

  constructor(options: FileWatcherOptions) {
    this.options = options
    this.dispatcher = options.dispatcher
    this.fswatcher = chokidar.watch(options.watchPath, {
      awaitWriteFinish: {
        pollInterval: 500,
        stabilityThreshold: 60000,
      },
      // ignoreInitial: true
    })
  }

  public async init(): Promise<FSWatcher> {
    try {
      logger.info(`Starting watcher`)
      return this.fswatcher.on(`add`, this.onAdd.bind(this))
    } catch (err) {
      logger.error(err)
      throw err
    }
  }

  private onAdd(filePath: string): void {
    try {
      const absFilePath = path.resolve(this.options.watchPath, filePath)

      logger.debug(
        `\n==FileWatcher onAdd==\nFilePath: %s\nAbsolute File Path: %s`,
        filePath,
        absFilePath
      )

      this.handleFileEvent(absFilePath)
    } catch (err) {
      logger.error(err)
    }
  }

  private async handleFileEvent(filePath: string): Promise<boolean> {
    const stat = await lstat(filePath)

    if (
      stat.isFile() &&
      this.isValidFileType(filePath) &&
      (await this.dispatcher.isNewFile(filePath))
    ) {
      return this.handleFile(filePath) && true
    }

    return logger.debug(`Skipping file: %s`, filePath) && false
  }

  private async handleFile(filePath: string): Promise<boolean> {
    logger.info(`Taking file: %s`, filePath)
    const jobType = this.getJobType(filePath)

    logger.debug(`Took %s %s`, filePath, jobType)
    return this.dispatcher.enqueueFile(filePath, jobType)
  }

  private getJobType(filePath: string): FileJobType {
    const ext = path.extname(filePath).substr(1)
    const options = this.options

    switch (true) {
      case options.copyVideoExtensions.includes(ext):
        return FileJobType.CopyVideo
      case options.convertVideoExtensions.includes(ext):
        return FileJobType.ConvertVideo
      case options.copyAudioExtensions.includes(ext):
        return FileJobType.CopyAudio
      case options.convertAudioExtensions.includes(ext):
        return FileJobType.ConvertAudio
      default:
        return FileJobType.Unknown
    }
  }

  private isValidFileType(filePath: string): boolean {
    const jobType = this.getJobType(filePath)

    if (jobType === FileJobType.Unknown) {
      return false
    }

    return true
  }
}

export function createFileWatcher(options: FileWatcherOptions): FileWatcher {
  return new FileWatcher(options)
}
