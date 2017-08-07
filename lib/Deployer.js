const SSHClient = require('ssh2').Client
const { spawn } = require('child_process')
const os = require('os')
const fs = require('fs')

function Deployer (configuration) {
  this.configuration = configuration
  this.connection = new SSHClient()
}

Deployer.prototype.deploy = function (commands) {
  this.commands = commands

  connect.apply(this)
}

module.exports = Deployer

function initLifeCycle () {
  this.initialTime = process.hrtime()
  this.commandIndex = -1

  if (this.commands.length === 0) {
    this.connection.end()
  } else {
    continueLifeCycle.apply(this)
  }
}

function continueLifeCycle(lastResult, lastCode) {
  const currentCommand = selectCommand.apply(this)

  if (currentCommand) {
    currentCommand.options = currentCommand.options || []

    if (currentCommand.dynamic) {
      var rendered = currentCommand.dynamic(lastResult, lastCode)

      currentCommand.command = rendered[0]
      currentCommand.options = rendered[1]
    }

    console.log(currentCommand.command, currentCommand.options.join(' '))

    if(currentCommand.local) {
      excecuteLocalCommand.apply(this, [currentCommand])
    } else {
      executeRemoteCommand.apply(this, [currentCommand])
    }
  } else {
    this.connection.end()
  }
}

function showResults(command, lastResult, lastCode, excecutionTime, error) {
  if(lastCode !== 0 && !command.continueOnErrorCode) {
    this.connection.end()

    console.log('Failed', lastResult, lastCode, error)
  } else {
    console.log(formatTime('ss.SSS', excecutionTime), command.command, command.options.join(' '))

    continueLifeCycle.apply(this, [lastResult, lastCode])
  }
}

function selectCommand() {
  this.commandIndex = this.commandIndex + 1

  if(this.commandIndex === this.commands.length) {
    return undefined
  } else {
    const currentCommand = this.commands[this.commandIndex]

    if(currentCommand.header) {
      console.log(this.initialTime, process.hrtime(this.initialTime))
      const timeToHere = process.hrtime(this.initialTime)

      console.log(formatTime('mm:ss', timeToHere), currentCommand.header)

      return selectCommand.apply(this)
    }

    return currentCommand
  }
}

function excecuteLocalCommand (command) {
  const commandExcecutionInitialTime = process.hrtime()
  const excecution = spawn(command.command, command.options)
  var fullOutput = ''
  var excecutionError = undefined

  excecution.on('close', (code) => {
    const timeToHere = process.hrtime(commandExcecutionInitialTime)

    showResults.apply(this, [command, fullOutput, code, timeToHere, excecutionError])
  })

  excecution.on('error', (error) => {
    excecutionError = error
  })

  excecution.stdout.on('data', (data) => {
    fullOutput += String(data)
  })

  excecution.stderr.on('data', (data) => {
    fullOutput += String(data)
  })
}

function executeRemoteCommand (command) {
  const commandExcecutionInitialTime = process.hrtime()
  const self = this

  this.connection.exec(command.command + ' ' + command.options.join(' '), function (error, stream) {
    if (error) throw error

    var fullOutput = ''

    stream.on('close', function (code, signal) {
      const timeToHere = process.hrtime(commandExcecutionInitialTime)

      showResults.apply(self, [command, fullOutput, code, timeToHere])
    })

    stream.on('data', function (data) {
      fullOutput += String(data)
    })

    stream.stderr.on('data', function (data) {
      fullOutput += String(data)
    })
  })
}

function showBanner (message, language) {
  console.log(this.message, ' - ', this.language)
}

function continueConnection () {
  console.log('Connection continued')
}

function connectionError (error) {
  console.log('Connection error')
  console.log(error)
}

function connectionEnded () {
  console.log('Connection ended')
}

function connectionClosed (hadError) {
  console.log('Connection closed', hadError ? ' with error' : '')
}

function connect () {
  this.connection.on('ready', initLifeCycle.bind(this))
  this.connection.on('banner', showBanner.bind(this))
  this.connection.on('continue', continueConnection.bind(this))
  this.connection.on('error', connectionError.bind(this))
  this.connection.on('end', connectionEnded.bind(this))
  this.connection.on('close', connectionClosed.bind(this))

  this.connection.connect({
    host: this.configuration.host,
    port: this.configuration.port,
    username: this.configuration.username,
    privateKey: getPrivateKey(this.configuration.private_key_path),
    password: this.configuration.password
  })
}

function getPrivateKey (path) {
  return fs.readFileSync(path || getLocalPrivateKeyPath())
}

function getLocalPrivateKeyPath () {
  return os.homedir() + '/.ssh/id_rsa'
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
