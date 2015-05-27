#!/usr/bin/env node

var path = require('path');
var mkdirp = require('mkdirp');
var touch = require('touch');
var argv = require('minimist')(process.argv.slice(2));
var service = require('../service');
var assert = require('hoek').assert;
var arrivals = require('../lib/arrivals');
var config = require('../config');
var svc;

var action = argv._[0] || 'run';

if (action === 'uninstall' || action === 'restart' || action === 'stop') {
    console.log(argv._);
    // svc = service.create(argv._[1]);
    // return svc[action]();
}

assert(argv.destination || (argv['video-destination'] && argv['audio-destination']), 'Destination is required');

var cwd = process.cwd();
var watch = argv.watch || cwd;

if (watch) {
    process.env['WATCH_PATH'] = path.resolve(watch);
}

if (argv.log) {
    if (path.isAbsolute(argv.log)) {
        process.env['LOG_FILE'] = argv.log;
    } else {
        process.env['LOG_FILE'] = path.resolve(cwd, argv.log);
    }
} else {
    process.env['LOG_FILE'] = path.resolve(watch, config.get('baseDir'), config.get('logFile'));
}

process.env['LOG_TYPE'] = argv['log-type'] || 'file';
process.env['LOG_LEVEL'] = argv['log-level'] || 'info';

if (argv.tmp) {
    if (path.isAbsolute(argv.tmp)) {
        process.env['TMP_PATH'] = argv.tmp;
    } else {
        process.env['TMP_PATH'] = path.resolve(cwd, argv.tmp);
    }
} else {
    process.env['TMP_PATH'] = path.resolve(watch, config.get('baseDir'), config.get('tmpDir'));
}


if (argv.db) {
    if (path.isAbsolute(argv.db)) {
        process.env['DB_PATH'] = argv.db;
    } else {
        process.env['DB_PATH'] = path.resolve(cwd, argv.db);
    }
} else {
    process.env['DB_PATH'] = path.resolve(watch, config.get('baseDir'), config.get('dbDir'));
}

var videoDestination = argv['video-destination'] || argv['destination'];

if (path.isAbsolute(videoDestination)) {
    process.env['VIDEO_DESTINATION'] = videoDestination;
} else {
    process.env['VIDEO_DESTINATION'] = path.resolve(cwd, videoDestination);
}

var audioDestination = argv['audio-destination'] || argv['destination'];

if (path.isAbsolute(videoDestination)) {
    process.env['AUDIO_DESTINATION'] = audioDestination;
} else {
    process.env['AUDIO_DESTINATION'] = path.resolve(cwd, audioDestination);
}

mkdirp.sync(process.env['TMP_PATH']);
mkdirp.sync(process.env['DB_PATH']);
touch.sync(process.env['LOG_FILE']);

process.env['FFMPEG_PATH'] = argv.ffmpeg || '/usr/local/bin/ffmpeg';
process.env['MKVTOMP4_PATH'] = argv.mkvtomp4 || '/usr/local/bin/mkvtomp4';
process.env['MP4BOX_PATH'] = argv.mp4box || '/usr/local/bin/mp4box';
process.env['MKVINFO_PATH'] = argv.mkvinfo || '/usr/local/bin/mkvinfo';
process.env['MKVEXTRACT_PATH'] = argv.mkvextract || '/usr/local/bin/mkvextract';

if (action === 'run') {
    arrivals();
} else if (action === 'install' || action === 'uninstall' || action === 'restart') {
    process.env['LOG_TYPE'] = 'console';
    svc = service.create(argv._[1]);
    svc[action]();
}
