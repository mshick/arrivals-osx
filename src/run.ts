import logger from 'winston';
import { watch } from './lib/arrivals';

watch()
  .then(() => {
    logger.info('Arrivals has started!');
  })
  .catch(err => {
    logger.error(err);
  });
