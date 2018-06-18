import EventEmitter from 'events'
import Remote from './Remote'

export default class RemoteManager extends EventEmitter {
  constructor(config, id, options) {
    super()
    this.remote = new Remote(config, id)
    this.status = 'free'
    this.options = { maxRetries: 0, reconnectionInterval: 5000, timeOut: 0, ...options }
    this.runs = []

    this.remote.on('ready', this._onRemoteReady.bind(this))
    this.remote.on('error', this._onRemoteError.bind(this))
    this.remote.on('close', this._onRemoteClose.bind(this))
  }

  close() {
    this.remote.close()
  }

  connect() {
    this.remote.connect()
  }

  exec(command, streamCallBack, options = {}) {
    return new Promise((resolve, reject) => {
      if (this.status === 'free') {
        this.status = 'resolving'
        this.currentRun = {
          attempts: 0,
          command: command,
          connectionErrors: [],
          options: { ...this.options, ...options },
          reconnectionAttempts: 0,
          results: { 1: [] },
          streamCallBack: streamCallBack
        }

        this.resolve = resolve
        this.reject = reject

        if (this.remote.status === 'ready') {
          this._run()
        }
        if (this.remote.status === 'close') {
          this.remote.connect()
        }
      } else {
        reject({ error: 'Manager is resolving' })
      }
    })
  }

  _onRemoteClose() {
    if (this.status === 'resolving_time_out') {
      this._resolveTimeOut()
    } else if (this.currentRun) {
      this.status = 'resolving_remote'
      this._resolveConnection()
    } else {
      this.status = 'free'
    }
  }

  _onRemoteError(error) {
    this.currentRun.connectionErrors.push({ attempts: this.currentRun.attempts, error })
  }

  _onRemoteReady() {
    if (this.currentRun) {
      this.status = 'resolving'
      this._run()
    }
  }

  _run() {
    this.currentRun.attempts++

    if (this.currentRun.options.timeOut) {
      this.timeOutInterval = setTimeout(() => {
        this.status = 'resolving_time_out'

        this.remote.close()

        this.emit('timeout', this.currentRun)
      }, this.currentRun.options.timeOut)
    }

    this.remote
      .exec(this.currentRun.command, this.currentRun.streamCallBack)
      .then(result => {
        clearTimeout(this.timeOutInterval)
        const runData = this.currentRun
        this.status = 'free'
        this.currentRun.results[this.currentRun.reconnectionAttempts + 1].push(result)
        this.runs.push(this.currentRun)
        this.currentRun = undefined

        this.resolve(runData)
      })
      .catch(error => {
        clearTimeout(this.timeOutInterval)
        if (this.status === 'resolving') {
          this._resolveError(error)
        }
      })
  }

  async _resolveConnection() {
    if (this.currentRun.options.maxReconnectionRetries > this.currentRun.reconnectionAttempts) {
      this.currentRun.reconnectionAttempts++
      this.currentRun.attempts = 0

      this.emit('reconnection', this.currentRun)

      await setTimeout(() => {
        this.currentRun.results[this.currentRun.reconnectionAttempts + 1] = []

        this.remote.connect()
      }, this.currentRun.options.reconnectionInterval)
    } else {
      const runData = this.currentRun
      this.runs.push(this.currentRun)
      this.currentRun = undefined
      this.status = 'free'

      this.reject(runData)
    }
  }

  _resolveError(error) {
    this.currentRun.results[this.currentRun.reconnectionAttempts + 1].push(error)

    if (this.currentRun.options.maxRetries >= this.currentRun.attempts) {
      this._run()
      this.emit('retry')
    } else {
      const runData = this.currentRun
      this.status = 'free'
      this.runs.push(this.currentRun)
      this.currentRun = undefined

      this.reject(runData)
    }
  }

  _resolveTimeOut() {
    this.currentRun.results[this.currentRun.reconnectionAttempts + 1].push({ error: 'Execution time out' })

    if (this.currentRun.options.maxRetries >= this.currentRun.attempts) {
      this.connect()
      this.emit('retry', this.currentRun)
    } else {
      const runData = this.currentRun
      this.status = 'free'
      this.runs.push(this.currentRun)
      this.currentRun = undefined

      this.reject(runData)
    }
  }
}
