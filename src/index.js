#! /usr/bin/env node
import program from 'commander'
import run from './run'

program
  .version('2.0.8')
  .description('Desplega command line tool')
  .allowUnknownOption()

program
  .command('*')
  .description('run the desplega file in the current directory or a named one')
  .allowUnknownOption()
  .action(run)

program.parse(process.argv)

if (program.args.length < 1) {
  run()
}
