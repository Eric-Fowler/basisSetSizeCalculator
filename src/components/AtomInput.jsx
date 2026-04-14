import { useState, useRef, useEffect } from 'react'

// Sorted list of element symbols Z=1..36
const ALL_ELEMENTS = [
  'H','He','Li','Be','B','C','N','O','F','Ne',
  'Na','Mg','Al','Si','P','S','Cl','Ar',
  'K','Ca','Sc','Ti','V','Cr','Mn','Fe','Co','Ni','Cu','Zn',
  'Ga','Ge','As','Se','Br','Kr'
]

const ELEMENT_NAMES = {
  H:'Hydrogen', He:'Helium', Li:'Lithium', Be:'Beryllium', B:'Boron',
  C:'Carbon', N:'Nitrogen', O:'Oxygen', F:'Fluorine', Ne:'Neon',
  Na:'Sodium', Mg:'Magnesium', Al:'Aluminium', Si:'Silicon', P:'Phosphorus',
  S:'Sulfur', Cl:'Chlorine', Ar:'Argon', K:'Potassium', Ca:'Calcium',
  Sc:'Scandium', Ti:'Titanium', V:'Vanadium', Cr:'Chromium', Mn:'Manganese',
  Fe:'Iron', Co:'Cobalt', Ni:'Nickel', Cu:'Copper', Zn:'Zinc',
  Ga:'Gallium', Ge:'Germanium', As:'Arsenic', Se:'Selenium', Br:'Bromine', Kr:'Krypton'
}

// Color by period
const PERIOD_COLOR = {
  1: 'bg-teal-600 hover:bg-teal-500',
  2: 'bg-indigo-600 hover:bg-indigo-500',
  3: 'bg-violet-600 hover:bg-violet-500',
  4: 'bg-pink-600 hover:bg-pink-500',
}
const Z_TO_PERIOD = (z) => {
  if (z <= 2) return 1
  if (z <= 10) return 2
  if (z <= 18) return 3
  return 4
}
const Z_MAP = { H:1,He:2,Li:3,Be:4,B:5,C:6,N:7,O:8,F:9,Ne:10,
  Na:11,Mg:12,Al:13,Si:14,P:15,S:16,Cl:17,Ar:18,
  K:19,Ca:20,Sc:21,Ti:22,V:23,Cr:24,Mn:25,Fe:26,Co:27,Ni:28,Cu:29,Zn:30,
  Ga:31,Ge:32,As:33,Se:34,Br:35,Kr:36 }

export default function AtomInput({ atoms, onAdd, onRemove, onCountChange, supportedElements }) {
  const [search, setSearch] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const searchRef = useRef(null)
  const pickerRef = useRef(null)

  const supported = new Set(supportedElements || ALL_ELEMENTS)

  const filteredElements = search.trim()
    ? ALL_ELEMENTS.filter(el =>
        supported.has(el) &&
        (el.toLowerCase().startsWith(search.toLowerCase()) ||
         ELEMENT_NAMES[el]?.toLowerCase().includes(search.toLowerCase()))
      )
    : ALL_ELEMENTS.filter(el => supported.has(el))

  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleAdd = (sym) => {
    onAdd(sym)
    setSearch('')
  }

  return (
    <div className="space-y-3">
      {/* Search + picker */}
      <div ref={pickerRef} className="relative">
        <div className="flex gap-2">
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setShowPicker(true) }}
            onFocus={() => setShowPicker(true)}
            placeholder="Search elements (e.g. C, Carbon)…"
            className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-600
                       text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
          />
          <button
            onClick={() => setShowPicker(p => !p)}
            className="px-3 py-2 rounded-lg bg-slate-700 border border-slate-600
                       hover:bg-slate-600 transition-colors text-sm text-slate-300"
            title="Browse elements"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>

        {showPicker && (
          <div className="absolute z-40 mt-1 w-full rounded-xl bg-slate-800 border border-slate-600
                          shadow-2xl shadow-black/60 p-3 max-h-64 overflow-y-auto">
            {filteredElements.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-2">No supported elements match "{search}"</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {filteredElements.map(el => {
                  const z = Z_MAP[el] || 0
                  const pc = PERIOD_COLOR[Z_TO_PERIOD(z)] || 'bg-slate-600 hover:bg-slate-500'
                  const already = atoms.some(a => a.symbol === el)
                  return (
                    <button
                      key={el}
                      onClick={() => { handleAdd(el); setShowPicker(false) }}
                      disabled={already}
                      title={`${ELEMENT_NAMES[el]} (Z=${z})`}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold text-white transition-all
                                  ${already ? 'opacity-40 cursor-not-allowed bg-slate-700' : pc}`}
                    >
                      {el}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current atoms */}
      {atoms.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-4">
          No atoms added yet. Search or browse to add elements.
        </p>
      ) : (
        <div className="space-y-2">
          {atoms.map(({ symbol, count }) => {
            const z = Z_MAP[symbol] || 0
            const pc = PERIOD_COLOR[Z_TO_PERIOD(z)] || 'bg-slate-600'
            return (
              <div key={symbol} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm text-white shrink-0 ${pc.split(' ')[0]}`}>
                  {symbol}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">{ELEMENT_NAMES[symbol]}</div>
                  <div className="text-xs text-slate-400">Z = {z}</div>
                </div>
                {/* Count stepper */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onCountChange(symbol, Math.max(1, count - 1))}
                    className="w-7 h-7 rounded-md bg-slate-700 hover:bg-slate-600 flex items-center justify-center
                               text-slate-300 hover:text-white transition-colors"
                  >–</button>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={count}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10)
                      if (!isNaN(v) && v >= 1) onCountChange(symbol, v)
                    }}
                    className="w-12 text-center bg-slate-900 border border-slate-700 rounded-md py-1
                               text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => onCountChange(symbol, count + 1)}
                    className="w-7 h-7 rounded-md bg-slate-700 hover:bg-slate-600 flex items-center justify-center
                               text-slate-300 hover:text-white transition-colors"
                  >+</button>
                </div>
                <button
                  onClick={() => onRemove(symbol)}
                  title="Remove"
                  className="w-7 h-7 rounded-md bg-slate-700 hover:bg-red-800 flex items-center justify-center
                             text-slate-400 hover:text-red-300 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
