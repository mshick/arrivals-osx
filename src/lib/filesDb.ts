import { Database } from 'sqlite3'

export function createFilesDb(): Database {
  return new Database(`:memory:`)
}
