"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDefaults = exports.prettyPrint = void 0;
const path_1 = __importDefault(require("path"));
function prettyPrint(data) {
    return JSON.stringify(data, null, 4);
}
exports.prettyPrint = prettyPrint;
function buildDefaults() {
    const { CWD: cwd = process.cwd(), DB_PATH: dbPath = `./fixtures/db`, VIDEO_DESTINATION: videoDestination = `./fixtures/videoDestination`, VIDEO_CONVERT_EXTENSIONS: convertVideoExtensions = ``, VIDEO_COPY_EXTENSIONS: copyVideoExtensions = `mkv`, AUDIO_DESTINATION: audioDestination = `./fixtures/audioDestination`, AUDIO_CONVERT_EXTENSIONS: convertAudioExtensions = `flac`, AUDIO_COPY_EXTENSIONS: copyAudioExtensions = `mp3,m4a,m4b`, LOG_FILE: logFile = ``, LOG_LEVEL: logLevel = `debug`, LOG_TYPE: logType = `console`, TMP_PATH: tmpPath = `./fixtures/tmpFolder`, WATCH_PATHS: watchPathsRaw = `./fixtures/watchFolder`, ATOMICPARSLEY_PATH: atomicparsleyPath = `/usr/local/bin/atomicparsley`, TAG_PATH: tagPath, } = process.env;
    const watchPathsArr = watchPathsRaw ? watchPathsRaw.split(`,`) : [];
    const watchPaths = watchPathsArr.map(watchPath => path_1.default.resolve(cwd, watchPath));
    const options = {
        tagPath,
        atomicparsleyPath,
        audioDestination,
        convertAudioExtensions: convertAudioExtensions ? convertAudioExtensions.split(`,`) : [],
        convertVideoExtensions: convertVideoExtensions ? convertVideoExtensions.split(`,`) : [],
        copyAudioExtensions: copyAudioExtensions ? copyAudioExtensions.split(`,`) : [],
        copyVideoExtensions: copyVideoExtensions ? copyVideoExtensions.split(`,`) : [],
        cwd,
        dbPath,
        logFile,
        logLevel,
        logType,
        tmpPath,
        videoDestination,
        watchPaths,
        maxRetries: 25,
        retryDelay: 5000,
        batchDelay: 500,
    };
    return options;
}
exports.buildDefaults = buildDefaults;
//# sourceMappingURL=utils.js.map