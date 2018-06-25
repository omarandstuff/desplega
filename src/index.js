import _Pipeline from './Pipeline'
import _Stage from './Stage'
import _LocalStep from './LocalStep'
import _RemoteStep from './RemoteStep'

export function Pipeline(title, config, theme) {
  return new _Pipeline(title, config, theme)
}

export function Stage(title, config) {
  return new _Stage(title, config)
}

export function LocalStep(definition) {
  return new _LocalStep(definition)
}

export function RemoteStep(definition) {
  return new _RemoteStep(definition)
}
