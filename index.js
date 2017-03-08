const SimpleDeployer = require('./v0.0.2/SimpleDeployer')
const sd = new SimpleDeployer({
  host: 'ardillasypinguinos.com',
  port: 22,
  username: 'deploy',
  show_deploy_messages: true,
})

var commands = [{ instruction: 'ls' }, { instruction: 'ls' }]

sd.deploy(commands)

