import RemoteManager from '../src/RemoteManager'
import ssh from 'ssh2'

afterEach(() => {
  ssh.__mockExecErrorCode = 0
  ssh.__mockExecError = 0
  ssh.__mockExecTimeOut = 0
  ssh.__mockConnectionInterruption = 0
})

describe('Remote#connect', () => {
  it('Just tsart connecting the internal remote', () => {
    const remoteManager = new RemoteManager()
    const readyFunc = jest.fn()

    remoteManager.remote.on('ready', readyFunc)
    remoteManager.connect()

    expect(readyFunc.mock.calls.length).toBe(1)
    expect(remoteManager.remote.status).toBe('ready')
  })
})

describe('Remote#close', () => {
  it('Just tsart close the internal remote', () => {
    const remoteManager = new RemoteManager()
    const closeFunc = jest.fn()

    remoteManager.remote.on('close', closeFunc)
    remoteManager.connect()
    remoteManager.close()

    expect(closeFunc.mock.calls.length).toBe(1)
    expect(remoteManager.remote.status).toBe('close')
  })
})

describe('Remote#exec', () => {
  it('Executes a remote command and solves the result (run data)', async () => {
    const remoteManager = new RemoteManager()
    const thenFunc = jest.fn()

    remoteManager.connect()
    await remoteManager.exec('command').then(thenFunc)

    expect(thenFunc.mock.calls.length).toBe(1)
    expect(thenFunc.mock.calls[0][0]).toEqual({
      attempts: 1,
      command: 'command',
      connectionErrors: [],
      options: { maxRetries: 0, reconnectionInterval: 5000, timeOut: 0 },
      reconnectionAttempts: 0,
      results: { '1': [{ code: 0, signal: 'signal', stdout: 'stdout' }] },
      streamCallBack: undefined
    })
  })

  it('streams stdout and stderr before closing', async () => {
    const remoteManager = new RemoteManager()
    const streamFunc = jest.fn()

    await remoteManager.exec('command', streamFunc)

    expect(streamFunc.mock.calls.length).toBe(2)
    expect(streamFunc.mock.calls[0][0]).toBe('stdout')
    expect(streamFunc.mock.calls[1]).toEqual([undefined, 'stderr'])
  })

  it('rejects the run if is already solving', async () => {
    const remoteManager = new RemoteManager()
    const catchFunc = jest.fn()

    remoteManager.status = 'resolving'

    await remoteManager.exec('command').catch(catchFunc)

    expect(catchFunc.mock.calls.length).toBe(1)
    expect(catchFunc.mock.calls[0][0]).toEqual({
      error: 'Manager is resolving'
    })
  })

  it('starts the remote connection if is not running', async () => {
    const remoteManager = new RemoteManager()

    expect(remoteManager.remote.status === 'close')
    await remoteManager.exec('command')
    expect(remoteManager.remote.status === 'ready')
  })

  it('rejects the execution if unsuccessful', async () => {
    const remoteManager = new RemoteManager()
    const catchFunc = jest.fn()

    ssh.__mockExecErrorCode = true
    await remoteManager.exec('command').catch(catchFunc)

    expect(catchFunc.mock.calls.length).toBe(1)
    expect(catchFunc.mock.calls[0][0]).toEqual({
      attempts: 1,
      command: 'command',
      connectionErrors: [],
      options: { maxRetries: 0, reconnectionInterval: 5000, timeOut: 0 },
      reconnectionAttempts: 0,
      results: { '1': [{ code: 128, signal: 'signal', stderr: 'stderr' }] },
      streamCallBack: undefined
    })
  })

  it('rejects the execution if the time out configuration inteval is reached', async () => {
    const remoteManager = new RemoteManager()
    const catchFunc = jest.fn()

    ssh.__mockExecTimeOut = true
    await remoteManager.exec('command', undefined, { timeOut: 1 }).catch(catchFunc)

    expect(catchFunc.mock.calls.length).toBe(1)
    expect(catchFunc.mock.calls[0][0]).toEqual({
      attempts: 1,
      command: 'command',
      connectionErrors: [],
      options: { maxRetries: 0, reconnectionInterval: 5000, timeOut: 1 },
      reconnectionAttempts: 0,
      results: { '1': [{ error: 'Execution time out' }] },
      streamCallBack: undefined
    })
  })

  describe('when the maxRetries option is set and the exex is rejected', () => {
    it('retries the same command the specified ammount', async () => {
      const remoteManager = new RemoteManager()
      const catchFunc = jest.fn()

      ssh.__mockExecErrorCode = 2
      ssh.__mockExecTimeOut = 2
      await remoteManager.exec('command', undefined, { timeOut: 1, maxRetries: 3 }).catch(catchFunc)

      expect(catchFunc.mock.calls.length).toBe(1)
      expect(catchFunc.mock.calls[0][0]).toEqual({
        attempts: 4,
        command: 'command',
        connectionErrors: [],
        options: { maxRetries: 3, reconnectionInterval: 5000, timeOut: 1 },
        reconnectionAttempts: 0,
        results: {
          '1': [
            { code: 128, signal: 'signal', stderr: 'stderr' },
            { code: 128, signal: 'signal', stderr: 'stderr' },
            { error: 'Execution time out' },
            { error: 'Execution time out' }
          ]
        },
        streamCallBack: undefined
      })
    })

    it('resolve if the exec command if it is successfull before spending all tries', async () => {
      const remoteManager = new RemoteManager()
      const catchFunc = jest.fn()
      const thenFunc = jest.fn()

      ssh.__mockExecErrorCode = 2
      ssh.__mockExecTimeOut = 2
      await remoteManager
        .exec('command', undefined, { timeOut: 1, maxRetries: 4 })
        .then(thenFunc)
        .catch(catchFunc)

      expect(catchFunc.mock.calls.length).toBe(0)
      expect(thenFunc.mock.calls.length).toBe(1)
      expect(thenFunc.mock.calls[0][0]).toEqual({
        attempts: 5,
        command: 'command',
        connectionErrors: [],
        options: { maxRetries: 4, reconnectionInterval: 5000, timeOut: 1 },
        reconnectionAttempts: 0,
        results: {
          '1': [
            { code: 128, signal: 'signal', stderr: 'stderr' },
            { code: 128, signal: 'signal', stderr: 'stderr' },
            { error: 'Execution time out' },
            { error: 'Execution time out' },
            { code: 0, signal: 'signal', stdout: 'stdout' }
          ]
        },
        streamCallBack: undefined
      })
    })
  })

  describe('when the maxReconnectionRetries option is set and the connection is lost', () => {
    it('retries to reconnect and also apply the retry count for every retried connection', async () => {
      const remoteManager = new RemoteManager()
      const catchFunc = jest.fn()

      ssh.__mockExecErrorCode = 2
      ssh.__mockExecError = 2
      ssh.__mockExecTimeOut = 2
      ssh.__mockConnectionInterruption = 3
      await remoteManager
        .exec('command', undefined, { timeOut: 1, maxRetries: 7, maxReconnectionRetries: 2, reconnectionInterval: 1 })
        .catch(catchFunc)

      expect(catchFunc.mock.calls.length).toBe(1)
      expect(catchFunc.mock.calls[0][0]).toEqual({
        attempts: 6,
        command: 'command',
        connectionErrors: [
          { attempts: 6, error: { error: 'Comunication interrupted' } },
          { attempts: 6, error: { error: 'Comunication interrupted' } },
          { attempts: 6, error: { error: 'Comunication interrupted' } }
        ],
        options: { maxReconnectionRetries: 2, maxRetries: 7, reconnectionInterval: 1, timeOut: 1 },
        reconnectionAttempts: 2,
        results: {
          '1': [
            { code: 128, signal: 'signal', stderr: 'stderr' },
            { code: 128, signal: 'signal', stderr: 'stderr' },
            { error: 'Exec error' },
            { error: 'Exec error' },
            { error: 'Execution time out' }
          ],
          '2': [
            { code: 128, signal: 'signal', stderr: 'stderr' },
            { code: 128, signal: 'signal', stderr: 'stderr' },
            { error: 'Exec error' },
            { error: 'Exec error' },
            { error: 'Execution time out' }
          ],
          '3': [
            { code: 128, signal: 'signal', stderr: 'stderr' },
            { code: 128, signal: 'signal', stderr: 'stderr' },
            { error: 'Exec error' },
            { error: 'Exec error' },
            { error: 'Execution time out' }
          ]
        },
        streamCallBack: undefined
      })
    })

    it('retries to reconnect and resolve the execution', async () => {
      const remoteManager = new RemoteManager()
      const thenFunc = jest.fn()
      const catchFunc = jest.fn()

      ssh.__mockConnectionInterruption = 2
      await remoteManager
        .exec('command', undefined, { maxReconnectionRetries: 3, reconnectionInterval: 1 })
        .then(thenFunc)
        .catch(catchFunc)

      expect(catchFunc.mock.calls.length).toBe(0)
      expect(thenFunc.mock.calls.length).toBe(1)
      expect(thenFunc.mock.calls[0][0]).toEqual({
        attempts: 1,
        command: 'command',
        connectionErrors: [
          { attempts: 1, error: { error: 'Comunication interrupted' } },
          { attempts: 1, error: { error: 'Comunication interrupted' } }
        ],
        options: { maxReconnectionRetries: 3, maxRetries: 0, reconnectionInterval: 1, timeOut: 0 },
        reconnectionAttempts: 2,
        results: { '1': [], '2': [], '3': [{ code: 0, signal: 'signal', stdout: 'stdout' }] },
        streamCallBack: undefined
      })
    })
  })
})
