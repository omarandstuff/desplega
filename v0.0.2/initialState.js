const Client = require('ssh2').Client

module.exports = function (commandsArray) { return {
    connection: new Client(),
    currentCommandIndex: 0,
    initialTime: process.hrtime(),
    timeAtCommand: 0,
    commandCountUp: 0,
    commands: commandsArray || [],
    cmdTab: '      ',
    cmdDoneTab: '    '
  }
}
