import { exec } from 'child_process'

export default class Local {
  constructor(config) {
    const env = { FORCE_COLOR: true, ...process.env }
    this.config = { env: env, maxBuffer: 8388608, ...config }
  }

  exec(command, streamCallBack) {
    return new Promise((resolve, reject) => {
      const child = exec(command, this.config, (error, stdout, stderr) => {
        if (!error) {
          resolve({ stdout, stderr })
        } else {
          reject(error)
        }
      })

      child.stdout.on('data', data => {
        if (streamCallBack) {
          streamCallBack(data.toString('utf8'))
        }
      })

      child.stderr.on('data', data => {
        if (streamCallBack) {
          streamCallBack(undefined, data.toString('utf8'))
        }
      })
    })
  }
}
