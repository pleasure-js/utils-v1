/*!
 * @pleasure-js/utils v1.0.0-beta
 * (c) 2018-2020 Martin Rafael Gonzalez <tin@devtin.io>
 * Released under the MIT License.
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = _interopDefault(require('path'));
var fs = require('fs');
var fs__default = _interopDefault(fs);
var util = _interopDefault(require('util'));
var Promise = _interopDefault(require('bluebird'));
var trim = _interopDefault(require('lodash/trim'));
var castArray = _interopDefault(require('lodash/castArray'));
var mkdirp = _interopDefault(require('mkdirp'));
var each = _interopDefault(require('lodash/each'));
var JSON5 = _interopDefault(require('json5'));
var merge = _interopDefault(require('deepmerge'));
var events = require('events');
var get = _interopDefault(require('lodash/get'));
var set = _interopDefault(require('lodash/set'));
var snakeCase = _interopDefault(require('lodash/snakeCase'));
var dot = _interopDefault(require('dot-object'));
var find = _interopDefault(require('lodash/find'));

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
    if (dir === '/') {
      return path.join(process.cwd(), 'package.json')
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
 * Locates the pleasure.config.js file. Alternatively returns the env variable PLEASURE_CONFIG if set.
 * @ignore
 */
function findConfig () {
  return process.env.PLEASURE_CONFIG || findRoot('pleasure.config.js')
}

function packageJson () {
  const file = findRoot('./package.json');

  if (!fs__default.existsSync(file)) {
    return {}
  }

  return require(file)
}

const readdirAsync = util.promisify(fs__default.readdir);

const config = {
  pathPattern: [/(!\[[^\]]*])\(([^)]+)\)/mg],
  libPath: '_lib',
  fixPaths: true
};

/**
 * Parses the given ugly assetPath (ugly meaning that could have or not hash's. i.e. 'path/to/asset.png#asdmpoiam')
 *
 * @ignore
 * @param {String} assetPath - Path to the garbled asset.
 * @return {Object} - Breaks downs the given garbled path and return the clean `path`, the `garbage` and the `sep`-arator
 */
