import Queue, { ProcessFunction, ProcessFunctionCb, Ticket } from 'better-queue'
import logger from 'winston'
// @ts-ignore
import SqliteStore from './store'

export interface TaskQueueOptions {
  readonly batchDelay: number
  readonly dbPath: string
  readonly maxRetries: number
  readonly retryDelay: number
}

export type QueueHandlerPromise = (payload: any, worker: any) => Promise<void>

function queueHandlerShim(handler: QueueHandlerPromise): ProcessFunction<any, any> {
  return function queueHandler(this: any, payload: any, done: ProcessFunctionCb<undefined>): void {
    handler(payload, this)
      .then(() => done())
      .catch((err: any) => done(err))
  }
}

export class TaskQueue extends Queue {
  pushPromise(payload: any): Promise<Ticket> {
    return new Promise((resolve, reject) => {
      try {
        resolve(this.push(payload))
      } catch (err) {
        reject(err)
      }
    })
  }
}

export function createQueue(handler: QueueHandlerPromise, options: TaskQueueOptions): TaskQueue {
  try {
    return new TaskQueue(queueHandlerShim(handler), {
      batchDelay: options.batchDelay,
      batchSize: 1,
      cancelIfRunning: true,
      concurrent: 1,
      id: `filepath`,
      maxRetries: options.maxRetries,
      maxTimeout: 60000,
      retryDelay: options.retryDelay,
      store: new SqliteStore({
        path: `${options.dbPath}/queue.sqlite`,
      }),
    })
  } catch (err) {
    logger.error(err)
    throw err
  }
}
