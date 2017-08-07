const SSHClient = require('ssh2').Client
const os = require('os')
const fs = require('fs')
const { spawn } = require('child_process');

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
  if (this.commandIndex + 1 === this.commands.length) {
    this.connection.end()
  } else {
    this.commandIndex = this.commandIndex + 1

    const currentCommand = this.commands[this.commandIndex]

    if (currentCommand.dynamic) {
      var rendered = currentCommand.dynamic(lastResult, lastCode)

      currentCommand.command = rendered[0]
      currentCommand.options = rendered[1]
    }

    const excecutionParams = [currentCommand.command, currentCommand.options]

    if(currentCommand.local) {
      excecuteLocalCommand.apply(this, excecutionParams)
    } else {
      executeRemoteCommand.apply(this, excecutionParams)
    }
  }
}

function showResults(command, options, lastResult, lastCode, excecutionTime) {
  console.log(formatTime('ss.SSS', excecutionTime), command, options.join(' '))

  continueLifeCycle.apply(this, [lastResult, lastCode]);
}

function excecuteLocalCommand (command, options = []) {
  const commandExcecutionInitialTime = process.hrtime()
  const excecution = spawn(command, options);
  var fullOutput = ''

  excecution.on('close', (code) => {
    const timeToHere = process.hrtime(commandExcecutionInitialTime)

    showResults.apply(this, [command, options, fullOutput, code, timeToHere])
  });

  excecution.stdout.on('data', (data) => {
    fullOutput += String(data)
  });

  excecution.stderr.on('data', (data) => {
    fullOutput += String(data)
  });
}

function executeRemoteCommand (command, options = []) {
  const commandExcecutionInitialTime = process.hrtime()
  const self = this

  this.connection.exec(command + ' ' + options.join(' '), function (error, stream) {
    if (error) throw error

    var fullOutput = ''

    stream.on('close', function (code, signal) {
      const timeToHere = process.hrtime(commandExcecutionInitialTime)

      showResults.apply(self, [command, options, fullOutput, code, timeToHere])
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
