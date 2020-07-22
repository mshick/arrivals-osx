import { FileJobStatus, FileJobType } from './enums';
export interface BinPaths {
    readonly ffmpeg?: string;
    readonly mkvextract?: string;
    readonly mkvinfo?: string;
    readonly mkvtomp4?: string;
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
//# sourceMappingURL=typings.d.ts.map