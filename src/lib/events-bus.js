import { EventEmitter } from 'events'

let singleton

export function EventBus () {
  if (singleton) {
    return singleton
  }

  const PleasureMainEvent = new EventEmitter()

  const api = {}
  const evs = ['on', 'removeListener', 'once', 'emit']

  evs.forEach(ev => {
    if (ev in PleasureMainEvent) {
      api[ev] = PleasureMainEvent[ev].bind(PleasureMainEvent)
    }
  })

  singleton = api

  return singleton
}
