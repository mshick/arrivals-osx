// tslint:disable:no-console no-if-statement no-expression-statement

import meow from 'meow';

export async function checkArgs(): Promise<string> {
  const cli = meow(
    `
	Usage
    $ arrivals-osx [install|watch]
  Commands
    install             Installs a plist and triggers launchctl
    watch               Immediately invokes the arrivals watch function
    `,
    {
      flags: {}
    }
  );

  return cli.input[0];
}
