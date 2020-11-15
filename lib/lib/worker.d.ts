import { Worker as BetterQueueWorker } from 'better-queue';
import { FileJobPayload } from './types';
export interface WorkerOptions {
    readonly tmpPath: string;
    readonly audioDestination: string;
    readonly videoDestination: string;
    readonly atomicparsleyPath: string;
    readonly tagPath?: string;
    readonly watchPaths: string[];
}
export declare class Worker {
    private options;
    constructor(options: WorkerOptions);
    handler(payload: FileJobPayload, worker: BetterQueueWorker): Promise<void>;
    private handleFile;
}
export declare function createWorker(options: WorkerOptions): Worker;
//# sourceMappingURL=worker.d.ts.map