function breakGarbledPath (assetPath) {
  let [path, garbage = ''] = assetPath.split(/[#\s]/);
  let sep = '';

  if (garbage) {
    sep = assetPath.match(/[#\s]/)[0];
  }
  return { path, garbage, sep }
}

function mdImport (cnf = config) {
  const { fixPaths, pathPattern } = cnf;

  return async function mdImport ({ opts, subModule, directory, parentDir, parser, src, content, display }) {
    const libPath = path.join(directory, cnf.libPath);

    const pattern = /@import\(([^\)]+)\)/g;
    let loader = [];

    content.replace(pattern, (m, args) => {
      const file = args.indexOf(',') > 0 ? args.substr(0, args.indexOf(',')) : args;
      // let options = args.indexOf(',') > 0 ? trim(args.substr(args.indexOf(',') + 1)) : '{}'

      // options = deepmerge(defaultOptions, JSON5.parse(options))

      let load = path.resolve(path.dirname(src), file);
      // const format = path.parse(file).ext.substr(1)

      if (!fs__default.existsSync(load)) {
        load = path.resolve(libPath, file);
      }

      // console.log({ load })
      loader.push(parser(load, path.dirname(src)).then(content => {
        return trim(content)
      }));
      return m
    });

    loader = await Promise.all(loader);

    if (fixPaths) {
      pathPattern.forEach(pattern => {
        content = content.replace(pattern, (m, imgTag, assetPath) => {
          const { path: thePath, sep, garbage } = breakGarbledPath(assetPath);
          // console.log({ thePath, sep, garbage, src, parentDir, assetPath })
          let add = '';
          if (garbage) {
            add = `${ sep }${ garbage }`;
          }
          return `${ imgTag }(${ path.join(path.relative(parentDir, path.dirname(src)), thePath) }${ add })`
        });
      });
    }

    return content.replace(pattern, () => {
      return loader.splice(0, 1)
    })
  }
}

const lstat = Promise.promisify(fs__default.lstat);

/**
 * Deep scans the given `directory` returning an array with strings to all of the files found in that `directory`.
 *
 * @param {String} directory - The directory to scan
 * @param {String[]|RegExp[]} [exclude=[/node_modules/]] - Paths to exclude
 * @param {String[]|RegExp[]} [only=[]] - If present, only paths matching at least one of the expressions,
 * would be included.
 * @param {Function} [filter] - Callback function called with the evaluated `path` as the first argument. Must return
 * `true` or `false`
 * @return {Promise<String[]>} Paths found
 */
async function deepScanDir (directory, { exclude = [/node_modules/], filter, only = [] } = {}) {
  const files = await readdirAsync(directory);
  // console.log({ files })
  let found = [];

  await Promise.each(files, async file => {
    file = path.join(directory, file);

    let excluded = false;
    let included = only.length === 0;

    each(castArray(exclude), pattern => {
      if (typeof pattern === 'string' && file.indexOf(pattern) >= 0) {
        excluded = true;
        return false
      }

      if (pattern instanceof RegExp && pattern.test(file)) {
        excluded = true;
        return false
      }
    });

    if (excluded) {
      return
    }

    const isDirectory = (await lstat(file)).isDirectory();

    if (!isDirectory && filter && !await filter(file)) {
      return
    }

    if (isDirectory) {
      found = found.concat(await deepScanDir(file, { exclude, filter, only }));
      return
    }

    each(castArray(only), pattern => {
      if (typeof pattern === 'string' && file.indexOf(pattern) >= 0) {
        included = true;
        return false
      }

      if (pattern instanceof RegExp && pattern.test(file)) {
        included = true;
        return false
      }
    });

    if (!included) {
      return
    }

    found.push(file);
  });

  return found
}

const readFile = Promise.promisify(fs__default.readFile);
const writeFile = Promise.promisify(fs__default.writeFile);

/*
todo:
  √ deeply scan given directory
  √ grab *.raw.md files
  √ parse their content applying plugins
  √ write an output file removing the .raw. prefix
 */

const config$1 = {
  pattern: /\.md$/
};

/**
 * Scans all files matching the `config.pattern` in given `directory`. Parses all matching files using a `plugins`
 * pipeline and writes the results in given `out` directory.
 *
 * @ignore
 * @param {String} directory - The directory to scan
 * @param plugins
 * @param out
 * @param {RegExp[]|String[]} exclude - `RegExp` or `String` path to exclude from importing.
 * @return {Promise<*>}
 */
async function MDRawParser (directory, { plugins = [], out, exclude = [/node_module/] } = {}) {
  // `rawFiles` = scans all files in given `directory` matching `config.pattern`
  const rawFiles = await deepScanDir(directory, {
    exclude,
    filter (file) {
      return config$1.pattern.test(file)
    }
  });

  const mainOut = out;

  /**
   *
   * @param {Object} opts -
   * @param src
   * @param parentDir
   * @return {Promise<*>}
   */
  const parser = async (opts, src, parentDir) => {
    let { directory, out } = opts || {};
    // console.log({ opts, src, parentDir })

    if (!directory) {
      directory = path.dirname(src);
    }

    const fileContent = await Promise.reduce(castArray(plugins), (content, plugin) => {
      /**
       * @typedef {Function} MDRawParserPlugin
       * @desc Transforms given `content`
       *
       * @param {Object} opts - Plugin options
       * @param {Boolean} opts.subModule - Whether the plugin is being called through the main pipeline or being
       * re-called by another plugin
       * @param {String} mainOut - Bundle destination
       * @param {String} directory -
       * @param {String} parentDir - `directory` to the file importing `src`
       * @param {String} src - Path to the file where the `content` was loaded
       * @param {String} content - The content of `src`
       *
       * @return {String} - New transformed source
       */

      return plugin({
        opts,
        mainOut,
        directory,
        parentDir: parentDir || directory,
        src,
        content,
        parser: parser.bind(null, { subModule: true }),
        Parser: parser
      })
    }, (await readFile(src)).toString());

    const file = path.join(out || directory, path.relative(directory, src.replace(config$1.pattern, '.md')));

    if (out) {
      const dir = path.dirname(file);
      // console.log({ file, fileContent, dir })
      mkdirp.sync(dir);
      return writeFile(file, fileContent)
    }

    return fileContent
  };

  await Promise.each(rawFiles, (file) => parser({ directory, out }, file));
  return rawFiles
}

const readFile$1 = util.promisify(fs__default.readFile);

let codeTag = '```';

const defaultOptions = {
  displayLink: true
};

async function mdShowSource ({ src, content, display }) {
  const pattern = /@show-source\(([^\)]+)\)/g;
  let loader = [];

  content.replace(pattern, (m, args) => {
    const file = args.indexOf(',') > 0 ? args.substr(0, args.indexOf(',')) : args;
    let options = args.indexOf(',') > 0 ? trim(args.substr(args.indexOf(',') + 1)) : '{}';

    options = merge(defaultOptions, JSON5.parse(options));

    const load = path.resolve(path.dirname(src), file);
    const format = path.parse(file).ext.substr(1);

    loader.push(readFile$1(load).then(content => {
      const output = [`${ codeTag }${ format }`, options.displayLink ? `// ${ file }\n` : false, trim(content.toString()), codeTag];
      return output.filter(Boolean).join(`\n`)
    }));
    return m
  });

  loader = await Promise.all(loader);

  return content.replace(pattern, (m) => {
    return loader.splice(0, 1)
  })
}

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

const middlewares = {};

const overwriteMerge = (destinationArray, sourceArray, options) => {
  // guessing when it's a moment pair array
  // console.log({ destinationArray }, destinationArray.length === 2, typeof destinationArray[0] === 'number', typeof destinationArray[1] === 'string', { options })
  if (destinationArray.length === 2 && typeof destinationArray[0] === 'number' && typeof destinationArray[1] === 'string') {
    // replace the entire value... DO NOT MERGE
    return sourceArray
  }

  return sourceArray.concat(destinationArray.filter((ele) => {
    // merging strategy for plugins
    if (typeof ele === 'object' && ele.hasOwnProperty('name')) {
      return !find(sourceArray, { name: ele.name })
    }

    // anything else
    return sourceArray.indexOf(ele) === -1
  }))
};

/**
 * Extends a configuration scope
 * @param {String} scope - Scope to extend
 * @param {Function|Object} replacement - Either an object to merge with the local configuration, or a function that
 * will get called per configuration request and must return an object to merge with local found scope.
 *
 * @example <caption>Overriding a scope</caption>
 *
 * ```js
 * // forces to assign 4000 as the value of port in the api scopes
 * extendConfig('api', { port: 4000 })
 *
 * // will return { api: { port: 4000, xxx: 'xValue', yyy: 'yValue' }, ui { ... } }
 * getConfig()
 * ```
 */
function extendConfig (scope = '', replacement) {
  if (!scope || !replacement) {
    return console.error(`provide both a scope & replacement`)
  }

  // console.log(`adding middleware for ${ scope }`, replacement)

  if (!middlewares.hasOwnProperty(scope)) {
    middlewares[scope] = [];
  }

  middlewares[scope].push(replacement);
}

function getMiddlewareMutation (scope) {
  let middlewareMutation = {};

  if (!middlewares.hasOwnProperty(scope)) {
    Object.keys(middlewares).forEach(scope => {
      middlewareMutation[scope] = getMiddlewareMutation(scope);
    });
    return middlewareMutation
  }

  middlewares[scope].forEach(mutation => {
    if (typeof mutation === 'function') {
      middlewareMutation = merge(middlewareMutation, mutation(), {
        arrayMerge: overwriteMerge
      });
      return
    }
    middlewareMutation = merge(middlewareMutation, mutation, {
      arrayMerge: overwriteMerge
    });
  });

  return middlewareMutation
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
 * @param {String} [scope=null] - The scope to return from the `pleasure.config.js` file. `null` to return the entire
 * config object.
 * @param {Object} [mergeWith] - Alternatively another configuration object to merge with the local found, overriding
 * local values.
 * @param {Boolean} [force=false] - Force read the configuration from file (avoiding cache).
 * @param {Boolean} [runMiddleware=true] - Force read the configuration from file (avoiding cache).
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
function getConfig (scope = null, mergeWith = {}, force = false, runMiddleware = true) {
  // console.log(`pleasure-utils>get config`, { scope, force, runMiddleware })
  const configFile = findConfig();

  if (force) {
    delete require.cache[require.resolve(configFile)];
  }

  const loadedConfig = (fs__default.existsSync(configFile) ? require(configFile) : null) || {};
  const toMerge = [
    scope ? get(loadedConfig, scope, {}) : loadedConfig,
    runMiddleware ? getMiddlewareMutation(scope) : {},
    mergeWith || {}
  ];

  // console.log(`toMerge>>>`, toMerge)

  // node.js only
  const mergedConfig = merge.all(
    toMerge,
    {
      arrayMerge: overwriteMerge
    }
  );

  return mergeConfigWithEnv(mergedConfig)
}

/**
 * Replaces `config` properties with given ENV variables. Mutates given `config`.
 * @param {Object} config - The configuration object
 * @param {String} prefix=PLEASURE - Prefix of the ENV variable
 * @return {*} The mutated object
 *
 * @examples
 *
 * ```js
 * process.env.PLEASURE_API_MONGODB_HOST = '127.0.0.1'
 * mergeConfigWithEnv({
 *   api: {
 *     mongodb: {
 *       host: 'localhost',
 *       collection: 'my-project'
 *     }
 *   }
 * })
 *
 * // api: {
 * //   mongodb: {
 * //     host: '127.0.0.1',
 * //     collection: 'my-project'
 * //   }
 * // }
 * ```
 */
function mergeConfigWithEnv (config, prefix = `PLEASURE`) {
  Object.keys(dot.dot(config)).forEach(k => {
    const envKey = `${ prefix }_${ snakeCase(k) }`.toUpperCase();
    if (process.env[envKey]) {
      set(config, k, process.env[envKey]);
    }
  });
  return config
}

exports.EventBus = eventsBus;
exports.MDRawParser = MDRawParser;
exports.deepScanDir = deepScanDir;
exports.extendConfig = extendConfig;
exports.findConfig = findConfig;
exports.findPackageJson = findPackageJson;
exports.findRoot = findRoot;
exports.getConfig = getConfig;
exports.mdImport = mdImport;
exports.mdShowSource = mdShowSource;
exports.mergeConfigWithEnv = mergeConfigWithEnv;
exports.overwriteMerge = overwriteMerge;
exports.packageJson = packageJson;
exports.randomUniqueId = randomUniqueId;
exports.readdirAsync = readdirAsync;
