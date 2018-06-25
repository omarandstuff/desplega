import _Pipeline from '../src/Pipeline'
import _Stage from '../src/Stage'
import _LocalStep from '../src/LocalStep'
import _RemoteStep from '../src/RemoteStep'
import { Pipeline, Stage, LocalStep, RemoteStep } from '../src/index'

describe('index', () => {
  it('exports the object creator functions', () => {
    expect(Pipeline('', {})).toBeInstanceOf(_Pipeline)
    expect(Stage('', {})).toBeInstanceOf(_Stage)
    expect(LocalStep()).toBeInstanceOf(_LocalStep)
    expect(RemoteStep()).toBeInstanceOf(_RemoteStep)
  })
})
