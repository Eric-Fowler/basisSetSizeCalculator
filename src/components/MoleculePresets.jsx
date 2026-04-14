const PRESETS = [
  { name: 'H₂O',    formula: 'H2O',    label: 'Water' },
  { name: 'CH₄',    formula: 'CH4',    label: 'Methane' },
  { name: 'NH₃',    formula: 'NH3',    label: 'Ammonia' },
  { name: 'CO₂',    formula: 'CO2',    label: 'CO₂' },
  { name: 'C₂H₄',   formula: 'C2H4',   label: 'Ethylene' },
  { name: 'C₆H₆',   formula: 'C6H6',   label: 'Benzene' },
  { name: 'HF',     formula: 'HF',     label: 'Hydrogen Fluoride' },
  { name: 'N₂',     formula: 'N2',     label: 'Dinitrogen' },
  { name: 'C₂H₂',   formula: 'C2H2',   label: 'Acetylene' },
  { name: 'H₂O₂',   formula: 'H2O2',   label: 'Hydrogen Peroxide' },
  { name: 'SO₂',    formula: 'SO2',    label: 'Sulfur Dioxide' },
  { name: 'Fe(CO)₅', formula: 'Fe(CO)5', label: 'Iron Pentacarbonyl' },
]

export default function MoleculePresets({ onSelect }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Quick presets</p>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(p => (
          <button
            key={p.formula}
            onClick={() => onSelect(p.formula)}
            title={p.label}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700
                       hover:border-indigo-500 hover:bg-indigo-900/30 transition-colors
                       text-sm font-mono text-slate-300 hover:text-indigo-200"
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  )
}
