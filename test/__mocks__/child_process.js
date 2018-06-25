import Stream from './stream'
const child_process = jest.genMockFromModule('child_process')
let lastStdoutStream, lastStderrStream, lastCallback

child_process.__mockExecError = 0
child_process.__mockExecTimeOut = 0

child_process.exec = (command, _, callback) => {
  lastStdoutStream = new Stream()
  lastStderrStream = new Stream(false)
  lastCallback = callback

  setTimeout(() => {
    if (child_process.__mockExecError) {
      child_process.__mockExecError = Number(child_process.__mockExecError) - 1
      lastStderrStream.__data()
      lastCallback({ code: 127, signal: null }, undefined, 'stderr')
    } else if (child_process.__mockExecTimeOut) {
      child_process.__mockExecTimeOut = Number(child_process.__mockExecTimeOut) - 1
      lastStderrStream.__data()
      lastCallback({ code: null, signal: 'SIGTERM' }, undefined, '')
    } else {
      lastStdoutStream.__data()
      lastCallback(undefined, 'stdout', undefined)
    }
  }, 10)

  return { stdout: lastStdoutStream, stderr: lastStderrStream }
}

module.exports = child_process
