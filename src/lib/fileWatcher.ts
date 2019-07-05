// tslint:disable:no-submodule-imports
import chokidar, { FSWatcher } from 'chokidar';
// import Future from 'fibers/future';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import logger from 'winston';

import { Dispatcher } from './dispatcher';
import { FileJobType } from './enums';
// import { sleep } from './utils';

const lstat = promisify(fs.lstat);

export interface FileWatcherOptions {
  readonly dispatcher: Dispatcher;
  readonly cwd: string;
  readonly watchPath: string;
  readonly convertAudioExtensions: string[];
  readonly convertVideoExtensions: string[];
  readonly copyAudioExtensions: string[];
  readonly copyVideoExtensions: string[];
}

export class FileWatcher {
  private options: FileWatcherOptions;
  private dispatcher: Dispatcher;
  private fswatcher: FSWatcher;

  constructor(options: FileWatcherOptions) {
    this.options = options;
    this.dispatcher = options.dispatcher;
    this.fswatcher = chokidar.watch(options.watchPath, {
      awaitWriteFinish: {
        pollInterval: 250,
        stabilityThreshold: 10000
      },
      ignoreInitial: true
    });
  }

  public async init(): Promise<FSWatcher> {
    try {
      logger.info('Starting watcher');
      return this.fswatcher.on('add', this.onAdd.bind(this));
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }

  private onAdd(filePath: string): void {
    try {
      const absFilePath = path.resolve(this.options.watchPath, filePath);

      logger.debug(
        '\n==FileWatcher onAdd==\nFilePath: %s\nAbsolute File Path: %s',
        filePath,
        absFilePath
      );

      this.handleFileEvent(absFilePath);
      // const fileFuture = Future.fromPromise(this.handleFileEvent(absFilePath));
      // fileFuture.detach();
    } catch (err) {
      logger.error(err);
    }
  }

  private async handleFileEvent(filePath: string): Promise<boolean> {
    const stat = await lstat(filePath);
    return stat.isFile() &&
      this.isValidFileType(filePath) &&
      (await this.dispatcher.isNewFile(filePath))
      ? this.handleFile(filePath) && true
      : logger.debug('Skipping file: %s', filePath) && false;
  }

  private async handleFile(filePath: string): Promise<boolean> {
    logger.info('Taking file: %s', filePath);
    const jobType = this.getJobType(filePath);
    logger.debug('Took %s %s', filePath, jobType);

    // Give directories a chance to write cover files
    // await sleep(1000);

    return this.dispatcher.enqueueFile(filePath, jobType);
  }

  private getJobType(filePath: string): FileJobType {
    const ext = path.extname(filePath).substr(1);
    const options = this.options;

    switch (true) {
      case options.copyVideoExtensions.indexOf(ext) > -1:
        return FileJobType.CopyVideo;
      case options.convertVideoExtensions.indexOf(ext) > -1:
        return FileJobType.ConvertVideo;
      case options.copyAudioExtensions.indexOf(ext) > -1:
        return FileJobType.CopyAudio;
      case options.convertAudioExtensions.indexOf(ext) > -1:
        return FileJobType.ConvertAudio;
      default:
        return FileJobType.Unknown;
    }
  }

  private isValidFileType(filePath: string): boolean {
    const jobType = this.getJobType(filePath);

    switch (jobType) {
      case FileJobType.Unknown:
        return false;
      default:
        return true;
    }
  }

  // private async getNewFilesInDirectory(dirpath: string): Promise<string[]> {
  //   const extensions = this.getAllHandledExtensions();

  //   const globbedFiles = await globPromise(`**/*.{${extensions.join(',')}}`, {
  //     cwd: dirpath
  //   });

  //   const files = globbedFiles || [];

  //   const filePaths = files.map(file => path.resolve(dirpath, file));

  //   const checks = filePaths.map(
  //     (filepath: string): Promise<boolean> | boolean =>
  //       this.isValidFileType(filepath)
  //   );

  //   const checkResults = await Promise.all(checks);

  //   return checkResults
  //     .map((res, idx) => (res ? filePaths[idx] : ''))
  //     .filter(x => x);
  // }

  // private async handleDirectoryEvent(info: any): Promise<boolean> {
  //   const newFiles = await this.getNewFilesInDirectory(info.path);
  //   return this.isValidDirectoryEvent(info.event) && newFiles.length
  //     ? this.handleDirectory(newFiles) && true
  //     : logger.debug('Skipping directory: %s', info.path) && false;
  // }

  // private async handleDirectory(filePaths: string[]): Promise<boolean> {
  //   logger.info('Taking directory of files: %s', prettyPrint(filePaths));

  //   const handleFile = this.handleFile.bind(this);
  //   const handledFiles = filePaths.map(handleFile);

  //   await Promise.all(handledFiles);

  //   return true;
  // }
}

export function createFileWatcher(options: FileWatcherOptions): FileWatcher {
  return new FileWatcher(options);
}
