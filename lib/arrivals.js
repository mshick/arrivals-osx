"use strict";

const fs = require("fs");
const path = require("path");
const config = require("ez-config");
const fsevents = require("fsevents");
const levelup = require("levelup");
const assert = require("hoek").assert;
const Timer = require("hoek").Timer;
const co = require("co");
const each = require("co-each");
const bole = require("bole");
const boleFile = require("./bole-file");
const boleConsole = require("bole-console");
const log = bole("main");
const Dispatcher = require("./dispatcher");

const EXTENSION_LIST = config.get("extensions");
const MS = 1000;

const watched = function (watcher, dispatcher) {

  return co(function * () {

    const timer = new Timer();

    log.info("Building existing files database for %s...", dispatcher.watchPath);

    yield dispatcher.init();

    log.info("Database for %s built in %d seconds", dispatcher.watchPath, timer.elapsed() / MS);

    watcher.on("change", (filepath, info) => {

      log.debug("File changed", filepath, info);

      // if (filepath.search(basePath) === 0) {
      //     log.debug("Skipping processing for working directory", filepath);
      //     return;
      // }

      co(function * () {

        if (info.type === "file" && (info.event === "modified" || info.event === "moved-in")) {
          if (EXTENSION_LIST.indexOf(path.extname(filepath).substr(1)) >= 0) {
            const seen = yield dispatcher.check(filepath);
            if (!seen) {
              yield dispatcher.push(filepath);
            }
          }
        }

        if (info.type === "directory" && info.event === "moved-in") {
          const dirResult = yield dispatcher.checkDir(filepath);
          if (dirResult && dirResult.length) {
            yield each(dirResult, dispatcher.push.bind(dispatcher));
          }
        }
      })
      .catch((err) => {

        log.error("Unhandled error in onChange", err);
      });
    });

    log.info("Starting watcher");

    watcher.start();
  })
  .catch((err) => {

    log.error("Unhandled error in main", err);
  });
};

module.exports = function () {

  const logFile = process.env.LOG_FILE;
  const logType = process.env.LOG_TYPE;
  const logLevel = process.env.LOG_LEVEL;

  if (logType === "file") {
    bole.output({
      level: logLevel,
      stream: boleFile(logFile)
    });
  } else {
    const boleConsoleStream = boleConsole({
      timestamp: true
    });
    bole.output({
      level: logLevel,
      stream: boleConsoleStream
    });
  }

  log.debug("Starting...");

  const cwd = process.env.CWD;

  const watchPaths = process.env.WATCH_PATH.split(",").map((p) => {
    let watchPath;
    if (path.isAbsolute(p)) {
      watchPath = p;
    } else {
      watchPath = path.resolve(cwd, p);
    }
    assert(watchPath && fs.statSync(watchPath).isDirectory(),
      "Watch path must exist and be a directory");
    return watchPath;
  });

  log.debug("Watching paths", watchPaths);

  const videoDestination = process.env.VIDEO_DESTINATION;
  log.debug("Video destination", videoDestination);
  assert(videoDestination && fs.statSync(videoDestination).isDirectory(),
    "Video destination path must exist and be a directory");

  const audioDestination = process.env.AUDIO_DESTINATION;
  log.debug("Audio destination", audioDestination);
  assert(audioDestination && fs.statSync(audioDestination).isDirectory(),
    "Audio destination path must exist and be a directory");

  // const basePath = path.resolve(watchPath, BASE_DIR);

  const db = levelup(process.env.DB_PATH);

  watchPaths.forEach((watchPath) => {

    const watcher = fsevents(watchPath);

    const dispatcher = new Dispatcher({
      watchPath,
      tmpPath: process.env.TMP_PATH,
      db,
      audioDestination,
      videoDestination,
      binPaths: {
        ffmpeg: process.env.FFMPEG_PATH,
        mkvtomp4: process.env.MKVTOMP4_PATH,
        mkvinfo: process.env.MKVINFO_PATH,
        mp4box: process.env.MP4BOX_PATH,
        mkvextract: process.env.MKVEXTRACT_PATH
      },
      audioConversionExtensionList: process.env.AUDIO_CONVERT_EXTENSIONS.split(","),
      audioCopyExtensionList: process.env.AUDIO_COPY_EXTENSIONS.split(","),
      videoConversionExtensionList: process.env.VIDEO_CONVERT_EXTENSIONS.split(","),
      videoCopyExtensionList: process.env.VIDEO_COPY_EXTENSIONS.split(",")
    });

    watched(watcher, dispatcher);
  });
};
