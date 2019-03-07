import { configure, format, transports } from 'winston';

const { combine, timestamp, splat } = format;

const myFormat = format.printf(info => {
  return `${info.timestamp} ${info.level.toUpperCase()}: ${info.message}`;
});

export interface LoggerOptions {
  readonly logType: string;
  readonly logFile: string;
  readonly logLevel: string;
}

export function createLogger(options: LoggerOptions): void {
  const { logType, logLevel } = options;

  configure({
    exitOnError: false,
    format: combine(
      timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      splat(),
      myFormat
    ),
    level: logLevel,
    transports:
      logType === 'file'
        ? [
            new transports.File({
              filename: 'error.log',
              level: 'error'
            }),
            new transports.File({ filename: 'combined.log' })
          ]
        : [new transports.Console()]
  });
}
