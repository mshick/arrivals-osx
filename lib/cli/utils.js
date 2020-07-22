"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.execPromise = exports.touch = exports.expandPath = exports.untildify = exports.getIntro = exports.Commands = void 0;
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
var Commands;
(function (Commands) {
    Commands["Install"] = "install";
    Commands["Watch"] = "watch";
})(Commands = exports.Commands || (exports.Commands = {}));
function getIntro() {
    return `\n${chalk_1.default.cyan.bold(`
  ~~~         A R R I V A L S          ~~~

  [All paths must exist before you install]
  `)}\n`;
}
exports.getIntro = getIntro;
function untildify(input) {
    const home = os_1.default.homedir();
    return home ? input.replace(/^~(?=$|\/|\\)/, home) : input;
}
exports.untildify = untildify;
function expandPath(filePath, options) {
    switch (true) {
        case filePath === `` && options.defaultValue === ``:
            return ``;
        case filePath === ``:
            return path_1.default.join(options.homeDir, options.baseDir, options.defaultValue || ``);
        case path_1.default.isAbsolute(filePath):
            return filePath;
        default:
            return path_1.default.resolve(options.processCwd, filePath);
    }
}
exports.expandPath = expandPath;
function touch(filename) {
    try {
        return fs_1.closeSync(fs_1.openSync(filename, `w`));
    }
    catch (err) {
        console.log(`file already exists`);
    }
}
exports.touch = touch;
exports.execPromise = util_1.promisify(child_process_1.exec);
//# sourceMappingURL=utils.js.map