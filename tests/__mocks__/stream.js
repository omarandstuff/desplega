export default class Stream {
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
