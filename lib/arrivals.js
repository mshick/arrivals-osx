var fs = require('fs');
var path = require('path');
var fsevents = require('fsevents');
var assert = require('hoek').assert;
var co = require('co');
var each = require('co-each');
var bole = require('bole');
var boleFile = require('./boleFile');
var boleConsole = require('bole-console');
var config = require('../config');
var log = bole('main');
var Dispatcher = require('./Dispatcher');

const BASE_DIR = config.get('baseDir');
const EXTENSION_LIST = config.get('extensions');


module.exports = function () {

    var watchPath = process.env['WATCH_PATH'];
    assert(watchPath && fs.statSync(watchPath).isDirectory(), 'Watch path must exist and be a directory');

    var videoDestination = process.env['VIDEO_DESTINATION'];
    assert(videoDestination && fs.statSync(videoDestination).isDirectory(), 'Video destination path must exist and be a directory');

    var audioDestination = process.env['AUDIO_DESTINATION'];
    assert(audioDestination && fs.statSync(audioDestination).isDirectory(), 'Audio destination path must exist and be a directory');

    var basePath = path.resolve(watchPath, BASE_DIR);

    var logFile = process.env['LOG_FILE'];
    var logType = process.env['LOG_TYPE'];
    var logLevel = process.env['LOG_LEVEL'];

    if (logType === 'file') {
        bole.output({ level: logLevel, stream: boleFile(logFile) });
    } else {
        var boleConsoleStream = boleConsole({ timestamp: true });
        bole.output({ level: logLevel, stream: boleConsoleStream });
    }

    var watcher = fsevents(watchPath);

    var dispatcher = new Dispatcher({
        watchPath: watchPath,
        tmpPath: process.env['TMP_PATH'],
        dbPath: process.env['DB_PATH'],
        audioDestination: audioDestination,
        videoDestination: videoDestination,
        binPaths: {
            ffmpeg: process.env['FFMPEG_PATH'],
            mkvtomp4: process.env['MKVTOMP4_PATH'],
            mkvinfo: process.env['MKVINFO_PATH'],
            mp4box: process.env['MP4BOX_PATH'],
            mkvextract: process.env['MKVEXTRACT_PATH']
        }
    });

    return co(function* () {

        yield dispatcher.start();

        watcher.on('change', function(filepath, info) {

            log.debug('File changed', filepath, info);

            if (filepath.search(basePath) === 0) {
                log.debug('Skipping processing for working directory', filepath);
                return;
            }

            co(function* () {

                try {

                    if (info.type === 'file' && (info.event === 'modified' || info.event === 'moved-in')) {
                        if (EXTENSION_LIST.indexOf(path.extname(filepath).substr(1)) > -1) {
                            var seen = yield dispatcher.check(filepath);
                            if (!seen) {
                                yield dispatcher.push(filepath);
                            }
                        }
                    }

                    if (info.type === 'directory' && info.event === 'moved-in') {
                        var dirResult = yield dispatcher.checkDir(filepath);
                        if (dirResult && dirResult.length) {
                            yield each(dirResult, dispatcher.push.bind(dispatcher));
                        }
                    }

                } catch (err) {

                    log.error(err);
                }

            });
        });

        log.info('Starting watcher');

        watcher.start();
    });
};
