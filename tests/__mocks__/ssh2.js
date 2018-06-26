import EventEmitter from 'events'
import Stream from './stream'

const mocking = {
  __mockConnectionError: 0,
  __mockExecError: 0,
  __mockExecErrorCode: 0,
  __mockExecTimeOut: 0,
  __mockConnectionInterruption: 0
}

export default mocking

export class Client extends EventEmitter {
  constructor() {
    super()
  }

  connect(config) {
    this.config = config

    if (!mocking.__mockConnectionError) {
      this.emit('ready')
    } else {
      mocking.__mockConnectionError--
      this.emit('error', { error: 'Connection error' })
    }
  }

  end() {
    this.emit('end')
    this.emit('close')
  }

  exec(command, callback) {
    const withErrorCode = mocking.__mockExecErrorCode !== 0
    const withExecError = mocking.__mockExecError !== 0
    const withTimeOut = mocking.__mockExecTimeOut !== 0
    const withInterruption =
      mocking.__mockConnectionInterruption !== 0 &&
      mocking.__mockExecErrorCode + mocking.__mockExecError + mocking.__mockExecTimeOut < 2

    if (mocking.__mockConnectionInterruption !== 0) {
      if (!mocking.__saveForInteruption) {
        mocking.__interruptionExecErrorCodes = mocking.__mockExecErrorCode
        mocking.__interruptionExecErrors = mocking.__mockExecError
        mocking.__interruptionExecTimeOuts = mocking.__mockExecTimeOut
        mocking.__saveForInteruption = true
      }
    }

    if (withInterruption) {
      mocking.__mockExecErrorCode = mocking.__interruptionExecErrorCodes
      mocking.__mockExecError = mocking.__interruptionExecErrors
      mocking.__mockExecTimeOut = mocking.__interruptionExecTimeOuts
      mocking.__mockConnectionInterruption = Number(mocking.__mockConnectionInterruption) - 1

      if (mocking.__mockConnectionInterruption === 0) {
        mocking.__saveForInteruption = false
      }

      this.emit('error', { error: 'Comunication interrupted' })
      this.emit('end')
      this.emit('close')

      callback({ error: 'Comunication interrupted' })
    } else {
      const stream = new Stream(true, withErrorCode)

      if (withErrorCode) {
        mocking.__mockExecErrorCode = Number(mocking.__mockExecErrorCode) - 1
      }

      if (!withErrorCode && withExecError) {
        mocking.__mockExecError = Number(mocking.__mockExecError) - 1
        callback({ error: 'Exec error' }, stream)
      } else {
        callback(undefined, stream)
      }

      stream.__data()
      stream.stderr.__data()
      if (!withErrorCode && !withExecError && withTimeOut) {
        mocking.__mockExecTimeOut = Number(mocking.__mockExecTimeOut) - 1
      } else {
        stream.__close()
      }
    }
  }
}
