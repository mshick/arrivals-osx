import path from 'path';
import logger from 'winston';
import { watch } from '../lib/arrivals';

const {
  CWD: cwd = process.cwd(),
  DB_PATH: dbPath = './fixtures/db',
  VIDEO_DESTINATION: videoDestination = './fixtures/videoDestination',
  VIDEO_CONVERT_EXTENSIONS: convertVideoExtensions = '',
  VIDEO_COPY_EXTENSIONS: copyVideoExtensions = 'mkv',
  AUDIO_DESTINATION: audioDestination = './fixtures/audioDestination',
  AUDIO_CONVERT_EXTENSIONS: convertAudioExtensions = 'flac',
  AUDIO_COPY_EXTENSIONS: copyAudioExtensions = 'mp3,m4a,m4b',
  LOG_FILE: logFile = '',
  LOG_LEVEL: logLevel = 'debug',
  LOG_TYPE: logType = 'console',
  TMP_PATH: tmpPath = './fixtures/tmpFolder',
  WATCH_PATHS: watchPathsRaw = './fixtures/watchFolder',
  FFMPEG_PATH: ffmpegPath = '/usr/local/bin/ffmpeg',
  MKVTOMP4_PATH: mkvtomp4Path = '/usr/local/bin/mkvtomp4',
  // MP4BOX_PATH: mp4boxPath = '/usr/local/bin/MP4Box',
  MP4BOX_PATH: mp4boxPath = '/usr/local/bin/atomicparsley',
  ATOMICPARSLEY_PATH: atomicparsleyPath = '/usr/local/bin/atomicparsley',
  MKVINFO_PATH: mkvinfoPath = '/usr/local/bin/mkvinfo',
  MKVEXTRACT_PATH: mkvextractPath = '/usr/local/bin/mkvextract'
} = process.env;

const watchPathsArr = watchPathsRaw ? watchPathsRaw.split(',') : [];

const watchPaths = watchPathsArr.map(watchPath => path.resolve(cwd, watchPath));

const options = {
  atomicparsleyPath,
  audioDestination,
  convertAudioExtensions: convertAudioExtensions
    ? convertAudioExtensions.split(',')
    : [],
  convertVideoExtensions: convertVideoExtensions
    ? convertVideoExtensions.split(',')
    : [],
  copyAudioExtensions: copyAudioExtensions
    ? copyAudioExtensions.split(',')
    : [],
  copyVideoExtensions: copyVideoExtensions
    ? copyVideoExtensions.split(',')
    : [],
  cwd,
  dbPath,
  ffmpegPath,
  logFile,
  logLevel,
  logType,
  mkvextractPath,
  mkvinfoPath,
  mkvtomp4Path,
  mp4boxPath,
  tmpPath,
  videoDestination,
  watchPaths
};

watch(options)
  .then(() => {
    logger.info('Arrivals has started!');
  })
  .catch(err => {
    logger.error(err);
  });
