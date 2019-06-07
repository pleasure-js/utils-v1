import { findConfig } from './find-config.js'
import merge from 'deepmerge'
import fs from 'fs'
import path from 'path'
import get from 'lodash/get'
import set from 'lodash/set'
import snakeCase from 'lodash/snakeCase'
import dot from 'dot-object'

const middlewares = {}

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
export function extendConfig (scope = '', replacement) {
  if (!scope || !replacement) {
    return console.error(`provide both a scope & replacement`)
  }

  if (!middlewares.hasOwnProperty(scope)) {
    middlewares[scope] = []
  }

  middlewares[scope].push(replacement)
}

function getMiddlewareMutation (scope) {
  let middlewareMutation = {}

  if (!middlewares.hasOwnProperty(scope)) {
    return middlewareMutation
  }

  middlewares[scope].forEach(mutation => {
    if (typeof mutation === 'function') {
      middlewareMutation = merge(middlewareMutation, mutation())
      return
    }
    middlewareMutation = merge(middlewareMutation, mutation)
  })

  // console.log({ middlewareMutation })

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
export function getConfig (scope = null, mergeWith = {}, force = false, runMiddleware = true) {
  const configFile = findConfig()

  if (force) {
    delete require.cache[require.resolve(configFile)]
  }

  const loadedConfig = (fs.existsSync(configFile) ? require(configFile) : null) || {}

  // node.js only
  const mergedConfig = merge.all(
    [
      {},
      scope ? get(loadedConfig, scope, {}) : loadedConfig,
      runMiddleware ? getMiddlewareMutation(scope) : {},
      mergeWith || {}
    ]
  )

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
export function mergeConfigWithEnv (config, prefix = `PLEASURE`) {
  // merge with ENV
  Object.keys(dot.dot(config)).forEach(k => {
    const envKey = `${ prefix }_${ snakeCase(k) }`.toUpperCase()
    if (process.env[envKey]) {
      set(config, k, process.env[envKey])
    }
  })
  return config
}
