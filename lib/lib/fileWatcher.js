"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFileWatcher = exports.FileWatcher = void 0;
const chokidar_1 = __importDefault(require("chokidar"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const winston_1 = __importDefault(require("winston"));
const types_1 = require("./types");
const lstat = util_1.promisify(fs_1.default.lstat);
class FileWatcher {
    constructor(options) {
        this.options = options;
        this.dispatcher = options.dispatcher;
        this.fswatcher = chokidar_1.default.watch(options.watchPath, {
            awaitWriteFinish: {
                pollInterval: 500,
                stabilityThreshold: 60000,
            },
        });
    }
    async init() {
        try {
            winston_1.default.info(`Starting watcher`);
            return this.fswatcher.on(`add`, this.onAdd.bind(this));
        }
        catch (err) {
            winston_1.default.error(err);
            throw err;
        }
    }
    onAdd(filePath) {
        try {
            const absFilePath = path_1.default.resolve(this.options.watchPath, filePath);
            winston_1.default.debug(`\n==FileWatcher onAdd==\nFilePath: %s\nAbsolute File Path: %s`, filePath, absFilePath);
            this.handleFileEvent(absFilePath);
        }
        catch (err) {
            winston_1.default.error(err);
        }
    }
    async handleFileEvent(filePath) {
        const stat = await lstat(filePath);
        if (stat.isFile() &&
            this.isValidFileType(filePath) &&
            (await this.dispatcher.isNewFile(filePath))) {
            return this.handleFile(filePath) && true;
        }
        return winston_1.default.debug(`Skipping file: %s`, filePath) && false;
    }
    async handleFile(filePath) {
        winston_1.default.info(`Taking file: %s`, filePath);
        const jobType = this.getJobType(filePath);
        winston_1.default.debug(`Took %s %s`, filePath, jobType);
        return this.dispatcher.enqueueFile(filePath, jobType);
    }
    getJobType(filePath) {
        const ext = path_1.default.extname(filePath).substr(1);
        const options = this.options;
        switch (true) {
            case options.copyVideoExtensions.includes(ext):
                return types_1.FileJobType.CopyVideo;
            case options.convertVideoExtensions.includes(ext):
                return types_1.FileJobType.ConvertVideo;
            case options.copyAudioExtensions.includes(ext):
                return types_1.FileJobType.CopyAudio;
            case options.convertAudioExtensions.includes(ext):
                return types_1.FileJobType.ConvertAudio;
            default:
                return types_1.FileJobType.Unknown;
        }
    }
    isValidFileType(filePath) {
        const jobType = this.getJobType(filePath);
        if (jobType === types_1.FileJobType.Unknown) {
            return false;
        }
        return true;
    }
}
exports.FileWatcher = FileWatcher;
function createFileWatcher(options) {
    return new FileWatcher(options);
}
exports.createFileWatcher = createFileWatcher;
//# sourceMappingURL=fileWatcher.js.map