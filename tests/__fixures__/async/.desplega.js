module.exports = async function generatePipeline() {
  return {
    pipeline: {
      title: 'Async Fixture',
      stages: [
        {
          title: 'Stage',
          steps: [
            {
              title: 'Step',
              command: 'ls'
            }
          ]
        }
      ]
    }
  }
}
