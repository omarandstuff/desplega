export default class Printer {
  drawRow(elements, inline = false) {
    const terminalWidth = process.stdout.columns
    const processedElements = this._fitElements(elements, terminalWidth)
    const fixedWidth = this._calculateFixedElementsWidth(processedElements)
    const availableWidth = Math.max(0, terminalWidth - fixedWidth)
    const rendered = this._buildAndFormat(processedElements, availableWidth)

    if (inline) {
      process.stdout.write(`${rendered}\r`)
    } else {
      process.stdout.write(`${' '.repeat(terminalWidth)}\r`)
      console.log(rendered)
    }
  }

  draw(string, tabSize = 0) {
    const terminalWidth = process.stdout.columns
    const finalString = string
      .replace(/(\r|[\n]$)/g, '')
      .split('\n')
      .map(line => {
        return `${' '.repeat(tabSize)}${line}`
      })
      .join('\n')

    process.stdout.write(`${' '.repeat(terminalWidth)}\r`)
    console.log(finalString)
  }

  _applyFormat(element, optionalText, raw) {
    if (element.style && !raw) {
      return element.style(optionalText || element.text)
    }
    return optionalText || element.text
  }

  _buildAndFormat(elements, availableWidth, raw = false) {
    const dynamicCount = this._calculateDynamicCount(elements)
    const widthPerDynamicElement = Number.parseInt(availableWidth / dynamicCount)
    const specialDynamic = widthPerDynamicElement === 0
    let availableDynamixSpace = availableWidth
    let uncalculateDynamicSpace = availableWidth - widthPerDynamicElement * dynamicCount

    return elements
      .map(element => {
        if (element.blank) {
          if (specialDynamic) {
            if (availableDynamixSpace) {
              availableDynamixSpace--
              return this._applyFormat(element, ' ')
            }
          } else {
            const extraSpace = uncalculateDynamicSpace-- > 0 ? 1 : 0
            const blank = (element.symbol || ' ').repeat(widthPerDynamicElement + extraSpace)
            return this._applyFormat(element, blank, raw)
          }
        } else if (element.fit) {
          if (specialDynamic) {
            if (availableDynamixSpace) {
              availableDynamixSpace--
              return this._applyFormat(element, element.text[0], raw)
            }
          } else {
            const extraSpace = uncalculateDynamicSpace-- > 0 ? 1 : 0
            const finalWith = widthPerDynamicElement + extraSpace

            if (element.text.length > finalWith) {
              const exceed = element.text.length - finalWith
              const cutPosition = element.text.length - exceed
              const addDots = cutPosition - 3 > 0
              const extraCut = addDots ? 3 : 0
              const extraDots = addDots ? '...' : ''
              const cuttedText = element.text.substring(0, cutPosition - extraCut)
              const rendered = this._applyFormat(element, `${cuttedText}${extraDots}`, raw)

              return `${rendered}`
            } else {
              const lack = finalWith - element.text.length
              const amplifiedText = `${element.text}${' '.repeat(lack)}`
              const rendered = this._applyFormat(element, amplifiedText, raw)

              return `${rendered}`
            }
          }
        } else {
          return this._applyFormat(element)
        }
      })
      .join('')
  }

  _calculateDynamicCount(elements, onlyBlanks) {
    return elements.reduce((currentCount, element) => {
      if ((element.fit && !onlyBlanks) || element.blank) {
        return currentCount + 1
      }
      return currentCount
    }, 0)
  }

  _calculateFixedElementsWidth(elements) {
    return elements.reduce((currentWidth, element) => {
      if (!element.fit && !element.blank) {
        return currentWidth + element.text.length
      }
      return currentWidth
    }, 0)
  }

  _fitElements(elements, targetWidth) {
    const fixedWidth = this._calculateFixedElementsWidth(elements)
    const availableWidth = Math.max(0, targetWidth - fixedWidth)
    const dynamicCount = this._calculateDynamicCount(elements)
    const widthPerDynamicElement = Number.parseInt(availableWidth / dynamicCount)
    const removeDynamics = fixedWidth >= targetWidth
    let currentWidth = 0

    return elements
      .map(element => {
        if (currentWidth < targetWidth) {
          if (element.fit || element.blank) {
            if (!removeDynamics) {
              currentWidth += widthPerDynamicElement
              return element
            }
          } else {
            currentWidth += element.text.length

            if (currentWidth >= targetWidth) {
              const exceed = currentWidth - targetWidth
              const cutPosition = element.text.length - exceed

              return { ...element, text: element.text.substring(0, cutPosition) }
            }

            return element
          }
        }
      })
      .filter(element => element)
  }
}
