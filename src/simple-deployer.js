/*!
 * simple deployer
 * Copyright(c) David de Anda
 * MIT Licensed
 */

module.exports = createDeployer

var Client = require('ssh2').Client
var os = require('os')
var fs = require('fs')
var colors = require('colors')

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

function createDeployer () {
  return new SimpleDeployer()
}

function SimpleDeployer () {
  this.configuration = {}

  var connection = new Client()
  var configuration = {}
  var currentCommandIndex = 0
  var initialTime = 0
  var timeAtCommand = 0
  var commandCountUp = 0
  var commands = []
  var cmdTab = '      '
  var cmdDoneTab = '    '

  function initLifeCycle (commandArray) {
    currentCommandIndex = 0
    commands = commandArray || []
    initialTime = process.hrtime()
    commandCountUp = 0
    configuration = this.configuration

    if (commands.length === 0) {
      if (configuration.show_deploy_messages) {
        console.log(' Nothing to deploy  '.nothing_color)
      }
      connection.end()
    } else {
      excecuteCommand(commands[0])
    }
  }

  function continueLifeCycle (error, stream) {
    if (error) throw error

    var isLastCommand = currentCommandIndex === commands.length - 1
    var currentCommand = commands[currentCommandIndex]
    var stdOut = null
    var stderrOut = null

    stream.on('close', function (code, signal) {
      if (code === 0 || (currentCommand.permited_return_statuses && currentCommand.permited_return_statuses.indexOf(code) !== -1)) {
        if (currentCommand.keep_response) {
          currentCommand.response = stdOut
        }

        var timeToHere = process.hrtime(timeAtCommand)

        console.log(cmdDoneTab + ('✔ ' + formatUnits(commandCountUp) + ' ' + configuration.username + '@' + configuration.host).succsess_color + ' ' + formatTime('ss.SSS', timeToHere) + 's')

        if (!isLastCommand) {
          excecuteCommand(commands[++currentCommandIndex], stdOut || stderrOut, code)
        } else {
          timeToHere = process.hrtime(initialTime)

          if (configuration.show_deploy_messages) {
            console.log('\n' + ' Deploy complete  '.complete_color + ' ' + formatTime('mm:ss', timeToHere) + ' ✔'.complete_time_color)
          } else {
            console.log('\n' + formatTime('mm:ss', timeToHere) + ' ✔'.complete_time_color)
          }
          connection.end()
        }
      } else {
        console.log('\n')
        console.log(': There was an error while deploying  '.error_color)
        if (stdOut) {
          console.log('Code: ' + formatUnits(code) + ' ' + stdOut.stderr_color)
        }
        if (stderrOut) {
          console.log('Code: ' + formatUnits(code) + ' ' + stderrOut.stderr_color)
        }
        connection.end()
      }
    }).on('data', function (data) {
      stdOut = String(data)

      if (stdOut && currentCommand.show_result) {
        console.log(stdOut)
      }
    }).stderr.on('data', function (data) {
      stdOut = String(data)

      if (stdOut && currentCommand.show_result) {
        console.log(stdOut)
      }
    })
  }

  function excecuteCommand (command, lastResponse, lastCode) {
    var isLastCommand = currentCommandIndex === commands.length - 1

    commandCountUp++

    if (command.header) {
      var timeToHere = process.hrtime(initialTime)
      console.log(formatTime('mm:ss', timeToHere) + ' ' + command.header.header_color)

      commandCountUp = 0

      if (isLastCommand) {
        connection.end()
      } else {
        excecuteCommand(commands[++currentCommandIndex])
      }
    } else {
      if (command.message) {
        console.log(cmdTab + command.message.message_color)
      }

      if (typeof command.instruction === 'function') {
        command.generatedInstruction = command.instruction(lastResponse, lastCode)
      } else {
        command.generatedInstruction = command.instruction
      }

      timeAtCommand = process.hrtime()

      var preCommandToPrint = cmdTab + formatUnits(commandCountUp) + ' '
      var cliAvailableSpace = process.stdout.columns - preCommandToPrint.length
      var commandToPrint = null

      if (command.generatedInstruction.length > cliAvailableSpace) {
        commandToPrint = command.generatedInstruction.slice(0, cliAvailableSpace - 3) + '...'
      }

      console.log(preCommandToPrint + (commandToPrint || command.generatedInstruction).command_color)

      connection.exec(command.generatedInstruction, continueLifeCycle)
    }
  }

  this.deploy = function (commandArray) {
    this.startedat = new Date()
    this.totaltime = 0

    console.log(' Connecting...  '.connecting_color)
    connection.on('ready', initLifeCycle.bind(this, commandArray)).connect({
      host: this.configuration.host,
      port: this.configuration.port,
      username: this.configuration.username,
      privateKey: fs.readFileSync(this.configuration.privatekeypath || (os.homedir() + '/.ssh/id_rsa'))
    })
  }
}

function formatTime (format, hrtime) {
  if (format === 'mm:ss') {
    var minutes = parseInt(hrtime[0] / 60, 10)
    var newSconds = hrtime[0] - (minutes * 60)

    return formatUnits(minutes) + ':' + formatUnits(newSconds)
  } else if (format === 'ss.SSS') {
    return hrtime[0] + '.' + formatUnits(parseInt(hrtime[1] / 1000)).slice(0, 3)
  }
}

function formatUnits (units) {
  return String((units < 10 ? '0' + units : units))
}
