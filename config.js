var reach = require('hoek').reach;

var defaults = {
  baseDir: './.arrivals',
  dbDir: 'db',
  tmpDir: 'tmp',
  logFile: 'arrivals.log',
  extensions: ['flac', 'mp3', 'mp4', 'm4a', 'm4v', 'mkv', 'mov'],
  copyAudioExtensions: ['mp3', 'm4a', 'm4b'],
  convertAudioExtensions: ['flac'],
  copyVideoExtensions: ['mov', 'mp4'],
  convertVideoExtensions: ['mkv'],
  flags: {
    PENDING: 'pending',
    EXISTING: 'existing',
    COMPLETE: 'complete',
    IN_PROGRESS: 'in-progress',
    UNHANDLED: 'unhandled'
  }
};

var Config = function () {
    this.config = defaults;
};

Config.prototype.get = function(val) {
    return reach(this.config, val);
};

Config.prototype.set = function(key, val) {
    this.config[key] = val;
};

module.exports = new Config();

