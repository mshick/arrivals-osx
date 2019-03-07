import { AbstractBatch } from 'abstract-leveldown';
import glob from 'glob';
import LevelJobs from 'level-jobs';
import { LevelUp } from 'levelup';
import path from 'path';
import { promisify } from 'util';
import logger from 'winston';

import { FileJobStatus, FileJobType } from './enums';
import { Tag } from './tag';
import { FileJobPayload, FilePayload } from './typings';
import { prettyPrint } from './utils';

const globPromise = promisify(glob);

export interface DispatcherOptions {
  readonly queue: LevelJobs;
  readonly files: LevelUp;
  readonly watchPaths: string[];
}

export class Dispatcher {
  private files: LevelUp;
  private queue: LevelJobs;
  private options: DispatcherOptions;

  constructor(options: DispatcherOptions) {
    this.queue = options.queue;
    this.files = options.files;
    this.options = options;
  }

  public async init(): Promise<void> {
    try {
      logger.info('Starting dispatcher ...');

      // Build existing file DB here ...
      const existingPaths = this.options.watchPaths.map(watchPath =>
        this.buildExistingFilesDb(watchPath)
      );

      const existingPathsAdded = await Promise.all(existingPaths);

      const existingPathsCount = existingPathsAdded.reduce(
        (p: number, c: number) => p + c,
        0
      );

      logger.info('%s existing paths added', existingPathsCount);

      logger.info('Dispatcher started!');
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }

  public async buildExistingFilesDb(watchPath: string): Promise<number> {
    try {
      const cwd = watchPath;

      const files = await globPromise(`**/*`, {
        cwd
      });

      const filePayload: FilePayload = {
        jobStatus: FileJobStatus.Existing,
        jobType: FileJobType.Unknown
      };

      const existingFiles = files.map(
        (filepath: string): AbstractBatch => ({
          key: path.resolve(cwd, filepath),
          type: 'put',
          value: filePayload
        })
      );

      await this.files.batch(existingFiles);

      return existingFiles.length;
    } catch (error) {
      throw error;
    }
  }

  public async isNewFile(filepath: string): Promise<boolean> {
    try {
      await this.files.get(filepath);
      return false;
    } catch (err) {
      switch (err.notFound) {
        case true:
          return true;
        default:
          throw err;
      }
    }
  }

  public async enqueueFile(
    filepath: string,
    filetype: FileJobType
  ): Promise<boolean> {
    try {
      const tag = new Tag(filepath);

      const jobType = filetype;
      const jobStatus = FileJobStatus.Pending;

      const filePayload: FilePayload = {
        jobStatus,
        jobType
      };

      await this.files.put(filepath, filePayload);

      const fileJobPayload: FileJobPayload = {
        filepath,
        jobType
      };

      const jobId = await this.queue.pushPromise(fileJobPayload);

      logger.debug('File enqueued with jobId: %s', jobId);

      await tag.addTag('Yellow');

      return true;
    } catch (err) {
      logger.error('Error in enqueue\n%s', prettyPrint(err));
      return false;
    }
  }
}

export function createDispatcher(options: DispatcherOptions): Dispatcher {
  return new Dispatcher(options);
}
