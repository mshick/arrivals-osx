export interface InquireAnswers {
    readonly TAG_PATH: string;
    readonly ATOMICPARSLEY_PATH: string;
    readonly FFMPEG_PATH: string;
    readonly FFPROBE_PATH: string;
    readonly WATCH_PATHS: string;
    readonly VIDEO_DESTINATION: string;
    readonly AUDIO_DESTINATION: string;
    readonly AUDIO_CONVERT_EXTENSIONS: string;
    readonly AUDIO_COPY_EXTENSIONS: string;
    readonly VIDEO_COPY_EXTENSIONS: string;
    readonly DB_PATH: string;
    readonly LOG_LEVEL: string;
    readonly TMP_PATH: string;
}
export declare function inquire(): Promise<any>;
//# sourceMappingURL=inquire.d.ts.map