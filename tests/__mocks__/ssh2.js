class Stream {
  constructor(withStderr = true) {
    this.subscribers = { close: [], data: [] }
    if (withStderr) {
      this.stderr = new Stream(false)
    }
  }

  on(event, callback) {
    this.subscribers[event].push(callback)
  }

  __close() {
    Object.values(this.subscribers.close).forEach(subscriber => {
      subscriber('code', 'signal')
    })
  }

  __data() {
    Object.values(this.subscribers.data).forEach(subscriber => {
      if (this.stderr) {
        subscriber(Buffer.from('stdout', 'utf8'))
      } else {
        subscriber(Buffer.from('stderr', 'utf8'))
      }
    })
  }
}

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
}
