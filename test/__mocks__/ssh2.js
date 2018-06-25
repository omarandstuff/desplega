import EventEmitter from 'events'
import Stream from './stream'

export class Client extends EventEmitter {
  static __mockConnectionError = 0
  static __mockExecError = 0
  static __mockExecErrorCode = 0
  static __mockExecTimeOut = 0
  static __mockConnectionInterruption = 0

  constructor() {
    super()
  }

  connect(config) {
    this.config = config

    if (!Client.__mockConnectionError) {
      this.emit('ready')
    } else {
      Client.__mockConnectionError--
      this.emit('error', { error: 'Connection error' })
    }
  }

  end() {
    this.emit('end')
    this.emit('close')
  }

  exec(command, callback) {
    const withErrorCode = Client.__mockExecErrorCode !== 0
    const withExecError = Client.__mockExecError !== 0
    const withTimeOut = Client.__mockExecTimeOut !== 0
    const withInterruption =
      Client.__mockConnectionInterruption !== 0 &&
      Client.__mockExecErrorCode + Client.__mockExecError + Client.__mockExecTimeOut < 2

    if (Client.__mockConnectionInterruption !== 0) {
      if (!Client.__saveForInteruption) {
        Client.__interruptionExecErrorCodes = Client.__mockExecErrorCode
        Client.__interruptionExecErrors = Client.__mockExecError
        Client.__interruptionExecTimeOuts = Client.__mockExecTimeOut
        Client.__saveForInteruption = true
      }
    }

    if (withInterruption) {
      Client.__mockExecErrorCode = Client.__interruptionExecErrorCodes
      Client.__mockExecError = Client.__interruptionExecErrors
      Client.__mockExecTimeOut = Client.__interruptionExecTimeOuts
      Client.__mockConnectionInterruption = Number(Client.__mockConnectionInterruption) - 1

      if (Client.__mockConnectionInterruption === 0) {
        Client.__saveForInteruption = false
      }

      this.emit('error', { error: 'Comunication interrupted' })
      this.emit('end')
      this.emit('close')

      callback({ error: 'Comunication interrupted' })
    } else {
      const stream = new Stream(true, withErrorCode)

      if (withErrorCode) {
        Client.__mockExecErrorCode = Number(Client.__mockExecErrorCode) - 1
      }

      if (!withErrorCode && withExecError) {
        Client.__mockExecError = Number(Client.__mockExecError) - 1
        callback({ error: 'Exec error' }, stream)
      } else {
        callback(undefined, stream)
      }

      stream.__data()
      stream.stderr.__data()
      if (!withErrorCode && !withExecError && withTimeOut) {
        Client.__mockExecTimeOut = Number(Client.__mockExecTimeOut) - 1
      } else {
        stream.__close()
      }
    }
  }
}
