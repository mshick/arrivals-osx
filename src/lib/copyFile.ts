import { execFile } from 'child_process'

export function copyFile(source: string, destination: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = execFile(`/bin/cp`, [source, destination])

    proc.on(`error`, reject)
    proc.on(`close`, resolve)
  })
}
