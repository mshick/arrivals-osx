"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = void 0;
const winston_1 = require("winston");
const { combine, timestamp, splat } = winston_1.format;
const myFormat = winston_1.format.printf(info => {
    return `${info.timestamp} ${info.level.toUpperCase()}: ${info.message}`;
});
function createLogger(options) {
    const { logType, logLevel } = options;
    winston_1.configure({
        exitOnError: false,
        format: combine(timestamp({
            format: `YYYY-MM-DD HH:mm:ss`,
        }), splat(), myFormat),
        level: logLevel,
        transports: logType === `file`
            ? [
                new winston_1.transports.File({
                    filename: `error.log`,
                    level: `error`,
                }),
                new winston_1.transports.File({ filename: `combined.log` }),
            ]
            : [new winston_1.transports.Console()],
    });
}
exports.createLogger = createLogger;
//# sourceMappingURL=logger.js.map