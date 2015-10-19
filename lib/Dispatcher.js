/* eslint no-invalid-this:0 */

"use strict";

const path = require("path");
const glob = require("glob");
const sublevel = require("level-sublevel");
const levelWs = require("level-ws");
const levelPromisify = require("level-promisify");
const deleteStream = require("level-delete-stream");
const Jobs = require("level-jobs");
const Worker = require("./worker");
const config = require("../config");
const tag = require("./tag");

const EXISTING = config.get("flags.EXISTING");
const PENDING = config.get("flags.PENDING");
const EXTENSION_LIST = config.get("extensions");


const Dispatcher = function (options) {

  options = options || {};

  this.watchPath = options.watchPath;

  // const levelDb = levelup(options.dbPath);
  const levelDb = options.db;

  this.db = sublevel(levelDb);
  this.files = levelWs(this.db.sublevel("files", {
    valueEncoding: "json"
  }));
  this.files = levelPromisify(this.files);

  const maxConcurrency = 1;

  const worker = new Worker({
    db: this.files,
    tmpPath: options.tmpPath,
    audioDestination: options.audioDestination,
    videoDestination: options.videoDestination,
    binPaths: options.binPaths
  });

  const handler = function () {
    return worker.handler.apply(worker, arguments);
  };

  this.queue = new Jobs(this.db, handler, maxConcurrency);
};

Dispatcher.prototype.clearExisting = function () {

  const self = this;

  return new Promise((resolve, reject) => {
    self.files.root.createKeyStream()
      .pipe(deleteStream(self.files.root, (err) => {

        if (err) {
          return reject(err);
        }

        resolve();
      }));
  });
};

Dispatcher.prototype.init = function () {

  const self = this;

  return new Promise((resolve, reject) => {

    const processGlobs = function (err, files) {

      if (err) {
        return reject(err);
      }

      const existingFiles = files.map((filepath) => {
        return {
          type: "put",
          key: path.resolve(self.watchPath, filepath),
          value: {
            status: EXISTING
          }
        };
      });

      self.files.batch(existingFiles)
        .then(() => {
          resolve(existingFiles.length);
        })
        .catch(reject);
    };

    glob(`**/*.{${EXTENSION_LIST.join(",")}}`, {
      cwd: self.watchPath
    }, processGlobs);
  });
};

Dispatcher.prototype.check = function (filepath) {

  const self = this;

  return new Promise((resolve, reject) => {

    self.files.get(filepath)
      .then(resolve)
      .catch((err) => {

        if (err && err.notFound) {
          return resolve(false);
        }
        reject(err);
      });
  });
};

Dispatcher.prototype.checkDir = function (dirpath) {

  const self = this;

  return new Promise((resolve, reject) => {

    const processGlobs = function (err, files) {
      if (err) {
        return reject(err);
      }

      if (!files || !files.length) {
        return resolve(false);
      }

      const promises = files.map((file) => {
        return self.check(path.resolve(dirpath, file));
      });

      Promise.all(promises).then((res) => {
        const results = res.map((result, index) => {
          if (result === false) {
            return path.resolve(dirpath, files[index]);
          } else {
            return null;
          }
        }).filter((result) => result);

        return resolve(results);
      });
    };

    glob(`**/*.{${EXTENSION_LIST.join(",")}}`, {
      cwd: dirpath
    }, processGlobs);
  });
};

Dispatcher.prototype.push = function (filepath) {

  const self = this;

  return new Promise((resolve, reject) => {

    let jobId;

    const put = function () {
      self.files.put(filepath, {
        status: PENDING,
        jobId
      })
      .then(() => {
        tag.addTag(filepath, "Yellow");
      })
      .catch(reject);
    };

    jobId = self.queue.push(filepath, (err) => {

      if (err) {
        return reject(err);
      }
      put();
    });
  });
};

module.exports = Dispatcher;
