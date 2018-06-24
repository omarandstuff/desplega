import Stream from './stream'
const child_process = jest.genMockFromModule('child_process')
let lastStdoutStream, lastStderrStream, lastCallback

child_process.__mockExecError = false

child_process.exec = (command, _, callback) => {
  lastStdoutStream = new Stream()
  lastStderrStream = new Stream(false)
  lastCallback = callback

  setTimeout(() => {
    if (!child_process.__mockExecError) {
      lastStdoutStream.__data()
      lastCallback(undefined, 'stdout', undefined)
    } else {
      lastStderrStream.__data()
      child_process.__mockExecError = false
      lastCallback({ error: 'Exec error' }, undefined, 'stderr')
    }
  }, 10)

  return { stdout: lastStdoutStream, stderr: lastStderrStream }
}

module.exports = child_process
