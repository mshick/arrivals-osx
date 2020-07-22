"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const betterQueue_1 = require("./betterQueue");
let counter = 0;
const watcher = async (payload, worker) => {
    counter += 1;
    console.log(`watcher attempt:`, counter);
    console.log(payload);
    worker.failedBatch(`failed`);
};
const q = betterQueue_1.createQueue(watcher, { dbPath: `./db/db.sqlite`, maxRetries: 10, retryDelay: 1000 });
// q.push(666)
q.push({ foo: `bar` });
//# sourceMappingURL=test.js.map