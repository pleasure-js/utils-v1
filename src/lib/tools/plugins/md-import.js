import fs from 'fs'
import path from 'path'
import Promise from 'bluebird'
import trim from 'lodash/trim'

export const config = {
  pathPattern: [/(!\[[^\]]*])\(([^)]+)\)/mg],
  libPath: '_lib',
  fixPaths: true
}

/**
 * Parses the given ugly assetPath (ugly meaning that could have or not hash's. i.e. 'path/to/asset.png#asdmpoiam')
 *
 * @ignore
 * @param {String} assetPath - Path to the garbled asset.
 * @return {Object} - Breaks downs the given garbled path and return the clean `path`, the `garbage` and the `sep`-arator
 */
export function breakGarbledPath (assetPath) {
  let [path, garbage = ''] = assetPath.split(/[#\s]/)
  let sep = ''

  if (garbage) {
    sep = assetPath.match(/[#\s]/)[0]
  }
  return { path, garbage, sep }
}

/**
 * Parses the given ugly assetPath (ugly meaning that could have or not hash's. i.e. 'path/to/asset.png#asdmpoiam')
 *
 * @param {String} assetPath - Path to the garbled asset.
 * @param {String} base - The base from where to rebase the asset
 * @return {String} - Formatted `assetPath` with its gar
 */
export function rebaseGarbled (assetPath, base) {
  const { path: thePath, sep, garbage } = breakGarbledPath(assetPath)
  return path.join(base, thePath) + (garbage ? `${ sep }${ garbage }` : '')
}

export default function (cnf = config) {
  const { fixPaths, pathPattern } = cnf

  return async function mdImport ({ opts, subModule, directory, parentDir, parser, src, content, display }) {
    const libPath = path.join(directory, cnf.libPath)

    const pattern = /@import\(([^\)]+)\)/g
    let loader = []

    content.replace(pattern, (m, args) => {
      const file = args.indexOf(',') > 0 ? args.substr(0, args.indexOf(',')) : args
      // let options = args.indexOf(',') > 0 ? trim(args.substr(args.indexOf(',') + 1)) : '{}'

      // options = deepmerge(defaultOptions, JSON5.parse(options))

      let load = path.resolve(path.dirname(src), file)
      // const format = path.parse(file).ext.substr(1)

      if (!fs.existsSync(load)) {
        load = path.resolve(libPath, file)
      }

      // console.log({ load })
      loader.push(parser(load, path.dirname(src)).then(content => {
        return trim(content)
      }))
      return m
    })

    loader = await Promise.all(loader)

    if (fixPaths) {
      pathPattern.forEach(pattern => {
        content = content.replace(pattern, (m, imgTag, assetPath) => {
          const { path: thePath, sep, garbage } = breakGarbledPath(assetPath)
          // console.log({ thePath, sep, garbage, src, parentDir, assetPath })
          let add = ''
          if (garbage) {
            add = `${ sep }${ garbage }`
          }
          return `${ imgTag }(${ path.join(path.relative(parentDir, path.dirname(src)), thePath) }${ add })`
        })
      })
    }

    return content.replace(pattern, () => {
      return loader.splice(0, 1)
    })
  }
}
