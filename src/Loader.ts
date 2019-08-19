import fs from 'fs'
import yaml from 'js-yaml'

const priorities = {
  js: 'loadJsFile',
  json: 'loadJsFile',
  yml: 'loadYmlFile'
}

export default class Loader {
  public load(cwd: string, posfix?: string): {} {
    const posfixInRoot: string = posfix ? `.${posfix}` : ''
    const posfixInFolder: string = posfix ? `/${posfix}` : '/deploy'
    const descriptor: any = this.loadByPriority(cwd, posfixInRoot) || this.loadByPriority(cwd, posfixInFolder)

    if (descriptor) return descriptor

    throw new Error('There is not a desplega file in the current working directoy')
  }

  private loadJsFile(file: string): {} {
    return require(file)
  }

  private loadYmlFile(file: string): {} {
    return yaml.safeLoad(fs.readFileSync(file, 'utf8'))
  }

  private loadByPriority(cwd: string, posfix: string): {} {
    const keys: string[] = Object.keys(priorities)

    for (let i = 0; i < keys.length; i++) {
      const priority: string = keys[i]
      const priorityLoadMethod: string = priorities[priority]
      const fileName = `${cwd}/.desplega${posfix}.${priority}`

      if (fs.existsSync(fileName)) {
        switch (priorityLoadMethod) {
          case 'loadJsFile':
            return this.loadJsFile(fileName)
          case 'loadYmlFile':
            return this.loadYmlFile(fileName)
          default:
            break
        }
      }
    }
  }
}
