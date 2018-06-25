export default class GenericChild {
  constructor(simulateReject) {
    this.__sumulateReject = simulateReject
  }

  run(context) {
    return new Promise((resolve, reject) => {
      this.context = context
      if (this.__sumulateReject) {
        reject('Generic failure')
      } else {
        resolve('Generic success')
      }
    })
  }
}
