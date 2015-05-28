Arrivals (OSX)
==============

Arrivals will watch a directory and convert or copy a variety of incoming
audio or video files for you then place them somewhere you choose. This only
works with OSX and the primary use-case is incoming torrents in flac or mkv
formats that you'd like to play nice in an Apple ecosystem.

## Features

* Watch many directories
* Register as launchdaemon
* Converts `'flac', 'mp3', 'mp4', 'm4a', 'm4v', 'mkv', 'mov'` that are well-formed
  into ALAC/M4A, or M4V (with video passthrough, AAC safety track, original audio, and subtitles)
* Easy usage

## Installaion

```bash
npm install arrivals-osx -g
```

## Use

Simplest:

```bash
$ cd ~/Downloads
$ arrivals --watch=incoming --destination=converted
```

More complex (watch multiple dirs as comma-delimited list, custom log level):

```bash
$ cd ~/Downloads
$ arrivals --watch="/Volumes/foo/Incoming Movies",/Volumes/bar/incoming-music --audio-destination=converted-audio --video-destination=converted-video --log-level=debug
```

## Install as a system daemon and control

```bash
$ cd ~/Downloads
$ arrivals install --watch=incoming --destination=converted
$ arrivals restart|stop|uninstall
```

## Reset the existing files database, tmp files and log

```bash
$ arrivals reset
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

## Full command list

```bash
$ arrivals [command] [--flags]
```

(All are optional, run is the default)

Command   | Description
-------   | -----------
run       | Default value, simply runs the process.
install   | Install as a system daemon
restart   | Restarts an installed system daemon
stop      | Stops an installed system daemon
uninstall | Uninstalls an installed system daemon.
reset     | Reset the existing files database, tmp dir and log file. Obeys custom paths for all of those.

Flag                | Possible Values | Required | Description
----                | --------------- | -------- | -----------
--watch             | Valid, existing directory path | no | Pass a relative (resolved relative to cwd) or absolute path. Accepts a comma-delimited list of multiple watch paths
--destination       | Valid, existing directory path  | yes* | Pass a relative or absolute path
--video-destination | Valid, existing directory path  | yes* | (or a single destination above)
--audio-destination | Valid, existing directory path  | yes* | (or a single destination above)
--tmp               | Valid, existing directory path | no | Path to store temp conversion files. Defaults to ~/.arrivals/tmp
--db                | Valid, existing directory path | no | Path to store existing files db. Defaults to ~/.arrivals/db
--log-level         | `info`, `debug`, `error` | no | Logging level
--log-type          | `file`, `console` | no | How to log. Daemon defaults to console, which gets written in your Library/Logs folder. Command-line invocation default to a file in the ~/.arrivals directory
--ffmpeg            | path to ffmpeg bin | no | Defaults to `/usr/local/bin/ffmpeg`
--mkvextract        | path to mkvextract bin | no | Defaults to `/usr/local/bin/mkvextract`
--mkvinfo           | path to mkvinfo bin | no | Defaults to `/usr/local/bin/mkvinfo`
--mp4box            | path to mp4box bin | no | Defaults to `/usr/local/bin/mp4box`
--mkvtomp4          | path to mkvtomp4 bin | no | Defaults to `/usr/local/bin/mkvtomp4`
--run-as-root       | `true` | no | install the daemon as root, rather than current user
--cwd               | Valid path | no | Sets the cwd for all path resolution

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

## TODO

* add tagging in finder support
* rewrite to not require mkvtomp4 (big job) and maybe use ffprobe
