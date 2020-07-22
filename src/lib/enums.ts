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
