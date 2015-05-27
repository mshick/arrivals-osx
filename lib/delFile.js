var execFile = require('child_process').execFile;


module.exports = function (filepath) {

    return new Promise(function (resolve, reject) {

        var proc = execFile('/bin/rm', [filepath]);

        proc.on('error', reject);
        proc.on('close', resolve);
    });
};
