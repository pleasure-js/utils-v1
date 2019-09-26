import path from 'path'
import fs from 'fs'
import mkdirp from 'mkdirp'
import { breakGarbledPath } from './md-import.js'

export const config = {
  assetPattern: [/(!\[[^\]]*])\(([^)]+)\)/mg],
  dest: './' // same as main out
}

export default function copyAsset (cnf = config) {
  return function ({ opts: { subModule = false }, parentDir, mainOut, src, out, content }) {
    if (subModule) {
      return content
    }
    // console.log({ parentDir, mainOut, src, out })
    // console.log(`copy assets in ${ src }`)
    // outPath is the absolute path to the dest folder in the config
    const outPath = path.join(mainOut, config.dest)
    cnf.assetPattern.forEach(pattern => {
      content = content.replace(pattern, (m, imgTag, assetPath) => {
        // src is the path to the markdown file being processed
        // thePath is the relative path to the asset clean (no garbage)
        const { path: thePath, sep, garbage } = breakGarbledPath(assetPath)
        const cleanPath = thePath.replace(/^[^a-z0-9]+/, '')

        // srcPath is the real absolute path to the asset
        // console.log({ parentDir, thePath })
        const srcPath = path.join(parentDir, thePath)

        // destPath is the real absolute path to the destiny of the asset
        const destPath = path.join(outPath, cleanPath)
        // console.log({ thePath, parentDir, out, mainOut, src, srcPath, destPath, outPath })

        if (!fs.existsSync(destPath) && fs.existsSync(srcPath)) {
          // console.log(`copying assets`)
          mkdirp.sync(path.dirname(destPath))
          fs.copyFileSync(srcPath, destPath)
        }

        const relative = path.join(config.dest, cleanPath) + (garbage ? `${ sep }${ garbage }` : '')
        // console.log({ out, src, assetPath, relative, cleanPath, imgTag, 'config.dest': config.dest })

        // return relative path of the markdown file to the copied asset, plus any garbage it may had
        return `${ imgTag }(${ relative })`
      })
    })
    return content
  }
}
