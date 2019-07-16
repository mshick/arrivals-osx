// tslint:disable:no-object-mutation
import LevelJobs, { LevelJobsHandler, LevelJobsOptions } from 'level-jobs';
import { LevelUp } from 'levelup';
import logger from 'winston';

type LevelJobsHandlerPromise = (jobId: string, payload: any) => Promise<void>;

function queueHandlerShim(handler: LevelJobsHandlerPromise): LevelJobsHandler {
  return function queueHandler(jobId, payload, done): void {
    try {
      handler(jobId, payload)
        .then(() => done())
        .catch(err => done(err));
    } catch (err) {
      logger.error(err);
      done(err);
    }
  };
}

export function createQueue(
  db: LevelUp,
  handler: LevelJobsHandlerPromise,
  options: LevelJobsOptions
): any {
  try {
    const queue = new LevelJobs(db, queueHandlerShim(handler), options);

    queue.pushPromise = async payload => {
      return new Promise((resolve, reject) => {
        try {
          const jobId = queue.push(payload, err => {
            err ? reject(err) : resolve(jobId);
          });
        } catch (err) {
          reject(err);
        }
      });
    };

    return queue;
  } catch (err) {
    logger.error(err);
  }
}
