export = SqliteStore;
declare function SqliteStore(opts: any): void;
declare class SqliteStore {
    constructor(opts: any);
    connect(cb: any): void;
    _afterWritten(cb: any): void;
    getTask(taskId: any, cb: any): void;
    deleteTask(taskId: any, cb: any): void;
    putTask(taskId: any, task: any, priority: any, cb: any): any;
    getLock(lockId: any, cb: any): void;
    getRunningTasks(cb: any): void;
    releaseLock(lockId: any, cb: any): void;
    close(cb: any): any;
    takeFirstN(num: any, cb: any): void;
    takeLastN(num: any, cb: any): void;
}
//# sourceMappingURL=store.d.ts.map