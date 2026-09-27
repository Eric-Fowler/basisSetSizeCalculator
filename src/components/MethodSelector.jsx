import { useEffect, useRef, useState } from 'react'

export const METHODS = [
  { id: 'HF', exponent: 2 },
  { id: 'DFT', exponent: 2 },
  { id: 'RI-DFT', exponent: 2.5 },
  { id: 'TD-DFT (Local/TDA)', exponent: 2.5 },
  { id: 'TD-DFT (Canonical)', exponent: 4 },
  { id: 'Local-MP2 (DF-LMP2)', exponent: 1 },
  { id: 'MP2 (Canonical)', exponent: 5 },
  { id: 'RI-MP2', exponent: 5 },
  { id: 'MP3', exponent: 6 },
  { id: 'MP4', exponent: 7 },
  { id: 'CISD', exponent: 6 },
  { id: 'DLPNO-CCSD', exponent: 2 },
  { id: 'CCSD (Canonical)', exponent: 6 },
  { id: 'DLPNO-CCSD(T)', exponent: 1 },
  { id: 'CCSD(T) (Canonical)', exponent: 7 },
];
function MethodLabel({ method }) {
  return (
    <span className="grid grid-cols-[11rem_auto] items-baseline gap-x-2 whitespace-nowrap">
      <b>{method.id}</b>
      <span><i>O</i>(<i>N</i><sup>{method.exponent}</sup>)</span>
    </span>
  )
}

export default function MethodSelector({ selectedMethod, onSelect }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const selected = METHODS.find(method => method.id === selectedMethod) || METHODS[1]

  useEffect(() => {
    const handlePointerDown = event => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        id="comparison-method"
        type="button"
        onClick={() => setOpen(current => !current)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl
                   bg-slate-800 border border-slate-600 hover:border-indigo-500
                   transition-colors duration-150 text-left text-white text-sm"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="font-semibold"><MethodLabel method={selected} /></span>
        <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
             fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul role="listbox" aria-label="Computational method" className="absolute z-50 mt-2 w-full rounded-xl bg-slate-800 border border-slate-600 shadow-2xl shadow-black/60 overflow-hidden py-1">
          {METHODS.map(method => (
            <li key={method.id}>
              <button
                type="button"
                role="option"
                aria-selected={method.id === selectedMethod}
                onClick={() => {
                  onSelect(method.id)
                  setOpen(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors
                  ${method.id === selectedMethod
                    ? 'bg-indigo-900/50 text-indigo-200'
                    : 'text-slate-200 hover:bg-slate-700'}`}
              >
                <MethodLabel method={method} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
