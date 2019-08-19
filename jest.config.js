module.exports = {
  transform: {
    '^.+\\.ts?$': 'ts-jest'
  },
  testRegex: '(/test/.*\\.test\\.ts?)$',
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts']
}
