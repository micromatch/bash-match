'use strict';

var spawn = require('cross-spawn');
var exists = require('fs-exists-sync');
var isWindows = require('is-windows');
var bashPath;

/**
 * Returns true if `str` matches the given `pattern`.
 *
 * ```js
 * var bash = require('bash-match');
 * console.log(bash('foo', 'f*'));
 * //=> true
 *
 * console.log(bash('foo', 'b*'));
 * //=> false
 * ```
 *
 * @param {String} `str`
 * @param {String} `pattern`
 * @param {Options} `options` Set `strictErrors` to true to throw when bash throws an error. Otherwise it just returns false.
 * @return {Boolean}
 * @api public
 */

function bash(str, pattern, options) {
  if (typeof str !== 'string') {
    throw new TypeError('expected a string');
  }
  if (typeof pattern !== 'string') {
    throw new TypeError('expected a string');
  }

  var cmd = pattern;
  if (isWindows()) {
    throw new Error('bash-match does not work on windows');
  }

  if (!/echo/.test(cmd)) {
    cmd = 'IFS=$"\n"; shopt -s extglob && shopt -s globstar; if [[ "' + str + '" = ' + pattern + ' ]]; then echo true; fi';
  }

  try {
    var res = spawn.sync(getBashPath(), ['-c', cmd], options);
    var err = toString(res.stderr);
    if (err) {
      return handleError(err, options);
    }
    return !!toString(res.stdout);
  } catch (err) {
    return handleError(err, options);
  }
}

/**
 * Returns true if `str` matches the given `pattern`. Alias for the [main export](#bash).
 *
 * ```js
 * var bash = require('bash-match');
 * console.log(bash.isMatch('foo', 'f*'));
 * //=> true
 *
 * console.log(bash.isMatch('foo', 'b*'));
 * //=> false
 * ```
 *
 * @param {String} `str`
 * @param {String} `pattern`
 * @param {Options} `options` Set `strictErrors` to true to throw when bash throws an error. Otherwise it just returns false.
 * @return {Boolean}
 * @api public
 */

bash.isMatch = function(fixture, pattern, options) {
  return bash(fixture, pattern, options);
};

/**
 * Takes a `list` of strings and a glob `pattern`, and returns an array
 * of strings that match the pattern.
 *
 * ```js
 * var bash = require('bash-match');
 * console.log(bash.match(['foo', 'bar'], 'b*'));
 * //=> ['bar']
 * ```
 *
 * @param {Array} `array` List of strings to match
 * @param {String} `pattern` Glob pattern
 * @param {Options} `options` Set `strictErrors` to true to throw when bash throws an error. Otherwise it just returns false.
 * @return {Boolean}
 * @api public
 */

bash.match = function(list, pattern, options) {
  list = Array.isArray(list) ? list : [list];
  var matches = [];
  var len = list.length;
  var idx = -1;
  while (++idx < len) {
    var fixture = list[idx];
    if (bash.isMatch(fixture, pattern, options)) {
      matches.push(fixture);
    }
  }
  return matches;
};

/**
 * Stringify `buf`
 */

function toString(buf) {
  return (buf && buf.toString() || '').trim();
}

/**
 * Handle errors
 */

function handleError(err, options) {
  if (options && options.strictErrors === true) {
    throw err;
  }
  return false;
}

/**
 * Get bash path
 */

function getBashPath() {
  if (bashPath) return bashPath;
  if (exists('/usr/local/bin/bash')) {
    bashPath = '/usr/local/bin/bash';
  } else if (exists('/bin/bash')) {
    bashPath = '/bin/bash';
  } else {
    bashPath = 'bash';
  }
  return bashPath;
}

/**
 * Expose `bash`
 */

module.exports = bash;
