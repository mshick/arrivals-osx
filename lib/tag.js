/* eslint no-useless-escape:0 */
const {promisify, format} = require('util');
const child = require('child_process');
const exec = promisify(child.exec);
const bole = require('bole');
const log = bole('tag');

// Hex -> bin -> json -> lines
const hexToLines = `xxd -r -p - - | plutil -convert json -o - - | sed "s/[][]//g" | tr "," "\n"`;

// Lines -> json -> bin -> hex
const linesToHex = `tr "\n" "," | echo [\$(sed "s/,$//")] | plutil -convert binary1 -o - - | xxd -p - -`;

// Get them all
const gettags = `xattr -px com.apple.metadata:_kMDItemUserTags "%s" 2> /dev/null | ${hexToLines} | sed "s;.*Property List error.*;;"`;

const writeCmd = function (get, op, src) {
  const write = `xattr -wx com.apple.metadata:_kMDItemUserTags "$(%s | %s | grep . | %s)" "%s"`;
  return format(write, get, op, linesToHex, src);
};

const addCmd = function (source, tag) {
  const get = format(gettags, source);
  let add = `(cat -; echo \\\"%s\\\") | sort -u`;
  add = format(add, tag);
  return writeCmd(get, add, source);
};

const removeCmd = function (source, tag) {
  const get = format(gettags, source);
  let remove = `(cat - | sed "s;\\\"%s\\\";;") | sort -u`;
  remove = format(remove, tag);
  return writeCmd(get, remove, source);
};

const replaceCmd = function (source, tag, replacement) {
  const get = format(gettags, source);
  let replace = `(cat - | sed "s;\"%s\";\"%s\";") | sort -u`;
  replace = format(replace, tag, replacement);
  return writeCmd(get, replace, source);
};

class Tag {
  constructor(filepath) {
    this.filepath = filepath;
  }

  async addTag(tag) {
    const filepath = this.filepath;

    try {
      const cmd = addCmd(filepath, tag);
      const result = await exec(cmd);
      log.debug(result.stdout);

      if (result.stderr) {
        throw result.stderr;
      }
    } catch (error) {
      log.error(error);
    }
  }

  async removeTag(tag) {
    const filepath = this.filepath;

    try {
      const cmd = removeCmd(filepath, tag);
      const result = await exec(cmd);
      log.debug(result.stdout);

      if (result.stderr) {
        throw result.stderr;
      }
    } catch (error) {
      log.error(error);
    }
  }

  async replaceTag(tag, replacement) {
    const filepath = this.filepath;

    try {
      const cmd = replaceCmd(filepath, tag, replacement);
      const result = await exec(cmd);
      log.debug(result.stdout);

      if (result.stderr) {
        throw result.stderr;
      }
    } catch (error) {
      log.error(error);
    }
  }
}

module.exports = Tag;
