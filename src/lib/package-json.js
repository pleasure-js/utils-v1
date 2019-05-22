import { findRoot } from './find-root.js'
import fs from 'fs'

export function packageJson () {
  const file = findRoot('./package.json')

  if (!fs.existsSync(file)) {
    return {}
  }

  return require(file)
}
