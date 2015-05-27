var path = require('path');
var bole = require('bole');
var Timer = require('hoek').Timer;
var co = require('co');
var log = bole('worker');
var copyFile = require('./copyFile');
var delFile = require('./delFile');
var convertAudio = require('./convertAudio');
var convertVideo = require('./convertVideo');
var config = require('../config');

const COMPLETE = config.get('flags.COMPLETE');
const AUDIO_CONVERSION_EXTENSION_LIST = config.get('convertAudioExtensions');
const AUDIO_COPY_EXTENSION_LIST = config.get('copyAudioExtensions');
const VIDEO_CONVERSION_EXTENSION_LIST = config.get('convertVideoExtensions');
const VIDEO_COPY_EXTENSION_LIST = config.get('copyVideoExtensions');

var Worker = function (options) {
    options = options || {};
    this.db = options.db;
    this.tmpPath = options.tmpPath;
    this.audioDestination = options.audioDestination;
    this.videoDestination = options.videoDestination;
    this.binPaths = options.binPaths;
};

Worker.prototype.handler = function (filepath, done) {

    var db = this.db;

    var tmpPath = this.tmpPath;
    var audioDestination = this.audioDestination;
    var videoDestination = this.videoDestination;
    var binPaths = this.binPaths;

    log.debug('Starting work for %s', filepath);

    var extension = path.extname(filepath).substr(1).toLowerCase();

    var timer = new Timer();

    co(function* () {

        try {
            switch(true) {

                case AUDIO_CONVERSION_EXTENSION_LIST.indexOf(extension) > -1:
                    // do audio conversion
                    log.debug('Converting audio file');
                    var audioTmp = yield convertAudio(filepath, tmpPath, binPaths);
                    yield copyFile(audioTmp, audioDestination);
                    yield delFile(audioTmp);
                    break;

                case AUDIO_COPY_EXTENSION_LIST.indexOf(extension) > -1:
                    // do copy
                    log.debug('Copying audio file');
                    yield copyFile(filepath, audioDestination);
                    break;

                case VIDEO_CONVERSION_EXTENSION_LIST.indexOf(extension) > -1:
                    // do video conversion
                    log.debug('Converting video file');
                    var videoTmp = yield convertVideo(filepath, tmpPath, binPaths);
                    yield copyFile(videoTmp, videoDestination);
                    yield delFile(videoTmp);
                    break;

                case VIDEO_COPY_EXTENSION_LIST.indexOf(extension) > -1:
                    // do copy
                    log.debug('Copying video file');
                    yield copyFile(filepath, videoDestination);
                    break;
            }
        } catch (err) {
            log.error(err);
            return done();
        }

        db.get(filepath, function (err, value) {

            if (err) {
                log.error(err);
                return done();
            }

            log.info('Work complete for %s in %s', filepath, timer.elapsed());

            value.status = COMPLETE;

            db.put(filepath, value, done);
        });
    });
};

module.exports = Worker;
