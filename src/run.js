import { Loader, Parser } from 'desplega-api'

const cwd = process.cwd()

export default function run(name) {
  const descriptor = Loader.load(cwd, name)
  const pipeline = Parser.buildPipeline(descriptor)

  pipeline
    .run()
    .then(results => {})
    .catch(results => {})
}
