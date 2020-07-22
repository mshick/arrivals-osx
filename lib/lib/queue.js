"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQueue = void 0;
// tslint:disable:no-object-mutation
const level_jobs_1 = __importDefault(require("level-jobs"));
const winston_1 = __importDefault(require("winston"));
function queueHandlerShim(handler) {
    return function queueHandler(jobId, payload, done) {
        try {
            handler(jobId, payload)
                .then(() => done())
                .catch(err => done(err));
        }
        catch (err) {
            winston_1.default.error(err);
            done(err);
        }
    };
}
function createQueue(db, handler, options) {
    try {
        const queue = new level_jobs_1.default(db, queueHandlerShim(handler), options);
        queue.pushPromise = async (payload) => {
            return new Promise((resolve, reject) => {
                try {
                    const jobId = queue.push(payload, err => {
                        err ? reject(err) : resolve(jobId);
                    });
                }
                catch (err) {
                    reject(err);
                }
            });
        };
        return queue;
    }
    catch (err) {
        winston_1.default.error(err);
    }
}
exports.createQueue = createQueue;
//# sourceMappingURL=queue.js.map