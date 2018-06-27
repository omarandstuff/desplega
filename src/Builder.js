import * as Desplega from 'desplega-api'

export default class Builder {
  static build(descriptor) {
    if (descriptor instanceof Desplega.default.Pipeline) {
      return descriptor
    } else {
      return Builder._buildFromDescriptor(descriptor)
    }
  }

  static _buildFromDescriptor(descriptor) {
    const { pipeline } = descriptor

    if (pipeline) {
      const { title, remotes, remoteOptions, localOptions, theme, stages } = pipeline
      const pipelineRunner = Desplega.Pipeline(title, { remotes, remoteOptions, localOptions }, theme)

      if (stages) {
        stages.forEach(({ title, steps }) => {
          const stageRunner = Desplega.Stage(title)

          if (steps) {
            steps.forEach(({ remote, ...stepDefinition }) => {
              let stepRunner

              if (remote) {
                stepRunner = Desplega.RemoteStep(stepDefinition)
              } else {
                stepRunner = Desplega.LocalStep(stepDefinition)
              }

              stageRunner.addStep(stepRunner)
            })
          }

          pipelineRunner.addStage(stageRunner)
        })
      }

      return pipelineRunner
    } else {
      throw new Error('No pipe line definition')
    }
  }
}
