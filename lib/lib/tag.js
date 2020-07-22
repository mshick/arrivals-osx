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
// Hex -> bin -> json -> lines
const hexToLines = `xxd -r -p - - | plutil -convert json -o - - | sed "s/[][]//g" | tr "," "\n"`;
// Lines -> json -> bin -> hex
const linesToHex = `tr "\n" "," | echo [\$(sed "s/,$//")] | plutil -convert binary1 -o - - | xxd -p - -`; // eslint-disable-line no-useless-escape
// Get them all
const gettags = `xattr -px com.apple.metadata:_kMDItemUserTags "%s" 2> /dev/null | ${hexToLines} | sed "s;.*Property List error.*;;"`;
const writeCmd = (get, op, src) => {
    const write = `xattr -wx com.apple.metadata:_kMDItemUserTags "$(%s | %s | grep . | %s)" "%s"`;
    return util_1.format(write, get, op, linesToHex, src);
};
const addCmd = (source, tag) => {
    const get = util_1.format(gettags, source);
    let add = `(cat -; echo \\\"%s\\\") | sort -u`; // eslint-disable-line no-useless-escape
    add = util_1.format(add, tag);
    return writeCmd(get, add, source);
};
const removeCmd = (source, tag) => {
    const get = util_1.format(gettags, source);
    let remove = `(cat - | sed "s;\\\"%s\\\";;") | sort -u`; // eslint-disable-line no-useless-escape
    remove = util_1.format(remove, tag);
    return writeCmd(get, remove, source);
};
const replaceCmd = (source, tag, replacement) => {
    const get = util_1.format(gettags, source);
    let replace = `(cat - | sed "s;\"%s\";\"%s\";") | sort -u`; // eslint-disable-line no-useless-escape
    replace = util_1.format(replace, tag, replacement);
    return writeCmd(get, replace, source);
};
class Tag {
    constructor(filepath) {
        this.filepath = filepath;
    }
    async addTag(tag) {
        const filepath = this.filepath;
        try {
            const cmd = addCmd(filepath, tag);
            const result = await exec(cmd);
            winston_1.default.debug(result.stdout);
            if (result.stderr) {
                throw result.stderr;
            }
        }
        catch (error) {
            winston_1.default.error(error);
        }
    }
    async removeTag(tag) {
        const filepath = this.filepath;
        try {
            const cmd = removeCmd(filepath, tag);
            const result = await exec(cmd);
            winston_1.default.debug(result.stdout);
            if (result.stderr) {
                throw result.stderr;
            }
        }
        catch (error) {
            winston_1.default.error(error);
        }
    }
    async replaceTag(tag, replacement) {
        const filepath = this.filepath;
        try {
            const cmd = replaceCmd(filepath, tag, replacement);
            const result = await exec(cmd);
            winston_1.default.debug(result.stdout);
            if (result.stderr) {
                throw result.stderr;
            }
        }
        catch (error) {
            winston_1.default.error(error);
        }
    }
}
exports.Tag = Tag;
//# sourceMappingURL=tag.js.map