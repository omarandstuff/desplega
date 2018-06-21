import chalk from 'chalk'
import moment from 'moment'
import numeral from 'numeral'
import Printer from './Printer'

const colors = {
  backgroundColor: '#2b2b2b',
  headerColor: '#ffb600',
  headerContrastColor: '#2b2b2b',
  failcolor: '#8c1404',
  failContrastColor: '#2b2b2b',
  subRutineColorColor: '#c63500',
  subRutineContrastColor: '#2b2b2b',
  resultColor: '#058c14',
  resultContrastColor: '#2b2b2b',
  statusColor: '#ffb600',
  statusContrastColor: '#2b2b2b'
}

/**
 * In takes some remote manager objects and print formated information about
 * their status.
 *
 * @param {Object} definition a definition object.
 * Definistion attributes are:
 * title: Title for this step Example: 'Install node.js'.
 * command: The actual command to be executed.
 * path: Which path will be used as a cwd for the command.
 * remotes: Array of remote ids to filter, so the command will be
 *   executed only in those.
 * onFailure: Any object of funtion that return and Promise (Example: other RemoteStep).
 * recoverOnFailure: if the onFailure attribute is set and succeed this step will resolve
 *   instead of reject.
 * continueOnFailure: it does not matter if this step fails or onFailure fails it will resolve
 *   anyways.
 * options: options to overide in the remote objects: (See RemoteManager options)
 * verbosityLevel:
 *   'full': will the streamed output of the command
 *   'partial': will print only the last output line in the status bar.
 * 
 */

export default class RemoteStep {
  constructor(definition) {
    this.printer = new Printer()
    this.definition = definition
    this.animationTick = 0
    this.typeIcon = 'ssh'
    this.loadChars = {
      connecting: ['✶', '✸', '✹', '✺', '✹', '✷'],
      idle: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
      running: ['⣷', '⣯', '⣟', '⡿', '⢿', '⣻', '⣽', '⣾'],
      timeout: ['_', '_', '_', '-', '`', '`', "'", '´', '-', '_', '_', '_'],
      waiting: ['◜', '◠', '◝', '◞', '◡', '◟']
    }
    this.superScriptChars = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']

    this.bufferedCount = 0
    this.bufferedOutput = ''
  }

  /**
   * Starts resolving the remote object and print the status of it.
   *
   * @param {Object} context context in which this step is runnig
   * context attributes are:
   * remotes: Array of remotes avalilable in this context
   * stepNumber: This step can be part of a list of steps, so wich number is it.
   * globalStartTime: At what time all this started.
   * stackLevel: Tab size to be printed depending on the context.
   *
   * @returns {Promise} Promise to be solved or rejected.
   * when solving or rejecting will pass the remotes results
   * (See RemoteManager exec method for more details)
   *
   */

  run(context) {
    return new Promise((resolve, reject) => {
      this.context = context

      if (!this.context.remotes || this.context.remotes.length === 0) {
        return resolve('Nothing to deploy')
      }

      this.startTime = moment()
      this.filteredRemotes = []
      this.remotesIds = []
      this.remotesHandler = {}
      this.remotesFinished = 0
      this.verbosityLevel = this.context.verbosityLevel || this.definition.verbosityLevel
      this.options = { ...this.definition.options, ...(context.options || {}) }

      this.context.remotes.forEach(remote => {
        if (!this.definition.remotes || this.definition.remotes.includes(remote.id)) {
          this.filteredRemotes.push(remote)
          this.remotesIds.push(remote.id)
          this.remotesHandler[remote.id] = { status: 'online', remote: remote }
        }
      })

      this.resolve = resolve
      this.reject = reject

      this._printHeader()
      this._runAnimation()

      this.remotesIds.forEach(id => {
        this.remotesHandler[id].status = 'running'
        this.remotesHandler[id].remote
          .exec(`${this._buildPathCommand()}${this.definition.command}`, this._onStream.bind(this, id), this.options)
          .then(result => {
            this.remotesHandler[id].status = 'done'
            this.remotesHandler[id].result = result

            if (++this.remotesFinished === this.remotesIds.length) {
              clearTimeout(this.animation)
              this._onSuccess()
            }
          })
          .catch(error => {
            this.remotesHandler[id].status = 'fail'
            this.remotesHandler[id].result = error

            if (++this.remotesFinished === this.remotesIds.length) {
              clearTimeout(this.animation)
              this._onFailure()
            }
          })
      })
    })
  }

