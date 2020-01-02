import test from 'ava'
import { ArgsParser } from '../'

test(`Parses all args starting with a dash in object style`, t => {
  const args = ArgsParser(['--sandy=papo', '-papo', '--api', '--first-name', 'martin'])

  t.truthy(args)
  t.true(typeof args === 'object')
  t.is(args.sandy, 'papo')
  t.true(args.api)
  t.true(args.papo)
  t.is(args.firstName, 'martin')
  t.is(Object.keys(args).length, 4)
})
