/* eslint no-magic-numbers:0 */

"use strict";

const spawn = require("child_process").spawn;
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const glob = require("glob");
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

const findCoverFile = function (dirname) {
  const preferredFilenames = [
    "cover.jpg",
    "cover.jpeg",
    "folder.jpg",
    "folder.jpeg",
    "front.jpg",
    "front.jpeg"
  ];

  const filepaths = glob.sync("**/*.{jpeg,jpg}", {cwd: dirname});

  let found;

  for (const filepath of filepaths) {
    const base = path.basename(filepath).toLowerCase();
    if (preferredFilenames.indexOf(path.basename(base)) > -1) {
      found = filepath;
    }

    if (found) {
      continue;
    }

    found = filepath;
  }


  if (found) {
    const resolved = path.resolve(dirname, found);
    log.debug("Found cover art file: %s", resolved);
    return resolved;
  }
};

const embedCoverFile = function (outputAudio, coverFile, binPaths) {

  const cwd = path.dirname(outputAudio);

  log.debug("embedCoverFile", binPaths.mp4box, "-itags", `cover=${coverFile}`, outputAudio, cwd);

  return new Promise((resolve, reject) => {

    const mp4box = spawn(binPaths.mp4box, ["-itags", `cover=${coverFile}`, outputAudio], { cwd });

    mp4box.stderr.on("data", (data) => log.debug(data.toString()));

    mp4box.on("error", (err) => reject(err));

    mp4box.on("exit", (code, signal) => {

      if (signal) {
        reject(new Error(`mp4box was killed with signal ${signal}`));
      } else if (code) {
        reject(new Error(`mp4box exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
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

        embedCoverFile(outputAudio, coverFile, binPaths)
          .then(() => {
            resolve({ audio: outputAudio, cover: coverFileEmbedded });
          })
          .catch((err) => reject(err));
      } else {

        resolve({ audio: outputAudio, cover: coverFileEmbedded });
      }
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
