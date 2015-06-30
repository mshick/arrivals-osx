/* eslint quotes:0 */
var exec = require('child_process').exec;
var format = require('util').format;
var bole = require('bole');
var log = bole('tag');

// hex -> bin -> json -> lines
var hexToLines = `xxd -r -p - - | plutil -convert json -o - - | sed 's/[][]//g' | tr ',' '\n'`;

// lines -> json -> bin -> hex
var linesToHex = `tr '\n' ',' | echo [\$(sed 's/,$//')] | plutil -convert binary1 -o - - | xxd -p - -`;

// get them all
var gettags = `xattr -px com.apple.metadata:_kMDItemUserTags "%s" 2> /dev/null | ${hexToLines} | sed 's;.*Property List error.*;;'`;


function writeCmd(get, op, src) {

    var write = `xattr -wx com.apple.metadata:_kMDItemUserTags "$(%s | %s | grep . | %s)" "%s"`;
    return format(write, get, op, linesToHex, src);
}

function addCmd(source, tag) {

    var get = format(gettags, source);
    var add = `(cat -; echo \\\"%s\\\") | sort -u`;
    add = format(add, tag);
    return writeCmd(get, add, source);
}

function removeCmd(source, tag) {

    var get = format(gettags, source);
    var remove = `(cat - | sed 's;\\\"%s\\\";;') | sort -u`;
    remove = format(remove, tag);
    return writeCmd(get, remove, source);
}

function replaceCmd(source, tag, replacement) {

    var get = format(gettags, source);
    var replace = `(cat - | sed 's;\"%s\";\"%s\";') | sort -u`;
    replace = format(replace, tag, replacement);
    return writeCmd(get, replace, source);
}

module.exports = {

    addTag: function (source, tag) {

        var cmd = addCmd(source, tag);

        return new Promise(function(resolve) {

            exec(cmd, function (err, stdout, stderr) {

                log.debug(stdout);

                if (err || stderr) {
                    log.error(err || stderr);
                }

                resolve(stdout);
            });
        });
    },

    removeTag: function (source, tag) {

        var cmd = removeCmd(source, tag);

        return new Promise(function(resolve) {

            exec(cmd, function (err, stdout, stderr) {

                log.debug(stdout);

                if (err || stderr) {
                   log.error(err || stderr);
                }

                resolve(stdout);
            });
        });
    },

    replaceTag: function (source, tag, replacement) {

        var cmd = replaceCmd(source, tag, replacement);

        return new Promise(function(resolve) {

            exec(cmd, function (err, stdout, stderr) {

                log.debug(stdout);

                if (err || stderr) {
                    log.error(err || stderr);
                }

                resolve(stdout);
            });
        });
    }
};
