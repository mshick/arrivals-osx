import meow from 'meow'

export async function checkArgs(): Promise<string> {
  const cli = meow(
    `
	Usage
    $ arrivals-osx install
  Commands
    install             Installs a plist and triggers launchctl
    `,
    {
      flags: {},
    }
  )

  return cli.input[0]
}
