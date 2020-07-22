import * as opened from '@ronomon/opened'
import log from 'winston'

export async function isFileBusy(source: string): Promise<boolean> {
  return new Promise(resolve => {
    opened.file(source, (err: any, busy: boolean) => {
      if (err) {
        log.debug(`Problem checking for busy file: %s`, err.message)
        resolve(false)
      }

      resolve(busy)
    })
  })
}
