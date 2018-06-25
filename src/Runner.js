import Printer from './Printer'

/**
 * Base runner object to runa secuances of runnables
 *
 */

export default class Runner {
  constructor() {
    this.children = []
    this.currentIndex = 0
    this.childStackLevel = 0
    this.context = {}
    this.printer = new Printer()
    this.status = 'idle'
  }

  addChild(child) {
    this.children.push(child)
  }

  run() {
    throw new Error('You need to implement run method')
  }

  _onChildFailure() {
    throw new Error('You need to implement onFailure private method')
  }

  _onChildSuccess() {
    throw new Error('You need to implement onSuccess private method')
  }

  _onSuccess() {
    throw new Error('You need to implement onSuccess private method')
  }

  _printHeader() {
    throw new Error('You need to implement printHeader private method')
  }

  _printResult() {
    throw new Error('You need to implement printResult private method')
  }

  _run() {
    this.status = 'running'
    this._printHeader()
    this._runNext()
  }

  _runNext() {
    if (this.currentIndex < this.children.length) {
      const currentChild = this.children[this.currentIndex++]
      const context = { ...this.context, childIndex: this.currentIndex }

      currentChild
        .run(context)
        .then(result => {
          this._onChildSuccess(result)
          this._runNext()
        })
        .catch(result => {
          this.status = 'idle'
          this._onChildFailure(result)
          this._printResult(false)
        })
    } else {
      this.status = 'idle'
      this._onSuccess()
      this._printResult()
    }
  }
}
