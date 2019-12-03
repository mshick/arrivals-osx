// tslint:disable:no-if-statement
// tslint:disable:no-let
import { spawn } from 'child_process';
import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';
import fs from 'fs';
import glob from 'glob';
import path from 'path';
import log from 'winston';
import { BinPaths } from './typings';

const checkVideoStream = (_: Error, metadata: FfprobeData): boolean => {
  if (!metadata || !metadata.streams) {
    return false;
  }

  const videoStream = metadata.streams.filter(
    stream => stream.codec_name === 'mjpeg'
  );

  if (videoStream.length) {
    if (metadata.streams.length === 1) {
      throw new Error('Invalid stream length');
    }

    // log.debug('Has cover stream:');
    // log.debug(videoStream[0]);

    return true;
  }

  return false;
};

const findCoverFile = (dirname: string): string => {
  const preferredFilenames = [
    'cover.jpg',
    'cover.jpeg',
    'folder.jpg',
    'folder.jpeg',
    'front.jpg',
    'front.jpeg'
  ];

  const filepaths = glob.sync('**/*.{jpeg,jpg}', { cwd: dirname });

  let found;

  for (const filepath of filepaths) {
    const base = path.basename(filepath).toLowerCase();
    if (preferredFilenames.indexOf(path.basename(base)) > -1) {
      found = filepath;
    }

    if (found) {
      continue;
    }

    found = filepath;
  }

  if (found) {
    const resolved = path.resolve(dirname, found);
    log.debug('Found cover art file: %s', resolved);
    return resolved;
  }

  return '';
};

const embedCoverFile = (
  outputAudio: string,
  coverFile: string,
  binPaths: BinPaths
): Promise<void> => {
  const cwd = path.dirname(outputAudio);

  log.debug(
    'embedCoverFile: %s, %s, %s, %s',
    binPaths.atomicparsley,
    outputAudio,
    `cover=${coverFile} --overWrite`,
    cwd
  );

  return new Promise((resolve, reject) => {
    const atomicparsley = spawn(
      binPaths.atomicparsley,
      [outputAudio, `--artwork=${coverFile}`, '--overWrite'],
      { cwd }
    );

    atomicparsley.stderr.on('data', data => log.debug(data.toString()));

    atomicparsley.on('error', (err: Error) => reject(err));

    atomicparsley.on('exit', (code: any, signal: any) => {
      if (signal) {
        reject(new Error(`atomicparsley was killed with signal ${signal}`));
      } else if (code) {
        reject(new Error(`atomicparsley exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
};

export function convertAudio(
  source: string,
  destination: string,
  binPaths: BinPaths
): Promise<any> {
  const dirname = path.dirname(source);
  const outputFilename = path
    .basename(source)
    .replace(path.extname(source), '.m4a');
  const outputAudio = path.resolve(destination, outputFilename);
  const outputCover = path.resolve(destination, 'cover.jpg');

  log.debug(outputAudio);

  const command = ffmpeg(source, { logger: log })
    .noVideo()
    .audioCodec('alac')
    .outputOptions('-map 0:0')
    .outputOptions('-movflags')
    .outputOptions('+faststart')
    .addOutput(outputAudio);

  return new Promise((resolve, reject) => {
    let coverFileEmbedded: string;

    command.on('start', cmdline => log.debug('ffmpeg command: %s', cmdline));
    command.on('error', err => reject(err));

    command.on('end', () => {
      const coverFile =
        coverFileEmbedded && fs.existsSync(coverFileEmbedded)
          ? coverFileEmbedded
          : findCoverFile(dirname);

      if (coverFile) {
        embedCoverFile(outputAudio, coverFile, binPaths)
          .then(() => {
            resolve({ audio: outputAudio, hadCoverFile: true });
          })
          .catch(() => {
            resolve({ audio: outputAudio, hadCoverFile: true });
          });
      } else {
        resolve({
          audio: outputAudio,
          cover: coverFileEmbedded,
          hadCoverFileEmbedded: true
        });
      }
    });

    ffmpeg.ffprobe(source, (err, metadata) => {
      try {
        const hasVideoStream = checkVideoStream(err, metadata);

        if (hasVideoStream) {
          coverFileEmbedded = outputCover;
          command.addOutput(outputCover);
        }

        log.debug('Starting conversion of %s', source);

        command.run();
      } catch (err) {
        reject(err);
      }
    });
  });
}
