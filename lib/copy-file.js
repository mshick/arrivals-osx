const execFile = require('child_process').execFile;

module.exports = function (source, destination) {
  return new Promise((resolve, reject) => {
    const proc = execFile('/bin/cp', [source, destination]);

    proc.on('error', reject);
    proc.on('close', resolve);
  });
};
