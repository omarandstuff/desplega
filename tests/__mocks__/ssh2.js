import EventEmitter from 'events'
import Stream from './stream'

export class Client extends EventEmitter {
  static __mockConnectionError = false
  static __mockExecError = false

  constructor() {
    super()
  }

  connect(config) {
    this.config = config

    if (!Client.__mockConnectionError) {
      this.emit('ready')
    } else {
      Client.__mockConnectionError = false
      this.emit('error', { error: 'Connection error' })
    }
  }

  end() {
    this.emit('end')
    this.emit('close')
  }

  exec(command, callback) {
    const stream = new Stream()
    if (!Client.__mockExecError) {
      callback(undefined, stream)
    } else {
      Client.__mockExecError = false
      callback({ error: 'Exec error' }, stream)
    }

    stream.__data()
    stream.stderr.__data()
    stream.__close()
  }
}
