import { useState, useMemo, useEffect, useRef } from 'react'
import basisSetMeta from './data/basisSetMeta.json'
import BasisSetSelector from './components/BasisSetSelector'
import AtomInput from './components/AtomInput'
import ResultsDisplay from './components/ResultsDisplay'
import EducationPanel from './components/EducationPanel'
import MoleculePresets from './components/MoleculePresets'
import MethodSelector, { METHODS } from './components/MethodSelector'
import { parseMolecularFormula, parseXYZ } from './utils/formulaParser'

const DEFAULT_BASIS = 'cc-pVDZ'
const DEFAULT_ATOMS = [
  { symbol: 'C', count: 1 },
  { symbol: 'H', count: 4 },
]

function loadBasisData(meta, cache) {
  if (cache.current[meta.name]) return Promise.resolve(cache.current[meta.name])

  const request = fetch(`${import.meta.env.BASE_URL}data/basis/${meta.id}.json`)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json()
    })
    .then(data => {
      cache.current[meta.name] = data
      return data
    })
    .catch(error => {
      delete cache.current[meta.name]
      throw error
    })

  cache.current[meta.name] = request
  return request
}

function stringDistance(left, right) {
  const previousRow = Array.from({ length: right.length + 1 }, (_, index) => index)

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = previousRow[0]
    previousRow[0] = leftIndex

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const previous = previousRow[rightIndex]
      previousRow[rightIndex] = Math.min(
        previousRow[rightIndex] + 1,
        previousRow[rightIndex - 1] + 1,
        diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1)
      )
      diagonal = previous
    }
  }

  return previousRow[right.length]
}

function findSimilarBasisSets(name, count) {
  const normalizedName = name.toLowerCase()

  return basisSetMeta.basisSets
    .filter(basis => basis.name !== name)
    .map((basis, index) => {
      const normalizedCandidate = basis.name.toLowerCase()
      const distance = stringDistance(normalizedName, normalizedCandidate)
      return {
        name: basis.name,
        score: distance / Math.max(normalizedName.length, normalizedCandidate.length, 1),
        index,
      }
    })
    .sort((left, right) => left.score - right.score || left.index - right.index)
    .slice(0, count)
    .map(basis => basis.name)
}

