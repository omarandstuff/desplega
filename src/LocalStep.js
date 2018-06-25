import moment from 'moment'
import Step from './Step'

/**
 * In takes a local manager object and prints information about its results
 *
 * @param {Object} definition a definition object.
 * Definition attributes are:
 * title: Title for this step Example: 'Install Ruby on Rails'.
 * command: The actual command to be executed. or a function to build a dynamic
 *   command
 *   function(context)
 *     where context is the context recieved by the step it should contain
 *     a the results archive.
 * path: Which path will be used as a cwd for the command.
 * onFailure: Any object of funtion that return and Promise
 *   (Example: other LocalStep).
 * recoverOnFailure: if the onFailure attribute is set and succeed
 *   this step will resolve instead of reject.
 * continueOnFailure: it does not matter if this step fails or onFailure fails
 *   it will resolve anyways.
 * options: options to overide in the local object: (See LocalManager options)
 * verbosityLevel:
 *   'full': will the streamed output of the command
 *   'partial': will print only the last output line in the status bar.
 *
 */

export default class RemoteStep extends Step {
  constructor(definition) {
    super(definition)
    this.typeIcon = 'local'
  }

  /**
   * Starts resolving the local object and print the status of it.
   *
   * @param {Object} context context in which this step is runnig
   * context attributes are:
   * local: the local object that exec local commands
   * childIndex: This step can be part of a list of steps, so wich number is it.
   * globalStartTime: At what time all this started.
   * stackLevel: Tab size to be printed depending on the context.
   * subStep: In case this step was called as recovery step.
   * verbocityLevel: Global verbocity level.
   *
   * @returns {Promise} Promise to be solved or rejected.
   * when solving or rejecting will pass the results
   * (See LocalManager exec method for more details)
   *
   */

  run(context) {
    return new Promise((resolve, reject) => {
      if (this.status === 'idle') {
        this.context = this._buildContext(context)

        this.status = 'running'
        this.startTime = moment()
        this.currentRun = {}

        if (this.definition.command instanceof Function) {
          this.command = this.definition.command(this.context)
        } else {
          this.command = this.definition.command
        }

        this.resolve = resolve
        this.reject = reject

        this._printHeader()
        this._runAnimation()

        this.currentRun.status = 'running'
        this.context.local
          .exec(`${this._buildPathCommand()}${this.command}`, this._onStream.bind(this), this.context.options)
          .then(result => {
            this.currentRun.status = 'done'
            this.currentRun.result = result

            clearTimeout(this.animation)
            this._onSuccess()
          })
          .catch(error => {
            this.currentRun.status = 'fail'
            this.currentRun.result = error

            clearTimeout(this.animation)
            this._onFailure()
          })
      } else {
        reject(new Error('Step bussy'))
      }
    })
  }

  _buildContext(context) {
    return {
      ...context,
      options: { ...context.localOptions, ...this.definition.options },
      verbosityLevel: this.definition.verbosityLevel || context.verbosityLevel
    }
  }

  _generateLoaders() {
    if (this.currentRun.status === 'done') {
      return '✔'
    } else if (this.currentRun.status === 'fail') {
      return '✖'
    } else {
      return this._solveLoader()
    }
  }

  _solveLoader() {
    const animationChars = this.loadChars[this.context.local.feedback]
    const currentLoadChar = animationChars[this.animationTick % animationChars.length]
    const attemptsChar = this.context.local.currentRun
      ? this._solveSuperScript(this.context.local.currentRun.attempts)
      : ''

    return `${currentLoadChar}${attemptsChar}`
  }
}
