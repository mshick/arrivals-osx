"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_queue_1 = __importDefault(require("better-queue"));
const watcher = (input, cb) => {
    // Some processing here ...
    console.log(input);
    const result = input + 1;
    cb(null, result);
};
const q = new better_queue_1.default(watcher, {
    store: {
        type: `sql`,
        dialect: `sqlite`,
        path: `./db/db.sqlite`,
    },
});
q.push(1);
q.push({ x: 1 });
//# sourceMappingURL=newQueue.js.map