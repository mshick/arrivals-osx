var execFile = require('child_process').execFile;


module.exports = function (source, destination) {

    return new Promise(function (resolve, reject) {

        var proc = execFile('/bin/cp', [source, destination]);

        proc.on('error', reject);
        proc.on('close', resolve);
    });
};
