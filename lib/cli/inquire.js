"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inquire = void 0;
const fs_1 = __importDefault(require("fs"));
const inquirer_1 = require("inquirer");
const utils_1 = require("./utils");
async function inquire() {
    const processCwd = process.cwd();
    const homeDir = utils_1.untildify(`~/`);
    const baseDir = `.arrivals`;
    const { stdout: atomicparsley } = await utils_1.execPromise(`which atomicparsley`);
    const { stdout: ffmpeg } = await utils_1.execPromise(`which ffmpeg`);
    const { stdout: node } = await utils_1.execPromise(`which node`);
    const expandOptions = {
        baseDir,
        defaultValue: ``,
        homeDir,
        processCwd,
    };
    const questions = [
        {
            filter: (answer) => answer
                .trim()
                .split(`,`)
                .map(p => utils_1.expandPath(p, expandOptions))
                .join(`,`),
            message: `Enter paths to watch, separated by a comma:`,
            name: `WATCH_PATHS`,
            type: `input`,
            validate: (answer) => answer.length > 0 &&
                answer
                    .split(`,`)
                    .map(p => fs_1.default.existsSync(p))
                    .filter(x => x).length > 0,
        },
        {
            filter: (answer) => utils_1.expandPath(answer.trim(), expandOptions),
            message: `Video destination path:`,
            name: `VIDEO_DESTINATION`,
            type: `input`,
            validate: (answer) => answer.length > 0 && fs_1.default.existsSync(answer),
        },
        {
            filter: (answer) => utils_1.expandPath(answer.trim(), expandOptions),
            message: `Audio destination path:`,
            name: `AUDIO_DESTINATION`,
            type: `input`,
            validate: (answer) => answer.length > 0 && fs_1.default.existsSync(answer),
        },
        {
            default: `flac`,
            filter: (answer) => answer.trim(),
            message: `Convert audio extensions:`,
            name: `AUDIO_CONVERT_EXTENSIONS`,
            type: `input`,
        },
        {
            default: `mp3,m4a,m4b`,
            filter: (answer) => answer.trim(),
            message: `Copy audio extensions:`,
            name: `AUDIO_COPY_EXTENSIONS`,
            type: `input`,
        },
        {
            default: `mkv`,
            filter: (answer) => answer.trim(),
            message: `Copy video extensions:`,
            name: `VIDEO_COPY_EXTENSIONS`,
            type: `input`,
        },
        {
            default: atomicparsley.trim(),
            filter: (answer) => answer.trim(),
            message: `AtomicParsley path:`,
            name: `ATOMICPARSLEY_PATH`,
            type: `input`,
            validate: (answer) => answer.length > 0,
        },
        {
            default: ffmpeg.trim(),
            filter: (answer) => answer.trim(),
            message: `Ffmpeg path:`,
            name: `FFMPEG_PATH`,
            type: `input`,
            validate: (answer) => answer.length > 0,
        },
        {
            default: node.trim(),
            filter: (answer) => answer.trim(),
            message: `Node.js exec path:`,
            name: `NODE_EXEC_PATH`,
            type: `input`,
            validate: (answer) => answer.length > 0,
        },
        {
            default: utils_1.expandPath(``, { ...expandOptions, defaultValue: `db` }),
            filter: (answer) => utils_1.expandPath(answer.trim(), expandOptions),
            message: `Database path:`,
            name: `DB_PATH`,
            type: `input`,
            validate: (answer) => answer.length > 0,
        },
        {
            // @ts-ignore
            choices: [
                { name: `info`, value: `info` },
                { name: `error`, value: `error` },
                { name: `debug`, value: `debug` },
            ],
            message: `Log file path (not ):`,
            name: `LOG_LEVEL`,
            type: `list`,
        },
        {
            default: `/tmp`,
            filter: (answer) => utils_1.expandPath(answer.trim(), expandOptions),
            message: `Temp path:`,
            name: `TMP_PATH`,
            type: `input`,
            validate: (answer) => answer.length > 0,
        },
    ];
    return inquirer_1.prompt(questions).then(answers => {
        return answers;
    });
}
exports.inquire = inquire;
//# sourceMappingURL=inquire.js.map