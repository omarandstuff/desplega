#! /usr/bin/env node
import program from 'commander'
import Loader from './Loader'
import Builder from './Builder'

program.version('0.1.0').description('Desplega command line tool')

program
  .command('run [env]')
  .description('run the desplega file in the current directory')
  .allowUnknownOption()
  .action(function(env, options) {
    const descriptor = Loader.load(env)
    const pipeline = Builder.build(descriptor)

    pipeline.run()
  })

program.parse(process.argv)
