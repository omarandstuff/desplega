import Runner from '../src/Runner'
import DummyRunner from './__dummies__/DummyRunner'
import GenericChild from './__dummies__/GenericChild'

describe('Remote#run', () => {
  it('Executes a series of child object that responds to "run" method', async () => {
    const runner = new DummyRunner()
    const thenFunc = jest.fn()

    runner.addChild(new GenericChild())
    runner.addChild(new GenericChild())
    runner.addChild(new GenericChild())

    await runner.run().then(thenFunc)

    expect(thenFunc.mock.calls.length).toBe(1)
    expect(thenFunc.mock.calls[0][0]).toMatchObject(['Generic success', 'Generic success', 'Generic success'])
    expect(runner).toMatchObject({
      __printedHeader: 'Header',
      __printedResults: 'Results',
      currentIndex: 3
    })
  })

  it('rejects ths runner', async () => {
    const runner = new DummyRunner()
    const thenFunc = jest.fn()
    const catchFunc = jest.fn()

    runner.addChild(new GenericChild())
    runner.addChild(new GenericChild(true))
    runner.addChild(new GenericChild())

    await runner
      .run()
      .then(thenFunc)
      .catch(catchFunc)

    expect(thenFunc.mock.calls.length).toBe(0)
    expect(catchFunc.mock.calls.length).toBe(1)
    expect(catchFunc.mock.calls[0][0]).toMatchObject(['Generic success', 'Generic failure'])
    expect(runner).toMatchObject({
      __printedHeader: 'Header',
      __printedResults: 'Results',
      currentIndex: 2
    })
  })

  it('passes the context object with child index added', async () => {
    const runner = new DummyRunner()
    const thenFunc = jest.fn()
    const child = new GenericChild()

    runner.addChild(child)

    await runner.run({ attribute: 'value' }).then(thenFunc)

    expect(thenFunc.mock.calls.length).toBe(1)
    expect(thenFunc.mock.calls[0][0]).toMatchObject(['Generic success'])
    expect(child.context).toMatchObject({ attribute: 'value', childIndex: 1 })
  })

  it('throw errors if run function is not implemented', async () => {
    const runner = new Runner()
    expect(() => runner.run()).toThrow()
    expect(() => runner._onChildFailure()).toThrow()
    expect(() => runner._onChildSuccess()).toThrow()
    expect(() => runner._onSuccess()).toThrow()
    expect(() => runner._printHeader()).toThrow()
    expect(() => runner._printResult()).toThrow()
  })
})
