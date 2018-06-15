import Stream from './stream'
const child_process = jest.genMockFromModule('child_process')
let lastStdoutStream, lastStderrStream, lastCallback

child_process.__mockExecError = false

child_process.exec = (command, options, callback) => {
  lastStdoutStream = new Stream()
  lastStderrStream = new Stream(false)
  lastCallback = callback

  setTimeout(() => {
    lastStdoutStream.__data()
    lastStderrStream.__data()

    if (!child_process.__mockExecError) {
      lastCallback(undefined, 'stdout', 'stderr')
    } else {
      console.log('yes')
      child_process.__mockExecError = false
      lastCallback({ error: 'Exec error' })
    }
  }, 10)

  return { stdout: lastStdoutStream, stderr: lastStderrStream }
}

module.exports = child_process
