"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQueue = exports.TaskQueue = void 0;
const better_queue_1 = __importDefault(require("better-queue"));
const winston_1 = __importDefault(require("winston"));
function queueHandlerShim(handler) {
    return function queueHandler(payload, done) {
        try {
            handler(payload, this)
                .then(() => done())
                .catch((err) => done(err));
        }
        catch (err) {
            winston_1.default.error(err);
            done(err);
        }
    };
}
class TaskQueue extends better_queue_1.default {
    pushPromise(payload) {
        return new Promise((resolve, reject) => {
            try {
                const ticket = this.push(payload, err => {
                    err ? reject(err) : resolve(ticket);
                });
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
            maxRetries: options.maxRetries,
            retryDelay: options.retryDelay,
            store: {
                type: `sql`,
                dialect: `sqlite`,
                path: `${options.dbPath}/queue.sqlite`,
            },
        });
    }
    catch (err) {
        winston_1.default.error(err);
        throw err;
    }
}
exports.createQueue = createQueue;
//# sourceMappingURL=taskQueue.js.map