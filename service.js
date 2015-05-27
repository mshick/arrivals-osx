var path = require('path');
var Service = require('node-mac').Service;


function create(dirName) {

    if (!dirName) {
        dirName = process.env['WATCH_PATH'].toLowerCase().replace('/', '').replace(/\//g, ':');
    }

    var name = 'arrivals::' + dirName;

    var service = new Service({
        name: name,
        description: 'Arrivals-osx watch process.',
        runAsUserAgent: true,
        script: path.resolve(__dirname, 'index.js'),
        env: [{
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
        console.log(dirName);
        service.start();
    });

    service.on('uninstall', function() {
        console.log('Uninstall complete');
        console.log('Service status:', service.exists);
    });

    service.on('restart', function() {
        console.log('Restarting...');
    });

    service.on('stop', function() {
        if (!service.exists) {
            console.log('Stopped');
        }
    });

    return service;
}

module.exports = {
    create: create
};
