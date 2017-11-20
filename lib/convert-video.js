const path = require('path');
const spawn = require('child_process').spawn;
const bole = require('bole');
const log = bole('video conversion');

module.exports = function (source, destination, bin) {
  const outputFilename = path.basename(source).replace(path.extname(source), '.m4v');
  const output = path.resolve(destination, outputFilename);

  log.debug(output);

  return new Promise((resolve, reject) => {
    log.debug('Starting conversion of %s', source);

    const args = [
      '--no-summary',
      `--tmp=${destination}`,
      `--mp4box=${bin.mp4box}`,
      `--mkvinfo=${bin.mkvinfo}`,
      `--ffmpeg=${bin.ffmpeg}`,
      `--mkvextract=${bin.mkvextract}`,
      '--overwrite',
      '--use-audio-passthrough',
      '--audio-codec=libfdk_aac',
      '--subtitles-track=MAIN',
      `--output=${output}`,
      '--',
      source
    ];

    const proc = spawn(bin.mkvtomp4, args);

    log.debug('spawn: %s', `/usr/local/bin/mkvtomp4 ${args.join(' ')}`);

    proc.stdout.setEncoding('utf8');

    let processExited = false;

    const handleExit = err => {
      if (err) {
        return reject(err);
      }

      if (processExited) {
        resolve(output);
      }
    };

    const handleData = data => {
      const str = data.toString();
      return str.split(/(\r?\n)/g).map(ln => ln.trim()).filter(ln => ln);
    };

    proc.stdout.on('data', data => {
      const lines = handleData(data);
      lines.forEach(line => {
        log.debug(line);
      });
    });

    proc.stderr.on('data', data => {
      const lines = handleData(data);
      lines.forEach(line => {
        log.debug(line);
      });
    });

    proc.on('error', err => {
      log.error(err);
      return reject(err);
    });

    proc.on('exit', (code, signal) => {
      processExited = true;

      log.debug('exit', code, signal);

      if (signal) {
        handleExit(new Error(`mkvtomp4 was killed with signal ${signal}`));
      } else if (code) {
        handleExit(new Error(`mkvtomp4 exited with code ${code}`));
      } else {
        handleExit();
      }
    });
  });
};
