"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyFile = void 0;
const child_process_1 = require("child_process");
function copyFile(source, destination) {
    return new Promise((resolve, reject) => {
        const proc = child_process_1.execFile(`/bin/cp`, [source, destination]);
        proc.on(`error`, reject);
        proc.on(`close`, resolve);
    });
}
exports.copyFile = copyFile;
//# sourceMappingURL=copyFile.js.map