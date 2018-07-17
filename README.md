<h1 align="center">
  <img src="https://raw.githubusercontent.com/omarandstuff/desplega/master/media/desplega-logo.png" alt="Desplega" title="Desplega" width="512">
</h1>

[![npm version](https://badge.fury.io/js/desplega.svg)](https://www.npmjs.com/package/desplega)
[![Build Status](https://travis-ci.org/omarandstuff/desplega.svg?branch=master)](https://travis-ci.org/omarandstuff/desplega)
[![Maintainability](https://api.codeclimate.com/v1/badges/9af99621b2c02c5fdfe7/maintainability)](https://codeclimate.com/github/omarandstuff/desplega/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/9af99621b2c02c5fdfe7/test_coverage)](https://codeclimate.com/github/omarandstuff/desplega/test_coverage)

Desplega is a general purpose modularizable automatization tool, you can automate virtually any process that you would prefer not to do manually form your terminal.

## Install

```
npm i -g desplega

yarn global add desplega
```

## Basic usage

After installing the global package just create a `.desplega.yml` file in the root of your project

```yml
#.desplega.yml
pipeline:
  title: Desplega
  remotes:
    Host1:
      host: <my host ip or domain>
      username: <host username>
      password: <password> #Do not include if you authenticate via public key
  stages:
      -
        title: Update system
        steps:
          -
            remote: true
            title: Update system
            command: sudo apt-get update
```

Then just using our desplega cammand...

```shell
$ desplega
```

We will see something like this:

![Demo](https://raw.githubusercontent.com/omarandstuff/desplega/master/media/demo.svg?sanitize=true)

Yo can also create an equivalent json file

```js
//.desplega.json
{
  "pipeline": {
    "title": "Desplega",
    "remotes": {
      "Host1": {
        "host": "<my host ip or domain>",
        "username": "<host username>",
        "password": "<password>"
      },
      "stages": [
        {
          "title": "Update system",
          "steps": [
            {
              "remote": true,
              "title": "Update system",
              "command": "sudo apt-get update"
            }
          ]
        }
      ]
    }
  }
}
```

Or using a js file exporting an object, this is particularly useful to create richer pipelines, for example lets delete the oldest file in a directory.

```js
// .desplega.js

function deleteOldestFile(context) {
  const dictionaryOfCommandResultsById = context.archive.dictionary
  const commandUsingId = dictionaryOfCommandResultsById['list_command']
  const resultStdout = commandUsingId.stdout
  const firstFilePrintedInTheStdout = resultStdout.split('\n')[0]

  return `rm ${firstFilePrintedInTheStdout}`
}

module.exports = {
  pipeline: {
    title: 'Desplega',
    stages: [
      {
        title: 'Delet oldest file',
        steps: [
          {
            id: 'list_command', // Including id we can access its result in the archive dictionary
            title: 'Update system',
            path: '~/files',
            command: 'ls -t'
          },
          {
            title: 'Update system',
            path: '~/files',
            command: deleteOldestFile // We create dynamic commands using funtions
          }
        ]
      }
    ]
  }
}
```

Note: We didn't configured any remote this means we can run commands in or local machine too.

And finally we can also create pipelines asyncronously before running them by just exporting and async function in our desplega file, or by returning a promise.

```js
// .desplega.js

module.exports async function generatePipeline() {
  const pipelineName = await forSomeAsyncCalls...

  return {
    pipeline: {
      title: pipelineName,
      stages: [...]
    }
  }
}
```

## Naming convetions
You can name your desplega files with some subfix so you can run them independently. For example a desplega file to set up enviroment.

```yml
#.desplega.local.yml
pipeline:
  title: Desplega
  stages:
      -
        title: Install dependencies
        steps:
          -
            title: npm packages
            command: npm install
```

you can run this pipeline by using the desplega command and including the desplega file subfix as a command.

```shell
$ desplega local
```

### Desplega folder hierarchy
You can also specify a directory in where you can place more complex projects in a folder called `.desplega`. The following folder structure will behave exactly as if we were using a simple desplega file.

```
.desplega
 |__ deploy.js
```

and we can running just by calling the desplega command.

```shell
$ desplega
```

Just as the naming convention example you can specify other pipeline files in the .desplega folder hierarchy.

```
.desplega
 |__ local.js
```

will run with


```shell
$ desplega local
```

## Pipeline configurations

Pipelines can have more than one remote to send commands, you can even set different theme colors to show in the terminal pipeline UI.

```yml
pipeline:
  title: Pipeline Name
  verbosityLevel: full
  remotes:
    Remote1: ...
    Remote2: ...
  remoteOptions:
    maxRetries": 10
    maxReconnectionRetries: 12
    reconnectionInterval: 6000
    timeOut": 1000
  localOptions":
    maxRetries": 2
    timeOut": 2000
  stages: ...
```

### title

Text to display at the top of the pipeline UI.

### verbosityLevel [partial]

Standard output will be filtered by default (`partial`) and just show a portion of it while running a command as you can notice in the above gif.

Valid values

- partial
- full

If you prefer you can set the pipeline to print all the output a command produce (`full`).

### remotes

Here you write the configuration of every remote you want to send command to.

### remoteOptions

You can configure all the remotes to behave with this options.

- #### maxRetries [0]
  How many times try to run a command until it succedes, not counting the first attempt
- #### maxReconnectionRetries [0]
  If the connection is lost how many times try to reconnect
- #### reconnectionInterval [5000]
  If the connection is lost how much time in ms wait until try to connect again
- #### timeOut [0]
  How much time to wait for a commant to finsih until fail it, default 0 means it does not time out

### localOptions

You can configure how local commands will behave.

- #### maxRetries [0]
  How many times try to run a command until it succedes, not counting the first attempt
- #### timeOut [0]
  How much time to wait for a commant to finsih until fail it, default 0 means it does not time out

### theme

You can pass HEX formated color values to use insted of the UI default ones.

```yml
theme:
  backgroundColor: "#FFFFFF" #Background color to use for all the pipelne messages
  failureColor: "#FFFFFF" #Color for messages related to failures
  failureContrastColor: "#FFFFFF" #If set failure messages will be rendered with background
  mainColor: "#FFFFFF" #color to use for relevant info
  pipelineHeaderColor: "#FFFFFF" #Color for pipeline header
  pipelineHeaderContrastColor: "#FFFFFF" #If set pipeline header will be rendered with background
  stageHeaderColor: "#FFFFFF" #Color for stage header
  stageHeaderContrastColor: "#FFFFFF" #If set stage header will be rendered with background
  stepHeaderColor: "#FFFFFF" #Color for step related messages
  stepStatusColor: "#FFFFFF" #Color for step status related messages
  subStepHeaderColor: "#FFFFFF" #Color for sub step related messages
  subStepStatusColor: "#FFFFFF" #Color for sub step status related messages
  successColor: "#FFFFFF" #Color for messages related to success
  successContrastColor: "#FFFFFF" #If set success messages will be rendered with background
```

### stages

List of stages to run, this is meant to separate logic between steps.

## Remote configuration

Set where and how the ssh connection should be done.

```yml
Remote:
  host: host.com
  port: 45
  username: user
  password: somepassword
  privateKeyPath: /path/to/key/id_rsa
  keepaliveInterval: 666
  keepaliveCountMax: 777
  options:
    maxRetries: 2,
    maxReconnectionRetries: 2,
    reconnectionInterval: 12,
    timeOut: 600
  }
}
```

### host

IP or domain to stablish the ssh connection with.

### port [22]

You can change the port used for the ssh connection.

### username [root]

User name to use in the ssh connection.

### password

If you don't authenticate using your public key, you can specify a pasword to use when stablish the ssh connection.

### keepaliveInterval [12000]

How much time in ms interval wait to send the alive signal.

### keepaliveCountMax [5]

How many times check for alive signal before stop connection.

### options

The same as the remoteOptions but just for this remote.

## Stage configurations

Stages can override configurations from the pipeline so it only aplies to the child steps.

```yml
  title: Stage1
  verbosityLevel: full
  remotes:
    - Remote1
    - Remote2
  remoteOptions:
    maxRetries: 3
    maxReconnectionRetries: 1
    reconnectionInterval: 40
    timeOut: 6000
  localOptions:
    maxRetries: 1
    imeOut: 500
  steps: ...
```

### title

Text to display at the top of the stage UI.

### verbosityLevel [partial]

Verbosity level to use only under this stage context.

### remotes

Array of strings to filter the remotes to only use under this stage context.

### remoteOptions

Remote options to use only under this stage context.

### localOptions

Local options to use only under this stage context.

### steps

List of steps to run under this stage context.

### Step configurations

Steps can override configurations from the parent Stage so it only aplies to it.

```yml
  remote: true
  title: Step1
  path: path/where/to/run
  command: sudo apt-get update
  verbosityLevel: full
  remotes:
    - Remote1
    - Remote2
  onFailure: ...
  recoverOnFailure: true
  continueOnFailure: true
  options:
    maxRetries: 1
    maxReconnectionRetries: 4
    reconnectionInterval: 2
    timeOut: 600
```

### remote [false]

Should this step run remotly.

### title

Text to display to represent this step in the UI.

### path [~/]

Where this command shoud be run in the file tree.

### command

Command to execute, you can generate a dynamic command passing a function that resives the current step context.

### verbosityLevel [partial]

Verbosity level to use only for this step.

### remotes

Array of strings to filter the remotes to only use for this step.

### onFailure

You can describe another step here to run if the current step fails

### recoverOnFailure [false]

Should the pipeline continue if the sub step succeds?.

### continueOnFailure: true

Should the pipeline continue even if this step fails?.

### options

Remote or local options to use only for this step.

## Modularization

Modularization can be achieved by writing pipelines using javascript by importing sub components that export stages or steps descriptions.

```js
// .desplega.js
const Stage1 = require('./update-system')
const Stage2 = require('./install-ruby')

module.exports = {
  pipeline: {
    title: 'Desplega',
    stages: [Stage1, Stage2('2.2.9')]
  }
}
```

## Contributions

PRs are well accepted.

## Lisence

MIT
