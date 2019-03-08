# Arrivals (for MacOS)

![npm release](https://img.shields.io/npm/v/arrivals-osx.svg?style=flat)

Arrivals will watch a directory and convert or copy a variety of incoming
audio or video files for you then place them somewhere you choose. This only
works with MacOS and the primary use-case is incoming torrents in flac or mkv
formats that you'd like to play nice in an Apple ecosystem.

> Requires node.js 8.0.0 or greater!

## Features

- Watch many directories
- Register as launchdaemon
- Converts `'flac', 'mp3', 'mp4', 'm4a'` that are well-formed
  into ALAC/M4A
- Can copy video & audio files to a destination directory
- Easy usage
- Status visibility through Finder tagging of source files

## Installaion

```bash
npm install arrivals-osx -g
```

## Use

Launch the installer to build your plist and start the launchdaemon.

```bash
$ arrivals install
```

### Required system libraries

- node.js >= 8.0.0
- ffmpeg
- ffprobe
- atomicparsley

## Full command list

```bash
$ arrivals [command]
```

| Command | Description                                                |
| ------- | ---------------------------------------------------------- |
| watch   | Run the process directly, you'll want to set the env vars. |
| install | Interactive install as a system daemon                     |

## How it works

1. Launches watcher for a directory
2. Builds existing paths database
3. When events occur, evaluate against criterion
   - is correct event
   - is proper extension
   - is not in existing paths db
4. Push to work queue
5. Add a Yellow "pending" tag for Finder
6. Do work, either copy or convert
7. Add a Green tag for "finished" or a Red tag for "error" in Finder
