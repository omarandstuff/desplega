import run from '../src/run'

const realLog = console.log
const realWrite = process.stdout.write
const realCwd = process.cwd

beforeEach(() => {
  process.stdout.columns = 20
  console.log = jest.fn()
  process.stdout.write = jest.fn()
})

afterAll(() => {
  console.log = realLog
  process.stdout.write = realWrite
  process.cwd = realCwd
})

describe('run', () => {
  it('finds and run a desplega file', async () => {
    process.cwd = () => `${realCwd()}/test/__fixtures__/run`
    await run()

    expect(console.log).toHaveBeenCalled()
  })

  it('finds and run an async desplega file', async () => {
    process.cwd = () => `${realCwd()}/test/__fixtures__/run/async`
    await run()

    expect(console.log).toHaveBeenCalled()
  })
})
