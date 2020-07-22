import chalk from 'chalk'
import { writeFileSync } from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'
import plist from 'plist'
import { checkArgs } from './args'
import { inquire } from './inquire'
import { Commands, execPromise, getIntro, touch, untildify } from './utils'
;(async () => {
  const command = await checkArgs()

  if (command === Commands.Install) {
    const userOptions = {
      ...(await (async () => {
        console.log(getIntro())
        return inquire()
      })()),
    }

    const label = `us.shick.arrivals`
    const rootPath = path.resolve(__dirname, `../`)
    const plistPath = untildify(`~/Library/LaunchAgents/${label}.plist`)
    const logPath = untildify(`~/Library/Logs/${label}`)
    const outLogPath = path.resolve(logPath, `arrivals.log`)
    const errLogPath = path.resolve(logPath, `arrivals_error.log`)
    const execPath = process.execPath
    const scriptPath = `${rootPath}/lib/process.js`
    const workingDirectory = path.resolve(__dirname, `../../../`)

    const tpl = {
      EnvironmentVariables: userOptions,
      KeepAlive: false,
      Label: label,
      ProgramArguments: [execPath, scriptPath],
      RunAtLoad: true,
      StandardErrorPath: errLogPath,
      StandardOutPath: outLogPath,
      WorkingDirectory: workingDirectory,
    }

    const plistData = plist.build(tpl).toString()

    mkdirp.sync(logPath)
    touch(outLogPath)
    touch(errLogPath)

    writeFileSync(plistPath, plistData)

    try {
      await execPromise(`launchctl load ${plistPath}`)
      console.log(`launchdaemon loaded`)
    } catch (err) {
      console.log(`Could not start: %s`, err.message)
    }
  }
})().catch((err: Error) => {
  console.error(`
  ${chalk.red(err.message)}
`)
  process.exit(1)
})
