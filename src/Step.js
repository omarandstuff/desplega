import chalk from 'chalk'
import moment from 'moment'
import numeral from 'numeral'
import ansiRegex from 'ansi-regex'
import Printer from './Printer'

/**
 * Base step class.
 *
 * @param {Object} definition a definition object.
 */

export default class Step {
  constructor(definition) {
    this.printer = new Printer()
    this.definition = definition
    this.animationTick = 0
    this.animationFraction = 0.0
    this.typeIcon = 'ssh'
    this.loadChars = {
      connecting: ['✶', '✸', '✹', '✺', '✹', '✷'],
      idle: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
      running: ['⣷', '⣯', '⣟', '⡿', '⢿', '⣻', '⣽', '⣾'],
      timeout: ['_', '_', '_', '-', '`', '`', "'", '´', '-', '_', '_', '_'],
      waiting: ['◜', '◠', '◝', '◞', '◡', '◟']
    }
    this.superScriptChars = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']
    this.status = 'idle'
  }

  run() {
    throw new Error('You need to implement run method')
  }

  _buildPathCommand() {
    if (this.definition.path) {
      return `cd ${this.definition.path} && `
    }
    return ''
  }

  _finish(success, resultData) {
    this.status = 'idle'

    if (success || this.definition.continueOnFailure) {
      this._printResult()
      this.resolve(resultData)
    } else {
      this._printResult(false)
      this.reject(resultData)
    }
  }

  _onFailure() {
    if (this.definition.onFailure) {
      const context = {
        ...this.context,
        childIndex: undefined,
        stackLevel: this.context.stackLevel + 1,
        subStep: true
      }

      this.definition.onFailure
        .run(context)
        .then(result => {
          const resultData = { mainResult: this.currentRun, onFailureResult: result }

          if (this.definition.recoverOnFailure) {
            this._finish(true, resultData)
          } else {
            this._finish(false, resultData)
          }
        })
        .catch(error => {
          const resultData = { mainResult: this.currentRun, onFailureResult: error }

          this._finish(false, resultData)
        })
    } else {
      this._finish(false, this.currentRun)
    }
  }

  _onStream(stdout, stderr) {
    const output = stdout || stderr

    if (this.context.verbosityLevel === 'full') {
      this.printer.draw(output, this.context.stackLevel)
    }

    if (this.context.verbosityLevel === 'partial') {
      const lines = output.split('\n').filter(line => line)

      this.lastOutput = (lines[lines.length - 1] || '').replace(/(\r\n\t|\r|\n|\r\t)/gm, '').replace(ansiRegex(), '')
    }

    this._printStatus()
  }

  _onSuccess() {
    this._finish(true, this.currentRun)
  }

  _printHeader() {
    const style = this.context.subStep ? this.context.theme.subStepHeaderStyle : this.context.theme.stepHeaderStyle

    this.printer.drawRow([
      {
        text: `${' '.repeat(this.context.stackLevel || 0)}`,
        style: this.context.theme.backgroundStyle
      },
      {
        text: `${this.context.childIndex ? numeral(this.context.childIndex).format('00') : '~'} `,
        style: style
      },
      {
        text: `${this.definition.title} `,
        style: this.context.theme.mainStyle.bold
      },
      {
        text: `${this.typeIcon} `,
        style: style
      },
      {
        text: `${this.definition.path || '~/'}`,
        style: this.context.theme.mainStyle,
        fit: true
      }
    ])
    this.printer.drawRow([
      {
        text: `${' '.repeat(this.context.stackLevel || 0)}`,
        style: style
      },
      {
        text: `⏎ ${this.command}`,
        style: style.dim,
        fit: true
      }
    ])
  }

  _printStatus() {
    const style = this.context.subStep ? this.context.theme.subStepStatusStyle : this.context.theme.stepStatusStyle

    const statusSpace =
      this.context.verbosityLevel === 'partial'
        ? {
            text: this.lastOutput || '',
            style: this.context.theme.mainStyle,
            fit: true
          }
        : {
            blank: true,
            style: this.context.theme.backgroundStyle
          }

    this.printer.drawRow(
      [
        {
          text: `${' '.repeat(this.context.stackLevel || 0)}`,
          style: this.context.theme.backgroundStyle
        },
        {
          text: `▶▶ `,
          style: style
        },
        {
          text: `${this._solveDuration(this.startTime)}`,
          style: this.context.theme.mainStyle
        },
        {
          text: ` ${this._generateLoaders()} `,
          style: style
        },
        statusSpace
      ],
      true
    )
  }

  _printResult(success = true) {
    const successStyle = success ? this.context.theme.successStyle : this.context.theme.failureStyle
    const successContrastStyle = success
      ? this.context.theme.successContrastStyle
      : this.context.theme.failureContrastStyle
    const successWord = success ? 'DONE' : 'FAIL'
    const timeSlot = this.context.subStep
      ? {
          text: ` ${moment().format('hh[:]mma')} `,
          style: successStyle
        }
      : {
          text: ''
        }
    const successWordSlot = this.context.subStep
      ? {
          text: ` SUB STEP `,
          style: this.context.theme.subStepStatusContrastStyle.bold
        }
      : {
          text: ` ${successWord} `,
          style: successContrastStyle.bold
        }

    this.printer.drawRow([
      {
        text: `${' '.repeat(this.context.stackLevel || 0)}`,
        style: this.context.theme.backgroundStyle
      },
      successWordSlot,
      {
        text: ` ${this._solveDuration(this.startTime)}`,
        style: this.context.theme.mainStyle
      },
      {
        text: ` ${this._generateLoaders(true)}`,
        style: successStyle
      },
      {
        blank: true,
        style: this.context.theme.backgroundStyle
      },
      timeSlot
    ])
  }

  _runAnimation() {
    this.animation = setInterval(() => {
      this.animationFraction += 0.02
      this.animationTick = parseInt(this.animationFraction)
      this._printStatus()
    }, 1)
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

  _solveSuperScript(number) {
    if (number > 1) {
      const elements = String(number).split('')
      return elements.map(element => this.superScriptChars[Number(element)]).join('')
    }

    return ''
  }
}
