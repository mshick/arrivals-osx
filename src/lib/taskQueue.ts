import Queue, { ProcessFunction, ProcessFunctionCb, Ticket } from 'better-queue'
import logger from 'winston'

export interface TaskQueueOptions {
  readonly batchDelay: number
  readonly dbPath: string
  readonly maxRetries: number
  readonly retryDelay: number
}

export type QueueHandlerPromise = (payload: any, worker: any) => Promise<void>

function queueHandlerShim(handler: QueueHandlerPromise): ProcessFunction<any, any> {
  return function queueHandler(this: any, payload: any, done: ProcessFunctionCb<undefined>): void {
    try {
      handler(payload, this)
        .then(() => done())
        .catch((err: any) => done(err))
    } catch (err) {
      logger.error(err)
      done(err)
    }
  }
}

export class TaskQueue extends Queue {
  pushPromise(payload: any): Promise<Ticket> {
    return new Promise((resolve, reject) => {
      try {
        const ticket = this.push(payload, err => {
          err ? reject(err) : resolve(ticket)
        })
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
      maxRetries: options.maxRetries,
      retryDelay: options.retryDelay,
      store: {
        type: `sql`,
        dialect: `sqlite`,
        path: `${options.dbPath}/queue.sqlite`,
      },
    })
  } catch (err) {
    logger.error(err)
    throw err
  }
}
