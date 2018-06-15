import EventEmitter from 'events'

export default class Stream extends EventEmitter {
  constructor(withStderr = true) {
    super()

    if (withStderr) {
      this.stderr = new Stream(false)
    }
  }

  __close() {
    this.emit('close', 'code', 'signal')
  }

  __data() {
    if (this.stderr) {
      this.emit('data', Buffer.from('stdout', 'utf8'))
    } else {
      this.emit('data', Buffer.from('stderr', 'utf8'))
    }
  }
}
