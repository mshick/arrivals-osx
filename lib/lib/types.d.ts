/// <reference types="node" />
import { EventEmitter } from 'events';
export declare enum FileJobType {
    ConvertAudio = 0,
    ConvertVideo = 1,
    CopyAudio = 2,
    CopyVideo = 3,
    Unknown = 4
}
export declare enum FileJobStatus {
    Pending = 0,
    Existing = 1,
    Complete = 2,
    InProgress = 3,
    Unhandled = 4,
    Error = 5
}
export interface BinPaths {
    readonly ffmpeg?: string;
    readonly tag?: string;
    readonly atomicparsley: string;
}
export interface FileJobPayload {
    readonly filepath: string;
    readonly jobType: FileJobType;
}
export interface FilePayload {
    readonly jobType: FileJobType;
    readonly jobStatus: FileJobStatus;
}
declare module 'better-queue' {
    interface Worker extends EventEmitter {
        setup(): void;
        start(): void;
        end(): void;
        resume(): void;
        pause(): void;
        cancel(): void;
        failedBatch(msg: FileJobStatus): void;
        finishBatch(result: FileJobStatus): void;
    }
}
//# sourceMappingURL=types.d.ts.map