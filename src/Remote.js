import EventEmitter from 'events'
import { Client } from 'ssh2'
import fs from 'fs'
import os from 'os'

export default class Remote extends EventEmitter {
  constructor(config = {}) {
    super()
    this.config = config
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
      host: this.config.host,
      port: this.config.port || 22,
      username: this.config.username || 'root',
      privateKey: this._getPrivateKey(this.config.privateKeyPath),
      password: this.config.password,
      keepaliveInterval: this.config.keepaliveInterval || 120000,
      keepaliveCountMax: this.config.keepaliveCountMax || 5
    })
  }

  exec(command, streamCallBack) {
    return new Promise((resolve, reject) => {
      this.connection.exec(command, (error, stream) => {
        let stdout = ''
        let stderr = ''

        if (!error) {
          stream.on('close', (code, signal) => {
            resolve({ stdout, stderr, code, signal })
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
        }
      })
    })
  }

  _getPrivateKey(path) {
    return fs.readFileSync(path || `${os.homedir()}/.ssh/id_rsa`)
  }

  _onClose() {
    this.emit('close')
  }

  _onEnd() {
    this.emit('end')
  }

  _onError(error) {
    this.emit('error', error)
  }

  _onReady() {
    this.emit('ready')
  }
}
