import Connection from '../src/Connection'
import { Client } from 'ssh2'

describe('Connection#connect', () => {
  it('Connects and emmit the ready event if successfull', async () => {
    const connection = new Connection()
    const readyFunc = jest.fn()

    connection.on('ready').then(readyFunc)

    await connection.connect()

    expect(readyFunc.mock.calls.length).toBe(1)
  })

  it('Connects and emmit the error event if unsuccesfull', async () => {
    const connection = new Connection()
    const readyFunc = jest.fn()
    const errorFunc = jest.fn()

    connection.on('ready').then(readyFunc)
    connection.on('error').then(errorFunc)

    Client.__mockConnectionError = true
    await connection.connect()

    expect(readyFunc.mock.calls.length).toBe(0)
    expect(errorFunc.mock.calls.length).toBe(1)
    expect(errorFunc.mock.calls[0][0]).toEqual({ error: 'Connection error' })
  })
})

describe('Connection#close', () => {
  it('Closes the connection and emmit the end event and then close event', async () => {
    const connection = new Connection()
    const endFunc = jest.fn()
    const closeFunc = jest.fn()

    connection.on('end').then(() => {
      expect(closeFunc.mock.calls.length).toBe(0)
      endFunc()
    })
    connection.on('close').then(closeFunc)

    await connection.connect()
    await connection.close()

    expect(endFunc.mock.calls.length).toBe(1)
    expect(closeFunc.mock.calls.length).toBe(1)
  })
})

describe('Connection#exec', () => {
  it('executes a remote comand and then returns its stdio', async () => {
    const connection = new Connection()
    await connection.connect()

    await connection.exec('test command').then(result => {
      expect(result.stdout).toBe('stdout')
      expect(result.stderr).toBe('stderr')
      expect(result.code).toBe('code')
      expect(result.signal).toBe('signal')
    })
  })

  it('streams stdout and stderr before closing', async () => {
    const connection = new Connection()
    const streamFunc = jest.fn()
    await connection.connect()

    await connection.exec('test command', streamFunc).then(result => {
      expect(result.stdout).toBe('stdout')
      expect(result.stderr).toBe('stderr')
      expect(result.code).toBe('code')
      expect(result.signal).toBe('signal')
    })

    expect(streamFunc.mock.calls.length).toBe(2)
    expect(streamFunc.mock.calls[0][0]).toBe('stdout')
    expect(streamFunc.mock.calls[1]).toEqual([undefined, 'stderr'])
  })

  it('catches command error and return it', async () => {
    const connection = new Connection()
    await connection.connect()

    Client.__mockExecError = true
    await connection.exec('test command').catch(result => {
      expect(result).toEqual({ error: 'Exec error' })
    })
  })
})
