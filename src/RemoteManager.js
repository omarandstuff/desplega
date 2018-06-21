import Remote from './Remote'

/**
 * Manage a remote object to retry command failures and reconnects.
 *
 * When the command succeed or all retries and reconnections fails it will resolve
 * or reject respectively.
 *
 * It also share an status and feddback value to watch the current status.
 *
 * @param {Object} config a configuration object.
 * Configurations are: (See remote configurations)
 *
 * @param {String} [id] a unique id hanlded by your application.
 * This can be used to identify remotes withing a pool of them.
 *
 * @param {Object} [options] default options for the exec method
 * Options are:
 * maxRetries: Number of times the exec method should be rerun on fail.
 * maxReconnectionRetries: Number of times it will retry to connect on connection lost.
 * reconnectionInterval: Time to wait before calling the connect method again.
 * timeOut: Exec time before terminating the connection and count it as a failure.
 *
 */
export default class RemoteManager {
  constructor(config, id, options) {
    this.remote = new Remote(config, id)
    this.id = id
    this.status = 'free'
    this.feedback = 'idle'
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

  /**
   * Start resolving the remote.
   *
   * It will call the remote exec method if fails and waith for reconnections
   *
   *
   * @param {String} command the actual command string to be executed
   *
   * @param {Function} streamCallBack stream call back to pass to the remote object.
   *
   * @returns {Promise} Promise to be solved or rejected.
   * when solving or rejecting will pass the current run information
   * current run data is:
   * attempts: how many attempts the last connection run before finishing
   * command: command executed
   * connectionErrors: How many connection errors were there
   * options: final options used to run the command
   * reconnectionAttempts: How many reconnections attemps were there
   * results: results for every connection attempt
   * streamCallBack: function called when streaming
   *
   */
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
          this.feedback = 'running'
          this._run()
        }
        if (this.remote.status === 'close') {
          this.feedback = 'connecting'
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
    if (this.currentRun) {
      this.currentRun.connectionErrors.push({ attempts: this.currentRun.attempts, error })
    }
  }

  _onRemoteReady() {
    if (this.currentRun) {
      this.status = 'resolving'
      this.feedback = 'running'
      this._run()
    }
  }

  _run() {
    this.currentRun.attempts++

    if (this.currentRun.options.timeOut) {
      this.timeOutInterval = setTimeout(() => {
        this.status = 'resolving_time_out'
        this.feedback = 'timeout'

        this.remote.close()
      }, this.currentRun.options.timeOut)
    }

    this.remote
      .exec(this.currentRun.command, this.currentRun.streamCallBack)
      .then(result => {
        clearTimeout(this.timeOutInterval)
        const runData = this.currentRun
        this.currentRun.results[this.currentRun.reconnectionAttempts + 1].push(result)
        this.runs.push(this.currentRun)
        this.currentRun = undefined
        this.status = 'free'
        this.feedback = 'idle'

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

      this.feedback = 'waiting'

      await setTimeout(() => {
        this.currentRun.results[this.currentRun.reconnectionAttempts + 1] = []
        this.feedback = 'connecting'

        this.remote.connect()
      }, this.currentRun.options.reconnectionInterval)
    } else {
      const runData = this.currentRun
      this.runs.push(this.currentRun)
      this.currentRun = undefined
      this.status = 'free'
      this.feedback = 'idle'

      this.reject(runData)
    }
  }

  _resolveError(error) {
    this.currentRun.results[this.currentRun.reconnectionAttempts + 1].push(error)

    if (this.currentRun.options.maxRetries >= this.currentRun.attempts) {
      this.feedback = 'running'
      this._run()
    } else {
      const runData = this.currentRun
      this.runs.push(this.currentRun)
      this.currentRun = undefined
      this.status = 'free'
      this.feedback = 'idle'

      this.reject(runData)
    }
  }

  _resolveTimeOut() {
    this.currentRun.results[this.currentRun.reconnectionAttempts + 1].push({ error: 'Execution time out' })

    if (this.currentRun.options.maxRetries >= this.currentRun.attempts) {
      this.connect()
    } else {
      const runData = this.currentRun
      this.runs.push(this.currentRun)
      this.currentRun = undefined
      this.status = 'free'
      this.feedback = 'idle'

      this.reject(runData)
    }
  }
}
