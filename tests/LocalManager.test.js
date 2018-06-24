jest.mock('child_process')
import LocalManager from '../src/LocalManager'
import child_process from 'child_process'

afterEach(() => {
  child_process.__mockExecError = 0
  child_process.__mockExecTimeOut = 0
})

describe('Remote#exec', () => {
  it('Executes a local command and solves the result (run data)', async () => {
    const localManager = new LocalManager()
    const thenFunc = jest.fn()

    await localManager.exec('command').then(thenFunc)

    expect(thenFunc.mock.calls.length).toBe(1)
    expect(thenFunc.mock.calls[0][0]).toEqual({
      attempts: 1,
      command: 'command',
      options: { maxRetries: 0, timeOut: 0 },
      results: [{ code: 0, signal: null, stdout: 'stdout' }],
      streamCallBack: undefined
    })
  })

  it('streams stdout and stderr before finishing', async () => {
    const localManager = new LocalManager()
    const thenFunc = jest.fn()
    const catchFunc = jest.fn()
    let streamFunc = jest.fn()

    await localManager.exec('test command', streamFunc).then(thenFunc)

    expect(streamFunc.mock.calls.length).toBe(1)
    expect(streamFunc.mock.calls[0][0]).toBe('stdout')

    streamFunc = jest.fn()
    child_process.__mockExecError = true
    await localManager.exec('test command', streamFunc).catch(catchFunc)

    expect(streamFunc.mock.calls.length).toBe(1)
    expect(streamFunc.mock.calls[0][1]).toEqual('stderr')
  })

  it('rejects the run if is already solving', async () => {
    const localManager = new LocalManager()
    const catchFunc = jest.fn()

    localManager.status = 'resolving'

    await localManager.exec('command').catch(catchFunc)

    expect(catchFunc.mock.calls.length).toBe(1)
    expect(catchFunc.mock.calls[0][0]).toEqual(new Error('Manager is bussy'))
  })

  it('rejects the execution if unsuccessful', async () => {
    const localManager = new LocalManager()
    const catchFunc = jest.fn()

    child_process.__mockExecError = true
    await localManager.exec('command').catch(catchFunc)

    expect(catchFunc.mock.calls.length).toBe(1)
    expect(catchFunc.mock.calls[0][0]).toEqual({
      attempts: 1,
      command: 'command',
      options: { maxRetries: 0, timeOut: 0 },
      results: [{ code: 127, signal: null, stderr: 'stderr' }],
      streamCallBack: undefined
    })
  })

  it('rejects the execution if the time out configuration inteval is reached', async () => {
    const localManager = new LocalManager({ timeOut: 2 })
    const catchFunc = jest.fn()

    child_process.__mockExecTimeOut = true
    await localManager.exec('command', undefined, { timeOut: 1 }).catch(catchFunc)

    expect(catchFunc.mock.calls.length).toBe(1)
    expect(catchFunc.mock.calls[0][0]).toEqual({
      attempts: 1,
      command: 'command',
      options: { maxRetries: 0, timeOut: 1 },
      results: [{ code: null, signal: 'SIGTERM', stderr: '' }],
      streamCallBack: undefined
    })
  })

  describe('when the maxRetries option is set and the exec is rejected', () => {
    it('retries the same command the specified ammount', async () => {
      const localManager = new LocalManager()
      const catchFunc = jest.fn()

      child_process.__mockExecError = 2
      child_process.__mockExecTimeOut = 2
      await localManager.exec('command', undefined, { timeOut: 1, maxRetries: 3 }).catch(catchFunc)

      expect(catchFunc.mock.calls.length).toBe(1)
      expect(catchFunc.mock.calls[0][0]).toEqual({
        attempts: 4,
        command: 'command',
        options: { maxRetries: 3, timeOut: 1 },
        results: [
          { code: 127, signal: null, stderr: 'stderr' },
          { code: 127, signal: null, stderr: 'stderr' },
          { code: null, signal: 'SIGTERM', stderr: '' },
          { code: null, signal: 'SIGTERM', stderr: '' }
        ],
        streamCallBack: undefined
      })
    })

    it('resolve if the exec command if it is successfull before spending all tries', async () => {
      const localManager = new LocalManager()
      const catchFunc = jest.fn()
      const thenFunc = jest.fn()

      child_process.__mockExecError = 2
      child_process.__mockExecTimeOut = 2
      await localManager
        .exec('command', undefined, { timeOut: 1, maxRetries: 4 })
        .then(thenFunc)
        .catch(catchFunc)

      expect(catchFunc.mock.calls.length).toBe(0)
      expect(thenFunc.mock.calls.length).toBe(1)
      expect(thenFunc.mock.calls[0][0]).toEqual({
        attempts: 5,
        command: 'command',
        options: { maxRetries: 4, timeOut: 1 },
        results: [
          { code: 127, signal: null, stderr: 'stderr' },
          { code: 127, signal: null, stderr: 'stderr' },
          { code: null, signal: 'SIGTERM', stderr: '' },
          { code: null, signal: 'SIGTERM', stderr: '' },
          { code: 0, signal: null, stdout: 'stdout' }
        ],
        streamCallBack: undefined
      })
    })
  })
})
