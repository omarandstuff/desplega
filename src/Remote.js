import fs from 'fs'
const os = require('os')
import { Client } from 'ssh2'

export default class Remote {
  constructor(config = {}) {
    this.config = config
    this.connection = new Client()
    this.subscribers = { close: [], end: [], error: [], ready: [] }

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

  on(event) {
    const promise = new Promise((resolve, reject) => {
      this.subscribers[event].push = { resolve, reject }
    })

    return promise
  }

  _getPrivateKey(path) {
    return fs.readFileSync(path || `${os.homedir()}/.ssh/id_rsa`)
  }

  _onClose() {
    Object.values(this.subscribers.close).forEach(subscriber => {
      subscriber.resolve()
    })
  }

  _onEnd() {
    Object.values(this.subscribers.end).forEach(subscriber => {
      subscriber.resolve()
    })
  }

  _onError(error) {
    Object.values(this.subscribers.error).forEach(subscriber => {
      subscriber.resolve(error)
    })
  }

  _onReady() {
    Object.values(this.subscribers.ready).forEach(subscriber => {
      subscriber.resolve()
    })
  }
}
