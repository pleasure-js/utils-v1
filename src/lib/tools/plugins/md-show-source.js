import fs from 'fs'
import util from 'util'
import path from 'path'
import Promise from 'bluebird'
import trim from 'lodash/trim'
import JSON5 from 'json5'
import deepmerge from 'deepmerge'

const readFile = util.promisify(fs.readFile)

export let codeTag = '```'

export const defaultOptions = {
  displayLink: true
}

export default async function mdShowSource ({ src, content, display }) {
  const pattern = /@show-source\(([^\)]+)\)/g
  let loader = []

  content.replace(pattern, (m, args) => {
    const file = args.indexOf(',') > 0 ? args.substr(0, args.indexOf(',')) : args
    let options = args.indexOf(',') > 0 ? trim(args.substr(args.indexOf(',') + 1)) : '{}'

    options = deepmerge(defaultOptions, JSON5.parse(options))

    const load = path.resolve(path.dirname(src), file)
    const format = path.parse(file).ext.substr(1)

    loader.push(readFile(load).then(content => {
      const output = [`${ codeTag }${ format }`, options.displayLink ? `// ${ file }\n` : false, trim(content.toString()), codeTag]
      return output.filter(Boolean).join(`\n`)
    }))
    return m
  })

  loader = await Promise.all(loader)

  return content.replace(pattern, (m) => {
    return loader.splice(0, 1)
  })
}
