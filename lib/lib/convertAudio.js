"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertAudio = void 0;
const child_process_1 = require("child_process");
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const fs_1 = __importDefault(require("fs"));
const glob_1 = __importDefault(require("glob"));
const path_1 = __importDefault(require("path"));
const winston_1 = __importDefault(require("winston"));
const checkVideoStream = (_, metadata) => {
    if (!metadata || !metadata.streams) {
        return false;
    }
    const videoStream = metadata.streams.filter(stream => stream.codec_name === `mjpeg`);
    if (videoStream.length) {
        if (metadata.streams.length === 1) {
            throw new Error(`Invalid stream length`);
        }
        return true;
    }
    return false;
};
const findCoverFile = (dirname) => {
    const preferredFilenames = [
        `cover.jpg`,
        `cover.jpeg`,
        `folder.jpg`,
        `folder.jpeg`,
        `front.jpg`,
        `front.jpeg`,
    ];
    const filepaths = glob_1.default.sync(`**/*.{jpeg,jpg}`, { cwd: dirname });
    let found;
    for (const filepath of filepaths) {
        const base = path_1.default.basename(filepath).toLowerCase();
        if (preferredFilenames.indexOf(path_1.default.basename(base)) > -1) {
            found = filepath;
        }
        if (found) {
            continue;
        }
        found = filepath;
    }
    if (found) {
        const resolved = path_1.default.resolve(dirname, found);
        winston_1.default.debug(`Found cover art file: %s`, resolved);
        return resolved;
    }
    return ``;
};
const embedCoverFile = (outputAudio, coverFile, binPaths) => {
    const cwd = path_1.default.dirname(outputAudio);
    winston_1.default.debug(`embedCoverFile: %s, %s, %s, %s`, binPaths.atomicparsley, outputAudio, `cover=${coverFile} --overWrite`, cwd);
    return new Promise(resolve => {
        const atomicparsley = child_process_1.spawn(binPaths.atomicparsley, [outputAudio, `--artwork=${coverFile}`, `--overWrite`], { cwd });
        // atomicparsley.stderr.on(`data`, data => log.debug(data.toString()))
        atomicparsley.on(`error`, (err) => {
            winston_1.default.debug(`atomicparsley error ${err.message}`);
            resolve();
        });
        atomicparsley.on(`exit`, (code, signal) => {
            if (signal) {
                winston_1.default.debug(`atomicparsley was killed with signal ${signal}`);
            }
            else if (code) {
                winston_1.default.debug(`atomicparsley exited with code ${code}`);
            }
            resolve();
        });
    });
};
function convertAudio(source, destination, binPaths) {
    const dirname = path_1.default.dirname(source);
    const outputFilename = path_1.default.basename(source).replace(path_1.default.extname(source), `.m4a`);
    const outputAudio = path_1.default.resolve(destination, outputFilename);
    const outputCover = path_1.default.resolve(destination, `cover.jpg`);
    winston_1.default.debug(outputAudio);
    const command = fluent_ffmpeg_1.default(source, { logger: winston_1.default })
        .noVideo()
        .audioCodec(`alac`)
        .outputOptions(`-map 0:0`)
        .outputOptions(`-movflags`)
        .outputOptions(`+faststart`)
        .addOutput(outputAudio);
    return new Promise((resolve, reject) => {
        let coverFileEmbedded;
        command.on(`start`, cmdline => cmdline && winston_1.default.debug(`ffmpeg command: %s`, cmdline.trim()));
        command.on(`error`, err => reject(err));
        command.on(`end`, () => {
            const coverFile = coverFileEmbedded && fs_1.default.existsSync(coverFileEmbedded)
                ? coverFileEmbedded
                : findCoverFile(dirname);
            if (coverFile) {
                embedCoverFile(outputAudio, coverFile, binPaths)
                    .then(() => {
                    resolve({ audio: outputAudio, hadCoverFile: true });
                })
                    .catch(() => {
                    resolve({ audio: outputAudio, hadCoverFile: true });
                });
            }
            else {
                resolve({
                    audio: outputAudio,
                    cover: coverFileEmbedded,
                    hadCoverFileEmbedded: true,
                });
            }
        });
        fluent_ffmpeg_1.default.ffprobe(source, (err, metadata) => {
            try {
                const hasVideoStream = checkVideoStream(err, metadata);
                if (hasVideoStream) {
                    coverFileEmbedded = outputCover;
                    command.addOutput(outputCover);
                }
                winston_1.default.debug(`Starting conversion of %s`, source);
                command.run();
            }
            catch (err) {
                reject(err);
            }
        });
    });
}
exports.convertAudio = convertAudio;
//# sourceMappingURL=convertAudio.js.map