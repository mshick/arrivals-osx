Arrivals (OSX)
==============

Arrivals will watch a directory and convert or copy a variety of incoming
audio or video files for you then place them somewhere you choose. This only
works with OSX and the primary use-case is incoming torrents in flac or mkv
formats that you'd like to play nice in an Apple ecosystem.

## Installaion

```bash
npm install arrivals-osx -g
```

## Use

Simplest case:

```bash
$ cd ~/Downloads
$ arrivals --watch=incoming --destination=converted
```

## Install as a system daemon and control

```bash
$ cd ~/Downloads
$ arrivals install --watch=incoming --destination=converted
-> users:mshick:downloads:incoming // resolved path, made friendly for dirnames
$ arrivals restart|stop|uninstall users:mshick:downloads:incoming
```

## Dependencies

There are a number of system dependencies. For audio, only FFmpeg is required.
For video I suggest using my fork of mkvtomp4 via homebrew. It will install all the
dependencies you need.

```
$ brew tap mshick/personal
$ brew install mshick/personal/mkvtomp4
```

>The paths for these need to be defined absolutely, so if you don't use a
standard homebrew installation path, or you use different versions of these
you may need to pass additional command-line options, e.g.:

```
$ arrivals --watch=incoming --destination=converted --ffmpeg=/usr/local/bin/ffmpeg --mkvextract=/usr/local/bin/mkvextract
```

### Required system libraries

* ffmpeg (with libfdk_aac)
* mkvextract
* mp4box
* mkvinfo
* mkvtomp4

## How it works

1. Launches watcher for a directory
2. Builds existing paths database
3. When events occur, evaluate against criterion
    - is correct event
    - is proper extension
    - is not in existing paths db
4. Push to work queue
5. Tag with "pending" for Finder*
6. Do work, either mkvtomp4 or ffmpeg
7. Tag with "finished" or "error" for Finder*

> * Tagging is forthcoming

## Features

* launch per directory
* launchdaemon / plist
* reset seen files

## TODO

* add tagging in finder support
* persistent db as option?
* rewrite to not require mkvtomp4 (big job) and maybe use ffprobe
