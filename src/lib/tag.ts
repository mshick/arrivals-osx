// tslint:disable:no-let
// tslint:disable:no-if-statement
import child from 'child_process';
import { format, promisify } from 'util';
import logger from 'winston';

const exec = promisify(child.exec);

// Hex -> bin -> json -> lines
const hexToLines = `xxd -r -p - - | plutil -convert json -o - - | sed "s/[][]//g" | tr "," "\n"`;

// Lines -> json -> bin -> hex
const linesToHex = `tr "\n" "," | echo [\$(sed "s/,$//")] | plutil -convert binary1 -o - - | xxd -p - -`;

// Get them all
const gettags = `xattr -px com.apple.metadata:_kMDItemUserTags "%s" 2> /dev/null | ${hexToLines} | sed "s;.*Property List error.*;;"`;

const writeCmd = (get: string, op: string, src: string) => {
  const write = `xattr -wx com.apple.metadata:_kMDItemUserTags "$(%s | %s | grep . | %s)" "%s"`;
  return format(write, get, op, linesToHex, src);
};

const addCmd = (source: string, tag: string) => {
  const get = format(gettags, source);
  let add = `(cat -; echo \\\"%s\\\") | sort -u`;
  add = format(add, tag);
  return writeCmd(get, add, source);
};

const removeCmd = (source: string, tag: string) => {
  const get = format(gettags, source);
  let remove = `(cat - | sed "s;\\\"%s\\\";;") | sort -u`;
  remove = format(remove, tag);
  return writeCmd(get, remove, source);
};

const replaceCmd = (source: string, tag: string, replacement: string) => {
  const get = format(gettags, source);
  let replace = `(cat - | sed "s;\"%s\";\"%s\";") | sort -u`;
  replace = format(replace, tag, replacement);
  return writeCmd(get, replace, source);
};

export class Tag {
  private filepath: string;

  constructor(filepath: string) {
    this.filepath = filepath;
  }

  public async addTag(tag: string): Promise<void> {
    const filepath = this.filepath;

    try {
      const cmd = addCmd(filepath, tag);
      const result = await exec(cmd);
      logger.debug(result.stdout);

      if (result.stderr) {
        throw result.stderr;
      }
    } catch (error) {
      logger.error(error);
    }
  }

  public async removeTag(tag: string): Promise<void> {
    const filepath = this.filepath;

    try {
      const cmd = removeCmd(filepath, tag);
      const result = await exec(cmd);
      logger.debug(result.stdout);

      if (result.stderr) {
        throw result.stderr;
      }
    } catch (error) {
      logger.error(error);
    }
  }

  public async replaceTag(tag: string, replacement: string): Promise<void> {
    const filepath = this.filepath;

    try {
      const cmd = replaceCmd(filepath, tag, replacement);
      const result = await exec(cmd);
      logger.debug(result.stdout);

      if (result.stderr) {
        throw result.stderr;
      }
    } catch (error) {
      logger.error(error);
    }
  }
}