  _buildPathCommand() {
    if (this.definition.path) {
      return `cd ${this.definition.path} && `
    }
    return ''
  }

  _onFailure() {
    if (this.definition.onFailure) {
      const context = {
        remotes: this.filteredRemotes,
        globalStartTime: this.globalStartTime,
        caller: this,
        stackLevel: (this.context.stackLevel || 0) + 1
      }

      this.definition.onFailure
        .run(context)
        .then(result => {
          if (this.definition.recoverOnFailure) {
            this._printResult()
            this.resolve({ mainResult: this.remotesHandler, onFailureResult: result })
          } else {
            const resultData = { mainResult: this.remotesHandler, onFailureResult: result }

            if (this.definition.continueOnFailure) {
              this._printResult()
              this.resolve(resultData)
            } else {
              this._printResult(false)
              this.reject(resultData)
            }
          }
        })
        .catch(error => {
          const resultData = { mainResult: this.remotesHandler, onFailureResult: error }

          if (this.definition.continueOnFailure) {
            this._printResult()
            this.resolve(resultData)
          } else {
            this._printResult(false)
            this.reject(resultData)
          }
        })
    } else {
      if (this.definition.continueOnFailure) {
        this._printResult()
        this.resolve(this.remotesHandler)
      } else {
        this._printResult(false)
        this.reject(this.remotesHandler)
      }
    }
  }

  _onStream(index, stdout, stderr) {
    const output = stdout || stderr

    if (this.verbosityLevel === 'full') {
      const finalOutput = output
        .split('\n')
        .map(line => '    '.concat(line))
        .join('\n')
        .replace(/(\r\n\t|\r|\n|\r\t)/gm, '')

      this.printer.drawRow([
        {
          text: finalOutput,
          fit: true
        }
      ])
    }

    if (this.verbosityLevel === 'partial') {
      const lines = output.split('\n').filter(line => line)

      this.lastOutput = (lines[lines.length - 1] || '').replace(/(\r\n\t|\r|\n|\r\t)/gm, '')
    }

    this._printStatus()
  }

  _onSuccess() {
    this._printResult()
    this.resolve(this.remotesHandler)
  }

  _printHeader() {
    let color = colors.headerColor
    let contrastColor = colors.headerContrastColor

    if (this.context.caller) {
      color = colors.subRutineColorColor
      contrastColor = colors.subRutineContrastColor
    }

    this.printer.drawRow([
      {
        text: `${' '.repeat(this.context.stackLevel || 0)}`,
        style: chalk.bgHex(colors.backgroundColor)
      },
      {
        text: ` ${this.context.stepNumber ? numeral(this.context.stepNumber).format('00') : '~'} `,
        style: chalk.bgHex(color).hex(contrastColor)
      },
      {
        text: ` ${this.definition.title} `,
        style: chalk.bgHex(contrastColor).hex(color).bold
      },
      {
        text: ` ${this.typeIcon} ${this.definition.path || '~/'} `,
        style: chalk.bgHex(color).hex(contrastColor),
        fit: true
      },
      {
        text: ` ${this.startTime.format('hh[:]mma')} `,
        style: chalk.bgHex(contrastColor).hex(color).bold
      }
    ])
    this.printer.drawRow([
      {
        text: `${' '.repeat(this.context.stackLevel || 0)}`,
        style: chalk.bgHex(colors.backgroundColor)
      },
      {
        text: `⏎ ${this.definition.command}`,
        style: chalk.bgHex(contrastColor).hex(color),
        fit: true
      }
    ])
  }

