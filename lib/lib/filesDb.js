"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFilesDb = void 0;
const sqlite3_1 = require("sqlite3");
function createFilesDb() {
    return new sqlite3_1.Database(`:memory:`);
}
exports.createFilesDb = createFilesDb;
//# sourceMappingURL=filesDb.js.map