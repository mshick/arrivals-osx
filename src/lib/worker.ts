// tslint:disable:no-object-mutation
// tslint:disable:no-if-statement
import { sync as delSync } from 'del';
import { copyFileSync, existsSync } from 'fs';
import { LevelUp } from 'levelup';
import path from 'path';
import logger from 'winston';
import { convertAudio } from './convertAudio';
import { FileJobStatus, FileJobType } from './enums';
import { Tag } from './tag';

export interface WorkerOptions {
  readonly files: any;
  readonly tmpPath: string;
  readonly ffmpegPath: string;
  readonly audioDestination: string;
  readonly videoDestination: string;
  readonly atomicparsleyPath: string;
}

export class Worker {
  private options: WorkerOptions;
  private files: LevelUp;

  constructor(options: WorkerOptions) {
    this.files = options.files;
    this.options = options;
  }

  public async handler(_: string, payload: any): Promise<void> {
    try {
      const { filepath, jobType } = payload;

      logger.info('Starting work for %s', filepath);

      const tag = new Tag(filepath);

      const currentValue = await this.files.get(filepath);
      const { jobStatus } = currentValue;

      logger.debug('Work type: %s', FileJobType[jobType]);

      try {
        const handled =
          jobStatus === FileJobStatus.Pending && existsSync(filepath)
            ? this.handleFile(filepath, jobType) && true
            : false;

        currentValue.jobStatus = handled
          ? FileJobStatus.Complete
          : FileJobStatus.Unhandled;

        await tag.removeTag('Red');
        await tag.removeTag('Yellow');
        await tag.addTag('Green');
      } catch (err) {
        logger.error(err);

        currentValue.jobStatus = FileJobStatus.Error;

        await tag.removeTag('Green');
        await tag.removeTag('Yellow');
        await tag.addTag('Red');
      } finally {
        this.files.put(filepath, currentValue);
      }
    } catch (err) {
      logger.error(err);
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

    try {
      switch (jobType) {
        case FileJobType.ConvertAudio: {
          logger.debug('Converting audio file');

          const audioTmp = await convertAudio(filepath, tmpPath, {
            atomicparsley
          });

          logger.debug('Temporary audio file created: %s', audioTmp.audio);

          const outFileName = path.basename(audioTmp.audio);

          copyFileSync(audioTmp.audio, `${audioDestination}/${outFileName}`);

          delSync([audioTmp.audio], { force: true });

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
          copyFileSync(filepath, `${audioDestination}/${filename}`);
          return true;
        }

        case FileJobType.CopyVideo: {
          logger.debug('Copying video file');
          copyFileSync(filepath, `${videoDestination}/${filename}`);
          return true;
        }

        default:
          return false;
      }
    } catch (err) {
      logger.error(err);
      return false;
    }
  }
}

export function createWorker(options: WorkerOptions): Worker {
  return new Worker(options);
}
