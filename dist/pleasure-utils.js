/*!
 * pleasure-utils v1.0.0-beta
 * (c) 2018-2019 undefined
 * Released under the MIT License.
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = _interopDefault(require('path'));
var fs = require('fs');
var fs__default = _interopDefault(fs);
var util = _interopDefault(require('util'));
var events = require('events');
var merge = _interopDefault(require('deepmerge'));
var get = _interopDefault(require('lodash/get'));

/**
 * Returns a random unique id.
 *
 * @ignore
 * @see {@link https://stackoverflow.com/a/6860962/1064165}
 * @return {String} - Random unique id generated.
 */
function randomUniqueId () {
  const randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return randLetter + Date.now()
}

function findPackageJson (dir) {
  dir = dir || path.resolve(process.cwd(), process.env.PLEASURE_ROOT || './');
  const local = path.join(dir, 'package.json');
  if (!fs.existsSync(local)) {
    // todo: fix for different platforms
    if (local === '/') {
      return
    }

    return findPackageJson(path.join(dir, '../'))
  }

  return local
}

/**
 * Finds the root of a project (where the `pleasure.config.js` resides).
 *
 * @function Utils.findRoot
 * @param {...String} [paths] - Optional resolve the given path(s) from the root.
 *
 * @return {String} The path to the project. When given extra arguments, it will resolve those as paths from the
 * found root.
 *
 * @example <caption>Returning the location to the package.json file</caption>
 *
 * e.g. imaging running the code below from a project at path `/Users/tin/my-kick-ass-project`
 *
 * ```js
 * // prints: /Users/tin/my-kick-ass-project/package.json
 * console.log(findRoot('package.json'))
 * ```
 */
function findRoot (...paths) {
  return path.resolve(process.env.PLEASURE_ROOT || path.dirname(findPackageJson()), ...paths)
}

/**
 * Locates the pleasure.config.js file
 * @ignore
 */
function findConfig () {
  return findRoot('pleasure.config.js')
}

function packageJson () {
  const file = findRoot('./package.json');

  if (!fs__default.existsSync(file)) {
    return {}
  }

  return require(file)
}

const readdirAsync = util.promisify(fs__default.readdir);

let singleton;

function eventsBus () {
  if (singleton) {
    return singleton
  }

  const PleasureMainEvent = new events.EventEmitter();

  const api = {};
  const evs = ['on', 'removeListener', 'once', 'emit'];

  evs.forEach(ev => {
    if (ev in PleasureMainEvent) {
      api[ev] = PleasureMainEvent[ev].bind(PleasureMainEvent);
    }
  });

  singleton = api;

  return singleton
}

/**
 * @function Utils.getConfig
 * @summary Returns the local project configuration alternatively merging with `merge`
 *
 * @desc In order to keep things simple, pleasure's entire configuration for a project is handled in only one only file
 * called `pleasure.config.js` and must be located in the root of the project's directory.
 *
 * This file must export an `Object` with scoped properties to configure pleasure's logic.
 *
 * @param {String} scope - The scope to return from the `pleasure.config.js` file.
 * @param {Object} [mergeWith] - Alternatively another configuration object to merge with the local found.
 * @param {Boolean} [force=false] - Force read the configuration from file (avoiding cache).
 *
 * @return {Config}
 *
 * @example <caption>Configuring pleasure</caption>
 *
 * ```js
 * module.exports = {
 *   // legacy: const { utils: { getConfig } } = require('pleasure')
 *   const { getConfig } = require('pleasure')
 * }
 * ```
 */
function getConfig (scope, mergeWith = {}, force = false) {
  if (force) {
    delete require.cache[require.resolve(findConfig())];
  }

  // node.js only
  return merge.all([{}, get(require(findConfig()), scope, {}), mergeWith || {}])
}

exports.EventBus = eventsBus;
exports.findConfig = findConfig;
exports.findPackageJson = findPackageJson;
exports.findRoot = findRoot;
exports.getConfig = getConfig;
exports.packageJson = packageJson;
exports.randomUniqueId = randomUniqueId;
exports.readdirAsync = readdirAsync;
