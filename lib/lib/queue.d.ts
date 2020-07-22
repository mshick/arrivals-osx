import { LevelJobsOptions } from 'level-jobs';
import { LevelUp } from 'levelup';
declare type LevelJobsHandlerPromise = (jobId: string, payload: any) => Promise<void>;
export declare function createQueue(db: LevelUp, handler: LevelJobsHandlerPromise, options: LevelJobsOptions): any;
export {};
//# sourceMappingURL=queue.d.ts.map