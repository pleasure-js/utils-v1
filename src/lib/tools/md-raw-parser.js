import { readdirAsync } from 'src/lib/readdir-async.js'
import fs from 'fs'
import Promise from 'bluebird'
import path from 'path'
import castArray from 'lodash/castArray'
import each from 'lodash/each'
import mkdirp from 'mkdirp'

const lstat = Promise.promisify(fs.lstat)
const readFile = Promise.promisify(fs.readFile)
const writeFile = Promise.promisify(fs.writeFile)

/*
todo:
  √ deeply scan given directory
  √ grab *.raw.md files
  √ parse their content applying plugins
  √ write an output file removing the .raw. prefix
 */

export const config = {
  pattern: /\.md$/
}

export async function deepScan (directory, { exclude = [/node_modules/], filter } = {}) {
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
      found = found.concat(await deepScan(file, { exclude, filter }))
      return
    }

    found.push(file)
  })

  return found
}

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
export async function MDRawParser (directory, { plugins = [], out, exclude = [/node_module/] } = {}) {
  // `rawFiles` = scans all files in given `directory` matching `config.pattern`
  const rawFiles = await deepScan(directory, {
    exclude,
    filter (file) {
      return config.pattern.test(file)
    }
  })

  const mainOut = out

  /**
   *
   * @param {Object} opts -
   * @param src
   * @param parentDir
   * @return {Promise<*>}
   */
  const parser = async (opts, src, parentDir) => {
    let { directory, out } = opts || {}
    console.log({ opts, src, parentDir })

    if (!directory) {
      directory = path.dirname(src)
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
    }, (await readFile(src)).toString())

    const file = path.join(out || directory, path.relative(directory, src.replace(config.pattern, '.md')))

    if (out) {
      const dir = path.dirname(file)
      // console.log({ file, fileContent, dir })
      mkdirp.sync(dir)
      return writeFile(file, fileContent)
    }

    return fileContent
  }

  await Promise.each(rawFiles, (file) => parser({ directory, out }, file))
  return rawFiles
}
