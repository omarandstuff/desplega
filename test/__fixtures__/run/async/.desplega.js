module.exports = async function generatePipeline() {
  return {
    pipeline: {
      title: 'Async Fixture',
      steps: [
        {
          type: 'local',
          title: 'no',
          command: 'touch async.txt'
        }
      ]
    }
  }
}
