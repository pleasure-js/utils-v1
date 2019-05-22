import path from 'path'
import { findPackageJson } from './find-package-json.js'

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
export function findRoot (...paths) {
  return path.resolve(process.env.PLEASURE_ROOT || path.dirname(findPackageJson()), ...paths)
}
