import { useState, useRef, useEffect } from 'react'

// Fixed colours for the most common families; unknown families fall back to a neutral grey
const FAMILY_COLORS = {
  'STO / Minimal':   'bg-slate-600 text-slate-100',
  'Pople':           'bg-indigo-700 text-indigo-100',
  'Dunning':         'bg-teal-700 text-teal-100',
  'Dunning (aug)':   'bg-cyan-700 text-cyan-100',
  'Dunning (DK)':    'bg-sky-700 text-sky-100',
  'Dunning (DK3)':   'bg-sky-800 text-sky-100',
  'Dunning (X2C)':   'bg-sky-900 text-sky-100',
  'Ahlrichs':        'bg-violet-700 text-violet-100',
  'Ahlrichs (X2C)':  'bg-violet-800 text-violet-100',
  'ANO':             'bg-rose-700 text-rose-100',
  'Jensen (pc-n)':   'bg-orange-700 text-orange-100',
  'Jorge (ADZP)':    'bg-lime-700 text-lime-100',
  'NASA Ames':       'bg-blue-700 text-blue-100',
  'UGBS':            'bg-pink-700 text-pink-100',
}
const DEFAULT_FAMILY_COLOR = 'bg-slate-700 text-slate-200'

function familyColor(family) {
  return FAMILY_COLORS[family] || DEFAULT_FAMILY_COLOR
}

export default function BasisSetSelector({ basisSets, selectedBasis, onSelect }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const inputRef = useRef(null)

  const filtered = query.trim()
    ? basisSets.filter(b =>
        b.name.toLowerCase().includes(query.toLowerCase()) ||
        b.family.toLowerCase().includes(query.toLowerCase())
      )
    : basisSets

  // group by family
  const grouped = filtered.reduce((acc, b) => {
    acc[b.family] = acc[b.family] || []
    acc[b.family].push(b)
    return acc
  }, {})

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = basisSets.find(b => b.name === selectedBasis)

  const handleOpen = () => {
    setOpen(o => !o)
  }

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl
                   bg-slate-800 border border-slate-600 hover:border-indigo-500
                   transition-colors duration-150 text-left"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 min-w-0">
          {selected ? (
            <>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${familyColor(selected.family)}`}>
                {selected.family}
              </span>
              <span className="font-mono font-semibold text-white truncate">{selected.name}</span>
            </>
          ) : (
            <span className="text-slate-400">Choose a basis set…</span>
          )}
        </div>
        <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
             fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl bg-slate-800 border border-slate-600
                        shadow-2xl shadow-black/60 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-slate-700">
            <input
              ref={inputRef}
              autoFocus
              type="text"
              placeholder={`Search ${basisSets.length} basis sets…`}
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 text-white placeholder-slate-500
                         border border-slate-700 focus:outline-none focus:border-indigo-500 text-sm"
            />
          </div>

          {/* List */}
          <ul className="max-h-80 overflow-y-auto" role="listbox">
            {Object.entries(grouped).map(([family, items]) => (
              <li key={family}>
                <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 bg-slate-800 border-b border-slate-700/40">
                  {family} <span className="font-normal text-slate-600 normal-case">({items.length})</span>
                </div>
                {items.map(b => (
                  <button
                    key={b.name}
                    role="option"
                    aria-selected={b.name === selectedBasis}
                    onClick={() => { onSelect(b.name); setOpen(false); setQuery('') }}
                    className={`w-full text-left px-4 py-2 flex items-center gap-3
                                hover:bg-slate-700 transition-colors duration-75
                                ${b.name === selectedBasis ? 'bg-indigo-900/50 text-indigo-200' : 'text-slate-200'}`}
                  >
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${familyColor(family)}`}>
                      {family}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-mono font-semibold text-sm">{b.name}</div>
                      {b.description && (
                        <div className="text-xs text-slate-400 truncate">{b.description}</div>
                      )}
                    </div>
                    {b.name === selectedBasis && (
                      <svg className="w-4 h-4 text-indigo-400 ml-auto shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-4 py-6 text-center text-slate-500 text-sm">
                No basis sets match &ldquo;{query}&rdquo;
              </li>
            )}
          </ul>

          {/* Footer count */}
          <div className="px-3 py-2 border-t border-slate-700 text-xs text-slate-600 text-right">
            {filtered.length} of {basisSets.length} shown
          </div>
        </div>
      )}
    </div>
  )
}
