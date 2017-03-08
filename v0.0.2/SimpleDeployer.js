const state = require('./initialState')
const config = require('./config')
const os = require('os')
const fs = require('fs')

const cmdTab = '      '
const cmdDoneTab = '    '

function SimpleDeployer (configuration) {
  this.configuration = configuration || {}
  config.init()
}

SimpleDeployer.prototype.initLifeCycle = function () {
  if (this.state.commands.length === 0) {
    if (this.configuration.show_deploy_messages) {
      console.log(' Nothing to deploy'.nothing_color)
    }
    this.state.connection.end()
  } else {
    this.excecuteCommand(this.state.commands[0])
  }
}

SimpleDeployer.prototype.continuelifeCycle = function (error, stream) {
  if (error) throw error

  var currentCommand = this.currentCommand()
  var stdOut = null
  var stderrOut = null

  stream.on('close', function (code, signal) {
    if (code === 0 || (currentCommand.permited_return_statuses && currentCommand.permited_return_statuses.includes(code))) {
      if (currentCommand.keep_response) {
        currentCommand.response = stdOut
      }

      var timeToHere = process.hrtime(this.state.timeAtCommand)

      console.log(cmdDoneTab + ('✔ ' + formatUnits(this.state.commandCountUp) + ' ' + this.configuration.username + '@' + this.configuration.host).succsess_color + ' ' + formatTime('ss.SSS', timeToHere) + 's')

      if (!this.isLastCommand()) {
        this.excecuteCommand(this.nextCommand(), stdOut || stderrOut, code)
      } else {
        timeToHere = process.hrtime(this.state.initialTime)

        if (this.configuration.show_deploy_messages) {
          console.log('\n' + ' Deploy complete  '.complete_color + ' ' + formatTime('mm:ss', timeToHere) + ' ✔'.complete_time_color)
        } else {
          console.log('\n' + formatTime('mm:ss', timeToHere) + ' ✔'.complete_time_color)
        }
        this.state.connection.end()
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
      this.state.connection.end()
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

SimpleDeployer.prototype.excecuteCommand = function (command, lastResponse, lastCode) {
  this.nextGroupCommandCount()

  if (command.header) {
    var timeToHere = process.hrtime(this.state.initialTime)
    console.log(formatTime('mm:ss', timeToHere) + ' ' + command.header.header_color)

    this.resetGroupCommandCount()

    if (this.isLastCommand()) {
      this.state.connection.end()
    } else {
      this.excecuteCommand(this.nextCommand())
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

    this.state.timeAtCommand = process.hrtime()

    var preCommandToPrint = cmdTab + formatUnits(this.state.commandCountUp) + ' '
    var cliAvailableSpace = process.stdout.columns - preCommandToPrint.length
    var commandToPrint = null

    if (command.generatedInstruction.length > cliAvailableSpace) {
      commandToPrint = command.generatedInstruction.slice(0, cliAvailableSpace - 3) + '...'
    }

    console.log(preCommandToPrint + (commandToPrint || command.generatedInstruction).command_color)

    this.state.connection.exec(command.generatedInstruction, this.continueLifeCycle)
  }
}

SimpleDeployer.prototype.deploy = function (commandsArray) {
  this.state = state(commandsArray)

  console.log(' Connecting...  '.connecting_color)
  this.state.connection.on('ready', this.initLifeCycle.bind(this)).connect({
    host: this.configuration.host,
    port: this.configuration.port,
    username: this.configuration.username,
    privateKey: fs.readFileSync(this.configuration.privatekeypath || (os.homedir() + '/.ssh/id_rsa'))
  })
}

SimpleDeployer.prototype.isLastCommand = function () {
  return this.state.currentCommandIndex === this.state.commands.length - 1
}

SimpleDeployer.prototype.currentCommand = function () {
  return this.state.commands(this.state.currentCommandIndex)
}

SimpleDeployer.prototype.nextCommand = function () {
  return this.state.commands[++this.state.currentCommandIndex]
}

SimpleDeployer.prototype.nextGroupCommandCount = function () {
  this.state.commandCountUp++
}

SimpleDeployer.prototype.resetGroupCommandCount = function () {
  this.state.commandCountUp = 0
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

module.exports = SimpleDeployer
