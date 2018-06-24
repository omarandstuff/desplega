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
 * Base step class.
 *
 * @param {Object} definition a definition object.
 */

export default class Step {
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

  _generateStatusSpace() {
    return this.context.verbosityLevel === 'partial'
      ? {
          text: this.lastOutput || '',
          style: chalk.bgHex(colors.statusContrastColor).hex(colors.statusColor),
          fit: true
        }
      : { blank: true, style: chalk.bgHex(colors.statusContrastColor) }
  }

  _onFailure() {
    if (this.definition.onFailure) {
      const context = {
        ...this.context,
        childIndex: undefined,
        stackLevel: this.context.stackLevel + 1,
        substep: true
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

    if (this.context.verbosityLevel === 'partial') {
      const lines = output.split('\n').filter(line => line)

      this.lastOutput = (lines[lines.length - 1] || '').replace(/(\r\n\t|\r|\n|\r\t)/gm, '')
    }

    this._printStatus()
  }

  _onSuccess() {
    this._finish(true, this.currentRun)
  }

  _printHeader() {
    let color = colors.headerColor
    let contrastColor = colors.headerContrastColor

    if (this.context.substep) {
      color = colors.subRutineColorColor
      contrastColor = colors.subRutineContrastColor
    }

    this.printer.drawRow([
      {
        text: `${' '.repeat(this.context.stackLevel || 0)}`,
        style: chalk.bgHex(colors.backgroundColor)
      },
      {
        text: ` ${this.context.childIndex ? numeral(this.context.childIndex).format('00') : '~'} `,
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
        text: `⏎ ${this.command}`,
        style: chalk.bgHex(contrastColor).hex(color),
        fit: true
      }
    ])
  }

  _printStatus() {
    const statusSpace = this._generateStatusSpace()

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
          text: ` ${this.context.childIndex ? numeral(this.context.childIndex).format('00') : '~'} `,
          style: chalk.bgHex(colors.statusColor).hex(colors.statusContrastColor).bold
        },
        {
          text: ` ${this._generateLoaders()} `,
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
    const color = success ? colors.resultColor : colors.failcolor
    const contrastColor = success ? colors.resultContrastColor : colors.failContrastColor
    const successChar = success ? '✔' : '✖'

    this.printer.drawRow([
      {
        text: `${' '.repeat(this.context.stackLevel || 0)}`,
        style: chalk.bgHex(colors.backgroundColor)
      },
      {
        text: ` ${this.context.childIndex ? numeral(this.context.childIndex).format('00') : '~'} `,
        style: chalk.bgHex(color).hex(contrastColor).bold
      },
      {
        text: ` ${this._generateLoaders(true)} `,
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

  _solveSuperScript(number) {
    if (number > 1) {
      const elements = String(number).split('')
      return elements.map(element => this.superScriptChars[Number(element)]).join('')
    }

    return ''
  }
}
