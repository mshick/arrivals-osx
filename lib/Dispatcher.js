const {promisify} = require('util');
const path = require('path');
const config = require('ez-config');
const glob = promisify(require('glob'));
const sublevel = require('level-sublevel');
const levelWs = require('level-ws');
const levelPromisify = require('level-promisify');
const deleteStream = require('level-delete-stream');
const Jobs = require('level-jobs');
const Worker = require('./worker');
const Tag = require('./tag');

const EXISTING = config.get('flags.EXISTING');
const PENDING = config.get('flags.PENDING');
const EXTENSION_LIST = config.get('extensions');

const maxConcurrency = 1;

class Dispatcher {
  constructor(options) {
    options = options || {};

    this.watchPath = options.watchPath;

    const levelDb = options.db;

    this.db = sublevel(levelDb);
    this.files = levelWs(this.db.sublevel('files', {
      valueEncoding: 'json'
    }));
    this.files = levelPromisify(this.files);

    const workerOpts = options;
    workerOpts.db = this.files;

    const worker = new Worker(workerOpts);

    const handler = function () {
      return worker.handler.apply(worker, arguments);
    };

    this.queue = new Jobs(this.db, handler, maxConcurrency);
  }

  async init() {
    try {
      const cwd = this.watchPath;

      const files = await glob(`**/*.{${EXTENSION_LIST.join(',')}}`, {cwd});

      const existingFiles = files.map(filepath => ({
        type: 'put',
        key: path.resolve(cwd, filepath),
        value: {
          status: EXISTING
        }
      }));

      await this.files.batch(existingFiles);

      return existingFiles.length;
    } catch (error) {
      throw error;
    }
  }

  clearExisting() {
    const self = this;

    return new Promise((resolve, reject) => {
      self.files.root.createKeyStream()
        .pipe(deleteStream(self.files.root, err => {
          if (err) {
            return reject(err);
          }

          resolve();
        }));
    });
  }

  async check(filepath) {
    try {
      await this.files.get(filepath);
      return true;
    } catch (error) {
      if (error && error.notFound) {
        return false;
      }
      throw error;
    }
  }

  async checkDir(dirpath) {
    try {
      const files = await glob(`**/*.{${EXTENSION_LIST.join(',')}}`, {
        cwd: dirpath
      });

      if (!files || !files.length) {
        return false;
      }

      const checks = files.map(file => (
        this.check(path.resolve(dirpath, file))
      ));

      const res = await Promise.all(checks);

      const results = res.map((result, index) => {
        if (result === false) {
          return path.resolve(dirpath, files[index]);
        }
        return null;
      }).filter(result => result);

      return results;
    } catch (error) {
      throw error;
    }
  }

  push(filepath) {
    return new Promise((resolve, reject) => {
      const tag = new Tag(filepath);

      let jobId;

      const put = async () => {
        try {
          await this.files.put(filepath, {
            status: PENDING,
            jobId
          });

          await tag.addTag('Yellow');

          resolve();
        } catch (error) {
          reject(error);
        }
      };

      jobId = this.queue.push(filepath, err => {
        if (err) {
          return reject(err);
        }
        put();
      });
    });
  }
}

module.exports = Dispatcher;
