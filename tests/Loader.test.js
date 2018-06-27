import Loader from '../src/Loader'

const fixturesFolder = `${process.cwd()}/tests/__fixtures__/`

describe('Loader#load', () => {
  it('prioretizes yml if not json or js formats', () => {
    const prioretizableYmlPlaces = ['priority_yml', 'priority_folder/priority_yml']
    const notPrioretizableYmlPlaces = [
      'priority_json',
      'priority_js',
      'priority_folder/priority_json',
      'priority_folder/priority_js'
    ]
    prioretizableYmlPlaces.forEach(place => {
      expect(Loader.load(`${fixturesFolder}${place}`)).toEqual({ pipeline: { title: 'YML_PIPELINE' } })
    })
    notPrioretizableYmlPlaces.forEach(place => {
      expect(Loader.load(`${fixturesFolder}${place}`)).not.toEqual({ pipeline: { title: 'YML_PIPELINE' } })
    })
  })

  it('prioretizes named yml if not json or js formats', () => {
    const prioretizableYmlPlaces = ['priority_yml', 'priority_folder/priority_yml']
    const notPrioretizableYmlPlaces = [
      'priority_json',
      'priority_js',
      'priority_folder/priority_json',
      'priority_folder/priority_js'
    ]

    prioretizableYmlPlaces.forEach(place => {
      expect(Loader.load(`${fixturesFolder}${place}`, 'name')).toEqual({ pipeline: { title: 'YML_NAMED_PIPELINE' } })
    })
    notPrioretizableYmlPlaces.forEach(place => {
      expect(Loader.load(`${fixturesFolder}${place}`, 'name')).not.toEqual({
        pipeline: { title: 'YML_NAMED_PIPELINE' }
      })
    })
  })

  it('prioretizes json if not js format', () => {
    const prioretizableJSONPlaces = ['priority_json', 'priority_folder/priority_json']
    const notPrioretizableJSONPlaces = ['priority_js', 'priority_folder/priority_js']

    prioretizableJSONPlaces.forEach(place => {
      expect(Loader.load(`${fixturesFolder}${place}`)).toEqual({ pipeline: { title: 'JSON_PIPELINE' } })
    })
    notPrioretizableJSONPlaces.forEach(place => {
      expect(Loader.load(`${fixturesFolder}${place}`)).not.toEqual({ pipeline: { title: 'JSON_PIPELINE' } })
    })
  })

  it('prioretizes named json if not js format', () => {
    const prioretizableJSONPlaces = ['priority_json', 'priority_folder/priority_json']
    const notPrioretizableJSONPlaces = ['priority_js', 'priority_folder/priority_js']

    prioretizableJSONPlaces.forEach(place => {
      expect(Loader.load(`${fixturesFolder}${place}`, 'name')).toEqual({ pipeline: { title: 'JSON_NAMED_PIPELINE' } })
    })
    notPrioretizableJSONPlaces.forEach(place => {
      expect(Loader.load(`${fixturesFolder}${place}`, 'name')).not.toEqual({
        pipeline: { title: 'JSON_NAMED_PIPELINE' }
      })
    })
  })

  it('prioretizes js files always', () => {
    const prioretizableJSONPlaces = ['priority_js', 'priority_folder/priority_js']

    prioretizableJSONPlaces.forEach(place => {
      expect(Loader.load(`${fixturesFolder}${place}`)).toEqual({ pipeline: { title: 'JS_PIPELINE' } })
    })
  })

  it('prioretizes named js files always', () => {
    const prioretizableJSONPlaces = ['priority_js', 'priority_folder/priority_js']

    prioretizableJSONPlaces.forEach(place => {
      expect(Loader.load(`${fixturesFolder}${place}`, 'name')).toEqual({ pipeline: { title: 'JS_NAMED_PIPELINE' } })
    })
  })
})
