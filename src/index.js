#! /usr/bin/env node
import program from 'commander'
import run from './run'

program.version('0.1.0').description('Desplega command line tool')

program
  .command('run [name]')
  .description('run the desplega file in the current directory or a named one')
  .allowUnknownOption()
  .action(run)

program.parse(process.argv)
