/* eslint no-invalid-this:0 */
/* eslint prefer-template:0 */

"use strict";

const fs = require("fs");
const util = require("util");
const stream = require("stream");
const touch = require("touch");


const defaultProperties = {
  time: true,
  hostname: true,
  pid: true,
  level: true,
  name: true,
  message: true
};

const FileStream = function (filepath, options) {
  stream.Writable.call(this, { objectMode: true });
  touch.sync(filepath);

  options = options || {};

  this._filepath = filepath;

  this._filestream = fs.createWriteStream(filepath, {
    flags: "a",
    encoding: "utf-8"
  });

  this._indent = options.indent || 2;
};

util.inherits(FileStream, stream.Writable);

const localTime = function (date) {

  const TIMEBASE = 10;
  const MSBASE = 3;
  const MINUTES_IN_HOUR = 60;
  const SECONDS_IN_MINUTE = 60;

  const tzo = -date.getTimezoneOffset();
  const diff = tzo >= 0 ? "+" : "-";

  const pad = function (n) {
    return (n < TIMEBASE ? "0" : "") + n;
  };

  const padMilliseconds = function (n) {

    // TODO: refactor, doesn't work with template strings
    let str = n + "";
    while (str.length !== MSBASE) {
      str = "0" + str;
    }
    return str;
  };

  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hr = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  const ms = padMilliseconds(date.getMilliseconds());
  const tzh = pad(Math.abs(Math.floor(tzo / MINUTES_IN_HOUR)));
  const tzm = pad(Math.abs(Math.floor(tzo % SECONDS_IN_MINUTE)));

  return `${y}-${m}-${d}T${hr}:${mm}:${ss}.${ms}${diff}${tzh}:${tzm}`;
};

FileStream.prototype._write = function (obj, encoding, cb) {

  obj = Object.assign(obj);

  let str = "";

  const timestamp = localTime(new Date(obj.time));

  str += `[${timestamp}]`;

  if (obj.message) {
    str += ` ${obj.message}`;
  }

  if (obj.err) {
    let trace = obj.err.message || obj.err.name;

    const err = obj.err;
    trace = err.stack.substring(err.stack.indexOf(trace) + trace.length + 1);

    str += `${(obj.message ? " - " : " ")}${err.name}: ${err.message}`;

    if (trace) {
      str += `\n${trace}`;
    }
  } else {
    const arbitraryObject = {};
    let content;

    for (const p in obj) {

      if (!obj.hasOwnProperty(p)) {
        continue;
      }

      if (!defaultProperties[p]) {
        content = true;
        arbitraryObject[p] = obj[p];
      }
    }

    if (content) {
      str += `\n${JSON.stringify(arbitraryObject, null, this._indent)}`;
    }
  }

  this._filestream.write(`${str}\n`);

  cb();
};

module.exports = function (options) {
  return new FileStream(options);
};
