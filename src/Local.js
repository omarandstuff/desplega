import { exec } from 'child_process'

/**
 * Waraper for exec function to exec local commands.
 *
 * @param {Object} options command execution options.
 * Options are:
 * maxBuffer: How much std output to cache before failing the command.
 * timeOut: Exec time before failing the command.
 *
 */
export default class Local {
  constructor(options) {
    const env = { FORCE_COLOR: true, ...process.env }
    this.options = { env: env, maxBuffer: 8388608, ...options }
  }

  /**
   * Execs a local command and sets the status to running.
   *
   * It listens fot stdout and stderr and stream it to the stream callback, when
   * the command finishes it will resolve with the whole stdout and stderr
   * drivered form the call.
   *
   * If the returning code is not 0 or there is a problem with te execution it
   * rejects with the error | stderr.
   *
   * @param {String} command the actual command string to be executed
   * Any command with any params example:
   *   "sudo apt-get update"
   *   "ls -lh ~/apps"
   *
   * @param {Function} streamCallBack A callback to be invoked on data streaming.
   * The same data printed by some command while executing, chunk by chunk
   *
   * @returns {Promise} Promise to be solved or rejected.
   */
  exec(command, streamCallBack, options) {
    return new Promise((resolve, reject) => {
      const child = exec(command, { ...this.options, ...options }, (error, stdout, stderr) => {
        if (error) {
          reject({ code: error.code, signal: error.signal, stderr })
        } else {
          resolve({ code: 0, signal: null, stdout })
        }
      })

      child.stdout.on('data', data => {
        if (streamCallBack) {
          streamCallBack(data.toString('utf8'))
        }
      })

      child.stderr.on('data', data => {
        //console.log(data)
        if (streamCallBack) {
          streamCallBack(undefined, data.toString('utf8'))
        }
      })
    })
  }
}
