import { findRoot } from './find-root.js'

/**
 * Locates the pleasure.config.js file
 * @ignore
 */
export function findConfig () {
  return findRoot('pleasure.config.js')
}
