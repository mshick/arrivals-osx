const fs = require('fs');
const path = require('path');
const bole = require('bole');
const config = require('ez-config');
const Timer = require('hoek').Bench;
const del = require('del');
const log = bole('worker');
const copyFile = require('./copy-file');
const convertAudio = require('./convert-audio');
const convertVideo = require('./convert-video');
const Tag = require('./tag');

const MS = 1000;
const COMPLETE = config.get('flags.COMPLETE');
const UNHANDLED = config.get('flags.UNHANDLED');
const ERROR = config.get('flags.ERROR');

class Worker {
  constructor(options = {}) {
    this.db = options.db;
    this.tmpPath = options.tmpPath;
    this.audioDestination = options.audioDestination;
    this.videoDestination = options.videoDestination;
    this.binPaths = options.binPaths;

    this.audioConversionExtensionList = options.audioConversionExtensionList;
    this.audioCopyExtensionList = options.audioCopyExtensionList;
    this.videoConversionExtensionList = options.videoConversionExtensionList;
    this.videoCopyExtensionList = options.videoCopyExtensionList;
  }

  async handler(id, filepath, done) {
    const db = this.db;
    const tmpPath = this.tmpPath;
    const audioDestination = this.audioDestination;
    const videoDestination = this.videoDestination;
    const binPaths = this.binPaths;
    const audioConversionExtensionList = this.audioConversionExtensionList;
    const audioCopyExtensionList = this.audioCopyExtensionList;
    const videoConversionExtensionList = this.videoConversionExtensionList;
    const videoCopyExtensionList = this.videoCopyExtensionList;

    const tag = new Tag(filepath);

    const timer = new Timer();

    let value;

    try {
      log.info('Starting work for %s', filepath);

      const extension = path.extname(filepath).substr(1).toLowerCase();
      const fileExists = fs.existsSync(filepath);

      let handled = false;

      if (fileExists && extension) {
        if (audioConversionExtensionList.indexOf(extension) >= 0) {
          // Do audio conversion
          handled = true;
          log.debug('Converting audio file');
          const audioTmp = await convertAudio(filepath, tmpPath, binPaths);
          await copyFile(audioTmp.audio, audioDestination);
          await del(audioTmp.audio, {force: true});
          if (audioTmp.cover) {
            await del(audioTmp.cover, {force: true});
          }
        }

        if (audioCopyExtensionList.indexOf(extension) >= 0) {
          // Do copy
          handled = true;
          log.debug('Copying audio file');
          await copyFile(filepath, audioDestination);
        }

        if (videoConversionExtensionList.indexOf(extension) >= 0) {
          // Do video conversion
          handled = true;
          log.debug('Converting video file');
          const videoTmp = await convertVideo(filepath, tmpPath, binPaths);
          await copyFile(videoTmp, videoDestination);
          await del(videoTmp, {
            force: true
          });
        }

        if (videoCopyExtensionList.indexOf(extension) >= 0) {
          // Do copy
          handled = true;
          log.debug('Copying video file');
          await copyFile(filepath, videoDestination);
        }
      }

      if (!handled) {
        throw new Error(`Unhandled file ${filepath}`);
      }

      log.info('Work complete for %s in %s seconds', filepath, timer.elapsed() / MS);

      value = await db.get(filepath);
      value.status = handled ? COMPLETE : UNHANDLED;

      await db.put(filepath, value);

      await tag.removeTag('Red');
      await tag.removeTag('Yellow');
      await tag.addTag('Green');
    } catch (error) {
      log.error(error);

      value = await db.get(filepath);
      value.status = ERROR;

      await tag.removeTag('Green');
      await tag.removeTag('Yellow');
      await tag.addTag('Red');
    } finally {
      await db.put(filepath, value);
      done();
    }
  }
}

module.exports = Worker;
