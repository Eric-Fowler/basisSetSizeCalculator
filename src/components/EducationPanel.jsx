export default function EducationPanel() {
  return (
    <details className="group rounded-2xl bg-slate-800/50 border border-slate-700 overflow-hidden">
      <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none
                          hover:bg-slate-800 transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-xl">🎓</span>
          <span className="font-semibold text-white">What is a basis set? (Educational)</span>
        </div>
        <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform"
             fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>

      <div className="px-5 pb-5 pt-1 space-y-5 text-sm text-slate-300 leading-relaxed border-t border-slate-700">

        {/* What is a basis set? */}
        <section>
          <h3 className="font-semibold text-white mb-2">What is a Basis Set?</h3>
          <p>
            In quantum chemistry, molecular orbitals are expressed as linear combinations of
            pre-defined mathematical functions called <strong className="text-indigo-300">basis functions</strong>.
            The collection of these functions for a given molecule is called the <em>basis set</em>.
            Larger basis sets give more accurate results but require more computational resources.
          </p>
        </section>

        {/* Angular momentum */}
        <section>
          <h3 className="font-semibold text-white mb-2">Angular Momentum (Shell Types)</h3>
          <p className="mb-3">
            Each basis function belongs to a <em>shell</em> characterised by an angular momentum quantum
            number <strong className="text-indigo-300">ℓ</strong>:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { am: 's', l: 0, n: 1, desc: '1 function (no angular nodes)' },
              { am: 'p', l: 1, n: 3, desc: '3 functions (px, py, pz)' },
              { am: 'd', l: 2, n: 5, desc: '5 functions (spherical) or 6 (Cartesian)' },
              { am: 'f', l: 3, n: 7, desc: '7 functions (spherical) or 10 (Cartesian)' },
            ].map(({ am, l, desc }) => (
              <div key={am} className="rounded-lg bg-slate-900/70 border border-slate-700 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold am-${am}`}>{am}</span>
                  <span className="text-white font-semibold">ℓ = {l}</span>
                </div>
                <div className="text-xs text-slate-400">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Primitives vs contracted */}
        <section>
          <h3 className="font-semibold text-white mb-2">Primitives vs Contracted Functions</h3>
          <p>
            Each basis function is typically a <em>contracted</em> linear combination of simpler
            Gaussian functions called <strong className="text-indigo-300">primitives</strong>.
            More primitives per contraction means a more flexible representation of the electron density,
            but the number of basis functions that enter the SCF equations is determined by the number
            of <em>contracted</em> functions.
          </p>
          <div className="mt-3 rounded-lg bg-slate-900/70 border border-slate-700 p-3 font-mono text-xs text-slate-300">
            φ<sub>μ</sub>(r) = Σ<sub>p</sub> c<sub>pμ</sub> · χ<sub>p</sub>(r)
            <br />
            <span className="text-slate-500 text-xs">(contracted) = Σ (coefficients) × (Gaussian primitives)</span>
          </div>
        </section>

        {/* Counting formula */}
        <section>
          <h3 className="font-semibold text-white mb-2">Counting Basis Functions</h3>
          <p className="mb-2">
            For <strong className="text-indigo-300">spherical harmonics</strong> (most modern programs):
          </p>
          <div className="rounded-lg bg-slate-900/70 border border-slate-700 p-3 font-mono text-xs space-y-1">
            <div>N<sub>funcs</sub>(shell) = N<sub>contracted</sub> × (2ℓ + 1)</div>
            <div className="text-slate-500">e.g. 2 contracted d shells = 2 × 5 = 10 functions</div>
          </div>
          <p className="mt-2 mb-2">
            For <strong className="text-indigo-300">Cartesian</strong> functions:
          </p>
          <div className="rounded-lg bg-slate-900/70 border border-slate-700 p-3 font-mono text-xs space-y-1">
            <div>N<sub>funcs</sub>(shell) = N<sub>contracted</sub> × (ℓ+1)(ℓ+2)/2</div>
            <div className="text-slate-500">e.g. 2 contracted d shells = 2 × 6 = 12 functions</div>
          </div>
        </section>

        {/* Common families */}
        <section>
          <h3 className="font-semibold text-white mb-2">Common Basis Set Families</h3>
          <div className="space-y-2">
            {[
              { fam: 'Pople (6-31G, 6-311G…)', color: 'bg-indigo-900/50 border-indigo-700/50',
                desc: 'Workhorse basis sets for medium-sized molecules. The notation N-MKLG describes the number of Gaussians used for core and valence shells.' },
              { fam: 'Dunning (cc-pVXZ)', color: 'bg-teal-900/50 border-teal-700/50',
                desc: 'Designed for systematic convergence to the complete basis set (CBS) limit in correlated calculations. X = D (double), T (triple), Q (quadruple), 5 (quintuple).' },
              { fam: 'Dunning aug (aug-cc-pVXZ)', color: 'bg-cyan-900/50 border-cyan-700/50',
                desc: 'Dunning basis sets augmented with diffuse functions, essential for anions, excited states, and weakly interacting systems.' },
              { fam: 'Ahlrichs (def2-*)', color: 'bg-violet-900/50 border-violet-700/50',
                desc: 'Optimised for the full periodic table with balanced accuracy/cost. SVP < TZVP < TZVPP < QZVP < QZVPP in quality.' },
            ].map(({ fam, color, desc }) => (
              <div key={fam} className={`rounded-lg ${color} border p-3`}>
                <div className="font-semibold text-white text-sm mb-1">{fam}</div>
                <div className="text-xs text-slate-300">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Credit */}
        <section className="rounded-lg bg-slate-900/50 border border-slate-700 p-3">
          <p className="text-xs text-slate-400">
            Basis set data sourced from the{' '}
            <a href="https://www.basissetexchange.org/" target="_blank" rel="noopener noreferrer"
               className="text-indigo-400 hover:text-indigo-300 underline">
              Basis Set Exchange
            </a>
            {' '}(MolSSI BSE). Function counts use the spherical harmonic convention by default.
          </p>
        </section>
      </div>
    </details>
  )
}
