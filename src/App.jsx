import { useState, useMemo } from 'react'
import basisSetData from './data/basisSetData.json'
import BasisSetSelector from './components/BasisSetSelector'
import AtomInput from './components/AtomInput'
import ResultsDisplay from './components/ResultsDisplay'
import EducationPanel from './components/EducationPanel'
import MoleculePresets from './components/MoleculePresets'
import { parseMolecularFormula } from './utils/formulaParser'

const DEFAULT_BASIS = 'cc-pVDZ'
const DEFAULT_ATOMS = [
  { symbol: 'C', count: 1 },
  { symbol: 'H', count: 4 },
]

export default function App() {
  const [selectedBasis, setSelectedBasis] = useState(DEFAULT_BASIS)
  const [atoms, setAtoms] = useState(DEFAULT_ATOMS)
  const [spherical, setSpherical] = useState(true)
  const [formulaInput, setFormulaInput] = useState('')
  const [formulaError, setFormulaError] = useState('')

  // Current basis data for the selected basis set
  const currentBasisData = useMemo(
    () => basisSetData.data[selectedBasis] || {},
    [selectedBasis]
  )

  const currentBasisMeta = useMemo(
    () => basisSetData.basisSets.find(b => b.name === selectedBasis),
    [selectedBasis]
  )

  const supportedElements = currentBasisMeta?.elements || []

  // Atom manipulation
  const addAtom = (symbol) => {
    setAtoms(prev => prev.some(a => a.symbol === symbol)
      ? prev
      : [...prev, { symbol, count: 1 }]
    )
  }

  const removeAtom = (symbol) => {
    setAtoms(prev => prev.filter(a => a.symbol !== symbol))
  }

  const updateCount = (symbol, count) => {
    setAtoms(prev => prev.map(a => a.symbol === symbol ? { ...a, count } : a))
  }

  // Formula parser input
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

  const handlePreset = (formula) => {
    const parsed = parseMolecularFormula(formula)
    if (parsed.length) setAtoms(parsed)
  }

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
          <div className="ml-auto flex items-center gap-2">
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

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Hero */}
        <div className="text-center pt-2 pb-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            How many basis functions?
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            Select a basis set, add the atoms in your molecule, and instantly see the total
            number of basis functions — broken down by element and shell type.
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
                basisSets={basisSetData.basisSets}
                selectedBasis={selectedBasis}
                onSelect={setSelectedBasis}
              />
              {currentBasisMeta && (
                <p className="text-xs text-slate-500 leading-snug">
                  {currentBasisMeta.description}.{' '}
                  Supports {supportedElements.length} element{supportedElements.length !== 1 ? 's' : ''} (H–Kr).
                </p>
              )}
            </div>

            {/* Molecule input */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-700 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                2 · Molecule / Atoms
              </h3>

              {/* Formula input */}
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
              {formulaError && (
                <p className="text-xs text-red-400">{formulaError}</p>
              )}

              {/* Presets */}
              <MoleculePresets onSelect={handlePreset} />

              {/* Manual atom input */}
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

            {/* Education */}
            <EducationPanel />
          </div>

          {/* Right panel: results */}
          <div className="lg:col-span-3">
            {atoms.length === 0 || !selectedBasis ? (
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

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            Basis set data from the{' '}
            <a href="https://www.basissetexchange.org/" target="_blank" rel="noopener noreferrer"
               className="text-indigo-400 hover:text-indigo-300">
              Basis Set Exchange
            </a>{' '}
            (MolSSI). Counts use spherical harmonics by default.
          </p>
          <p className="text-xs text-slate-600">
            Static web app — no backend, all data bundled.
          </p>
        </div>
      </footer>
    </div>
  )
}
