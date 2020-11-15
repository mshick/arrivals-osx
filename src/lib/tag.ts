import child from 'child_process'
import { promisify } from 'util'
import logger from 'winston'

const exec = promisify(child.exec)

export class Tag {
  private filepath: string

  constructor(filepath: string) {
    this.filepath = filepath
  }

  public async addTag(tag: string): Promise<void> {
    const filepath = this.filepath

    try {
      const cmd = [`tag`, `--add`, tag, filepath].join(` `)

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
      const cmd = [`tag`, `--remove`, tag, filepath].join(` `)

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
