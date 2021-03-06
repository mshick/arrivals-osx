import assert from 'assert'
import { FSWatcher } from 'chokidar'
import fs from 'fs'
import path from 'path'
import * as logger from 'winston'
import { createDispatcher } from './dispatcher'
import { createFileWatcher, FileWatcherOptions } from './fileWatcher'
import { createLogger, LoggerOptions } from './logger'
import { createFilesDb } from './filesDb'
import { createQueue, TaskQueueOptions } from './taskQueue'
import { buildDefaults } from './utils'
import { createWorker, WorkerOptions } from './worker'

export interface ArrivalsOptions {
  readonly tagPath?: string
  readonly atomicparsleyPath: string
  readonly audioDestination: string
  readonly convertAudioExtensions: string[]
  readonly convertVideoExtensions: string[]
  readonly copyAudioExtensions: string[]
  readonly copyVideoExtensions: string[]
  readonly cwd: string
  readonly dbPath: string
  readonly logLevel: string
  readonly logType: string
  readonly logFile: string
  readonly tmpPath: string
  readonly videoDestination: string
  readonly watchPaths: string[]
  readonly maxRetries: number
  readonly retryDelay: number
  readonly batchDelay: number
}

const mapWatchPaths = (cwd: string) => (p: string) => {
  const watchPath = path.isAbsolute(p) === true ? p : path.resolve(cwd, p)

  assert(
    watchPath && fs.statSync(watchPath).isDirectory(),
    `Watch path must exist and be a directory`
  )

  return watchPath
}

export async function watch(): Promise<FSWatcher[]> {
  const options = buildDefaults()

  createLogger(options as LoggerOptions)

  const { cwd, watchPaths, videoDestination, audioDestination } = options

  logger.debug(`Starting...`)
  logger.debug(`cwd: %s`, cwd)
  logger.debug(`Video destination: %s`, videoDestination)

  assert(
    videoDestination && fs.statSync(videoDestination).isDirectory(),
    `Video destination must exist and be a directory`
  )

  logger.debug(`Audio destination: %s`, audioDestination)

  assert(
    audioDestination && fs.statSync(audioDestination).isDirectory(),
    `Audio destination must exist and be a directory`
  )

  const workerOptions: WorkerOptions = { ...options }
  const worker = createWorker(workerOptions)
  const queue = createQueue(worker.handler.bind(worker), options as TaskQueueOptions)
  const filesDb = createFilesDb()
  const dispatcher = createDispatcher({ filesDb, queue, watchPaths })

  await dispatcher.init()

  logger.debug(`Database created`)

  const pathsToWatch = watchPaths.map(mapWatchPaths(cwd))

  logger.debug(`Watching paths: %s`, pathsToWatch.toString())

  const watchers = watchPaths.map(watchPath => {
    const fileWatcherOptions: FileWatcherOptions = {
      dispatcher,
      watchPath,
      ...options,
    }

    const fileWatcher = createFileWatcher(fileWatcherOptions)

    return fileWatcher.init()
  })

  return Promise.all(watchers)
}
