import chalk from 'chalk';
import { exec } from 'child_process';
import { closeSync, openSync } from 'fs';
import os from 'os';
import path from 'path';
import { promisify } from 'util';

export interface ExpandPathOptions {
  readonly processCwd: string;
  readonly homeDir: string;
  readonly baseDir: string;
  readonly defaultValue?: string;
}

export enum Commands {
  Install = 'install',
  Watch = 'watch'
}

export function getIntro(): string {
  return `\n${chalk.cyan.bold.underline(`
  ~~~         A R R I V A L S          ~~~

  [All paths must exist before you install]
  `)}\n`;
}

export function untildify(input: string): string {
  const home = os.homedir();
  return home ? input.replace(/^~(?=$|\/|\\)/, home) : input;
}

export function expandPath(
  filePath: string,
  options: ExpandPathOptions
): string {
  switch (true) {
    case filePath === '' && options.defaultValue === '':
      return '';
    case filePath === '':
      return path.join(
        options.homeDir,
        options.baseDir,
        options.defaultValue || ''
      );
    case path.isAbsolute(filePath):
      return filePath;
    default:
      return path.resolve(options.processCwd, filePath);
  }
}

export function touch(filename: string): any {
  try {
    return closeSync(openSync(filename, 'w'));
  } catch (err) {
    console.log('file already exists');
  }
}

export const execPromise = promisify(exec);