  _printStatus() {
    const loaders = this.remotesIds
      .map(id => {
        if (this.remotesHandler[id].status === 'done') {
          return '✔'
        } else if (this.remotesHandler[id].status === 'fail') {
          return '✖'
        } else {
          return this._solveLoader(id)
        }
      })
      .join(' ')

    const statusSpace =
      this.verbosityLevel === 'partial'
        ? {
            text: this.lastOutput || '',
            style: chalk.bgHex(colors.statusContrastColor).hex(colors.statusColor),
            fit: true
          }
        : { blank: true, style: chalk.bgHex(colors.statusContrastColor) }

    this.printer.drawRow(
      [
        {
          text: `${' '.repeat(this.context.stackLevel || 0)}`,
          style: chalk.bgHex(colors.backgroundColor)
        },
        {
          text: ` ▶▶`,
          style: chalk.bgHex(colors.statusColor).hex(colors.statusContrastColor)
        },
        {
          text: ` ${this.context.stepNumber ? numeral(this.context.stepNumber).format('00') : '~'} `,
          style: chalk.bgHex(colors.statusColor).hex(colors.statusContrastColor).bold
        },
        {
          text: ` ${loaders} `,
          style: chalk.bgHex(colors.statusContrastColor).hex(colors.statusColor)
        },
        statusSpace,
        {
          text: ` ${this._solveDuration(this.startTime)} `,
          style: chalk.bgHex(colors.statusContrastColor).hex(colors.statusColor).bold
        }
      ],
      true
    )
  }

  _printResult(success = true) {
    const loaders = this.remotesIds
      .map(id => {
        if (this.remotesHandler[id].status === 'done') {
          return '✔'
        } else if (this.remotesHandler[id].status === 'fail') {
          return `✖${id}`
        }
      })
      .join(' ')

    const color = success ? colors.resultColor : colors.failcolor
    const contrastColor = success ? colors.resultContrastColor : colors.failContrastColor
    const successChar = success ? '✔' : '✖'

    this.printer.drawRow([
      {
        text: `${' '.repeat(this.context.stackLevel || 0)}`,
        style: chalk.bgHex(colors.backgroundColor)
      },
      {
        text: ` ${this.context.stepNumber ? numeral(this.context.stepNumber).format('00') : '~'} `,
        style: chalk.bgHex(color).hex(contrastColor).bold
      },
      {
        text: ` ${loaders} `,
        style: chalk.bgHex(contrastColor).hex(color),
        fit: true
      },
      {
        text: ` ${successChar} ${this._solveDuration(this.startTime)} `,
        style: chalk.bgHex(contrastColor).hex(color)
      },
      {
        text: ` ● ${this._solveDuration(this.context.globalStartTime)} `,
        style: chalk.bgHex(contrastColor).hex(color)
      }
    ])
    if (!this.context.caller) {
      this.printer.drawRow([
        {
          blank: true,
          style: chalk.bgHex(contrastColor).hex(color)
        }
      ])
    }
  }

  _runAnimation() {
    this.animation = setInterval(() => {
      this.animationTick++
      this._printStatus()
    }, 100)
  }

  _solveDuration(time) {
    const duration = moment.duration(moment().diff(moment(time)))
    return numeral(duration.asSeconds()).format('00:00:00')
  }

  _solveLoader(id) {
    const animationChars = this.loadChars[this.remotesHandler[id].remote.feedback]
    const currentLoadChar = animationChars[this.animationTick % animationChars.length]
    const attemptsChar = this.remotesHandler[id].remote.currentRun
      ? this._solveSuperScript(this.remotesHandler[id].remote.currentRun.attempts)
      : ''

    return `${currentLoadChar}${attemptsChar}`
  }

  _solveSuperScript(number) {
    if (number > 1) {
      const elements = String(number).split('')
      return elements.map(element => this.superScriptChars[Number(element)]).join('')
    }

    return ''
  }
}
