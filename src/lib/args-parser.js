import camelCase from 'lodash/camelCase'

export function ArgsParser (args = process.argv) {
  const res = {}
  let currentArg
  args.forEach(arg => {
    const cleanArg = camelCase(arg.replace(/^-+/, '').replace(/=.*$/, ''))

    if (currentArg) {
      if (/^-/.test(arg)) {
        res[currentArg] = true
      } else {
        res[currentArg] = cleanArg
        currentArg = null
        return
      }
    }

    if (/^--/.test(arg)) {
      if (arg.indexOf('=') > 0) {
        res[cleanArg] = arg.split('=')[1]
      } else {
        currentArg = cleanArg
      }
    } else if (/^-/.test(arg)) {
      res[cleanArg] = true
    }
  })
  if (currentArg) {
    res[currentArg] = true
  }
  return res
}
