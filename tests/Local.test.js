jest.mock('child_process')
import Local from '../src/Local'
import child_process from 'child_process'

describe('Local#exec', () => {
  it('executes a local comand and then resolves the result', async () => {
    const local = new Local()
    const thenFunc = jest.fn()

    await local.exec('test command').then(thenFunc)

    expect(thenFunc.mock.calls.length).toBe(1)
    expect(thenFunc.mock.calls[0][0]).toEqual({
      code: 0,
      signal: null,
      stdout: 'stdout'
    })
  })

  it('rejects if command fails', async () => {
    const local = new Local()
    const catchFunc = jest.fn()

    child_process.__mockExecError = true
    await local.exec('test command').catch(catchFunc)

    expect(catchFunc.mock.calls.length).toBe(1)
    expect(catchFunc.mock.calls[0][0]).toEqual({
      code: 127,
      signal: null,
      stderr: 'stderr'
    })
  })

  it('streams stdout and stderr before closing', async () => {
    const local = new Local()
    const thenFunc = jest.fn()
    const catchFunc = jest.fn()
    let streamFunc = jest.fn()

    await local.exec('test command', streamFunc).then(thenFunc)

    expect(streamFunc.mock.calls.length).toBe(1)
    expect(streamFunc.mock.calls[0][0]).toBe('stdout')

    streamFunc = jest.fn()
    child_process.__mockExecError = true
    await local.exec('test command', streamFunc).catch(catchFunc)

    expect(streamFunc.mock.calls.length).toBe(1)
    expect(streamFunc.mock.calls[0][1]).toEqual('stderr')
  })

  it('rejects if command time out is reached', async () => {
    const local = new Local()
    const catchFunc = jest.fn()

    child_process.__mockExecTimeOut = true
    await local.exec('test command').catch(catchFunc)

    expect(catchFunc.mock.calls.length).toBe(1)
    expect(catchFunc.mock.calls[0][0]).toEqual({
      code: null,
      signal: 'SIGTERM',
      stderr: ''
    })
  })
})
