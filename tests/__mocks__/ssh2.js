import Stream from './stream'

export class Client {
  static __mockConnectionError = false
  static __mockExecError = false

  constructor() {
    this.subscribers = { close: [], end: [], error: [], ready: [] }
  }

  connect(config) {
    this.config = config

    if (!Client.__mockConnectionError) {
      Object.values(this.subscribers.ready).forEach(subscriber => {
        subscriber()
      })
    } else {
      Client.__mockConnectionError = false
      Object.values(this.subscribers.error).forEach(subscriber => {
        subscriber({ error: 'Connection error' })
      })
    }
  }

  end() {
    Object.values(this.subscribers.end).forEach(subscriber => {
      subscriber()
    })
    Object.values(this.subscribers.close).forEach(subscriber => {
      subscriber()
    })
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

  on(event, callback) {
    this.subscribers[event].push(callback)
  }

  static cosas() {
    
  }
}
