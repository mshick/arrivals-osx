var fs = require('fs');
var path = require('path');
var fsevents = require('fsevents');
var levelup = require('levelup');
var assert = require('hoek').assert;
var Timer = require('hoek').Timer;
var co = require('co');
var each = require('co-each');
var bole = require('bole');
var boleFile = require('./boleFile');
var boleConsole = require('bole-console');
var config = require('../config');
var log = bole('main');
var Dispatcher = require('./Dispatcher');

const EXTENSION_LIST = config.get('extensions');


var watched = function (watcher, dispatcher) {

    return co(function* () {


        var timer = new Timer();

        log.info('Building existing files database for %s...', dispatcher.watchPath);

        yield dispatcher.init();

        log.info('Database for %s built in %d seconds', dispatcher.watchPath, timer.elapsed() / 1000);

        watcher.on('change', function(filepath, info) {

            log.debug('File changed', filepath, info);

            // if (filepath.search(basePath) === 0) {
            //     log.debug('Skipping processing for working directory', filepath);
            //     return;
            // }

            co(function* () {

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
            })
            .catch(function (err) {

                log.error('Unhandled error in onChange', err);
            });
        });

        log.info('Starting watcher');

        watcher.start();
    })
    .catch(function (err) {

        log.error('Unhandled error in main', err);
    });
};

module.exports = function () {

    var cwd = process.env['CWD'];

    var watchPaths = process.env['WATCH_PATH'].split(',').map(function (p) {
        var watchPath;
        if (path.isAbsolute(p)) {
            watchPath = p;
        } else {
            watchPath = path.resolve(cwd, p);
        }
        assert(watchPath && fs.statSync(watchPath).isDirectory(), 'Watch path must exist and be a directory');
        return watchPath;
    });

    var videoDestination = process.env['VIDEO_DESTINATION'];
    assert(videoDestination && fs.statSync(videoDestination).isDirectory(), 'Video destination path must exist and be a directory');

    var audioDestination = process.env['AUDIO_DESTINATION'];
    assert(audioDestination && fs.statSync(audioDestination).isDirectory(), 'Audio destination path must exist and be a directory');

    // var basePath = path.resolve(watchPath, BASE_DIR);

    var logFile = process.env['LOG_FILE'];
    var logType = process.env['LOG_TYPE'];
    var logLevel = process.env['LOG_LEVEL'];

    if (logType === 'file') {
        bole.output({ level: logLevel, stream: boleFile(logFile) });
    } else {
        var boleConsoleStream = boleConsole({ timestamp: true });
        bole.output({ level: logLevel, stream: boleConsoleStream });
    }

    var db = levelup(process.env['DB_PATH']);

    watchPaths.forEach(function (watchPath) {

        var watcher = fsevents(watchPath);

        var dispatcher = new Dispatcher({
            watchPath: watchPath,
            tmpPath: process.env['TMP_PATH'],
            db: db,
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

        watched(watcher, dispatcher);
    });
};
