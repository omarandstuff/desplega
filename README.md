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
      username": <host username>
      password": <password> #Do not include if you authenticate via public key
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

<img src="https://raw.githubusercontent.com/omarandstuff/desplega/master/media/desplega-demo.gif" alt="Desplega" title="Desplega">
