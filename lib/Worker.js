/* eslint no-invalid-this:0 */
/* eslint no-case-declarations:0 */

"use strict";

const fs = require("fs");
const path = require("path");
const bole = require("bole");
const config = require("ez-config");
const Timer = require("hoek").Timer;
const co = require("co");
const log = bole("worker");
const copyFile = require("./copy-file");
const del = require("del");
const convertAudio = require("./convert-audio");
const convertVideo = require("./convert-video");
const tag = require("./tag");

const MS = 1000;
const COMPLETE = config.get("flags.COMPLETE");
const UNHANDLED = config.get("flags.UNHANDLED");
const ERROR = config.get("flags.ERROR");

const AUDIO_CONVERSION_EXTENSION_LIST = config.get("convertAudioExtensions");
const AUDIO_COPY_EXTENSION_LIST = config.get("copyAudioExtensions");
const VIDEO_CONVERSION_EXTENSION_LIST = config.get("convertVideoExtensions");
const VIDEO_COPY_EXTENSION_LIST = config.get("copyVideoExtensions");

const Worker = function (options) {
  options = options || {};
  this.db = options.db;
  this.tmpPath = options.tmpPath;
  this.audioDestination = options.audioDestination;
  this.videoDestination = options.videoDestination;
  this.binPaths = options.binPaths;
};

Worker.prototype.handler = function (filepath, done) {

  const db = this.db;

  const tmpPath = this.tmpPath;
  const audioDestination = this.audioDestination;
  const videoDestination = this.videoDestination;
  const binPaths = this.binPaths;
  const extension = path.extname(filepath).substr(1).toLowerCase();

  const timer = new Timer();
  log.info("Starting work for %s", filepath);

  co(function *() {

    let handled = false;
    let fileExists;

    try {
      fileExists = fs.statSync(filepath);
    } catch (err) {
      fileExists = false;
    }

    if (fileExists) {

      switch (true) {

      case AUDIO_CONVERSION_EXTENSION_LIST.indexOf(extension) >= 0:
        // do audio conversion
        handled = true;
        log.debug("Converting audio file");
        const audioTmp = yield convertAudio(filepath, tmpPath, binPaths);
        yield copyFile(audioTmp, audioDestination);
        yield del(audioTmp, {
          force: true
        });
        break;

      case AUDIO_COPY_EXTENSION_LIST.indexOf(extension) >= 0:
        // do copy
        handled = true;
        log.debug("Copying audio file");
        yield copyFile(filepath, audioDestination);
        break;

      case VIDEO_CONVERSION_EXTENSION_LIST.indexOf(extension) >= 0:
        // do video conversion
        handled = true;
        log.debug("Converting video file");
        const videoTmp = yield convertVideo(filepath, tmpPath, binPaths);
        yield copyFile(videoTmp, videoDestination);
        yield del(videoTmp, {
          force: true
        });
        break;

      case VIDEO_COPY_EXTENSION_LIST.indexOf(extension) >= 0:
        // do copy
        handled = true;
        log.debug("Copying video file");
        yield copyFile(filepath, videoDestination);
        break;
      }
    }

    if (!handled) {
      throw new Error(`Unhandled file ${filepath}`);
    }

    log.info("Work complete for %s in %s seconds", filepath, timer.elapsed() / MS);

    const value = yield db.get(filepath);
    value.status = handled ? COMPLETE : UNHANDLED;

    yield db.put(filepath, value);

    yield tag.removeTag(filepath, "Yellow");
    yield tag.addTag(filepath, "Green");

    done();
  })
  .catch((err) => {

    log.error(err);

    db.get(filepath).then((val) => {
      val.status = ERROR;
      return db.put(val);
    })
    .then(() => {
      return tag.removeTag(filepath, "Yellow");
    })
    .then(() => {
      return tag.addTag(filepath, "Red");
    })
    .then(() => {
      done();
    });
  });
};

module.exports = Worker;
