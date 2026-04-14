const AM_LABELS = { s: 'am-s', p: 'am-p', d: 'am-d', f: 'am-f', g: 'am-g', h: 'am-h', i: 'am-i' }

function AMBadge({ am }) {
  const cls = AM_LABELS[am] || 'bg-slate-600 text-white'
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold ${cls}`}>
      {am}
    </span>
  )
}

function ShellRow({ shell, count, isLast }) {
  return (
    <tr className={`${isLast ? '' : 'border-b border-slate-700/50'}`}>
      <td className="py-1.5 pr-3">
        <div className="flex items-center gap-2">
          <AMBadge am={shell.am_name} />
          <span className="text-slate-300 text-sm font-mono">{shell.am_name} orbital</span>
        </div>
      </td>
      <td className="py-1.5 px-2 text-right text-slate-400 text-sm">{shell.n_primitives}</td>
      <td className="py-1.5 px-2 text-right text-slate-300 text-sm font-semibold">{shell.n_contractions}</td>
      <td className="py-1.5 px-2 text-right text-slate-400 text-sm">{shell.n_funcs}</td>
      <td className="py-1.5 pl-2 text-right text-indigo-300 text-sm font-semibold">{shell.n_funcs * count}</td>
    </tr>
  )
}

function AtomCard({ symbol, name, count, elemData, spherical }) {
  const funcs = spherical ? elemData.total_funcs_sph : elemData.total_funcs_cart
  const notation = buildNotation(elemData.shells)
  const totalContrib = funcs * count

  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-lg">
            {symbol}
          </div>
          <div>
            <div className="font-semibold text-white">{name}</div>
            <div className="text-xs text-slate-400 font-mono">{notation}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">× {count} atom{count > 1 ? 's' : ''}</div>
          <div className="text-xl font-bold text-indigo-300">{totalContrib}</div>
          <div className="text-xs text-slate-500">basis functions</div>
        </div>
      </div>

      <div className="px-4 py-3 overflow-x-auto">
        <table className="w-full min-w-[420px]">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="pb-1.5 text-left text-xs text-slate-500 font-medium">Shell type</th>
              <th className="pb-1.5 px-2 text-right text-xs text-slate-500 font-medium">Primitives</th>
              <th className="pb-1.5 px-2 text-right text-xs text-slate-500 font-medium">Contracted</th>
              <th className="pb-1.5 px-2 text-right text-xs text-slate-500 font-medium">Funcs / atom</th>
              <th className="pb-1.5 pl-2 text-right text-xs text-slate-500 font-medium">Total (×{count})</th>
            </tr>
          </thead>
          <tbody>
            {elemData.shells.map((shell, i) => (
              <ShellRow
                key={`${shell.am_name}-${i}`}
                shell={shell}
                count={count}
                isLast={i === elemData.shells.length - 1}
              />
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-600">
              <td colSpan={3} className="pt-2 text-xs text-slate-500 font-medium">Total per atom</td>
              <td className="pt-2 px-2 text-right font-bold text-white">{funcs}</td>
              <td className="pt-2 pl-2 text-right font-bold text-indigo-300">{totalContrib}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function buildNotation(shells) {
  const counts = {}
  for (const s of shells) {
    counts[s.am_name] = (counts[s.am_name] || 0) + s.n_contractions
  }
  const order = ['s', 'p', 'd', 'f', 'g', 'h', 'i']
  return '[' + order.filter(a => counts[a]).map(a => `${counts[a]}${a}`).join('') + ']'
}

// ─── Occupied / Virtual orbital stats ────────────────────────────────────────
function OrbitalStats({ totalFuncs, atoms, basisData }) {
  const totalElectrons = atoms.reduce((sum, { symbol, count }) => {
    const z = basisData[symbol]?.z ?? 0
    return sum + z * count
  }, 0)

  if (totalElectrons === 0) return null

  const isOpenShell = totalElectrons % 2 !== 0
  const nOcc = Math.floor(totalElectrons / 2)
  const nVirt = totalFuncs - nOcc

  return (
    <div className="mt-4 pt-4 border-t border-indigo-800/50">
      <div className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">
        Orbital occupancy (neutral closed-shell RHF)
      </div>
      <div className="flex flex-wrap gap-3">
        {/* Electrons */}
        <div className="flex-1 min-w-[90px] rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2 text-center">
          <div className="text-lg font-bold text-slate-200 tabular-nums">{totalElectrons}</div>
          <div className="text-xs text-slate-500">electrons</div>
        </div>
        {/* Occupied */}
        <div className={`flex-1 min-w-[90px] rounded-lg border px-3 py-2 text-center
          ${isOpenShell
            ? 'bg-amber-900/30 border-amber-700/50'
            : 'bg-teal-900/30 border-teal-700/50'}`}>
          <div className={`text-lg font-bold tabular-nums ${isOpenShell ? 'text-amber-300' : 'text-teal-300'}`}>
            {nOcc}
          </div>
          <div className={`text-xs ${isOpenShell ? 'text-amber-500' : 'text-teal-600'}`}>
            {isOpenShell ? 'α occupied' : 'occupied'}
          </div>
        </div>
        {/* Virtual */}
        <div className="flex-1 min-w-[90px] rounded-lg bg-violet-900/30 border border-violet-700/50 px-3 py-2 text-center">
          <div className="text-lg font-bold text-violet-300 tabular-nums">{nVirt}</div>
          <div className="text-xs text-violet-600">virtual</div>
        </div>
      </div>
      {isOpenShell && (
        <p className="text-xs text-amber-400 mt-2">
          ⚠ Odd electron count ({totalElectrons}e) — open-shell system. Counts assume UHF/ROHF α occupancy.
        </p>
      )}
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function ResultsDisplay({ atoms, basisData, basisName, basisMeta, spherical, onToggleSpherical }) {
  if (!atoms.length) return null

  const totalFuncs = atoms.reduce((sum, { symbol, count }) => {
    const d = basisData[symbol]
    if (!d) return sum
    return sum + (spherical ? d.total_funcs_sph : d.total_funcs_cart) * count
  }, 0)

  const totalPrimitives = atoms.reduce((sum, { symbol, count }) => {
    const d = basisData[symbol]
    if (!d) return sum
    return sum + d.total_primitives * count
  }, 0)

  const missingAtoms = atoms.filter(({ symbol }) => !basisData[symbol])

  return (
    <div className="space-y-5">
      {/* Summary card */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-900/60 to-slate-800/80
                      border border-indigo-700/50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm text-indigo-300 font-medium mb-1">
              Basis: <span className="font-mono font-bold text-white">{basisName}</span>
              {basisMeta?.default_harmonic && basisMeta.default_harmonic !== 'unspecified' && (
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-normal
                  ${basisMeta.default_harmonic === 'spherical'
                    ? 'bg-teal-900/50 text-teal-400'
                    : 'bg-amber-900/50 text-amber-400'}`}>
                  {basisMeta.default_harmonic === 'spherical' ? '5d 7f…' : '6d 10f…'} default
                </span>
              )}
            </div>
            <div className="text-sm text-slate-400 mb-3">
              {basisMeta?.description || basisMeta?.family}
            </div>
            <div className="flex flex-wrap gap-2">
              {atoms.map(({ symbol, count }) => (
                <span key={symbol} className="px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-200 text-sm font-mono">
                  {count > 1 ? `${symbol}${count}` : symbol}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold text-white tabular-nums">{totalFuncs}</div>
            <div className="text-sm text-indigo-300 mt-0.5">basis functions</div>
            <div className="text-xs text-slate-500 mt-1">{totalPrimitives} primitives</div>
          </div>
        </div>

        {/* Occupied / virtual stats */}
        <OrbitalStats totalFuncs={totalFuncs} atoms={atoms} basisData={basisData} />

        {/* Spherical vs Cartesian toggle */}
        <div className="mt-4 pt-4 border-t border-indigo-800/50 flex items-center gap-3">
          <span className="text-xs text-slate-400">Harmonic type:</span>
          <div className="flex rounded-lg overflow-hidden border border-slate-600">
            <button
              onClick={() => onToggleSpherical(true)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${spherical ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              Spherical (5d, 7f…)
            </button>
            <button
              onClick={() => onToggleSpherical(false)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${!spherical ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              Cartesian (6d, 10f…)
            </button>
          </div>
        </div>
      </div>

      {/* Missing atoms warning */}
      {missingAtoms.length > 0 && (
        <div className="rounded-xl bg-amber-900/30 border border-amber-700/50 px-4 py-3 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div className="text-sm text-amber-200">
            <strong>Not supported:</strong>{' '}
            {missingAtoms.map(a => a.symbol).join(', ')} — these elements are not defined in {basisName}.
          </div>
        </div>
      )}

      {/* Per-atom breakdowns */}
      <div className="space-y-3">
        {atoms.map(({ symbol, count }) => {
          const d = basisData[symbol]
          if (!d) return null
          return (
            <AtomCard
              key={symbol}
              symbol={symbol}
              name={d.name}
              count={count}
              elemData={d}
              spherical={spherical}
            />
          )
        })}
      </div>
    </div>
  )
}
