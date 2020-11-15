import { EventEmitter } from 'events'

export enum FileJobType {
  ConvertAudio,
  ConvertVideo,
  CopyAudio,
  CopyVideo,
  Unknown,
}

export enum FileJobStatus {
  Pending,
  Existing,
  Complete,
  InProgress,
  Unhandled,
  Error,
}

export interface BinPaths {
  readonly ffmpeg?: string
  readonly tag?: string
  readonly atomicparsley: string
}

export interface FileJobPayload {
  readonly filepath: string
  readonly jobType: FileJobType
}

export interface FilePayload {
  readonly jobType: FileJobType
  readonly jobStatus: FileJobStatus
}

declare module 'better-queue' {
  export interface Worker extends EventEmitter {
    setup(): void
    start(): void
    end(): void
    resume(): void
    pause(): void
    cancel(): void
    failedBatch(msg: FileJobStatus): void
    finishBatch(result: FileJobStatus): void
  }
}
