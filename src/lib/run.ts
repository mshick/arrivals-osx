import logger from 'winston'
import { watch } from './arrivals'

watch()
  .then(() => {
    logger.info(`Arrivals has started!`)
  })
  .catch(err => {
    logger.error(err)
  })
