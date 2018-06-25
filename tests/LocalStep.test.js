jest.mock('child_process')
import LocalStep from '../src/LocalStep'
import LocalManager from '../src/LocalManager'
import Theme from '../src/Theme'
import child_process from 'child_process'

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

afterEach(() => {
  child_process.__mockExecError = 0
  child_process.__mockExecTimeOut = 0
})

describe('LocalStep#run', () => {
  it('Executes a local command and return its result', async () => {
    const localManager = new LocalManager({})
    const localStep = new LocalStep({ title: 'title', command: 'command', verbosityLevel: 'full' })
    const thenFunc = jest.fn()

    await localStep.run({ local: localManager, childIndex: 5, theme: new Theme() }).then(thenFunc)

    expect(thenFunc.mock.calls.length).toBe(1)
    expect(thenFunc.mock.calls[0][0]).toMatchObject({
      result: {
        attempts: 1,
        command: 'command',
        options: { maxRetries: 0, timeOut: 0 },
        results: [{ code: 0, signal: null, stdout: 'stdout' }]
      },
      status: 'done'
    })
  })

  it('tansforms the path as a change dir command', async () => {
    const localManager = new LocalManager({})
    const localStep = new LocalStep({
      title: 'title',
      command: 'command',
      path: 'some/path',
      verbosityLevel: 'partial'
    })
    const thenFunc = jest.fn()

    await localStep.run({ local: localManager, childIndex: 5, theme: new Theme() }).then(thenFunc)

    expect(thenFunc.mock.calls.length).toBe(1)
    expect(thenFunc.mock.calls[0][0]).toMatchObject({
      result: {
        attempts: 1,
        command: 'cd some/path && command',
        options: { maxRetries: 0, timeOut: 0 },
        results: [{ code: 0, signal: null, stdout: 'stdout' }]
      },
      status: 'done'
    })
  })

  it('allows to generate a dynamic command', async () => {
    const localManager = new LocalManager({})
    const command = context => 'dynamic command'
    const localStep = new LocalStep({ title: 'title', command: command, verbosityLevel: 'full' })
    const thenFunc = jest.fn()

    await localStep.run({ local: localManager, theme: new Theme() }).then(thenFunc)

    expect(thenFunc.mock.calls.length).toBe(1)
    expect(thenFunc.mock.calls[0][0]).toMatchObject({
      result: {
        attempts: 1,
        command: 'dynamic command',
        options: { maxRetries: 0, timeOut: 0 },
        results: [{ code: 0, signal: null, stdout: 'stdout' }]
      },
      status: 'done'
    })
  })

  it('rejects if is already running', async () => {
    const localManager = new LocalManager({})
    const localStep = new LocalStep({ title: 'title', command: 'command', verbosityLevel: 'full' })
    const thenFunc = jest.fn()
    const catchFunc = jest.fn()

    localStep.status = 'running'
    await localStep
      .run({ local: localManager, childIndex: 5, theme: new Theme() })
      .then(thenFunc)
      .catch(catchFunc)

    expect(thenFunc.mock.calls.length).toBe(0)
    expect(catchFunc.mock.calls.length).toBe(1)
    expect(catchFunc.mock.calls[0][0]).toBeInstanceOf(Error)
  })

  describe('when continueOnFailure is not set', () => {
    it('rejects when the internal remote fails', async () => {
      const localManager = new LocalManager({})
      const localStep = new LocalStep({ title: 'title', command: 'command' })
      const thenFunc = jest.fn()
      const catchFunc = jest.fn()

      child_process.__mockExecError = true
      await localStep
        .run({ local: localManager, childIndex: 5, theme: new Theme() })
        .then(thenFunc)
        .catch(catchFunc)

      expect(thenFunc.mock.calls.length).toBe(0)
      expect(catchFunc.mock.calls.length).toBe(1)
      expect(catchFunc.mock.calls[0][0]).toMatchObject({
        result: {
          attempts: 1,
          command: 'command',
          options: { maxRetries: 0, timeOut: 0 },
          results: [{ code: 127, signal: null, stderr: 'stderr' }]
        },
        status: 'fail'
      })
    })

    it('rejects and run the onfailure block if set', async () => {
      const localManager = new LocalManager({})
      const onFailureStep = new LocalStep({ title: 'on failure', command: 'command' })
      const localStep = new LocalStep({ title: 'title', command: 'command', onFailure: onFailureStep })
      const thenFunc = jest.fn()
      const catchFunc = jest.fn()

      child_process.__mockExecError = true
      await localStep
        .run({ local: localManager, childIndex: 5, theme: new Theme() })
        .then(thenFunc)
        .catch(catchFunc)

      expect(thenFunc.mock.calls.length).toBe(0)
      expect(catchFunc.mock.calls.length).toBe(1)
      expect(catchFunc.mock.calls[0][0]).toMatchObject({
        mainResult: {
          result: {
            attempts: 1,
            command: 'command',
            options: { maxRetries: 0, timeOut: 0 },
            results: [{ code: 127, signal: null, stderr: 'stderr' }]
          },
          status: 'fail'
        },
        onFailureResult: {
          result: {
            attempts: 1,
            command: 'command',
            options: { maxRetries: 0, timeOut: 0 },
            results: [{ code: 0, signal: null, stdout: 'stdout' }]
          },
          status: 'done'
        }
      })
    })

    it('resolves on failure if set recoverOnFailure and the secundary block succeed', async () => {
      const localManager = new LocalManager({})
      const onFailureStep = new LocalStep({ title: 'on failure', command: 'command' })
      const localStep = new LocalStep({
        title: 'title',
        command: 'command',
        onFailure: onFailureStep,
        recoverOnFailure: true
      })
      const thenFunc = jest.fn()

      child_process.__mockExecError = true
      await localStep.run({ local: localManager, childIndex: 5, theme: new Theme() }).then(thenFunc)

      expect(thenFunc.mock.calls.length).toBe(1)
      expect(thenFunc.mock.calls[0][0]).toMatchObject({
        mainResult: {
          result: {
            attempts: 1,
            command: 'command',
            options: { maxRetries: 0, timeOut: 0 },
            results: [{ code: 127, signal: null, stderr: 'stderr' }]
          },
          status: 'fail'
        },
        onFailureResult: {
          result: {
            attempts: 1,
            command: 'command',
            options: { maxRetries: 0, timeOut: 0 },
            results: [{ code: 0, signal: null, stdout: 'stdout' }]
          },
          status: 'done'
        }
      })
    })

    it('rejects on failure if onFailure fails even if recoverOnFailure is set', async () => {
      const localManager = new LocalManager({})
      const onFailureStep = new LocalStep({ title: 'on failure', command: 'command' })
      const localStep = new LocalStep({
        title: 'title',
        command: 'command',
        onFailure: onFailureStep,
        recoverOnFailure: true
      })
      const thenFunc = jest.fn()
      const catchFunc = jest.fn()

      child_process.__mockExecError = 2
      await localStep
        .run({ local: localManager, childIndex: 5, theme: new Theme() })
        .then(thenFunc)
        .catch(catchFunc)

      expect(thenFunc.mock.calls.length).toBe(0)
      expect(catchFunc.mock.calls.length).toBe(1)
      expect(catchFunc.mock.calls[0][0]).toMatchObject({
        mainResult: {
          result: {
            attempts: 1,
            command: 'command',
            options: { maxRetries: 0, timeOut: 0 },
            results: [{ code: 127, signal: null, stderr: 'stderr' }]
          },
          status: 'fail'
        },
        onFailureResult: {
          result: {
            attempts: 1,
            command: 'command',
            options: { maxRetries: 0, timeOut: 0 },
            results: [{ code: 127, signal: null, stderr: 'stderr' }]
          },
          status: 'fail'
        }
      })
    })
  })

  describe('when continueOnFailure is not set', () => {
    it('resolves on failure', async () => {
      const localManager = new LocalManager({})
      const localStep = new LocalStep({ title: 'title', command: 'command', continueOnFailure: true })
      const thenFunc = jest.fn()

      child_process.__mockExecError = true
      await localStep.run({ local: localManager, childIndex: 5, theme: new Theme() }).then(thenFunc)

      expect(thenFunc.mock.calls.length).toBe(1)
      expect(thenFunc.mock.calls[0][0]).toMatchObject({
        result: {
          attempts: 1,
          command: 'command',
          options: { maxRetries: 0, timeOut: 0 },
          results: [{ code: 127, signal: null, stderr: 'stderr' }]
        },
        status: 'fail'
      })
    })

    it('resolves and run the onfailure block if set', async () => {
      const localManager = new LocalManager({})
      const onFailureStep = new LocalStep({ title: 'on failure', command: 'command' })
      const localStep = new LocalStep({
        title: 'title',
        command: 'command',
        onFailure: onFailureStep,
        continueOnFailure: true
      })
      const thenFunc = jest.fn()

      child_process.__mockExecError = true
      await localStep.run({ local: localManager, childIndex: 5, theme: new Theme() }).then(thenFunc)

      expect(thenFunc.mock.calls.length).toBe(1)
      expect(thenFunc.mock.calls[0][0]).toMatchObject({
        mainResult: {
          result: {
            attempts: 1,
            command: 'command',
            options: { maxRetries: 0, timeOut: 0 },
            results: [{ code: 127, signal: null, stderr: 'stderr' }]
          },
          status: 'fail'
        },
        onFailureResult: {
          result: {
            attempts: 1,
            command: 'command',
            options: { maxRetries: 0, timeOut: 0 },
            results: [{ code: 0, signal: null, stdout: 'stdout' }]
          },
          status: 'done'
        }
      })
    })

    it('resolves on failure even if onFailure fails too', async () => {
      const localManager = new LocalManager({})
      const onFailureStep = new LocalStep({ title: 'on failure', command: 'command' })
      const localStep = new LocalStep({
        title: 'title',
        command: 'command',
        onFailure: onFailureStep,
        recoverOnFailure: true,
        continueOnFailure: true
      })
      const thenFunc = jest.fn()

      child_process.__mockExecError = 2
      await localStep.run({ local: localManager, childIndex: 5, theme: new Theme() }).then(thenFunc)

      expect(thenFunc.mock.calls.length).toBe(1)
      expect(thenFunc.mock.calls[0][0]).toMatchObject({
        mainResult: {
          result: {
            attempts: 1,
            command: 'command',
            options: { maxRetries: 0, timeOut: 0 },
            results: [{ code: 127, signal: null, stderr: 'stderr' }]
          },
          status: 'fail'
        },
        onFailureResult: {
          result: {
            attempts: 1,
            command: 'command',
            options: { maxRetries: 0, timeOut: 0 },
            results: [{ code: 127, signal: null, stderr: 'stderr' }]
          },
          status: 'fail'
        }
      })
    })
  })
})
