"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWorker = exports.Worker = void 0;
const del_1 = require("del");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const winston_1 = __importDefault(require("winston"));
const convertAudio_1 = require("./convertAudio");
const copyFile_1 = require("./copyFile");
const enums_1 = require("./enums");
const isFileBusy_1 = require("./isFileBusy");
const tag_1 = require("./tag");
// Don't let the tags ruin things...
async function finalizeTagsSuccess(tag) {
    try {
        await tag.removeTag(`Red`);
        await tag.removeTag(`Yellow`);
        await tag.addTag(`Green`);
    }
    catch (err) {
        winston_1.default.debug(`tagging failure`);
    }
}
async function finalizeTagsFailure(tag) {
    try {
        await tag.removeTag(`Green`);
        await tag.removeTag(`Yellow`);
        await tag.addTag(`Red`);
    }
    catch (err) {
        winston_1.default.debug(`tagging failure`);
    }
}
class Worker {
    constructor(options) {
        this.options = options;
    }
    async handler(payload, worker) {
        const { filepath, jobType } = payload;
        const tag = new tag_1.Tag(filepath);
        try {
            const isBusy = await isFileBusy_1.isFileBusy(filepath);
            if (isBusy) {
                winston_1.default.info(`File %s is busy, deferring...`, filepath);
                worker.failedBatch(enums_1.FileJobStatus.Error);
            }
            winston_1.default.info(`Starting work for %s`, filepath);
            winston_1.default.debug(`Work type: %s`, enums_1.FileJobType[jobType]);
            const handled = fs_1.existsSync(filepath) ? await this.handleFile(filepath, jobType) : false;
            worker.finishBatch(handled ? enums_1.FileJobStatus.Complete : enums_1.FileJobStatus.Unhandled);
            await finalizeTagsSuccess(tag);
        }
        catch (err) {
            winston_1.default.error(err);
            worker.failedBatch(enums_1.FileJobStatus.Error);
            await finalizeTagsFailure(tag);
        }
    }
    async handleFile(filepath, jobType) {
        const { tmpPath, audioDestination, videoDestination, atomicparsleyPath: atomicparsley, } = this.options;
        const filename = path_1.default.basename(filepath);
        const dirname = path_1.default.dirname(filepath);
        switch (jobType) {
            case enums_1.FileJobType.ConvertAudio: {
                winston_1.default.debug(`Converting audio file`);
                const audioTmp = await convertAudio_1.convertAudio(filepath, tmpPath, {
                    atomicparsley,
                });
                winston_1.default.debug(`Temporary audio file created: %s`, audioTmp.audio);
                const outFileName = path_1.default.basename(audioTmp.audio);
                await copyFile_1.copyFile(audioTmp.audio, `${audioDestination}/${outFileName}`);
                if (audioTmp.audio) {
                    del_1.sync([audioTmp.audio], { force: true });
                }
                if (audioTmp.hadCoverFile) {
                    del_1.sync([`${dirname}/*cover-resized-*.jpg`], {
                        force: true,
                    });
                }
                if (audioTmp.hadCoverFileEmbedded) {
                    del_1.sync([audioTmp.cover, `${tmpPath}/*cover-resized-*.jpg`], {
                        force: true,
                    });
                }
                return true;
            }
            case enums_1.FileJobType.ConvertVideo: {
                winston_1.default.debug(`Converting video file`);
                winston_1.default.info(`VIDEO CONVERSION IS DISABLED`);
                return true;
            }
            case enums_1.FileJobType.CopyAudio: {
                winston_1.default.debug(`Copying audio file`);
                await copyFile_1.copyFile(filepath, `${audioDestination}/${filename}`);
                return true;
            }
            case enums_1.FileJobType.CopyVideo: {
                winston_1.default.debug(`Copying video file`);
                await copyFile_1.copyFile(filepath, `${videoDestination}/${filename}`);
                return true;
            }
            default:
                return false;
        }
    }
}
exports.Worker = Worker;
function createWorker(options) {
    return new Worker(options);
}
exports.createWorker = createWorker;
//# sourceMappingURL=worker.js.map