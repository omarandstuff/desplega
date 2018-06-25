import Runner from '../../src/Runner'

export default class DummyRunner extends Runner {
  run(context) {
    return new Promise((resolve, reject) => {
      this.context = context
      this.results = []
      this.resolve = resolve
      this.reject = reject

      this._run()
    })
  }

  _onChildFailure(result) {
    this.results.push(result)
    this.reject(this.results)
  }

  _onChildSuccess(result) {
    this.results.push(result)
  }

  _onSuccess() {
    this.resolve(this.results)
  }

  _printHeader() {
    this.__printedHeader = 'Header'
  }

  _printResult() {
    this.__printedResults = 'Results'
  }
}
