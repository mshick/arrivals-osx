"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.watch = void 0;
const assert_1 = __importDefault(require("assert"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger = __importStar(require("winston"));
const dispatcher_1 = require("./dispatcher");
const fileWatcher_1 = require("./fileWatcher");
const logger_1 = require("./logger");
const filesDb_1 = require("./filesDb");
const taskQueue_1 = require("./taskQueue");
const utils_1 = require("./utils");
const worker_1 = require("./worker");
const mapWatchPaths = (cwd) => (p) => {
    const watchPath = path_1.default.isAbsolute(p) === true ? p : path_1.default.resolve(cwd, p);
    assert_1.default(watchPath && fs_1.default.statSync(watchPath).isDirectory(), `Watch path must exist and be a directory`);
    return watchPath;
};
async function watch() {
    const options = utils_1.buildDefaults();
    logger_1.createLogger(options);
    const { cwd, watchPaths, videoDestination, audioDestination } = options;
    logger.debug(`Starting...`);
    logger.debug(`cwd: %s`, cwd);
    logger.debug(`Video destination: %s`, videoDestination);
    assert_1.default(videoDestination && fs_1.default.statSync(videoDestination).isDirectory(), `Video destination must exist and be a directory`);
    logger.debug(`Audio destination: %s`, audioDestination);
    assert_1.default(audioDestination && fs_1.default.statSync(audioDestination).isDirectory(), `Audio destination must exist and be a directory`);
    const workerOptions = { ...options };
    const worker = worker_1.createWorker(workerOptions);
    const queue = taskQueue_1.createQueue(worker.handler.bind(worker), options);
    const filesDb = filesDb_1.createFilesDb();
    const dispatcher = dispatcher_1.createDispatcher({ filesDb, queue, watchPaths });
    await dispatcher.init();
    logger.debug(`Database created`);
    const pathsToWatch = watchPaths.map(mapWatchPaths(cwd));
    logger.debug(`Watching paths: %s`, pathsToWatch.toString());
    const watchers = watchPaths.map(watchPath => {
        const fileWatcherOptions = {
            dispatcher,
            watchPath,
            ...options,
        };
        const fileWatcher = fileWatcher_1.createFileWatcher(fileWatcherOptions);
        return fileWatcher.init();
    });
    return Promise.all(watchers);
}
exports.watch = watch;
//# sourceMappingURL=arrivals.js.map