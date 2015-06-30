var fs = require('fs');
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
var tag = require('./tag');

const COMPLETE = config.get('flags.COMPLETE');
const UNHANDLED = config.get('flags.UNHANDLED');
const ERROR = config.get('flags.ERROR');

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
    var extension = path.extname(filepath).substr(1).toLowerCase();

    var timer = new Timer();
    log.info('Starting work for %s', filepath);

    co(function* () {

        var handled = false;
        var fileExists;

        try {
            fileExists = fs.statSync(filepath);
        } catch (err) {
            fileExists = false;
        }

        if (fileExists) {

            switch(true) {

                case AUDIO_CONVERSION_EXTENSION_LIST.indexOf(extension) > -1:
                    // do audio conversion
                    handled = true;
                    log.debug('Converting audio file');
                    var audioTmp = yield convertAudio(filepath, tmpPath, binPaths);
                    yield copyFile(audioTmp, audioDestination);
                    yield delFile(audioTmp);
                    break;

                case AUDIO_COPY_EXTENSION_LIST.indexOf(extension) > -1:
                    // do copy
                    handled = true;
                    log.debug('Copying audio file');
                    yield copyFile(filepath, audioDestination);
                    break;

                case VIDEO_CONVERSION_EXTENSION_LIST.indexOf(extension) > -1:
                    // do video conversion
                    handled = true;
                    log.debug('Converting video file');
                    var videoTmp = yield convertVideo(filepath, tmpPath, binPaths);
                    yield copyFile(videoTmp, videoDestination);
                    yield delFile(videoTmp);
                    break;

                case VIDEO_COPY_EXTENSION_LIST.indexOf(extension) > -1:
                    // do copy
                    handled = true;
                    log.debug('Copying video file');
                    yield copyFile(filepath, videoDestination);
                    break;
            }
        }

        if (!handled) {
            throw new Error('Unhandled file ' + filepath);
        }

        log.info('Work complete for %s in %s seconds', filepath, timer.elapsed() / 1000);

        var value = yield db.get(filepath);
        value.status = handled ? COMPLETE : UNHANDLED;

        yield db.put(filepath, value);

        yield tag.removeTag(filepath, 'Yellow');
        yield tag.addTag(filepath, 'Green');

        done();
    })
    .catch(function (err) {

        log.error(err);

        db.get(filepath).then(function (val) {
            val.status = ERROR;
            return db.put(val);
        })
        .then(function () {
            return tag.removeTag(filepath, 'Yellow');
        })
        .then(function () {
            return tag.addTag(filepath, 'Red');
        })
        .then(function () {
            done();
        });
    });
};

module.exports = Worker;
