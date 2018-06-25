import Printer from '../src/Printer'

const realLog = console.log
const realWrite = process.stdout.write
const realColumns = process.stdout.columns

describe('Printer#drawRow', () => {
  beforeEach(() => {
    console.log = jest.fn()
    process.stdout.write = jest.fn()
    process.stdout.columns = 10
  })

  afterAll(() => {
    console.log = realLog
    process.stdout.write = realWrite
    process.stdout.columns = realColumns
  })

  describe('Printing inline', () => {
    it('it adds a /r at the end and uses process.stdout.write', async () => {
      const printer = new Printer()

      printer.drawRow([{ text: 'some text' }], true)

      expect(process.stdout.write.mock.calls[0][0]).toBe('some text\r')
    })
  })

  describe('Printing short text smaller than the terminal', () => {
    it('just prints that shor text', async () => {
      const printer = new Printer()

      printer.drawRow([{ text: 'short' }])

      expect(console.log.mock.calls[0][0]).toBe('short')
    })
  })

  describe('trying to print more text than space available', () => {
    it('crops the text', async () => {
      const printer = new Printer()

      printer.drawRow([{ text: 'this is a very large text' }])

      expect(console.log.mock.calls[0][0]).toBe('this is a ')
    })

    describe('throuh multiple text elements', () => {
      it('still crops the text', async () => {
        const printer = new Printer()

        printer.drawRow([{ text: 'this ' }, { text: 'is ' }, { text: 'a ' }, { text: 'very ' }, { text: 'large text' }])

        expect(console.log.mock.calls[0][0]).toBe('this is a ')
      })
    })
  })

  describe('Including text elements set as dynamic (fit: true)', () => {
    it('fits the text and add ...', async () => {
      const printer = new Printer()

      printer.drawRow([{ text: 'dynamic text', fit: true }])

      expect(console.log.mock.calls[0][0]).toBe('dynamic...')
    })

    describe('throuh multiple text elements', () => {
      it('still fits the text', async () => {
        const printer = new Printer()

        printer.drawRow([{ text: 'short ' }, { text: 'dynamic text', fit: true }])

        expect(console.log.mock.calls[0][0]).toBe('short d...')
      })
    })

    describe('the dynamic text is too short for the available space', () => {
      it('adds extra spaces to fill space', async () => {
        const printer = new Printer()

        printer.drawRow([{ text: '22', fit: true }])

        expect(console.log.mock.calls[0][0]).toBe('22        ')
      })
    })

    describe('when there is not space for the 3 dots', () => {
      it('dont use the dots', async () => {
        const printer = new Printer()

        printer.drawRow([{ text: 'bigenough' }, { text: 'dynamic text', fit: true }])

        expect(console.log.mock.calls[0][0]).toBe('bigenoughd')
      })
    })

    describe('when it is not posible to assign even space for all dynamics and blanks', () => {
      it('add some more spaces for the first ones', async () => {
        const printer = new Printer()

        process.stdout.columns = 11
        printer.drawRow([{ text: 'dynamic text', fit: true }, { blank: true }, { text: 'dynamic text', fit: true }])

        expect(console.log.mock.calls[0][0]).toBe('d...    dyn')
      })
    })

    describe('when there are too many dynamics for available space', () => {
      it('just renders some of them', async () => {
        const printer = new Printer()

        process.stdout.columns = 5
        printer.drawRow([
          { text: 'dynamic text', fit: true },
          { blank: true },
          { text: 'dynamic text', fit: true },
          { blank: true },
          { text: 'dynamic text', fit: true },
          { text: 'dynamic text', fit: true },
          { blank: true }
        ])

        expect(console.log.mock.calls[0][0]).toBe('d d d')
      })
    })
  })

  describe('when static text exeed available space', () => {
    it('do not try to render any dinamic text element', async () => {
      const printer = new Printer()

      printer.drawRow([{ text: 'short ' }, { text: 'dynamic text', fit: true }, { text: 'not too short ' }])

      expect(console.log.mock.calls[0][0]).toBe('short not ')
    })
  })

  describe('efining blank block to fill space', () => {
    it('fills the space between text', async () => {
      const printer = new Printer()

      printer.drawRow([{ text: 'short' }, { blank: true }, { text: '22' }])

      expect(console.log.mock.calls[0][0]).toBe('short   22')
    })
  })
})

describe('Printer#drawRow', () => {
  beforeEach(() => {
    console.log = jest.fn()
    process.stdout.write = jest.fn()
    process.stdout.columns = 10
  })

  afterAll(() => {
    console.log = realLog
    process.stdout.write = realWrite
    process.stdout.columns = realColumns
  })

  it('clean current terminal line and apply tabsize to the string', () => {
    const printer = new Printer()
    const styleCall = jest.fn()

    printer.draw('Some random text', 2)

    expect(process.stdout.write.mock.calls[0][0]).toBe('          \r')
    expect(console.log.mock.calls[0][0]).toBe('  Some random text')
  })
})
