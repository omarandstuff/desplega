import { Loader, Parser } from 'desplega-api'
import fs from 'fs'
import util from 'util'

export default function run(name) {
  const cwd = process.cwd()

  const descriptor = Loader.load(cwd, name)

  if (typeof descriptor === 'function') {
    Parser.buildPipelineAsync(descriptor)
      .then(pipeline => {
        runPipeline(pipeline)
      })
      .catch(error => {
        console.log('There was an error parsing the pipeline, check your desplega file.')
        console.log(error)
      })
  } else {
    try {
      runPipeline(Parser.buildPipeline(descriptor))
    } catch (error) {
      console.log('There was an error parsing the pipeline, check your desplega file.')
      console.log(error)
    }
  }
}

function runPipeline(pipeline) {
  pipeline
    .run()
    .then(logResults.bind(this, false))
    .catch(logResults.bind(this, true))
}

function logResults(failed, results) {
  const cwd = process.cwd()
  const logDir = `${cwd}/log`
  const logFilePath = `${logDir}/desplega.log`

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir)
  }

  fs.appendFileSync(logFilePath, `>>>>>${new Date()}\n`)
  recursiveLog(logFilePath, results.context.archive.history)
  fs.appendFileSync(logFilePath, `<<<<<${new Date()}\n`)

  if (failed && results.context.archive.history.length > 0) {
    recursiveLog('', [results.context.archive.history[results.context.archive.history.length - 1]], false)
  }
}

function recursiveLog(logFilePath, records, onFile = true) {
  records.forEach(record => {
    if (record instanceof Array) {
      recursiveLog(logFilePath, record)
    } else {
      if (record) {
        if (
          record.stdout !== undefined ||
          record.stderr !== undefined ||
          record.virtualout !== undefined ||
          record.virtualerr !== undefined
        ) {
          const line = getLine(logFilePath, record.stdout || record.stderr || record.virtualout || record.virtualerr)
          if (onFile) {
            fs.appendFileSync(logFilePath, line)
          } else {
            console.log(line)
          }
        } else {
          const line = getLine(logFilePath, record)
          if (onFile) {
            fs.appendFileSync(logFilePath, line)
          } else {
            console.log(line)
          }
        }
      }
    }
  })
}

function getLine(path, line) {
  const processedLine = line instanceof Object ? util.inspect(line) : line || ''
  return processedLine[processedLine.length - 1] === '\n' ? processedLine : `${processedLine}\n`
}
