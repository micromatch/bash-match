'use strict';

var spawn = require('cross-spawn');
var exists = require('fs-exists-sync');
var extend = require('extend-shallow');
var isWindows = require('is-windows');
var isExtglob = require('is-extglob');
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

  if (isWindows()) {
    throw new Error('bash-match does not work on windows');
  }

  try {
    var opts = createOptions(pattern, options);
    var res = spawn.sync(getBashPath(), cmd(str, pattern, opts), opts);
    var err = toString(res.stderr);
    if (err) {
      return handleError(err, opts);
    }
    return !!toString(res.stdout);
  } catch (err) {
    return handleError(err, opts);
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
 * Create the command to use
 */

function cmd(str, pattern, options) {
  var valid = ['dotglob', 'extglob', 'failglob', 'globstar', 'nocaseglob', 'nullglob'];
  var args = [];

  for (var key in options) {
    if (options.hasOwnProperty(key) && valid.indexOf(key) !== -1) {
      args.push('-O', key);
    }
  }
  args.push('-c', 'IFS=$"\n"; if [[ "' + str + '" = ' + pattern + ' ]]; then echo true; fi');
  return args;
}

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
 * Shallow clone and create options
 */

function createOptions(pattern, options) {
  if (options && options.normalized === true) return options;
  var opts = extend({cwd: process.cwd()}, options);
  if (opts.nocase === true) opts.nocaseglob = true;
  if (opts.nonull === true) opts.nullglob = true;
  if (opts.dot === true) opts.dotglob = true;
  if (!opts.hasOwnProperty('globstar') && pattern.indexOf('**') !== -1) {
    opts.globstar = true;
  }
  if (!opts.hasOwnProperty('extglob') && isExtglob(pattern)) {
    opts.extglob = true;
  }
  opts.normalized = true;
  return opts;
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
