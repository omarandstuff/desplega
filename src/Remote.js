import EventEmitter from 'events'
import { Client } from 'ssh2'
import fs from 'fs'
import os from 'os'

/**
 * Connects to a remote host and stays connected while sending commands.
 * Will reemit any events related to the connection status like (ready, error,
 * end, close)
 *
 * When the connection finishes or has an error it will end the connection
 * and then close it.
 *
 * @param {Object} config a configuration object.
 * Configurations are:
 * host: IP or domain of the remote host
 * port[22]: port used by the ssh server on the remote host.
 * username[root]: remote host account username
 * privateKeyPath[~/.ssh]: path to the local private key file
 * keepaliveInterval(12000): how much time wait to check for connection status (ms)
 * keepaliveCountMax[5]: how many times check for alive signal before stop connection
 *
 * @param {String} [id] a unique id hanlded by your application.
 * This can be used to identify remotes withing a pool of them.
 *
 */

export default class Remote extends EventEmitter {
  constructor(config, id) {
    super()
    this.id = id
    this.status = 'close'
    this.config = {
      port: 22,
      username: 'root',
      privateKeyPath: `${os.homedir()}/.ssh/id_rsa`,
      keepaliveInterval: 12000,
      keepaliveCountMax: 5,
      ...(config || {})
    }
    this.connection = new Client()

    this.connection.on('ready', this._onReady.bind(this))
    this.connection.on('error', this._onError.bind(this))
    this.connection.on('end', this._onEnd.bind(this))
    this.connection.on('close', this._onClose.bind(this))
  }

  close() {
    this.connection.end()
  }

  connect() {
    this.connection.connect({
      privateKey: this._getPrivateKey(this.config.privateKeyPath),
      ...this.config
    })
  }

  /**
   * Execs a remote command and sets the status to ready.
   *
   * It lisens fot stdout and stderr and stream it to the stream callback, when
   * the command finishes it will resolve with the whole stdout and stderr
   * drivered form the call.
   * 
   * If the returning code is not 0 or there si a problem with te execution it
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
  exec(command, streamCallBack) {
    if (this.status === 'ready') {
      return new Promise((resolve, reject) => {
        this.connection.exec(String(command), (error, stream) => {
          let stdout = ''
          let stderr = ''

          this.status = 'running'

          if (!error) {
            stream.on('close', (code, signal) => {
              if (code !== 0) {
                reject({ stderr, code, signal })
              } else {
                resolve({ stdout, code, signal })
              }
              this.status = 'ready'
            })

            stream.on('data', data => {
              stdout += data.toString('utf8')
              if (streamCallBack) {
                streamCallBack(data.toString('utf8'))
              }
            })

            stream.stderr.on('data', data => {
              stderr += data.toString('utf8')
              if (streamCallBack) {
                streamCallBack(undefined, data.toString('utf8'))
              }
            })
          } else {
            reject(error)
            this.status = 'ready'
          }
        })
      })
    }
  }

  /**
   * Gets the content of a private key file.
   *
   * @param {String} path local path to the private key fil
   * @returns {String} Content o fthe file.
   */
  _getPrivateKey(path) {
    return fs.readFileSync(path)
  }

  _onClose() {
    this.status = 'close'
    this.emit('close')
  }

  _onEnd() {
    this.status = 'end'
    this.emit('end')
  }

  _onError(error) {
    this.status = 'error'
    this.emit('error', error)
  }

  _onReady() {
    this.status = 'ready'
    this.emit('ready')
  }
}
