import { FSWatcher } from 'chokidar';
export interface ArrivalsOptions {
    readonly atomicparsleyPath: string;
    readonly audioDestination: string;
    readonly convertAudioExtensions: string[];
    readonly convertVideoExtensions: string[];
    readonly copyAudioExtensions: string[];
    readonly copyVideoExtensions: string[];
    readonly cwd: string;
    readonly dbPath: string;
    readonly logLevel: string;
    readonly logType: string;
    readonly logFile: string;
    readonly tmpPath: string;
    readonly videoDestination: string;
    readonly watchPaths: string[];
    readonly maxRetries: number;
    readonly retryDelay: number;
    readonly batchDelay: number;
}
export declare function watch(): Promise<FSWatcher[]>;
//# sourceMappingURL=arrivals.d.ts.map