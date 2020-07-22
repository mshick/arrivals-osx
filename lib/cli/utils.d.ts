/// <reference types="node" />
import { exec } from 'child_process';
export interface ExpandPathOptions {
    readonly processCwd: string;
    readonly homeDir: string;
    readonly baseDir: string;
    readonly defaultValue?: string;
}
export declare enum Commands {
    Install = "install",
    Watch = "watch"
}
export declare function getIntro(): string;
export declare function untildify(input: string): string;
export declare function expandPath(filePath: string, options: ExpandPathOptions): string;
export declare function touch(filename: string): any;
export declare const execPromise: typeof exec.__promisify__;
//# sourceMappingURL=utils.d.ts.map