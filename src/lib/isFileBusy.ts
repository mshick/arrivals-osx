import { execFile } from 'child_process';
import { promisify } from 'util';
import log from 'winston';

const execFilePromise = promisify(execFile);

export async function isFileBusy(
  directory: string,
  source: string
): Promise<boolean> {
  try {
    const { stdout } = await execFilePromise('/usr/sbin/lsof', [
      '+D',
      directory,
      '|',
      'grep',
      source
    ]);
    return stdout ? true : false;
  } catch (err) {
    log.debug('Problem checking for busy file: %s', err.message);
    return false;
  }
}
