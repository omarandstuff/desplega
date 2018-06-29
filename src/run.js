import { Loader, Parser } from 'desplega-api'
import fs from 'fs'

export default function run(name) {
  const cwd = process.cwd()

  const descriptor = Loader.load(cwd, name)
  const pipeline = Parser.buildPipeline(descriptor)

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
  if (records.stdout !== undefined || records.stderr !== undefined) {
    fs.appendFileSync(logFilePath, records.stdout || records.stderr)
  } else {
    Object.keys(records).forEach(recordKey => {
      const record = records[recordKey]

      recursiveLog(logFilePath, record)
    })
  }
}
