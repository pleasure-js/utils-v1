import { readdirAsync } from '../readdir-async.js'
import each from 'lodash/each'

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
