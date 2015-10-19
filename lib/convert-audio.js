"use strict";

const path = require("path");
const FfmpegCommand = require("fluent-ffmpeg");
const bole = require("bole");
const log = bole("audio conversion");


module.exports = function (source, destination) {

  const outputFilename = path.basename(source).replace(path.extname(source), ".m4a");
  const output = path.resolve(destination, outputFilename);

  log.debug(output);

  const command = new FfmpegCommand(source)
    .noVideo()
    .audioCodec("alac")
    .outputOptions("-map 0:0")
    .outputOptions("-movflags")
    .outputOptions("+faststart");

  return new Promise((resolve, reject) => {
    log.debug("Starting conversion of %s", source);
    command.on("error", reject);
    command.on("end", () => {
      resolve(output);
    });
    command.save(output);
  });
};
