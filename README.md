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
  steps:
    - type: remote
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
      "steps": [
        {
          "type": 'remote,
          "title": "Update system",
          "command": "sudo apt-get update"
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
  const files = context.history[0].stdout // We know the files are in the first command result
  const firstFile = files.split('\n')[0]

  return `rm ${firstFile}`
}

module.exports = {
  pipeline: {
    title: 'Desplega',
    steps: [
      {
        type: 'header'
        title: 'Delet oldest file'
      },
      {
        type: 'remote',
        title: 'List files',
        workingDirectory: '~/files',
        command: 'ls -t'
      },
      {
        type: 'remote',
        title: 'Delete oldest one',
        workingDirectory: '~/files',
        command: deleteOldestFile // We create dynamic commands using funtions
      }
    ]
  }
}
```

You can also run common JS async functions as steps by setting the step type as `virtual` and setting the asyncFunxtion property to an async function.

```js
// .desplega.js
async function calculateHash(context, emit) {
  let hash = 0

  for (let i = 0; i < 1000; i++) {
    emit('stdout', `Calculating hash... iteration: ${i}`) // Virtual steps pass an emit function to stream data as stdout or stderr
    hash += Math.random() * 5
  }

  hash = Math.floor(hash)

  context.globals.hash = hash
}

module.exports = {
  pipeline: {
    title: 'Desplega',
    steps: [
      {
        type: 'virtual'
        title: 'Calculate hash',
        asyncFunction: calculateHash
      },
      {
        type: 'local'
        title: 'Create file',
        command: 'touch :hash:.txt' // Access setted globals with :<global>:
      }
    ]
  }
}
```

And finally we can also create pipelines asyncronously before running them by just exporting and async function in our desplega file, or by returning a promise.

```js
// .desplega.js

module.exports async function generatePipeline() {
  const pipelineName = await forSomeAsyncCalls...

  return {
    pipeline: {
      title: pipelineName,
      steps: [...]
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
  steps:
    - type: 'local'
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
  remotes:
    Remote1: ...
    Remote2: ...
  remoteOptions:
    timeout": 1000
  localOptions":
    timeout": 2000
  virtualOptions":
    timeout": 3000
  stages: ...
```

### title

Title of pipeline.

### remotes

Here you write the configuration of every remote you want to send command to.

### remoteOptions

You can configure all the remotes to behave with this options.

- #### timeout [0]
  How much time to wait for a commant to finsih until fail it, default 0 means it does not time out

### localOptions

You can configure how local commands will behave.

- #### timeout [0]
  How much time to wait for a commant to finsih until fail it, default 0 means it does not time out

### virtualOptions

You can configure how virtual commands will behave.

- #### timeout [0]
  How much time to wait for a commant to finsih until fail it, default 0 means it does not time out

### steps

List of steps to run.

## Remote configuration

Set where and how the ssh connection should be done.

```yml
Remote:
  host: host.com
  port: 45
  username: user
  password: somepassword
  privateKey: 'key'
  keepaliveInterval: 666
  keepaliveCountMax: 777
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

### privateKey [home ssh key]

Contents of a ssh private key

### keepaliveInterval [12000]

How much time in ms interval wait to send the alive signal.

### keepaliveCountMax [5]

How many times check for alive signal before stop connection.

## Step definition

Basic step definition

```yml
type: local | remote | virtual
title: Step1
onFailure: continue | terminate
onSuccess: continue | terminate
maxRetries: 1
```

### trype

The type of step; can be: local, remote or virtual

### title

Title of the step.

### onFailure [terminate]

If the step fails continue or terminate the pipeline

### onSuccess [continue]

If the step succeeds continue or terminate the pipeline

### maxRetries [0]

If the step fails how many times retry it

## Local Step definition

Local steps have special definition

```yml
type: local
workingDirectory: path/where/to/run
command: sudo apt-get update
localOptions:
  timeout: 600
```

### workingDirectory [~/]

Where this command shoud be run in the file tree.

### command

Command to execute, you can generate a dynamic command passing a function that resives the current step context.

### localOptions

Local options to override from the pipiline ones.

## Remote Step definition

Remote steps have special definition

```yml
type: remote
workingDirectory: path/where/to/run
command: sudo apt-get update
remoteOptions:
  timeout: 600
```

### workingDirectory [~/]

Where this command shoud be run in the file tree.

### command

Command to execute, you can generate a dynamic command passing a function that resives the current step context.

### remoteOptions

Remote options to override from the pipiline ones.

## Virtual Step definition

Remote steps have special definition

```yml
type: virtual
asyncFunction: sudo apt-get update
virtualOptions:
  timeout: 600
```

### workingDirectory [~/]

Where this command shoud be run in the file tree.

### asyncFunction

Async funxtion to execute

### virtualOptions

Virtual options to override from the pipiline ones.

## Modularization

Modularization can be achieved by writing pipelines using javascript by importing sub components that export stages or steps descriptions.

```js
// .desplega.js
const step1 = require('./update-system')
const step2 = require('./install-ruby')

module.exports = {
  pipeline: {
    title: 'Desplega',
    steps: [step1, step2('2.2.9')]
  }
}
```

## Contributions

PRs are welcome

## Lisence

MIT
