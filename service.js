const path = require('path');
const Service = require('node-mac').Service;
const bole = require('bole');
const boleConsole = require('bole-console');

const boleConsoleStream = boleConsole({timestamp: false});

bole.output({
  level: 'info',
  stream: boleConsoleStream
});

const log = bole('service');

const create = function (options) {
  options = options || {};

  const service = new Service({
    name: 'com-mshick-arrivals',
    description: 'arrivals-osx watch process',
    runAsUserAgent: options.runAsUserAgent,
    cwd: path.resolve(__dirname),
    script: path.resolve(__dirname, 'index.js'),
    env: [{
      name: 'NODE_CONFIG_DIR',
      value: path.resolve(__dirname, 'config')
    }, {
      name: 'CWD',
      value: process.env.CWD
    }, {
      name: 'WATCH_PATH',
      value: process.env.WATCH_PATH
    }, {
      name: 'LOG_FILE',
      value: process.env.LOG_FILE
    }, {
      name: 'LOG_TYPE',
      value: process.env.LOG_TYPE
    }, {
      name: 'LOG_LEVEL',
      value: process.env.LOG_LEVEL
    }, {
      name: 'TMP_PATH',
      value: process.env.TMP_PATH
    }, {
      name: 'DB_PATH',
      value: process.env.DB_PATH
    }, {
      name: 'VIDEO_DESTINATION',
      value: process.env.VIDEO_DESTINATION
    }, {
      name: 'VIDEO_COPY_EXTENSIONS',
      value: process.env.VIDEO_COPY_EXTENSIONS
    }, {
      name: 'VIDEO_CONVERT_EXTENSIONS',
      value: process.env.VIDEO_CONVERT_EXTENSIONS
    }, {
      name: 'AUDIO_DESTINATION',
      value: process.env.AUDIO_DESTINATION
    }, {
      name: 'AUDIO_COPY_EXTENSIONS',
      value: process.env.AUDIO_COPY_EXTENSIONS
    }, {
      name: 'AUDIO_CONVERT_EXTENSIONS',
      value: process.env.AUDIO_CONVERT_EXTENSIONS
    }, {
      name: 'FFMPEG_PATH',
      value: process.env.FFMPEG_PATH
    }, {
      name: 'MKVTOMP4_PATH',
      value: process.env.MKVTOMP4_PATH
    }, {
      name: 'MKVINFO_PATH',
      value: process.env.MKVINFO_PATH
    }, {
      name: 'MKVEXTRACT_PATH',
      value: process.env.MKVEXTRACT_PATH
    }, {
      name: 'MP4BOX_PATH',
      value: process.env.MP4BOX_PATH
    }]
  });

  service.on('install', () => {
    log.info('Installing...');
    service.start();
  });

  service.on('start', () => {
    log.info('Started!');
  });

  service.on('uninstall', () => {
    log.info('Uninstalling...');
    if (service.exists) {
      log.error('Service could not be uninstalled');
    } else {
      log.info('Uninstalled');
    }
  });

  service.on('restart', () => {
    log.info('Restarting...');
  });

  service.on('stop', () => {
    if (!service.exists) {
      log.info('Stopped');
    }
  });

  service.on('alreadyinstalled', () => {
    log.info('Already installed');
  });

  service.on('invalidinstallation', () => {
    log.info('Invalid installation');
  });

  service.on('error', err => {
    log.error('Error', err);
  });

  return service;
};

module.exports = {create};
