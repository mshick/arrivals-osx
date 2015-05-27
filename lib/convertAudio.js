var path = require('path');
var FfmpegCommand = require('fluent-ffmpeg');
var bole = require('bole');
var log = bole('audio conversion');


module.exports = function (source, destination) {

    var outputFilename = path.basename(source).replace(path.extname(source), '.m4a');
    var output = path.resolve(destination, outputFilename);

    log.debug(output);

    var command = new FfmpegCommand(source)
        .noVideo()
        .audioCodec('alac')
        .outputOptions('-map 0:0')
        .outputOptions('-movflags')
        .outputOptions('+faststart');

    return new Promise(function (resolve, reject) {
        log.debug('Starting conversion of %s', source);
        command.on('error', reject);
        command.on('end', function () {
            resolve(output);
        });
        command.save(output);
    });
};
