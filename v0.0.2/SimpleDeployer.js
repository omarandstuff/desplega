const state = require('./initialState')
const config = require('./config')

function SimpleDeployer (configuration) {
  this.configuration = configuration || {}
  config.init()
}

SimpleDeployer.prototype.initLifeCycle = function (commandsArray) {
  this.state = state(commandsArray)

  if (this.state.commands.length === 0) {
    if (this.configuration.show_deploy_messages) {
      console.log(' Nothing to deploy'.nothing_color);
    }
    this.state.connection.end()
  } else {
    this.excecuteCommand(this.state.commands[0])
  }
}

module.exports = SimpleDeployer
