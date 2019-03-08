// tslint:disable:no-console no-if-statement no-expression-statement
import chalk from 'chalk';
import { writeFileSync } from 'fs';
import mkdirp from 'mkdirp';
import path from 'path';
import plist from 'plist';
import logger from 'winston';
import { checkArgs } from './args';
import { inquire } from './inquire';

import { watch } from '../lib/arrivals';
import { createLogger } from '../lib/logger';

import { Commands, execPromise, getIntro, touch, untildify } from './utils';

createLogger({
  logFile: '',
  logLevel: 'info',
  logType: 'console'
});

(async () => {
  const command = await checkArgs();

  if (command === Commands.Install) {
    const userOptions = {
      ...(await (async () => {
        console.log(getIntro());
        return inquire();
      })())
    };

    const label = 'us.shick.arrivals';
    const plistPath = untildify(`~/Library/LaunchAgents/${label}.plist`);
    const logPath = untildify(`~/Library/Logs/${label}`);
    const outLogPath = path.resolve(logPath, 'arrivals.log');
    const errLogPath = path.resolve(logPath, 'arrivals_error.log');
    const execPath = process.execPath;
    const scriptPath = path.resolve(__dirname, '../wrapper.js');
    const workingDirectory = path.resolve(__dirname, '../../../');

    const tpl = {
      EnvironmentVariables: userOptions,
      KeepAlive: false,
      Label: label,
      ProgramArguments: [execPath, scriptPath],
      RunAtLoad: true,
      StandardErrorPath: errLogPath,
      StandardOutPath: outLogPath,
      WorkingDirectory: workingDirectory
    };

    const plistData = plist.build(tpl).toString();

    mkdirp.sync(logPath);
    touch(outLogPath);
    touch(errLogPath);

    writeFileSync(plistPath, plistData);

    try {
      await execPromise(`launchctl load ${plistPath}`);
      logger.info('launchdaemon loaded');
    } catch (err) {
      logger.error('Could not start: %s', err.message);
    }
  } else {
    watch()
      .then(() => {
        logger.info('Arrivals has started!');
      })
      .catch(err => {
        logger.error(err);
      });
  }
})().catch((err: Error) => {
  console.error(`
  ${chalk.red(err.message)}
`);
  process.exit(1);
});
