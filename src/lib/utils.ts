import path from 'path'
import { ArrivalsOptions } from './arrivals'

export function prettyPrint(data: Record<string, unknown>): string {
  return JSON.stringify(data, null, 4)
}

export function buildDefaults(): ArrivalsOptions {
  const {
    CWD: cwd = process.cwd(),
    DB_PATH: dbPath = `./fixtures/db`,
    VIDEO_DESTINATION: videoDestination = `./fixtures/videoDestination`,
    VIDEO_CONVERT_EXTENSIONS: convertVideoExtensions = ``,
    VIDEO_COPY_EXTENSIONS: copyVideoExtensions = `mkv`,
    AUDIO_DESTINATION: audioDestination = `./fixtures/audioDestination`,
    AUDIO_CONVERT_EXTENSIONS: convertAudioExtensions = `flac`,
    AUDIO_COPY_EXTENSIONS: copyAudioExtensions = `mp3,m4a,m4b`,
    LOG_FILE: logFile = ``,
    LOG_LEVEL: logLevel = `debug`,
    LOG_TYPE: logType = `console`,
    TMP_PATH: tmpPath = `./fixtures/tmpFolder`,
    WATCH_PATHS: watchPathsRaw = `./fixtures/watchFolder`,
    ATOMICPARSLEY_PATH: atomicparsleyPath = `/usr/local/bin/atomicparsley`,
  } = process.env

  const watchPathsArr = watchPathsRaw ? watchPathsRaw.split(`,`) : []

  const watchPaths = watchPathsArr.map(watchPath => path.resolve(cwd, watchPath))

  const options: ArrivalsOptions = {
    atomicparsleyPath,
    audioDestination,
    convertAudioExtensions: convertAudioExtensions ? convertAudioExtensions.split(`,`) : [],
    convertVideoExtensions: convertVideoExtensions ? convertVideoExtensions.split(`,`) : [],
    copyAudioExtensions: copyAudioExtensions ? copyAudioExtensions.split(`,`) : [],
    copyVideoExtensions: copyVideoExtensions ? copyVideoExtensions.split(`,`) : [],
    cwd,
    dbPath,
    logFile,
    logLevel,
    logType,
    tmpPath,
    videoDestination,
    watchPaths,
    maxRetries: 99,
    retryDelay: 5000,
    batchDelay: 500,
  }

  return options
}
