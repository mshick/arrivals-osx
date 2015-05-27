var path = require('path');
var spawn = require('child_process').spawn;
var bole = require('bole');
var log = bole('video conversion');


module.exports = function(source, destination, bin) {

    var outputFilename = path.basename(source).replace(path.extname(source), '.m4v');
    var output = path.resolve(destination, outputFilename);

    log.debug(output);

    return new Promise(function(resolve, reject) {

        log.debug('Starting conversion of %s', source);

        var args = [
            '--no-summary',
            '--tmp=' + destination,
            '--mp4box=' + bin.mp4box,
            '--mkvinfo=' + bin.mkvinfo,
            '--ffmpeg=' + bin.ffmpeg,
            '--mkvextract=' + bin.mkvextract,
            '--overwrite',
            '--use-audio-passthrough',
            '--audio-codec=libfdk_aac',
            '--subtitles-track=MAIN',
            '--output=' + output,
            '--',
            source
        ];

        var proc = spawn(bin.mkvtomp4, args);

        log.debug('spawn: %s', '/usr/local/bin/mkvtomp4 ' + args.join(' '));

        proc.stdout.setEncoding('utf8');

        proc.stdout.on('data', function(data) {
            var str = data.toString(),
                lines = str.split(/(\r?\n)/g);
            for (var i = 0; i < lines.length; i++) {
                if (lines[i].trim()) {
                    log.debug(lines[i].trim());
                }
            }
        });

        var processExited = false;

        function handleExit(err) {

            if (err) {
                return reject(err);
            }

            if (processExited) {
                resolve(output);
            }
        }

        proc.on('error', function(err) {
            return reject(err);
        });

        proc.on('exit', function(code, signal) {

            processExited = true;

            log.debug('exit', code, signal);

            if (signal) {
                handleExit(new Error('mkvtomp4 was killed with signal ' + signal));
            } else if (code) {
                handleExit(new Error('mkvtomp4 exited with code ' + code));
            } else {
                handleExit();
            }
        });
    });
};
