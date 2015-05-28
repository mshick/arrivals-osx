var path = require('path');
var Service = require('node-mac').Service;
var bole = require('bole');
var log = bole('service');


function create(options) {

    options = options || {};

    var service = new Service({
        name: 'arrivals',
        description: 'Arrivals-osx watch process.',
        runAsUserAgent: options.runAsUserAgent,
        script: path.resolve(__dirname, 'index.js'),
        env: [{
            name: 'CWD',
            value: process.env['CWD']
        }, {
            name: 'WATCH_PATH',
            value: process.env['WATCH_PATH']
        }, {
            name: 'LOG_FILE',
            value: process.env['LOG_FILE']
        }, {
            name: 'LOG_TYPE',
            value: process.env['LOG_TYPE']
        }, {
            name: 'LOG_LEVEL',
            value: process.env['LOG_LEVEL']
        }, {
            name: 'TMP_PATH',
            value: process.env['TMP_PATH']
        }, {
            name: 'DB_PATH',
            value: process.env['DB_PATH']
        }, {
            name: 'VIDEO_DESTINATION',
            value: process.env['VIDEO_DESTINATION']
        }, {
            name: 'AUDIO_DESTINATION',
            value: process.env['AUDIO_DESTINATION']
        }, {
            name: 'FFMPEG_PATH',
            value: process.env['FFMPEG_PATH']
        }, {
            name: 'MKVTOMP4_PATH',
            value: process.env['MKVTOMP4_PATH']
        }, {
            name: 'MKVINFO_PATH',
            value: process.env['MKVINFO_PATH']
        }, {
            name: 'MKVEXTRACT_PATH',
            value: process.env['MKVEXTRACT_PATH']
        }, {
            name: 'MP4BOX_PATH',
            value: process.env['MP4BOX_PATH']
        }]
    });

    service.on('install', function() {
        log.info('Installing...');
        service.start();
    });

    service.on('start', function() {
        log.info('Started!');
    });

    service.on('uninstall', function() {
        log.info('Uninstalling...');
        if (!service.exists) {
            log.info('Uninstalled');
        } else {
            log.error('Service could not be uninstalled')
        }
    });

    service.on('restart', function() {
        log.info('Restarting...');
    });

    service.on('stop', function() {
        if (!service.exists) {
            log.info('Stopped');
        }
    });

    return service;
}

module.exports = {
    create: create
};
