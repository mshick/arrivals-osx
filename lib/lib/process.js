"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:no-if-statement no-let no-delete no-object-mutation
const child_process_1 = require("child_process");
const net_1 = require("net");
const path_1 = __importDefault(require("path"));
const script = path_1.default.resolve(__dirname, `./run.js`);
const max = 60;
const maxRetries = -1;
const maxRestarts = 5;
const grow = 0.25;
let wait = 1000;
let startTime = null;
let starts = 0;
let attempts = 0;
// Hack to force the wrapper process to stay open by launching a ghost socket server
const server = net_1.createServer().listen(0, `127.0.0.1`);
process.title = `arrivals`;
let child = null;
const monitor = () => {
    if (!child.pid) {
        // If the number of periodic starts exceeds the max, kill the process
        if (starts >= maxRestarts && startTime instanceof Date) {
            if (new Date().getTime() - max * 1000 <= startTime.getTime()) {
                console.error(`Too many restarts within the last ` + max + ` seconds. Please check the script.`);
                process.exit();
            }
        }
        setTimeout(() => {
            wait = wait * grow;
            attempts += 1;
            if (attempts > maxRetries && maxRetries >= 0) {
                console.error(`Too many restarts. Arrivals will not be restarted because the maximum number of total restarts has been exceeded.`);
                process.exit();
            }
            else {
                launch();
            }
        }, wait);
    }
    else {
        attempts = 0;
        wait = 1000;
    }
};
const launch = () => {
    // Set the start time if it's null
    if (startTime === null) {
        startTime = startTime || new Date();
        setTimeout(() => {
            startTime = null;
            starts = 0;
        }, max * 1000 + 1);
    }
    starts += 1;
    // Fork the child process
    child = child_process_1.fork(script, [], { env: process.env });
    // When the child dies, attempt to restart based on configuration
    child.on(`exit`, (code) => {
        console.error(`Arrivals stopped running.`);
        // If an error is thrown and the process is configured to exit, then kill the parent.
        if (code !== 0 && code !== null) {
            console.error(`Arrivals exited with error code ${code}`);
            process.exit();
            server.unref();
        }
        delete child.pid;
        // Monitor the process
        monitor();
    });
};
process.on(`exit`, () => {
    if (child.pid) {
        process.kill(child.pid);
    }
    process.exit();
});
// Launch the process
launch();
//# sourceMappingURL=process.js.map