import { FSWatcher } from 'chokidar';
import { Dispatcher } from './dispatcher';
export interface FileWatcherOptions {
    readonly dispatcher: Dispatcher;
    readonly cwd: string;
    readonly watchPath: string;
    readonly convertAudioExtensions: string[];
    readonly convertVideoExtensions: string[];
    readonly copyAudioExtensions: string[];
    readonly copyVideoExtensions: string[];
}
export declare class FileWatcher {
    private options;
    private dispatcher;
    private fswatcher;
    constructor(options: FileWatcherOptions);
    init(): Promise<FSWatcher>;
    private onAdd;
    private handleFileEvent;
    private handleFile;
    private getJobType;
    private isValidFileType;
}
export declare function createFileWatcher(options: FileWatcherOptions): FileWatcher;
//# sourceMappingURL=fileWatcher.d.ts.map