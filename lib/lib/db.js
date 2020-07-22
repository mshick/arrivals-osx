"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDb = void 0;
const sqlite3_1 = require("sqlite3");
function createDb() {
    return new sqlite3_1.Database(`:memory:`);
}
exports.createDb = createDb;
//# sourceMappingURL=db.js.map