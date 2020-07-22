"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkArgs = void 0;
const meow_1 = __importDefault(require("meow"));
async function checkArgs() {
    const cli = meow_1.default(`
	Usage
    $ arrivals-osx install
  Commands
    install             Installs a plist and triggers launchctl
    `, {
        flags: {},
    });
    return cli.input[0];
}
exports.checkArgs = checkArgs;
//# sourceMappingURL=args.js.map