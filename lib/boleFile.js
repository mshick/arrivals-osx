var fs = require('fs');
var util = require('util');
var stream = require('stream');
var touch = require('touch');
var assign = require('object-assign');


var defaultProperties = {
  time: true,
  hostname: true,
  pid: true,
  level: true,
  name: true,
  message: true
};

var FileStream = function (filepath, options) {
    stream.Writable.call(this, {
        objectMode: true
    });

    touch.sync(filepath);
    this._filepath = filepath;
    this._filestream = fs.createWriteStream(filepath, { flags: 'a', encoding: 'utf-8' });

    options = options || {};
    this._indent = options.indent || 2;
};

util.inherits(FileStream, stream.Writable);

var localTime = function (date) {

    var tzo = -date.getTimezoneOffset();
    var diff = tzo >= 0 ? '+' : '-';

    var pad = function (n) {
        return (n < 10 ? '0' : '') + n;
    };

    var padMilliseconds = function (n) {
        var str = n + '';
        while (str.length !== 3) {
            str = '0' + str;
        }
        return str;
    };

    return date.getFullYear() + '-' +
        pad(date.getMonth() + 1) + '-' +
        pad(date.getDate()) + 'T' +
        pad(date.getHours()) + ':' +
        pad(date.getMinutes()) + ':' +
        pad(date.getSeconds()) + '.' +
        padMilliseconds(date.getMilliseconds()) +
        diff +
        pad(Math.abs(Math.floor(tzo / 60))) + ':' +
        pad(Math.abs(Math.floor(tzo % 60)));
};

FileStream.prototype._write = function (obj, encoding, cb) {
    obj = assign(obj);
    var str = '';

    str += '[' + localTime(new Date(obj.time)) + ']';

    if (obj.message) str += ' ' + obj.message;

    if (obj.err) {
        var trace = obj.err.message || obj.err.name;
        trace = obj.err.stack.substring(obj.err.stack.indexOf(trace) +
            trace.length + 1);
        str += (obj.message ? ' - ' : ' ') + obj.err.name + ': ' + obj.err.message;
        if (trace) str += '\n' + trace;
    } else {
        var arbitraryObject = {};
        var content;

        for (var p in obj) {
            if (!obj.hasOwnProperty(p)) continue;
            if (!defaultProperties[p]) {
                content = true;
                arbitraryObject[p] = obj[p];
            }
        }

        if (content) {
            str += '\n' + JSON.stringify(arbitraryObject, null, this._indent);
        }
    }

    this._filestream.write(str + '\n');

    cb();
};

module.exports = function (options) {
    return new FileStream(options);
};
