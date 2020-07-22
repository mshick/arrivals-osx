import glob from 'glob'
import path from 'path'
import { promisify } from 'util'
import logger from 'winston'
import { Database } from 'sqlite3'
import { TaskQueue } from './taskQueue'
import { FileJobType } from './enums'
import { Tag } from './tag'
import { FileJobPayload } from './typings'
import { prettyPrint } from './utils'

const globPromise = promisify(glob)
const FILES_TABLE_NAME = `files`

export interface DispatcherOptions {
  readonly filesDb: Database
  readonly queue: TaskQueue
  readonly watchPaths: string[]
}

export class Dispatcher {
  private db: Database
  private queue: TaskQueue
  private options: DispatcherOptions

  constructor(options: DispatcherOptions) {
    this.db = options.filesDb
    this.queue = options.queue
    this.options = options
  }

  public async init(): Promise<void> {
    try {
      logger.info(`Starting dispatcher ...`)

      const existingPaths = this.options.watchPaths.map(watchPath =>
        this.buildExistingFilesDb(watchPath)
      )
      const existingPathsAdded = await Promise.all(existingPaths)
      const existingPathsCount = existingPathsAdded.reduce((p: number, c: number) => p + c, 0)
      logger.info(`%s existing paths added`, existingPathsCount)
      logger.info(`Dispatcher started!`)
    } catch (err) {
      logger.error(err)
      throw err
    }
  }

  private async insertExistingFiles(filePaths: string[]): Promise<number> {
    return new Promise(resolve => {
      // const filePlaceholders = filePaths.map(() => `(?)`).join(`,`)
      this.db.serialize(() => {
        this.db.run(`CREATE TABLE ${FILES_TABLE_NAME} (filepath TEXT PRIMARY KEY)`, () => {
          this.db.parallelize(() => {
            filePaths.forEach(filePath => {
              this.db.run(`INSERT INTO ${FILES_TABLE_NAME} VALUES (?)`, filePath)
            })
          })
          // this.db.run(`INSERT INTO ${FILES_TABLE_NAME} VALUES ${filePlaceholders}`, filePaths)
          this.db.all(`SELECT * FROM ${FILES_TABLE_NAME}`, (err, rows) => {
            resolve(rows.length)
          })
        })
      })
    })
  }

  public async buildExistingFilesDb(watchPath: string): Promise<number> {
    const files = await globPromise(`**/*`, {
      cwd: watchPath,
    })

    const filePaths = files.map((filepath: string): string => path.resolve(watchPath, filepath))

    return this.insertExistingFiles(filePaths)
  }

  public async isNewFile(filepath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.get(`SELECT * FROM ${FILES_TABLE_NAME} WHERE filepath = ?`, filepath, (err, row) => {
        if (err) {
          reject(err)
        }

        if (row && row.filepath) {
          resolve(false)
        }

        resolve(true)
      })
    })
  }

  public async enqueueFile(filepath: string, filetype: FileJobType): Promise<boolean> {
    return new Promise(resolve => {
      const tag = new Tag(filepath)
      const jobType = filetype

      this.db.serialize(() => {
        this.db.run(`INSERT INTO ${FILES_TABLE_NAME} VALUES (?)`, filepath, err => {
          if (err) {
            logger.error(`Error in enqueue\n%s`, prettyPrint(err as any))
          }

          const fileJobPayload: FileJobPayload = {
            filepath,
            jobType,
          }

          this.queue
            .pushPromise(fileJobPayload)
            .then(jobId => {
              logger.debug(`File enqueued with jobId: %s`, jobId)
              return tag.addTag(`Yellow`)
            })
            .then(() => {
              resolve(true)
            })
            .catch(err => {
              logger.error(`Error in enqueue\n%s`, prettyPrint(err))
              resolve(false)
            })
        })
      })
    })
  }
}

export function createDispatcher(options: DispatcherOptions): Dispatcher {
  return new Dispatcher(options)
}
