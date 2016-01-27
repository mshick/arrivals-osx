#!/usr/bin/env node

/* eslint no-process-exit:0 */

"use strict";

const path = require("path");
const fs = require("fs");
const mkdirp = require("mkdirp");
const untildify = require("untildify");
const touch = require("touch");
const del = require("del");
const argv = require("minimist")(process.argv.slice(2));
const service = require("../service");
const assert = require("hoek").assert;
const arrivals = require("../lib/arrivals");
const config = require("ez-config");

let svc;

const ACTION = argv._[0] || "run";
const RUN_AS_ROOT = argv["run-as-root"] || false;
const CWD = argv.cwd || process.cwd();
const HOME_DIR = untildify("~/");
const BASE_DIR = config.get("baseDir");


if (ACTION === "uninstall" || ACTION === "restart" || ACTION === "stop") {
  svc = service.create({ runAsUserAgent: !RUN_AS_ROOT });
  svc[ACTION]();
  process.exit();
}

const prepareDirs = function (reset) {
  if (reset) {
    del.sync([
      process.env.TMP_PATH,
      process.env.DB_PATH,
      process.env.LOG_FILE
    ], {
      force: true
    });
  }

  mkdirp.sync(process.env.TMP_PATH);
  mkdirp.sync(process.env.DB_PATH);
  touch.sync(process.env.LOG_FILE);
};

const setEnvPath = function (key, val, defaultVal) {
  if (val) {
    if (path.isAbsolute(val)) {
      process.env[key] = val;
    } else {
      process.env[key] = path.resolve(CWD, val);
    }
  } else if (defaultVal) {
    process.env[key] = path.join(HOME_DIR, BASE_DIR, defaultVal);
  }
};

setEnvPath("TMP_PATH", argv.tmp, config.get("tmpDir"));
setEnvPath("DB_PATH", argv.db, config.get("dbDir"));
setEnvPath("LOG_FILE", argv.log, config.get("logFile"));

if (ACTION === "reset") {
  prepareDirs(true);
  process.exit();
} else {
  prepareDirs();
}

if (argv.watch) {
  argv.watch.split(",").forEach((p) => {
    const watchPath = path.resolve(CWD, p);
    let watchPathStat;
    try {
      watchPathStat = fs.statSync(watchPath);
    } catch (err) {
      watchPathStat = null;
    }
    assert(watchPathStat && watchPathStat.isDirectory(),
        "Watch path must exist and be a directory");
  });
}

assert(argv.destination || argv["video-destination"] && argv["audio-destination"],
    "Destination is required");

setEnvPath("VIDEO_DESTINATION", argv["video-destination"] || argv.destination);
setEnvPath("AUDIO_DESTINATION", argv["audio-destination"] || argv.destination);

if (argv["log-type"]) {
  process.env.LOG_TYPE = argv["log-type"];
} else {
  process.env.LOG_TYPE = ACTION === "run" ? "file" : "console";
}

process.env.CWD = CWD;
process.env.WATCH_PATH = argv.watch;
process.env.LOG_LEVEL = argv["log-level"] || "info";

process.env.FFMPEG_PATH = argv.ffmpeg || "/usr/local/bin/ffmpeg";
process.env.MKVTOMP4_PATH = argv.mkvtomp4 || "/usr/local/bin/mkvtomp4";
process.env.MP4BOX_PATH = argv.mp4box || "/usr/local/bin/mp4box";
process.env.MKVINFO_PATH = argv.mkvinfo || "/usr/local/bin/mkvinfo";
process.env.MKVEXTRACT_PATH = argv.mkvextract || "/usr/local/bin/mkvextract";


if (ACTION === "run") {
  arrivals();
} else if (ACTION === "install") {
  svc = service.create({
    runAsUserAgent: !RUN_AS_ROOT
  });
  svc.install();
}
