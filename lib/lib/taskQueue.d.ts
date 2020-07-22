import Queue, { Ticket } from 'better-queue';
export interface TaskQueueOptions {
    readonly batchDelay: number;
    readonly dbPath: string;
    readonly maxRetries: number;
    readonly retryDelay: number;
}
export declare type QueueHandlerPromise = (payload: any, worker: any) => Promise<void>;
export declare class TaskQueue extends Queue {
    pushPromise(payload: any): Promise<Ticket>;
}
export declare function createQueue(handler: QueueHandlerPromise, options: TaskQueueOptions): TaskQueue;
//# sourceMappingURL=taskQueue.d.ts.map