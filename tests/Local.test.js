jest.mock('child_process')
import Local from '../src/Local'
import child_process from 'child_process'

describe('Local#exec', () => {
  it('executes a local comand and then returns its stdio', async () => {
    const local = new Local()

    await local.exec('test command').then(result => {
      expect(result.stdout).toBe('stdout')
      expect(result.stderr).toBe('stderr')
    })
  })

  it('streams stdout and stderr before closing', async () => {
    const local = new Local()
    const streamFunc = jest.fn()

    await local.exec('test command', streamFunc).then(result => {
      expect(result.stdout).toBe('stdout')
      expect(result.stderr).toBe('stderr')
    })

    expect(streamFunc.mock.calls.length).toBe(2)
    expect(streamFunc.mock.calls[0][0]).toBe('stdout')
    expect(streamFunc.mock.calls[1]).toEqual([undefined, 'stderr'])
  })

  it('catches command error and returns it', async () => {
    const local = new Local()

    child_process.__mockExecError = true
    await local.exec('test command').catch(result => {
      expect(result).toEqual({ error: 'Exec error' })
    })
  })
})