export default function App() {
  const [selectedBasis, setSelectedBasis] = useState(DEFAULT_BASIS)
  const [atoms, setAtoms] = useState(DEFAULT_ATOMS)
  const [spherical, setSpherical] = useState(true)
  const [formulaInput, setFormulaInput] = useState('')
  const [formulaError, setFormulaError] = useState('')
  const [xyzInput, setXyzInput] = useState('')
  const [xyzError, setXyzError] = useState('')
  const [additionalBasisSelections, setAdditionalBasisSelections] = useState(
    () => findSimilarBasisSets(DEFAULT_BASIS, 3)
  )
  const [comparisonBasisData, setComparisonBasisData] = useState({})
  const [selectedMethod, setSelectedMethod] = useState('DFT (Hybrid)')

  // Lazy-loaded basis data cache: { [basisName]: elementsData }
  const basisCache = useRef({})
  const [currentBasisData, setCurrentBasisData] = useState(null)
  const [loadingBasis, setLoadingBasis] = useState(false)

  const currentBasisMeta = useMemo(
    () => basisSetMeta.basisSets.find(b => b.name === selectedBasis),
    [selectedBasis]
  )

  const supportedElements = currentBasisMeta?.elements || []

  // Select a basis set and infer the default harmonic type at the same time
  const updateSelectedBasis = (name) => {
    const meta = basisSetMeta.basisSets.find(b => b.name === name)
    setSelectedBasis(name)
    if (meta?.default_harmonic === 'spherical') setSpherical(true)
    else if (meta?.default_harmonic === 'cartesian') setSpherical(false)
    // 'unspecified' → leave current user preference unchanged
  }

  const handleSelectBasis = (name) => {
    if (name === selectedBasis) return
    updateSelectedBasis(name)
    setAdditionalBasisSelections(findSimilarBasisSets(name, additionalBasisSelections.length))
  }

  // Lazy-fetch element data for the selected basis
  useEffect(() => {
    if (!currentBasisMeta) return
    let isCurrent = true
    setLoadingBasis(true)
    loadBasisData(currentBasisMeta, basisCache)
      .then(data => { if (isCurrent) setCurrentBasisData(data) })
      .catch(err => {
        console.error('Failed to load basis data:', err)
        if (isCurrent) setCurrentBasisData({})
      })
      .finally(() => { if (isCurrent) setLoadingBasis(false) })
    return () => { isCurrent = false }
  }, [currentBasisMeta])

  // Atom manipulation
  const addAtom = (symbol) => {
    setAtoms(prev => prev.some(a => a.symbol === symbol)
      ? prev
      : [...prev, { symbol, count: 1 }]
    )
  }
  const removeAtom = (symbol) => setAtoms(prev => prev.filter(a => a.symbol !== symbol))
  const updateCount = (symbol, count) =>
    setAtoms(prev => prev.map(a => a.symbol === symbol ? { ...a, count } : a))

  // Formula parser
  const handleFormulaSubmit = (e) => {
    e.preventDefault()
    const parsed = parseMolecularFormula(formulaInput)
    if (!parsed.length) {
      setFormulaError('Could not parse formula. Try e.g. H2O, CH4, C6H6')
      return
    }
    setFormulaError('')
    setAtoms(parsed)
    setFormulaInput('')
  }

  const handleXYZSubmit = (e) => {
    e.preventDefault()
    const parsed = parseXYZ(xyzInput)
    if (!parsed.length) {
      setXyzError('Could not parse XYZ block. Include atom symbols and three coordinates per atom.')
      return
    }
    setXyzError('')
    setAtoms(parsed)
    setXyzInput('')
  }

  const handlePreset = (formula) => {
    const parsed = parseMolecularFormula(formula)
    if (parsed.length) setAtoms(parsed)
  }

  const [activePanel, setActivePanel] = useState(1)
  const basisPanels = [
    { title: '1 · Basis Set', selectedBasis, onSelect: updateSelectedBasis },
    ...additionalBasisSelections.map((name, index) => ({
      title: `${index + 2} · Basis Set`,
      selectedBasis: name,
      onSelect: selectedName => setAdditionalBasisSelections(current =>
        current.map((basisName, currentIndex) => currentIndex === index ? selectedName : basisName)
      ),
    })),
  ]
  const comparisonRows = basisPanels.map(({ title, selectedBasis: name }) => {
    const data = comparisonBasisData[name]
    const unsupportedAtoms = data ? atoms.filter(({ symbol }) => !data[symbol]) : []
    const totalFunctions = data && unsupportedAtoms.length === 0
      ? atoms.reduce((total, { symbol, count }) => {
          const elementData = data[symbol]
          return total + (spherical ? elementData.total_funcs_sph : elementData.total_funcs_cart) * count
        }, 0)
      : null

    return { title, name, totalFunctions, unsupportedAtoms }
  }).sort((left, right) => {
    if (left.totalFunctions === null) return right.totalFunctions === null ? 0 : 1
    if (right.totalFunctions === null) return -1
    return left.totalFunctions - right.totalFunctions
  })
  const referenceBasisName = selectedBasis
  const referenceRow = comparisonRows.find(row => row.title === '1 · Basis Set' && row.name === referenceBasisName)
  const referenceFunctions = referenceRow?.totalFunctions
  const methodScaling = METHODS.find(method => method.id === selectedMethod)?.exponent
  const comparisonRowsWithCost = comparisonRows.map(row => ({
    ...row,
    isReference: row.title === '1 · Basis Set' && row.name === referenceBasisName,
    relativeCost: row.totalFunctions !== null && referenceFunctions > 0 && methodScaling !== undefined
      ? (row.totalFunctions / referenceFunctions) ** methodScaling
      : null,
    relativeCostRange: row.totalFunctions !== null && referenceFunctions > 0 && methodScaling !== undefined
      ? [
          (row.totalFunctions / referenceFunctions) ** (methodScaling - 0.5),
          (row.totalFunctions / referenceFunctions) ** (methodScaling + 0.5),
        ].sort((left, right) => left - right)
      : null,
  }))

  useEffect(() => {
    let isCurrent = true
    const uniqueBasisNames = [...new Set([selectedBasis, ...additionalBasisSelections])]
    const selectedMetas = uniqueBasisNames
      .map(name => basisSetMeta.basisSets.find(basis => basis.name === name))
      .filter(Boolean)

    Promise.all(selectedMetas.map(meta =>
      loadBasisData(meta, basisCache)
        .then(data => [meta.name, data])
        .catch(error => {
          console.error(`Failed to load basis data for ${meta.name}:`, error)
          return [meta.name, null]
        })
    )).then(entries => {
      if (!isCurrent) return
      setComparisonBasisData(current => ({
        ...current,
        ...Object.fromEntries(entries),
      }))
    })

    return () => { isCurrent = false }
  }, [selectedBasis, additionalBasisSelections])

  return (
    <div className="min-h-screen bg-[#0f172a]">


      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              ψ
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">Basis Set Calculator</h1>
              <p className="text-xs text-slate-400 mt-0.5">Size of basis for any chemical system</p>
            </div>
          </div>
          <div className="ml-auto">
            <a
              href="https://www.basissetexchange.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-indigo-300 transition-colors"
            >
              Data: Basis Set Exchange ↗
            </a>
          </div>
        </div>
      </header>

      <nav aria-label="Main panels" className="flex justify-center gap-2 border-b border-slate-800 px-4 py-3">
        {[
          { id: 1, name: 'Basis Set Size' },
          { id: 2, name: 'Relative Computational Cost' },
        ].map(panel => (
          <button
            key={panel.id}
            type="button"
            aria-pressed={activePanel === panel.id}
            onClick={() => setActivePanel(panel.id)}
            className={`px-3 py-2 text-sm ${
              activePanel === panel.id
                ? 'text-white border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {panel.name}
          </button>
        ))}
      </nav>
        {activePanel === 1 ? (
          <>
      
      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Hero */}
        <div className="text-center pt-2 pb-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            How many basis functions?
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            Select a basis set, add the atoms in your molecule, and instantly see the total
            number of basis functions — plus occupied and virtual orbital counts.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left panel: inputs */}
          <div className="lg:col-span-2 space-y-5">

            {/* Basis set */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-700 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                1 · Basis Set
              </h3>
              <BasisSetSelector
                basisSets={basisSetMeta.basisSets}
                selectedBasis={selectedBasis}
                onSelect={handleSelectBasis}
              />
              {currentBasisMeta && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-500">
                    {currentBasisMeta.description || `${currentBasisMeta.family} basis set`}.
                  </span>
                  <span className="text-slate-600">
                    {supportedElements.length} element{supportedElements.length !== 1 ? 's' : ''} (H–Kr).
                  </span>
                  {currentBasisMeta.default_harmonic !== 'unspecified' && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                      ${currentBasisMeta.default_harmonic === 'spherical'
                        ? 'bg-teal-900/50 text-teal-300'
                        : 'bg-amber-900/50 text-amber-300'}`}>
                      {currentBasisMeta.default_harmonic === 'spherical' ? 'Spherical' : 'Cartesian'} default
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Molecule input */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-700 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                2 · Molecule / Atoms
              </h3>

              <form onSubmit={handleFormulaSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={formulaInput}
                  onChange={e => { setFormulaInput(e.target.value); setFormulaError('') }}
                  placeholder="e.g. H2O, CH4, C6H6…"
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-600
                             text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500
                             text-white text-sm font-medium transition-colors"
                >
                  Parse
                </button>
              </form>
              {formulaError && <p className="text-xs text-red-400">{formulaError}</p>}

              <form onSubmit={handleXYZSubmit} className="space-y-2 border-t border-slate-700 pt-4">
                <label htmlFor="xyz-input" className="block text-xs text-slate-500 font-medium uppercase tracking-wider">
                  Or paste an XYZ block
                </label>
                <textarea
                  id="xyz-input"
                  value={xyzInput}
                  onChange={event => { setXyzInput(event.target.value); setXyzError('') }}
                  placeholder={'3\nWater molecule\nO 0.000 0.000 0.000\nH 0.758 0.000 0.504\nH -0.758 0.000 0.504'}
                  rows={5}
                  className="w-full resize-y rounded-lg bg-slate-800 border border-slate-600 px-3 py-2
                             font-mono text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                {xyzError && <p role="alert" className="text-xs text-red-400">{xyzError}</p>}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500
                               text-white text-sm font-medium transition-colors"
                  >
                    Parse XYZ
                  </button>
                </div>
              </form>

              <MoleculePresets onSelect={handlePreset} />

              <div>
                <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">
                  Or add atoms manually
                </p>
                <AtomInput
                  atoms={atoms}
                  onAdd={addAtom}
                  onRemove={removeAtom}
                  onCountChange={updateCount}
                  supportedElements={supportedElements}
                />
              </div>
            </div>

            <EducationPanel />
          </div>

          {/* Right panel: results */}
          <div className="lg:col-span-3">
            {loadingBasis ? (
              <div className="rounded-2xl bg-slate-900/40 border border-slate-800 h-64
                              flex flex-col items-center justify-center text-center px-8">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent
                                animate-spin mb-3" />
                <p className="text-slate-400 text-sm">Loading basis set data…</p>
              </div>
            ) : atoms.length === 0 || !selectedBasis || !currentBasisData ? (
              <div className="rounded-2xl bg-slate-900/40 border border-slate-800 h-64
                              flex flex-col items-center justify-center text-center px-8">
                <div className="text-4xl mb-3">⚗️</div>
                <p className="text-slate-400 text-sm">
                  Select a basis set and add some atoms to see the calculation.
                </p>
              </div>
            ) : (
              <ResultsDisplay
                atoms={atoms}
                basisData={currentBasisData}
                basisName={selectedBasis}
                basisMeta={currentBasisMeta}
                spherical={spherical}
                onToggleSpherical={setSpherical}
              />
            )}
          </div>

        </div>
      </main>

        </>

            ) : (
              <main aria-label="Panel 2" className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                <div className="text-center mb-8">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Reference molecule</p>
                  <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                    <h2 className="text-3xl font-bold text-white" aria-label={`Formula ${atoms.map(({ symbol, count }) => `${symbol}${count > 1 ? count : ''}`).join('')}`}>
                      {atoms.length ? atoms.map(({ symbol, count }) => (
                        <span key={symbol}>
                          {symbol}{count > 1 && <sub className="text-xl text-slate-300">{count}</sub>}
                        </span>
                      )) : 'No atoms selected'}
                    </h2>
                    <div className="flex items-baseline gap-3 sm:border-l sm:border-slate-700 sm:pl-6">
                      <span className="text-xs text-slate-500 uppercase tracking-wider">Scaling</span>
                      <span className="text-xl font-semibold text-indigo-300">
                        <i>O</i>(<i>N</i><sup>{methodScaling}</sup>)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  <div className="lg:col-span-1 space-y-5">
                    <section className="rounded-2xl bg-slate-900/60 border border-slate-700 p-3 space-y-2">
                      <label htmlFor="comparison-method" className="block text-sm font-semibold text-slate-300 uppercase tracking-wider">
                        Method
                      </label>
                      <MethodSelector selectedMethod={selectedMethod} onSelect={setSelectedMethod} />
                    </section>
                    {basisPanels.map(({ title, selectedBasis: panelBasis, onSelect }) => (
                        <section key={title} className="rounded-2xl bg-slate-900/60 border border-slate-700 p-3 space-y-2">
                          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                            {title}
                          </h3>
                          <BasisSetSelector
                            basisSets={basisSetMeta.basisSets}
                            selectedBasis={panelBasis}
                            onSelect={onSelect}
                          />
                        </section>
                    ))}
                  </div>

                  <div className="lg:col-span-2 space-y-5">
                    <section className="rounded-2xl bg-slate-900/60 border border-slate-700 p-5">
                      <div className="overflow-x-auto lg:overflow-x-visible">
                        <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th scope="col" className="pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Basis set</th>
                            <th scope="col" className="pb-3 px-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Basis functions</th>
                            <th scope="col" className="pb-3 pl-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonRowsWithCost.map(({ title, name, totalFunctions, unsupportedAtoms, relativeCost, relativeCostRange, isReference }) => (
                            <tr key={title} className="border-b border-slate-700/50 last:border-0">
                              <th
                                scope="row"
                                className={`py-3 pr-4 text-left font-mono text-sm font-semibold text-white ${isReference ? 'rounded-l-xl bg-indigo-500/10' : ''}`}
                                style={isReference ? { boxShadow: '-8px 0 0 0 rgb(99 102 241 / 0.1)' } : undefined}
                              >
                                {name}
                              </th>
                              <td className={`py-3 px-3 text-right tabular-nums ${isReference ? 'bg-indigo-500/10' : ''}`}>
                                {totalFunctions !== null ? (
                                  <span className="font-semibold text-indigo-300">{totalFunctions}</span>
                                ) : comparisonBasisData[name] === null ? (
                                  <span className="text-xs text-rose-400">Unavailable</span>
                                ) : comparisonBasisData[name] ? (
                                  <span className="text-xs text-amber-400">
                                    Unsupported: {unsupportedAtoms.map(atom => atom.symbol).join(', ')}
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-500">Loading…</span>
                                )}
                              </td>
                              <td
                                className={`py-3 pl-3 text-right tabular-nums font-semibold text-teal-300 ${isReference ? 'rounded-r-xl bg-indigo-500/10' : ''}`}
                                style={isReference ? { boxShadow: '8px 0 0 0 rgb(99 102 241 / 0.1)' } : undefined}
                              >
                                {relativeCost !== null ? (
                                  <span className="inline-flex flex-col items-end">
                                    <span>{relativeCost.toFixed(1)}x</span>
                                    {!isReference && (
                                      <span className="text-[10px] font-normal text-slate-500">
                                        {relativeCostRange[0].toFixed(1)}–{relativeCostRange[1].toFixed(1)}x
                                      </span>
                                    )}
                                  </span>
                                ) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        </table>
                      </div>
                    </section>

                    <section aria-label="Approach notes" className="rounded-2xl bg-slate-900/60 border border-slate-700 p-5 min-h-24">
                      <p className="text-sm text-slate-300 text-justify">
                        The calculator estimates the relative cost between different basis sets with 
                        N<sub>1</sub> and N<sub>2</sub> basis functions as (N<sub>1</sub>/N<sub>2</sub>)<sup>K</sup>, where K is the
                        approximate scaling (<i>O</i>(<i>N</i><sup>K</sup>)) of the selected model chemistry. Error ranges are given by
                        an uncertainty of ±0.5 on K. These values are crude estimates and should be only taken as a loose reference.
                      </p>
                    </section>
                  </div>
                </div>
              </main>
      )}
      
      {/* Footer */}
      <footer className="border-t border-slate-800 mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            Basis set data from the{' '}
            <a href="https://www.basissetexchange.org/" target="_blank" rel="noopener noreferrer"
               className="text-indigo-400 hover:text-indigo-300">
              Basis Set Exchange
            </a>{' '}
            (MolSSI) — {basisSetMeta.basisSets.length} basis sets, H–Kr.
          </p>
          <p className="text-xs text-slate-600">
            Static web app — no backend. Basis data loaded on demand.
          </p>
        </div>
      </footer>

    </div>
  )
}
