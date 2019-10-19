// tslint:disable:no-object-mutation
// tslint:disable:no-if-statement
import { sync as delSync } from 'del';
import { existsSync } from 'fs';
import { LevelUp } from 'levelup';
import path from 'path';
import logger from 'winston';
import { convertAudio } from './convertAudio';
import { copyFile } from './copyFile';
import { FileJobStatus, FileJobType } from './enums';
import { isFileBusy } from './isFileBusy';

export interface WorkerOptions {
  readonly files: any;
  readonly tmpPath: string;
  readonly audioDestination: string;
  readonly videoDestination: string;
  readonly atomicparsleyPath: string;
  readonly watchPaths: string[];
}

export class Worker {
  private options: WorkerOptions;
  private files: LevelUp;

  constructor(options: WorkerOptions) {
    this.files = options.files;
    this.options = options;
  }

  public async handler(_: string, payload: any): Promise<void> {
    const { filepath, jobType } = payload;

    // Test via the very slow lsof to see if this file is busy
    const isBusy = await isFileBusy(this.options.watchPaths[0], filepath);

    if (isBusy) {
      logger.info('File %s is busy, deferring...', filepath);
      throw new Error('File busy');
    }

    logger.info('Starting work for %s', filepath);

    // const tag = new Tag(filepath);

    const currentValue = await this.files.get(filepath);

    try {
      const { jobStatus } = currentValue;

      logger.debug('Work type: %s', FileJobType[jobType]);

      const validStatus = Boolean(
        jobStatus === FileJobStatus.Pending || jobStatus === FileJobStatus.Error
      );

      const fileExists = existsSync(filepath);

      const handled =
        validStatus && fileExists
          ? await this.handleFile(filepath, jobType)
          : false;

      currentValue.jobStatus = handled
        ? FileJobStatus.Complete
        : FileJobStatus.Unhandled;

      // await tag.removeTag('Red');
      // await tag.removeTag('Yellow');
      // await tag.addTag('Green');
    } catch (err) {
      logger.error(err);

      currentValue.jobStatus = FileJobStatus.Error;

      // await tag.removeTag('Green');
      // await tag.removeTag('Yellow');
      // await tag.addTag('Red');
    } finally {
      this.files.put(filepath, currentValue);
    }
  }

  private async handleFile(
    filepath: string,
    jobType: FileJobType
  ): Promise<boolean> {
    const {
      tmpPath,
      audioDestination,
      videoDestination,
      atomicparsleyPath: atomicparsley
    } = this.options;
    const filename = path.basename(filepath);
    const dirname = path.dirname(filepath);

    switch (jobType) {
      case FileJobType.ConvertAudio: {
        logger.debug('Converting audio file');

        const audioTmp = await convertAudio(filepath, tmpPath, {
          atomicparsley
        });

        logger.debug('Temporary audio file created: %s', audioTmp.audio);

        const outFileName = path.basename(audioTmp.audio);

        await copyFile(audioTmp.audio, `${audioDestination}/${outFileName}`);

        if (audioTmp.audio) {
          delSync([audioTmp.audio], { force: true });
        }

        if (audioTmp.hadCoverFile) {
          delSync([`${dirname}/*cover-resized-*.jpg`], {
            force: true
          });
        }

        if (audioTmp.hadCoverFileEmbedded) {
          delSync([audioTmp.cover, `${tmpPath}/*cover-resized-*.jpg`], {
            force: true
          });
        }

        return true;
      }

      case FileJobType.ConvertVideo: {
        logger.debug('Converting video file');
        logger.info('VIDEO CONVERSION IS DISABLED');
        return true;
      }

      case FileJobType.CopyAudio: {
        logger.debug('Copying audio file');
        await copyFile(filepath, `${audioDestination}/${filename}`);
        return true;
      }

      case FileJobType.CopyVideo: {
        logger.debug('Copying video file');
        await copyFile(filepath, `${videoDestination}/${filename}`);
        return true;
      }

      default:
        return false;
    }
  }
}

export function createWorker(options: WorkerOptions): Worker {
  return new Worker(options);
}
