import chalk from 'chalk'
import moment from 'moment'
import Runner from './Runner'

export default class Stage extends Runner {
  constructor(title, config) {
    super()
    this.title = title
    this.config = config || {}
    this.childStackLevel = 2
  }

  addStep(step) {
    this.addChild(step)
  }

  run(context) {
    return new Promise((resolve, reject) => {
      if (this.status === 'idle') {
        this.currentIndex = 0
        this.startTime = moment()
        this.context = this._buildContext(context)
        this.headerColor = context.theme.stageHeadercolor
        this.results = []

        this.resolve = resolve
        this.reject = reject

        this._run()
      } else {
        reject(new Error('Stage bussy'))
      }
    })
  }

  _buildContext(context) {
    return {
      ...context,
      stackLevel: this.childStackLevel,
      remotes: this._filterRemotes(context.remotes),
      localOptions: { ...context.localOptions, ...this.config.localOptions },
      remoteOptions: { ...context.remoteOptions, ...this.config.remoteOptions },
      verbosityLevel: this.config.verbosityLevel || context.verbosityLevel
    }
  }

  _filterRemotes(remotes) {
    return remotes.filter(remote => {
      return !this.config.remotes || this.config.remotes.includes(remote.id)
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
    this.printer.drawRow([
      {
        text: ` ${this.title} `,
        style: this.context.theme.stageHeaderContrastStyle.bold
      },
      {
        blank: true,
        style: this.context.theme.backgroundStyle
      },
      {
        text: ` ${this.context.globalStartTime.format('hh[:]mma')} `,
        style: this.context.theme.stageHeaderStyle
      }
    ])
  }

  _printResult() {}
}
