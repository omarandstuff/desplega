import Loader from '../src/Loader'

const fixturesFolder = `${process.cwd()}/test/__fixtures__/`

describe('Loader#load', (): void => {
  it('prioretizes yml', (): void => {
    const loader: Loader = new Loader()
    const prioretizableYmlPlaces = ['priority_yml', 'priority_folder/priority_yml']
    const notPrioretizableYmlPlaces = ['priority_json', 'priority_js', 'priority_folder/priority_json', 'priority_folder/priority_js']

    prioretizableYmlPlaces.forEach((place: string) => {
      const composedPlace = `${fixturesFolder}${place}`

      expect(loader.load(composedPlace)).toEqual({ pipeline: { title: 'YML_PIPELINE' } })
    })
    notPrioretizableYmlPlaces.forEach((place: string) => {
      const composedPlace = `${fixturesFolder}${place}`

      expect(loader.load(composedPlace)).not.toEqual({ pipeline: { title: 'YML_PIPELINE' } })
    })
  })

  it('then prioretizes named yml', () => {
    const loader: Loader = new Loader()
    const prioretizableYmlPlaces = ['priority_yml', 'priority_folder/priority_yml']
    const notPrioretizableYmlPlaces = ['priority_json', 'priority_js', 'priority_folder/priority_json', 'priority_folder/priority_js']

    prioretizableYmlPlaces.forEach((place: string) => {
      const composedPlace = `${fixturesFolder}${place}`

      expect(loader.load(composedPlace, 'name')).toEqual({ pipeline: { title: 'YML_NAMED_PIPELINE' } })
    })
    notPrioretizableYmlPlaces.forEach((place: string) => {
      const composedPlace = `${fixturesFolder}${place}`

      expect(loader.load(composedPlace, 'name')).not.toEqual({
        pipeline: { title: 'YML_NAMED_PIPELINE' }
      })
    })
  })

  it('prioretizes json if not js format', () => {
    const loader: Loader = new Loader()
    const prioretizableJSONPlaces = ['priority_json', 'priority_folder/priority_json']
    const notPrioretizableJSONPlaces = ['priority_js', 'priority_folder/priority_js']

    prioretizableJSONPlaces.forEach((place: string) => {
      const composedPlace = `${fixturesFolder}${place}`

      expect(loader.load(composedPlace)).toEqual({ pipeline: { title: 'JSON_PIPELINE' } })
    })
    notPrioretizableJSONPlaces.forEach((place: string) => {
      const composedPlace = `${fixturesFolder}${place}`

      expect(loader.load(composedPlace)).not.toEqual({ pipeline: { title: 'JSON_PIPELINE' } })
    })
  })

  it('prioretizes named json if not js format', () => {
    const loader: Loader = new Loader()
    const prioretizableJSONPlaces = ['priority_json', 'priority_folder/priority_json']
    const notPrioretizableJSONPlaces = ['priority_js', 'priority_folder/priority_js']

    prioretizableJSONPlaces.forEach((place: string) => {
      const composedPlace = `${fixturesFolder}${place}`

      expect(loader.load(composedPlace, 'name')).toEqual({ pipeline: { title: 'JSON_NAMED_PIPELINE' } })
    })
    notPrioretizableJSONPlaces.forEach((place: string) => {
      const composedPlace = `${fixturesFolder}${place}`

      expect(loader.load(composedPlace, 'name')).not.toEqual({
        pipeline: { title: 'JSON_NAMED_PIPELINE' }
      })
    })
  })

  it('prioretizes js files always', () => {
    const loader: Loader = new Loader()
    const prioretizableJSONPlaces = ['priority_js', 'priority_folder/priority_js']

    prioretizableJSONPlaces.forEach((place: string) => {
      const composedPlace = `${fixturesFolder}${place}`

      expect(loader.load(composedPlace)).toEqual({ pipeline: { title: 'JS_PIPELINE' } })
    })
  })

  it('prioretizes named js files always', () => {
    const loader: Loader = new Loader()
    const prioretizableJSONPlaces = ['priority_js', 'priority_folder/priority_js']

    prioretizableJSONPlaces.forEach((place: string) => {
      const composedPlace = `${fixturesFolder}${place}`

      expect(loader.load(composedPlace, 'name')).toEqual({ pipeline: { title: 'JS_NAMED_PIPELINE' } })
    })
  })

  it('throws when there is not a desplega file', () => {
    const loader: Loader = new Loader()

    expect(() => loader.load(process.cwd())).toThrow('There is not a desplega file in the current working directoy')
  })
})
