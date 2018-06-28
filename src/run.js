import { Loader, Parser } from 'desplega-api'
import fs from 'fs'

export default function run(name) {
  const cwd = process.cwd()

  console.log(name)

  const descriptor = Loader.load(cwd, name)
  const pipeline = Parser.buildPipeline(descriptor)

  pipeline
    .run()
    .then(logResults)
    .catch(logResults)
}

function logResults(results) {
  const cwd = process.cwd()

  fs.appendFileSync(`${cwd}/desplega.log`, '////////\n')
}
