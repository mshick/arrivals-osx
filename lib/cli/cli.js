"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = require("fs");
const mkdirp_1 = __importDefault(require("mkdirp"));
const path_1 = __importDefault(require("path"));
const plist_1 = __importDefault(require("plist"));
const args_1 = require("./args");
const inquire_1 = require("./inquire");
const utils_1 = require("./utils");
(async () => {
    const command = await args_1.checkArgs();
    if (command === utils_1.Commands.Install) {
        const userOptions = {
            ...(await (async () => {
                console.log(utils_1.getIntro());
                return inquire_1.inquire();
            })()),
        };
        const label = `us.shick.arrivals`;
        const rootPath = path_1.default.resolve(__dirname, `../`);
        const plistPath = utils_1.untildify(`~/Library/LaunchAgents/${label}.plist`);
        const logPath = utils_1.untildify(`~/Library/Logs/${label}`);
        const outLogPath = path_1.default.resolve(logPath, `arrivals.log`);
        const execPath = userOptions.NODE_EXEC_PATH;
        // Might need to switch back to process.js
        const scriptPath = `${rootPath}/lib/run.js`;
        const workingDirectory = path_1.default.resolve(__dirname, `../../../`);
        const tpl = {
            EnvironmentVariables: userOptions,
            KeepAlive: false,
            Label: label,
            ProgramArguments: [execPath, scriptPath],
            RunAtLoad: true,
            StandardErrorPath: outLogPath,
            StandardOutPath: outLogPath,
            WorkingDirectory: workingDirectory,
        };
        const plistData = plist_1.default.build(tpl).toString();
        mkdirp_1.default.sync(logPath);
        utils_1.touch(outLogPath);
        fs_1.writeFileSync(plistPath, plistData);
        try {
            await utils_1.execPromise(`launchctl load ${plistPath}`);
            console.log(`launchdaemon loaded`);
        }
        catch (err) {
            console.log(`Could not start: %s`, err.message);
        }
    }
})().catch((err) => {
    console.error(`
  ${chalk_1.default.red(err.message)}
`);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map