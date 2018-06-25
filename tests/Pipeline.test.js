import Pipeline from '../src/Pipeline'
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

describe('Pipeline#run', () => {
  it('Executes a series of child object that responds to "run" method', async () => {
    const pipeline = new Pipeline('Pipeline', { remotes: [{}] })
    const thenFunc = jest.fn()

    pipeline.addStage(new GenericChild())
    pipeline.addStage(new GenericChild())
    pipeline.addStage(new GenericChild())

    await pipeline.run().then(thenFunc)

    expect(thenFunc.mock.calls.length).toBe(1)
    expect(thenFunc.mock.calls[0][0]).toMatchObject(['Generic success', 'Generic success', 'Generic success'])
  })

  it('Rejects if the pipeline if a child fails', async () => {
    const pipeline = new Pipeline('Pipeline', { remotes: [{}] })
    const thenFunc = jest.fn()
    const catchFunc = jest.fn()

    pipeline.addStage(new GenericChild())
    pipeline.addStage(new GenericChild(true))
    pipeline.addStage(new GenericChild())

    await pipeline
      .run()
      .then(thenFunc)
      .catch(catchFunc)

    expect(thenFunc.mock.calls.length).toBe(0)
    expect(catchFunc.mock.calls.length).toBe(1)
    expect(catchFunc.mock.calls[0][0]).toEqual(['Generic success', 'Generic failure'])
  })

  it('Rejects if the pipeline if is alredy resolving', async () => {
    const pipeline = new Pipeline('Pipeline', { remotes: [{}] })
    const thenFunc = jest.fn()
    const catchFunc = jest.fn()

    pipeline.addStage(new GenericChild())
    pipeline.addStage(new GenericChild())
    pipeline.addStage(new GenericChild())

    pipeline.status = 'running'
    await pipeline
      .run()
      .then(thenFunc)
      .catch(catchFunc)

    expect(thenFunc.mock.calls.length).toBe(0)
    expect(catchFunc.mock.calls.length).toBe(1)
    expect(catchFunc.mock.calls[0][0]).toEqual(new Error('Pipeline bussy'))
  })

  it('passes the context object with child index added', async () => {
    const pipeline = new Pipeline('Pipeline', {})
    const thenFunc = jest.fn()
    const child = new GenericChild()

    pipeline.addChild(child)

    await pipeline.run({ attribute: 'value' }).then(thenFunc)

    expect(thenFunc.mock.calls.length).toBe(1)
    expect(thenFunc.mock.calls[0][0]).toMatchObject(['Generic success'])
    expect(child.context).toMatchObject({
      archive: { dictionary: {}, history: [] },
      childIndex: 1,
      remotes: [],
      verbosityLevel: 'partial'
    })
  })
})
