#!/usr/bin/env node

var path = require('path');
var mkdirp = require('mkdirp');
var untildify = require('untildify');
var touch = require('touch');
var del = require('del');
var argv = require('minimist')(process.argv.slice(2));
var service = require('../service');
var assert = require('hoek').assert;
var arrivals = require('../lib/arrivals');
var config = require('../config');
var svc;

const ACTION = argv._[0] || 'run';
const RUN_AS_ROOT = argv['run-as-root'] || false;
const CWD = argv.cwd || process.cwd();
const HOME_DIR = untildify('~/');
const BASE_DIR = config.get('baseDir');


if (ACTION === 'uninstall' || ACTION === 'restart' || ACTION === 'stop') {
    svc = service.create({ runAsUserAgent: !RUN_AS_ROOT });
    svc[ACTION]();
    return;
}

function prepareDirs(reset) {
    if (reset) {
        del.sync([
            process.env['TMP_PATH'],
            process.env['DB_PATH'],
            process.env['LOG_FILE']
        ], { force: true });
    }

    mkdirp.sync(process.env['TMP_PATH']);
    mkdirp.sync(process.env['DB_PATH']);
    touch.sync(process.env['LOG_FILE']);
}

function setEnvPath(key, val, defaultVal) {
    if (val) {
        if (path.isAbsolute(val)) {
            process.env[key] = val;
        } else {
            process.env[key] = path.resolve(CWD, val);
        }
    } else if (defaultVal) {
        process.env[key] = path.join(HOME_DIR, BASE_DIR, defaultVal);
    }
}

setEnvPath('TMP_PATH', argv.tmp, config.get('tmpDir'));
setEnvPath('DB_PATH', argv.db, config.get('dbDir'));
setEnvPath('LOG_FILE', argv.log, config.get('logFile'));

if (ACTION === 'reset') {
    prepareDirs(true);
    return;
} else {
    prepareDirs();
}

assert(argv.destination || (argv['video-destination'] && argv['audio-destination']), 'Destination is required');

setEnvPath('VIDEO_DESTINATION', argv['video-destination'] || argv['destination']);
setEnvPath('AUDIO_DESTINATION', argv['audio-destination'] || argv['destination']);

if (argv['log-type']) {
    process.env['LOG_TYPE'] = argv['log-type'];
} else {
    process.env['LOG_TYPE'] = ACTION === 'run' ? 'file' : 'console';
}

process.env['CWD'] = CWD;
process.env['WATCH_PATH'] = argv.watch;
process.env['LOG_LEVEL'] = argv['log-level'] || 'info';

process.env['FFMPEG_PATH'] = argv.ffmpeg || '/usr/local/bin/ffmpeg';
process.env['MKVTOMP4_PATH'] = argv.mkvtomp4 || '/usr/local/bin/mkvtomp4';
process.env['MP4BOX_PATH'] = argv.mp4box || '/usr/local/bin/mp4box';
process.env['MKVINFO_PATH'] = argv.mkvinfo || '/usr/local/bin/mkvinfo';
process.env['MKVEXTRACT_PATH'] = argv.mkvextract || '/usr/local/bin/mkvextract';


if (ACTION === 'run') {
    arrivals();
} else if (ACTION === 'install') {
    svc = service.create({ runAsUserAgent: !RUN_AS_ROOT });
    svc.install();
}
