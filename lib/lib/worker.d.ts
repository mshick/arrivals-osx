export interface WorkerOptions {
    readonly tmpPath: string;
    readonly audioDestination: string;
    readonly videoDestination: string;
    readonly atomicparsleyPath: string;
    readonly watchPaths: string[];
}
export declare class Worker {
    private options;
    constructor(options: WorkerOptions);
    handler(payload: any, worker: any): Promise<void>;
    private handleFile;
}
export declare function createWorker(options: WorkerOptions): Worker;
//# sourceMappingURL=worker.d.ts.map