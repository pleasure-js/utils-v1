import { readdirAsync } from '../readdir-async.js'
import castArray from 'lodash/castArray'
import each from 'lodash/each'
import Promise from 'bluebird'

/**
 * Deep scans the given `directory` returning an array with strings to all of the files found in that `directory`.
 *
 * @param {String} directory - The directory to scan
 * @param {String[]|RegExp[]} [exclude=[/node_modules/]] - Paths to exclude
 * @param {Function} [filter] - Callback function called with the evaluated `path` as the first argument. Must return
 * `true` or `false`
 * @return {Promise<String[]>} Paths found
 */
export async function deepScanDir (directory, { exclude = [/node_modules/], filter } = {}) {
  const files = await readdirAsync(directory)
  // console.log({ files })
  let found = []

  await Promise.each(files, async file => {
    file = path.join(directory, file)

    const isDirectory = (await lstat(file)).isDirectory()

    if (!isDirectory && filter && !await filter(file)) {
      return
    }

    let excluded = false

    each(castArray(exclude), pattern => {
      if (typeof pattern === 'string' && file.indexOf(pattern) >= 0) {
        excluded = true
        return false
      }

      if (pattern instanceof RegExp && pattern.test(file)) {
        excluded = true
        return false
      }
    })

    if (excluded) {
      return
    }

    if (isDirectory) {
      found = found.concat(await deepScanDir(file, { exclude, filter }))
      return
    }

    found.push(file)
  })

  return found
}
