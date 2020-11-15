"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDispatcher = exports.Dispatcher = void 0;
const glob_1 = __importDefault(require("glob"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const winston_1 = __importDefault(require("winston"));
const tag_1 = require("./tag");
const utils_1 = require("./utils");
const globPromise = util_1.promisify(glob_1.default);
const FILES_TABLE_NAME = `files`;
class Dispatcher {
    constructor(options) {
        this.db = options.filesDb;
        this.queue = options.queue;
        this.options = options;
    }
    async init() {
        try {
            winston_1.default.info(`Starting dispatcher ...`);
            const existingPaths = this.options.watchPaths.map(watchPath => this.buildExistingFilesDb(watchPath));
            const existingPathsAdded = await Promise.all(existingPaths);
            const existingPathsCount = existingPathsAdded.reduce((p, c) => p + c, 0);
            winston_1.default.info(`%s existing paths added`, existingPathsCount);
            winston_1.default.info(`Dispatcher started!`);
        }
        catch (err) {
            winston_1.default.error(err);
            throw err;
        }
    }
    async insertExistingFiles(filePaths) {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run(`CREATE TABLE ${FILES_TABLE_NAME} (filepath TEXT PRIMARY KEY);`, (err, res) => {
                    if (err) {
                        winston_1.default.error(`create table error`, err);
                        reject(err);
                        return;
                    }
                    winston_1.default.debug(`create table result`, res);
                    this.db.parallelize(() => {
                        filePaths.forEach(filePath => {
                            this.db.run(`INSERT INTO ${FILES_TABLE_NAME} VALUES (?);`, filePath);
                        });
                    });
                    // this.db.run(`INSERT INTO ${FILES_TABLE_NAME} VALUES ${filePlaceholders}`, filePaths)
                    this.db.all(`SELECT * FROM ${FILES_TABLE_NAME};`, (err, rows) => {
                        resolve(rows.length);
                    });
                });
            });
        });
    }
    async buildExistingFilesDb(watchPath) {
        const files = await globPromise(`**/*`, {
            cwd: watchPath,
        });
        const filePaths = files.map((filepath) => path_1.default.resolve(watchPath, filepath));
        return this.insertExistingFiles(filePaths);
    }
    async isNewFile(filepath) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM ${FILES_TABLE_NAME} WHERE filepath = ?`, filepath, (err, row) => {
                if (err) {
                    reject(err);
                }
                if (row && row.filepath) {
                    resolve(false);
                }
                resolve(true);
            });
        });
    }
    async enqueueFile(filepath, filetype) {
        return new Promise(resolve => {
            let tag;
            if (this.options.tagPath) {
                tag = new tag_1.Tag(filepath, this.options.tagPath);
            }
            const jobType = filetype;
            try {
                this.db.serialize(() => {
                    this.db.run(`INSERT INTO ${FILES_TABLE_NAME} VALUES (?)`, filepath, err => {
                        if (err) {
                            winston_1.default.error(`Error in enqueue\n%s`, utils_1.prettyPrint(err));
                        }
                        const fileJobPayload = {
                            filepath,
                            jobType,
                        };
                        const ticket = this.queue.push(fileJobPayload);
                        winston_1.default.debug(`${filepath} enqueued with ticket:\n%s`, ticket);
                        if (tag) {
                            tag.addTag(`Yellow`);
                        }
                        resolve(true);
                    });
                });
            }
            catch (err) {
                winston_1.default.error(`Error in enqueue\n%s`, utils_1.prettyPrint(err));
                resolve(false);
            }
        });
    }
}
exports.Dispatcher = Dispatcher;
function createDispatcher(options) {
    return new Dispatcher(options);
}
exports.createDispatcher = createDispatcher;
//# sourceMappingURL=dispatcher.js.map