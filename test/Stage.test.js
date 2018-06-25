import moment from 'moment'
import Stage from '../src/Stage'
import Theme from '../src/Theme'
import GenericChild from './__dummies__/GenericChild'

const realLog = console.log
const realWrite = process.stdout.write

beforeEach(() => {
  console.log = jest.fn()
  process.stdout.write = jest.fn()
})

afterAll(() => {
  console.log = realLog
  process.stdout.write = realWrite
})

describe('Stage#run', () => {
  it('Executes a series of child object that responds to "run" method', async () => {
    const stage = new Stage('Stage')
    const thenFunc = jest.fn()

    stage.addStep(new GenericChild())
    stage.addStep(new GenericChild())
    stage.addStep(new GenericChild())

    await stage.run({ remotes: [], theme: new Theme(), globalStartTime: moment() }).then(thenFunc)

    expect(thenFunc.mock.calls.length).toBe(1)
    expect(thenFunc.mock.calls[0][0]).toMatchObject(['Generic success', 'Generic success', 'Generic success'])
  })

  it('Rejects if the stage if a child fails', async () => {
    const stage = new Stage('Stage')
    const thenFunc = jest.fn()
    const catchFunc = jest.fn()

    stage.addStep(new GenericChild())
    stage.addStep(new GenericChild(true))
    stage.addStep(new GenericChild())

    await stage
      .run({ remotes: [], theme: new Theme(), globalStartTime: moment() })
      .then(thenFunc)
      .catch(catchFunc)

    expect(thenFunc.mock.calls.length).toBe(0)
    expect(catchFunc.mock.calls.length).toBe(1)
    expect(catchFunc.mock.calls[0][0]).toEqual(['Generic success', 'Generic failure'])
  })

  it('Rejects if the stage if is alredy resolving', async () => {
    const stage = new Stage('Stage', { remotes: [{}] })
    const thenFunc = jest.fn()
    const catchFunc = jest.fn()

    stage.addStep(new GenericChild())
    stage.addStep(new GenericChild())
    stage.addStep(new GenericChild())

    stage.status = 'running'
    await stage
      .run({ remotes: [], theme: new Theme(), globalStartTime: moment() })
      .then(thenFunc)
      .catch(catchFunc)

    expect(thenFunc.mock.calls.length).toBe(0)
    expect(catchFunc.mock.calls.length).toBe(1)
    expect(catchFunc.mock.calls[0][0]).toEqual(new Error('Stage bussy'))
  })

  it('passes the context object with child index added', async () => {
    const stage = new Stage('Stage', {})
    const thenFunc = jest.fn()
    const child = new GenericChild()

    stage.addChild(child)

    await stage.run({ remotes: [], theme: new Theme(), globalStartTime: moment() }).then(thenFunc)

    expect(thenFunc.mock.calls.length).toBe(1)
    expect(thenFunc.mock.calls[0][0]).toMatchObject(['Generic success'])
    expect(child.context).toMatchObject({
      childIndex: 1,
      localOptions: {},
      remoteOptions: {},
      remotes: [],
      stackLevel: 2
    })
  })
})
