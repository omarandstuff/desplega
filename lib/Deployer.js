const SSHClient = require('ssh2').Client
const { spawn } = require('child_process')
const os = require('os')
const fs = require('fs')
const chalk = require('chalk')

function Deployer (configuration) {
  this.configuration = configuration
  this.connection = new SSHClient()
}

Deployer.prototype.deploy = function (commands) {
  this.commands = commands

  if (this.commands.length === 0) {
    if (this.configuration.showDeployMessages) {
      console.log(chalk.bgHex('#ff7f00')(' Nothing to deploy  '))
    }
  } else {
    connect.apply(this)
  }
}

module.exports = Deployer

function initLifeCycle () {
  this.initialTime = process.hrtime()
  this.commandIndex = -1
  this.commanInBlock = 0
  
  continueLifeCycle.apply(this)
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

    this.commanInBlock += 1

    var preCommand = '      ' + formatUnits(this.commanInBlock)
    var cliAvailableSpace = process.stdout.columns - preCommand.length
    var finalCommand = currentCommand.command + ' ' + currentCommand.options.join(' ')

    if (finalCommand.length > cliAvailableSpace) {
      finalCommand = finalCommand.slice(0, cliAvailableSpace - 4) + '...'
    }

    console.log(preCommand, chalk.yellow(finalCommand))

    if(currentCommand.message) {
      console.log('     ', formatUnits(this.commanInBlock), chalk.cyan(currentCommand.message))
    }

    if(currentCommand.local) {
      excecuteLocalCommand.apply(this, [currentCommand])
    } else {
      executeRemoteCommand.apply(this, [currentCommand])
    }
  } else {
    const timeToHere = process.hrtime(this.initialTime)

    this.connection.end()

    if (this.configuration.showDeployMessages) {
      console.log(chalk.bgHex('#ff7f00')('\n Deploy complete  '), formatTime('mm:ss', timeToHere), chalk.hex('#ff7f00')('✔'))
    }
  }
}

function showResults(command, lastResult, lastCode, excecutionTime, error) {
  if(lastCode !== 0 && !command.continueOnErrorCode) {
    this.connection.end()

    lastResult.split('\n').forEach(function (line) {
      console.log('      ', chalk.red.dim(line))
    })

    if(error) {
      console.log('      ', chalk.red.dim(error))
    }

    if(command.local) {
      console.log(chalk.red('    x ' + formatUnits(this.commanInBlock) + ' local'), 'code: ' + lastCode)
    } else {
      console.log(chalk.red('    x ' + formatUnits(this.commanInBlock) + ' ' + this.configuration.username + '@' + this.configuration.host), 'code: ' + lastCode)
    }
  } else {
    if (command.showResults) {
      lastResult.split('\n').forEach(function (line) {
        console.log('      ', chalk.dim(line))
      })
    }

    if(command.local) {
      console.log(chalk.green('    ✔ ' + formatUnits(this.commanInBlock) + ' local'), formatTime('ss.SSS', excecutionTime) + 's')
    } else {
      console.log(chalk.green('    ✔ ' + formatUnits(this.commanInBlock) + ' local' + this.configuration.username + '@' + this.configuration.host), formatTime('ss.SSS', excecutionTime) + 's')
    }

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
      const timeToHere = process.hrtime(this.initialTime)
      this.commanInBlock = 0

      console.log(formatTime('mm:ss', timeToHere), chalk.bold.rgb(10, 100, 200)(currentCommand.header))

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

function connectionError (error) {
  console.log('')
  console.log('        Code: ', error.code)
  console.log('        Host: ', this.configuration.host)
  console.log('        Port: ', this.configuration.port)
  console.log('    Username: ', this.configuration.username)
  console.log('')
  console.log(chalk.bgRed(' Connection error  '))
}

function connect () {
  this.connection.on('ready', initLifeCycle.bind(this))
  this.connection.on('error', connectionError.bind(this))

  if(this.configuration.showDeployMessages) {
    console.log(chalk.bgGreen(' Connecting...     '))
  }

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
