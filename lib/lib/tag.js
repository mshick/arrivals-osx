"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tag = void 0;
const child_process_1 = __importDefault(require("child_process"));
const util_1 = require("util");
const winston_1 = __importDefault(require("winston"));
const exec = util_1.promisify(child_process_1.default.exec);
class Tag {
    constructor(filepath) {
        this.filepath = filepath;
    }
    async addTag(tag) {
        const filepath = this.filepath;
        try {
            const cmd = [`tag`, `--add`, tag, filepath].join(` `);
            const result = await exec(cmd);
            if (result.stderr) {
                throw result.stderr;
            }
            winston_1.default.debug(result.stdout.toString());
        }
        catch (error) {
            winston_1.default.error(error);
        }
    }
    async removeTag(tag) {
        const filepath = this.filepath;
        try {
            const cmd = [`tag`, `--remove`, tag, filepath].join(` `);
            const result = await exec(cmd);
            if (result.stderr) {
                throw result.stderr;
            }
            winston_1.default.debug(result.stdout.toString());
        }
        catch (error) {
            winston_1.default.error(error);
        }
    }
}
exports.Tag = Tag;
//# sourceMappingURL=tag.js.map