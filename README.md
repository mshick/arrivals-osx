CAVA
====

CAVA (Convert Audio/Video Arrivals) will watch a directory and convert or copy any
incoming A/V files for you, and place them somewhere you choose. Only works on
OSX, and the primary use-case is incoming torrents in flac or mkv formats that
you'd like to play nice in an Apple ecosystem.

## Use

```
$ cava --watch=/Users/mshick/CAVA --out=/Users/mshick/converted
```

## Dependencies

```
$ brew tap mshick/personal
$ brew install mshick/personal/mkvtomp4
```

## Process

* Launch watcher for a directory
* Build existing paths database
* When events occur, evaluate against criterion
    - is correct event
    - is proper extension
    - is not in existing paths db
* Push to work queue
* Tag with "pending" for Finder
* Do work, either mkvtomp4 or ffmpeg
* Tag with "finished" or "error" for Finder

## Features

* launch per directory
* launchdaemon / plist
* reset seen files
