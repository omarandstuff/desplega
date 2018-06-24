import moment from 'moment'
import Step from './Step'

/**
 * In takes some remote manager objects and print formated information about
 * their status.
 *
 * @param {Object} definition a definition object.
 * Definistion attributes are:
 * title: Title for this step Example: 'Install node.js'.
 * command: The actual command to be executed. or a function to build a dynamic
 *   command
 *   function(context)
 *     where context is the context recieved by the step it shuld comtain
 *     a list of the results of previous steps
 *   results history so the user
 * path: Which path will be used as a cwd for the command.
 * remotes: Array of remote ids to filter, so the command will be
 *   executed only in those.
 * onFailure: Any object of funtion that return and Promise
 *   (Example: other RemoteStep).
 * recoverOnFailure: if the onFailure attribute is set and succeed
 *   this step will resolve instead of reject.
 * continueOnFailure: it does not matter if this step fails or onFailure fails
 *   it will resolve anyways.
 * options: options to overide in the remote objects: (See RemoteManager options)
 * verbosityLevel:
 *   'full': will the streamed output of the command
 *   'partial': will print only the last output line in the status bar.
 *
 */

export default class RemoteStep extends Step {
  constructor(definition) {
    super(definition)
    this.typeIcon = 'ssh'
  }

  /**
   * Starts resolving the remote object and print the status of it.
   *
   * @param {Object} context context in which this step is runnig
   * context attributes are:
   * remotes: Array of remotes avalilable in this context
   * childIndex: This step can be part of a list of steps, so wich number is it.
   * globalStartTime: At what time all this started.
   * stackLevel: Tab size to be printed depending on the context.
   * substep: In case this step was called as recovery step.
   * verbocityLevel: Global verbocity level.
   *
   * @returns {Promise} Promise to be solved or rejected.
   * when solving or rejecting will pass the remotes results
   * (See RemoteManager exec method for more details)
   *
   */

  run(context) {
    return new Promise((resolve, reject) => {
      if (this.status === 'idle') {
        this.context = this._buildContext(context)

        if (this.context.remotes.length === 0) {
          return resolve('Nothing to deploy')
        }

        this.startTime = moment()
        this.remotesIds = []
        this.currentRun = {}
        this.remotesFinished = 0
        this.status = 'running'

        this.context.remotes.forEach(remote => {
          this.remotesIds.push(remote.id)
          this.currentRun[remote.id] = { status: 'online', remote: remote }
        })

        if (this.definition.command instanceof Function) {
          this.command = this.definition.command(this.context)
        } else {
          this.command = this.definition.command
        }

        this.resolve = resolve
        this.reject = reject

        this._printHeader()
        this._runAnimation()

        this.remotesIds.forEach(id => {
          this.currentRun[id].status = 'running'
          this.currentRun[id].remote
            .exec(`${this._buildPathCommand()}${this.command}`, this._onStream.bind(this, id), this.context.options)
            .then(result => {
              this.currentRun[id].status = 'done'
              this.currentRun[id].result = result

              if (++this.remotesFinished === this.remotesIds.length) {
                clearTimeout(this.animation)
                this._onSuccess()
              }
            })
            .catch(error => {
              this.currentRun[id].status = 'fail'
              this.currentRun[id].result = error

              if (++this.remotesFinished === this.remotesIds.length) {
                clearTimeout(this.animation)
                this._onFailure()
              }
            })
        })
      } else {
        reject(new Error('Step bussy'))
      }
    })
  }

  _buildContext(context) {
    return {
      ...context,
      remotes: this._filterRemotes(context.remotes),
      options: { ...context.remoteOptions, ...this.definition.options },
      verbosityLevel: this.definition.verbosityLevel || context.verbosityLevel
    }
  }

  _filterRemotes(remotes) {
    return remotes.filter(remote => {
      return !this.definition.remotes || this.definition.remotes.includes(remote.id)
    })
  }

  _generateLoaders(includeId) {
    return this.remotesIds
      .map(id => {
        if (this.currentRun[id].status === 'done') {
          return '✔'
        } else if (this.currentRun[id].status === 'fail') {
          return `✖${includeId ? id : ''}`
        } else {
          return this._solveLoader(id)
        }
      })
      .join(' ')
  }

  _solveLoader(id) {
    const animationChars = this.loadChars[this.currentRun[id].remote.feedback]
    const currentLoadChar = animationChars[this.animationTick % animationChars.length]
    const attemptsChar = this.currentRun[id].remote.currentRun
      ? this._solveSuperScript(this.currentRun[id].remote.currentRun.attempts)
      : ''

    return `${currentLoadChar}${attemptsChar}`
  }
}
