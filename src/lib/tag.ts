import child from 'child_process'
import { promisify } from 'util'
import logger from 'winston'

const exec = promisify(child.exec)

export class Tag {
  private filepath: string
  private binPath: string

  constructor(filepath: string, binPath: string) {
    this.filepath = filepath
    this.binPath = binPath
  }

  public async addTag(tag: string): Promise<void> {
    const filepath = this.filepath

    try {
      const cmd = [this.binPath, `--add`, `"${tag}"`, `"${filepath}"`].join(` `)

      const result = await exec(cmd)

      if (result.stderr) {
        throw result.stderr
      }
      logger.debug(result.stdout.toString())
    } catch (error) {
      logger.error(error)
    }
  }

  public async removeTag(tag: string): Promise<void> {
    const filepath = this.filepath

    try {
      const cmd = [this.binPath, `--remove`, `"${tag}"`, `"${filepath}"`].join(` `)

      const result = await exec(cmd)

      if (result.stderr) {
        throw result.stderr
      }
      logger.debug(result.stdout.toString())
    } catch (error) {
      logger.error(error)
    }
  }
}
