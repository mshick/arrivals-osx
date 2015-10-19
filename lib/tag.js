/* eslint max-len: 0 */

"use strict";

const exec = require("child_process").exec;
const format = require("util").format;
const bole = require("bole");
const log = bole("tag");

// hex -> bin -> json -> lines
const hexToLines = `xxd -r -p - - | plutil -convert json -o - - | sed "s/[][]//g" | tr "," "\n"`;

// lines -> json -> bin -> hex
const linesToHex = `tr "\n" "," | echo [\$(sed "s/,$//")] | plutil -convert binary1 -o - - | xxd -p - -`;

// get them all
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

module.exports = {

  addTag: (source, tag) => {

    const cmd = addCmd(source, tag);

    return new Promise((resolve) => {

      exec(cmd, (err, stdout, stderr) => {

        log.debug(stdout);

        if (err || stderr) {
          log.error(err || stderr);
        }

        resolve(stdout);
      });
    });
  },

  removeTag: (source, tag) => {

    const cmd = removeCmd(source, tag);

    return new Promise((resolve) => {

      exec(cmd, (err, stdout, stderr) => {

        log.debug(stdout);

        if (err || stderr) {
          log.error(err || stderr);
        }

        resolve(stdout);
      });
    });
  },

  replaceTag: (source, tag, replacement) => {

    const cmd = replaceCmd(source, tag, replacement);

    return new Promise((resolve) => {

      exec(cmd, (err, stdout, stderr) => {

        log.debug(stdout);

        if (err || stderr) {
          log.error(err || stderr);
        }

        resolve(stdout);
      });
    });
  }
};
