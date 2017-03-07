const colors = require('colors')

module.exports = {
  init: function () {
    colors.setTheme({
      connecting_color: ['white', 'bgGreen'],
      header_color: ['bold', 'cyan'],
      command_color: 'yellow',
      message_color: ['white', 'bgYellow'],
      succsess_color: 'green',
      error_color: ['white', 'bgRed'],
      nothing_color: ['white', 'bgYellow'],
      stderr_color: ['red'],
      complete_color: ['white', 'bgCyan'],
      complete_time_color: ['cyan']
    })
  }
}
