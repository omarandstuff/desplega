import { Parser, PipelineParserDescriptor, Pipeline, ConsoleLogger } from 'desplega-api'
import Loader from './Loader'

export default async function run(name?: string): Promise<void> {
  const cwd = process.cwd()
  const loader: Loader = new Loader()
  let parser: Parser
  let pipeline: Pipeline

  try {
    const descriptor: any = loader.load(cwd, name)
    const descriptorCheck = {}.toString.call(descriptor)

    if (descriptorCheck === '[object AsyncFunction]' || descriptorCheck === '[object Function]') {
      const actualDescriptor: PipelineParserDescriptor = await descriptor()
      parser = new Parser(actualDescriptor)
    } else {
      parser = new Parser(descriptor)
    }

    pipeline = parser.build()

    new ConsoleLogger(pipeline)
  } catch (error) {
    console.log(error.message)
  }

  if (pipeline) return await pipeline.run()
}
