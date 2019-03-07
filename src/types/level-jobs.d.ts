declare module 'level-jobs' {
  import { LevelUp } from 'levelup';

  type LevelJobsHandlerCallback = (error?: Error) => void;

  export type LevelJobsHandler = (
    jobId: string,
    payload: any,
    cb: LevelJobsHandlerCallback
  ) => void;

  export interface LevelJobsOptions {
    readonly maxConcurrency: number;
  }

  export default class LevelJobs {
    constructor(
      levelDb: LevelUp,
      handler: LevelJobsHandler,
      options: LevelJobsOptions
    );

    push: (payload: any, cb: LevelJobsHandlerCallback) => string;
    pushPromise: (payload: any) => Promise<any>;
  }
}
