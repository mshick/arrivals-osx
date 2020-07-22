"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQueue = exports.TaskQueue = void 0;
const better_queue_1 = __importDefault(require("better-queue"));
const winston_1 = __importDefault(require("winston"));
// @ts-ignore
const store_1 = __importDefault(require("./store"));
function queueHandlerShim(handler) {
    return function queueHandler(payload, done) {
        handler(payload, this)
            .then(() => done())
            .catch((err) => done(err));
    };
}
class TaskQueue extends better_queue_1.default {
    pushPromise(payload) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.push(payload));
            }
            catch (err) {
                reject(err);
            }
        });
    }
}
exports.TaskQueue = TaskQueue;
function createQueue(handler, options) {
    try {
        return new TaskQueue(queueHandlerShim(handler), {
            batchDelay: options.batchDelay,
            batchSize: 1,
            cancelIfRunning: true,
            concurrent: 1,
            id: `filepath`,
            maxRetries: options.maxRetries,
            maxTimeout: 60000,
            retryDelay: options.retryDelay,
            store: new store_1.default({
                path: `${options.dbPath}/queue.sqlite`,
            }),
        });
    }
    catch (err) {
        winston_1.default.error(err);
        throw err;
    }
}
exports.createQueue = createQueue;
//# sourceMappingURL=taskQueue.js.map