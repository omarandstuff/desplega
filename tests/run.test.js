import run from '../src/run'
import fs from 'fs'

const realLog = console.log
const realWrite = process.stdout.write
const realCwd = process.cwd

beforeEach(() => {
  console.log = jest.fn()
  process.stdout.write = jest.fn()
  process.cwd = () => `${realCwd()}/tests/__fixures__`
})

afterAll(() => {
  console.log = realLog
  process.stdout.write = realWrite
  process.cwd = realCwd
})

describe('run', () => {
  it('finds and run a desplega file', async () => {
    run()

    await new Promise(resolve =>
      setInterval(() => {
        const logFileName = `${process.cwd()}/desplega.log`
        if (fs.existsSync(logFileName)) {
          fs.unlinkSync(logFileName)
          resolve(logFileName)
        }
      }, 100)
    )
  })
})
