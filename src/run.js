import { Loader, Parser } from 'desplega-api'
import fs from 'fs'

export default function run(name) {
  const cwd = process.cwd()

  const descriptor = Loader.load(cwd, name)

  if (typeof descriptor === 'function') {
    Parser.buildPipelineAsync(descriptor)
      .then(pipeline => {
        runPipeline(pipeline)
      })
      .catch(_ => {
        console.log('There was an error parsing the pipeline, check your desplega file.')
      })
  } else {
    try {
      runPipeline(Parser.buildPipeline(descriptor))
    } catch (_) {
      console.log('There was an error parsing the pipeline, check your desplega file.')
    }
  }
}

function runPipeline(pipeline) {
  pipeline
    .run()
    .then(logResults)
    .catch(logResults)
}

function logResults(results) {
  const cwd = process.cwd()
  const logDir = `${cwd}/log`
  const logFilePath = `${logDir}/desplega.log`

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir)
  }

  fs.appendFileSync(logFilePath, `>>>>>${new Date()}\n`)
  recursiveLog(logFilePath, results.context.archive.history)
  fs.appendFileSync(logFilePath, `<<<<<${new Date()}\n`)
}

function recursiveLog(logFilePath, records) {
  if (records) {
    if (
      records.stdout !== undefined ||
      records.stderr !== undefined ||
      records.virtualout !== undefined ||
      records.virtualerr !== undefined
    ) {
      fs.appendFileSync(logFilePath, records.stdout || records.stderr || records.virtualout || records.virtualerr)
    } else {
      Object.keys(records).forEach(recordKey => {
        const record = records[recordKey]

        recursiveLog(logFilePath, record)
      })
    }
  }
}
