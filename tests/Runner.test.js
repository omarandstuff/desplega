import Runner from '../src/Runner'

class GenericChild {
  constructor(simulateReject) {
    this.__sumulateReject = simulateReject
  }

  run(context) {
    return new Promise((resolve, reject) => {
      if (this.__sumulateReject) {
        reject(context)
      } else {
        resolve(context)
      }
    })
  }
}

class DummyRunner extends Runner {
  run(context) {
    return new Promise((resolve, reject) => {
      this.context = context
      this.results = []
      this.resolve = resolve
      this.reject = reject

      this._run()
    })
  }

  _onChildFailure(result) {
    this.results.push(result)
    this.reject(this.results)
  }

  _onChildSuccess(result) {
    this.results.push(result)
  }

  _onSuccess() {
    this.resolve(this.results)
  }

  _printHeader() {
    this.__printedHeader = 'Header'
  }

  _printResult() {
    this.__printedResults = 'Results'
  }
}

describe('Remote#run', () => {
  it('Executes a series of child object that responds to "run" method', async () => {
    const runner = new DummyRunner()
    const thenFunc = jest.fn()

    runner.addChild(new GenericChild())
    runner.addChild(new GenericChild())
    runner.addChild(new GenericChild())

    await runner.run().then(thenFunc)

    expect(thenFunc.mock.calls.length).toBe(1)
    expect(thenFunc.mock.calls[0][0]).toMatchObject([{ childIndex: 1 }, { childIndex: 2 }, { childIndex: 3 }])
    expect(runner).toMatchObject({
      __printedHeader: 'Header',
      __printedResults: 'Results',
      currentIndex: 3
    })
  })

  it('Executes a series of child object that responds to "run" method', async () => {
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
    expect(catchFunc.mock.calls[0][0]).toMatchObject([{ childIndex: 1 }, { childIndex: 2 }])
    expect(runner).toMatchObject({
      __printedHeader: 'Header',
      __printedResults: 'Results',
      currentIndex: 2
    })
  })

  it('passes the context object with child index added', async () => {
    const runner = new DummyRunner()
    const thenFunc = jest.fn()

    runner.addChild(new GenericChild())

    await runner.run({ attribute: 'value' }).then(thenFunc)

    expect(thenFunc.mock.calls.length).toBe(1)
    expect(thenFunc.mock.calls[0][0]).toMatchObject([{ attribute: 'value', childIndex: 1 }])
    expect(runner).toMatchObject({
      __printedHeader: 'Header',
      __printedResults: 'Results',
      currentIndex: 1
    })
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
