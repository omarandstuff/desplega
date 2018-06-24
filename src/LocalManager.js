import Local from './Local'

/**
 * Manage a local object to retry command failures.
 *
 * When the command succeed or all retries fails it will resolve
 * or reject respectively.
 *
 * It also share an status and feddback value to watch the current status.
 *
 * @param {Object} [options] default options for the exec method
 * Options are:
 * maxRetries: Number of times the exec method should be rerun on fail.
 * timeOut: Exec time before failing the command.
 *
 */
export default class LocalManager {
  constructor(options) {
    this.local = new Local(options)
    this.status = 'free'
    this.feedback = 'idle'
    this.options = { maxRetries: 0, timeOut: 0, ...options }
    this.runs = []
  }

  /**
   * Start resolving the local command.
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
   * options: final options used to run the command
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
          options: { ...this.options, ...options },
          results: [],
          streamCallBack: streamCallBack
        }

        this.resolve = resolve
        this.reject = reject

        this._run()
      } else {
        reject(new Error('Manager is bussy'))
      }
    })
  }

  _run() {
    this.currentRun.attempts++

    this.local
      .exec(this.currentRun.command, this.currentRun.streamCallBack, { timeOut: this.currentRun.options.timeOut })
      .then(result => {
        const runData = this.currentRun
        this.currentRun.results.push(result)
        this.runs.push(this.currentRun)
        this.currentRun = undefined
        this.status = 'free'
        this.feedback = 'idle'

        this.resolve(runData)
      })
      .catch(error => {
        this._resolveError(error)
      })
  }

  _resolveError(error) {
    this.currentRun.results.push(error)

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
}
