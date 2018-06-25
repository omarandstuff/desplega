const fs = jest.genMockFromModule('fs')

fs.existsSync = function(path) {
  return true
}

fs.readFileSync = function(path) {
  return 'content'
}

module.exports = fs
