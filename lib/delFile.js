var del = require('del');


module.exports = function (filepath) {

    return new Promise(function (resolve, reject) {

        del([filepath], { force: true }, function (err) {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
};
