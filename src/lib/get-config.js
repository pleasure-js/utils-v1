import { findConfig } from './find-config.js'
import merge from 'deepmerge'
import get from 'lodash/get'

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
export function getConfig (scope, mergeWith = {}, force = false) {
  if (force) {
    delete require.cache[require.resolve(findConfig())]
  }

  // node.js only
  return merge.all([{}, get(require(findConfig()), scope, {}), mergeWith || {}])
}
