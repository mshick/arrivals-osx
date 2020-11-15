import { Database } from 'sqlite3';
import { TaskQueue } from './taskQueue';
import { FileJobType } from './types';
export interface DispatcherOptions {
    readonly filesDb: Database;
    readonly queue: TaskQueue;
    readonly watchPaths: string[];
    readonly tagPath?: string;
}
export declare class Dispatcher {
    private db;
    private queue;
    private options;
    constructor(options: DispatcherOptions);
    init(): Promise<void>;
    private insertExistingFiles;
    buildExistingFilesDb(watchPath: string): Promise<number>;
    isNewFile(filepath: string): Promise<boolean>;
    enqueueFile(filepath: string, filetype: FileJobType): Promise<boolean>;
}
export declare function createDispatcher(options: DispatcherOptions): Dispatcher;
//# sourceMappingURL=dispatcher.d.ts.map