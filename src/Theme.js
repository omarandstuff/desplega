import chalk from 'chalk'

const styleNames = [
  'failure',
  'main',
  'pipelineHeader',
  'stageHeader',
  'stepHeader',
  'stepStatus',
  'subStepHeader',
  'subStepStatus',
  'success'
]

const defaultTheme = {
  failureColor: '#af1400',
  failureContrastColor: '#380600',
  stageHeaderColor: '#00bfef',
  stepHeaderColor: '#d3d300',
  stepStatusColor: '#d3d300',
  subStepHeaderColor: '#c63500',
  subStepStatusColor: '#c63500',
  successColor: '#009918',
  successContrastColor: '#013308'
}

export default class Theme {
  constructor(theme = defaultTheme) {
    this.theme = theme

    this._buildStyles()
  }

  _buildStyles() {
    this.backgroundStyle = this.theme.backgroundColor ? chalk.bgHex(this.theme.backgroundColor) : chalk

    styleNames.forEach(colorName => {
      this._buildStyleFromBackgroundStyle(colorName, this.backgroundStyle)
    })
  }

  _buildStyleFromBackgroundStyle(colorName, backgroundStyle) {
    const themeName = `${colorName}Color`
    const themeContrastName = `${colorName}ContrastColor`
    const styleName = `${colorName}Style`
    const contrastStyleName = `${colorName}ContrastStyle`

    this[styleName] = this.theme[themeName] ? backgroundStyle.hex(this.theme[themeName]) : backgroundStyle

    if (this.theme[themeContrastName] && this.theme[themeName]) {
      this[contrastStyleName] = chalk.bgHex(this.theme[themeName]).hex(this.theme[themeContrastName])
    } else {
      this[contrastStyleName] = this[styleName]
    }
  }
}
