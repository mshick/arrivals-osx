var path = require('path');
var glob = require('glob');
var levelup = require('levelup');
var sublevel = require('level-sublevel');
var levelWs = require('level-ws');
var deleteStream = require('level-delete-stream');
var Jobs = require('level-jobs');
var Worker = require('./worker');
var co = require('co');
var config = require('../config');

const EXISTING = config.get('flags.EXISTING');
const PENDING = config.get('flags.PENDING');
const EXTENSION_LIST = config.get('extensions');


var Dispatcher = function (options) {

    options = options || {};

    this.watchPath = options.watchPath;

    var levelDb = levelup(options.dbPath);

    this.db = sublevel(levelDb);
    this.files = levelWs(this.db.sublevel('files', { valueEncoding: 'json' }));

    var maxConcurrency = 1;

    var worker = new Worker({
        db: this.files,
        tmpPath: options.tmpPath,
        audioDestination: options.audioDestination,
        videoDestination: options.videoDestination,
        binPaths: options.binPaths
    });

    var handler = function () {
        return worker.handler.apply(worker, arguments);
    };

    this.queue = new Jobs(this.db, handler, maxConcurrency);
};

Dispatcher.prototype.clearExisting = function () {

    var self = this;

    return new Promise(function (resolve, reject) {
        self.files.createKeyStream()
            .pipe(deleteStream(self.files, function (err) {

                if (err) {
                    return reject(err);
                }

                resolve();
            }));
    });
};

Dispatcher.prototype.storeExisting = function () {

    var self = this;

    return new Promise(function (resolve, reject) {

        var processGlobs = function (err, files) {

            if (err) {
                return reject(err);
            }

            var existingFiles = files.map(function (filepath) {
                return {
                    type: 'put',
                    key: path.resolve(self.watchPath, filepath),
                    value: { status: EXISTING }
                };
            });

            self.files.batch(existingFiles, function (error) {

                if (error) {
                    return reject(error);
                }

                resolve(existingFiles.length);
            });
        };

        glob(`**/*.{${EXTENSION_LIST.join(',')}}`, { cwd: self.watchPath }, processGlobs);
    });
};

Dispatcher.prototype.check = function (filepath) {

    var self = this;

    return new Promise(function (resolve, reject) {

        self.files.get(filepath, function (err, result) {

            if (err && err.notFound) {
                return resolve(false);
            }

            if (err) {
                return reject(err);
            }

            resolve(result);
        });
    });
};

Dispatcher.prototype.checkDir = function (dirpath) {

    var self = this;

    return new Promise(function (resolve, reject) {

        var processGlobs = function (err, files) {
            if (err) {
                return reject(err);
            }

            if (!files || !files.length) {
                return resolve(false);
            }

            var promises = files.map(function (file) {
                return self.check(path.resolve(dirpath, file));
            });

            Promise.all(promises).then(function (res) {
                var results = res.map(function (result, index) {
                    if (result === false) {
                        return path.resolve(dirpath, files[index]);
                    } else {
                        return null;
                    }
                }).filter(function (result) {
                    return (result);
                });

                return resolve(results);
            });
        };

        glob(`**/*.{${EXTENSION_LIST.join(',')}}`, { cwd: dirpath }, processGlobs);
    });
};

Dispatcher.prototype.push = function (filepath) {

    var self = this;

    return new Promise(function (resolve, reject) {

        var jobId;

        var put = function () {
            self.files.put(filepath, { status: PENDING, jobId: jobId }, function (err) {
                if (err) {
                    return reject(err);
                }

                resolve();
            });
        };

        jobId = self.queue.push(filepath, function(err) {

            if (err) {
                return reject(err);
            }

            put();
        });


    });
};

Dispatcher.prototype.start = function () {

    var self = this;

    return co(function* () {

        yield self.clearExisting();
        yield self.storeExisting();
    });
};

module.exports = Dispatcher;
