"use strict";

const fs = require("fs");
const spawnSync = require("child_process").spawnSync;
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const bole = require("bole");
const log = bole("audio conversion");


const checkVideoStream = function (err, metadata) {

  const videoStream = metadata.streams.filter((stream) => stream.codec_name === "mjpeg");

  if (videoStream.length) {

    if (metadata.streams.length === 1) {
      return new Error("Invalid stream length");
    }

    log.debug("Has cover stream:");
    log.debug(videoStream[0]);

    return true;
  }
};

const testCoverFile = function (filepath) {
  try {
    fs.accessSync(filepath, fs.F_OK);
  } catch (e) {
    return false;
  }
  return true;
};

const findCoverFile = function (dirname) {
  const filenames = ["cover.jpg", "folder.jpg"];
  for (const filename of filenames) {
    const testPath = path.join(dirname, filename);
    if (testCoverFile(testPath)) {
      log.debug("Found cover art in folder: %s", testPath);
      return testPath;
    }
  }
};

const embedCoverFile = function (outputAudio, coverFile, binPaths) {
  return spawnSync(binPaths.mp4box, ["-itags", `cover=${coverFile}`, outputAudio]);
};

module.exports = function (source, destination, binPaths) {

  const dirname = path.dirname(source);
  const outputFilename = path.basename(source).replace(path.extname(source), ".m4a");
  const outputAudio = path.resolve(destination, outputFilename);
  const outputCover = path.resolve(destination, "cover.jpg");

  log.debug(outputAudio);

  const command = ffmpeg(source, { logger: log })
    .noVideo()
    .audioCodec("alac")
    .outputOptions("-map 0:0")
    .outputOptions("-movflags")
    .outputOptions("+faststart")
    .addOutput(outputAudio);

  return new Promise((resolve, reject) => {

    let coverFileEmbedded = null;

    command.on("start", (cmdline) => log.debug("ffmpeg command: %s", cmdline));
    command.on("error", (err) => reject(err));

    command.on("end", () => {

      let coverFile = null;

      if (!coverFileEmbedded) {
        coverFile = findCoverFile(dirname);
      } else {
        coverFile = coverFileEmbedded;
      }

      if (coverFile) {
        const embedded = embedCoverFile(outputAudio, coverFile, binPaths);
        if (embedded.error) {
          return reject(embedded.error);
        }
      }

      resolve({ audio: outputAudio, cover: coverFileEmbedded });
    });

    ffmpeg.ffprobe(source, (err, metadata) => {

      const hasVideoStream = checkVideoStream(err, metadata);

      if (hasVideoStream instanceof Error) {
        return reject(hasVideoStream);
      }

      if (hasVideoStream) {
        coverFileEmbedded = outputCover;
        command.addOutput(outputCover);
      }

      log.debug("Starting conversion of %s", source);

      command.run();
    });
  });
};
