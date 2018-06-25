import chalk from 'chalk'
import moment from 'moment'
import Runner from './Runner'
import LocalManager from './LocalManager'
import RemoteManager from './RemoteManager'
import Printer from './Printer'
import Theme from './Theme'

export default class Pipeline extends Runner {
  constructor(title, config, theme) {
    super()
    this.title = title
    this.config = config
    this.context = {
      archive: { dictionary: {}, history: [] },
      localOptions: config.localOptions,
      local: this._createLocal(),
      remoteOptions: config.remoteOptions,
      remotes: this._createRemotes(),
      theme: new Theme(theme),
      verbosityLevel: config.verbosityLevel || 'partial'
    }

    this.printer = new Printer()
  }

  addStage(stage) {
    this.addChild(stage)
  }

  run() {
    return new Promise((resolve, reject) => {
      if (this.status === 'idle') {
        this.currentIndex = 0
        this.currentStage = undefined
        this.context.globalStartTime = moment()
        this.results = []

        this.resolve = resolve
        this.reject = reject

        this._run()
      } else {
        throw new Error('Pipeline bussy')
      }
    })
  }

  _closeRemotes() {
    this.context.remotes.forEach(remote => {
      remote.close()
    })
  }

  _createLocal() {
    return new LocalManager(this.config.localOptions)
  }

  _createRemotes() {
    return (this.config.remotes || []).map(remote => {
      const { id, options, ...config } = remote
      return new RemoteManager(config, id, options)
    })
  }

  _onChildFailure(result) {
    this.results.push(result)
    this._closeRemotes()
    this.reject(this.results)
  }

  _onChildSuccess(result) {
    this.results.push(result)
  }

  _onSuccess() {
    this._closeRemotes()
    this.resolve(this.results)
  }

  _printHeader() {
    this.printer.drawRow([
      {
        blank: true,
        style: this.context.theme.backgroundStyle
      },
      {
        text: ` ${this.title} `,
        style: this.context.theme.pipelineHeaderContrastStyle.bold
      },
      {
        blank: true,
        style: this.context.theme.backgroundStyle
      }
    ])
  }

  _printResult(success = true) {
    const successContrastStyle = success
      ? this.context.theme.successContrastStyle
      : this.context.theme.failureContrastStyle
    const successWord = success ? 'DONE' : 'FAIL'

    this.printer.drawRow([
      {
        blank: true,
        style: this.context.theme.backgroundStyle
      },
      {
        text: ` ${successWord} `,
        style: successContrastStyle.bold
      },
      {
        text: ` ${this._solveDuration(this.context.globalStartTime)}`,
        style: this.context.theme.mainStyle
      },
      {
        blank: true,
        style: this.context.theme.backgroundStyle
      }
    ])
  }

  _solveDuration(time) {
    const diference = moment().diff(time)
    const duration = moment.duration(diference)

    if (duration.hours() > 0) {
      return moment(diference).format('hh[:]mm[:]ss[.]SSS')
    } else if (duration.minutes() > 0) {
      return moment(diference).format('mm[:]ss[.]SSS')
    } else {
      return moment(diference).format('ss[.]SSS')
    }
  }
}
