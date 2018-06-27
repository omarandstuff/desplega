import fs from 'fs'
import yaml from 'js-yaml'

const priorities = {
  js: '_loadJsFile',
  json: '_loadJsFile',
  yml: '_loadYmlFile'
}

export default class Loader {
  static load(posfix) {
    const posfixWithDot = posfix ? `.${posfix}` : ''
    const descriptor = Loader._LoadByPriority(posfixWithDot, '/') || Loader._LoadByPriority(posfixWithDot)

    if (descriptor) return descriptor

    throw new Error('There is not a desplega file in the current working directoy')
  }

  static _loadJsFile(file) {
    return require(file)
  }

  static _loadYmlFile(file) {
    return yaml.safeLoad(fs.readFileSync(file, 'utf8'))
  }

  static _LoadByPriority(posfix, divition = '') {
    const cwd = process.cwd()
    const keys = Object.keys(priorities)

    for (let i = 0; i < keys.length; i++) {
      const priority = keys[i]
      const priorityLoadMethod = priorities[priority]
      const fileName = `${cwd}/.desplega${divition}${posfix}.${priority}`

      if (fs.existsSync(fileName)) {
        return Loader[priorityLoadMethod](fileName)
      }
    }
  }
}
