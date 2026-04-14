#!/usr/bin/env python3
"""
Generate static basis set data files from the basis_set_exchange Python library.

Outputs:
  src/data/basisSetMeta.json   - metadata for all orbital basis sets (bundled at startup)
  public/data/basis/{id}.json  - per-basis element data (fetched lazily on demand)

Usage:
    pip install basis_set_exchange
    python scripts/generate_basis_data.py
"""
import basis_set_exchange as bse
import json
import os

# ── Element tables ────────────────────────────────────────────────────────────
ELEMENT_SYMBOLS = {
    1: 'H',  2: 'He', 3: 'Li', 4: 'Be', 5: 'B',  6: 'C',  7: 'N',  8: 'O',
    9: 'F',  10: 'Ne',11: 'Na',12: 'Mg',13: 'Al',14: 'Si',15: 'P', 16: 'S',
    17: 'Cl',18: 'Ar',19: 'K', 20: 'Ca',21: 'Sc',22: 'Ti',23: 'V', 24: 'Cr',
    25: 'Mn',26: 'Fe',27: 'Co',28: 'Ni',29: 'Cu',30: 'Zn',31: 'Ga',32: 'Ge',
    33: 'As',34: 'Se',35: 'Br',36: 'Kr',
}
ELEMENT_NAMES = {
    1:'Hydrogen',   2:'Helium',   3:'Lithium',    4:'Beryllium', 5:'Boron',
    6:'Carbon',     7:'Nitrogen', 8:'Oxygen',     9:'Fluorine',  10:'Neon',
    11:'Sodium',   12:'Magnesium',13:'Aluminium', 14:'Silicon',  15:'Phosphorus',
    16:'Sulfur',   17:'Chlorine', 18:'Argon',     19:'Potassium',20:'Calcium',
    21:'Scandium', 22:'Titanium', 23:'Vanadium',  24:'Chromium', 25:'Manganese',
    26:'Iron',     27:'Cobalt',   28:'Nickel',    29:'Copper',   30:'Zinc',
    31:'Gallium',  32:'Germanium',33:'Arsenic',   34:'Selenium', 35:'Bromine',
    36:'Krypton',
}
SYMBOL_TO_Z = {sym: z for z, sym in ELEMENT_SYMBOLS.items()}
AM_NAMES = {0:'s',1:'p',2:'d',3:'f',4:'g',5:'h',6:'i'}

# ── BSE family → display name ─────────────────────────────────────────────────
FAMILY_DISPLAY = {
    'sto':            'STO / Minimal',
    'pople':          'Pople',
    'dunning':        'Dunning',
    'dunning_aug':    'Dunning (aug)',
    'dunning_dk':     'Dunning (DK)',
    'dunning_dk3':    'Dunning (DK3)',
    'dunning_x2c':    'Dunning (X2C)',
    'ahlrichs':       'Ahlrichs',
    'ahlrichs_dhf':   'Ahlrichs',
    'ahlrichs_x2c':   'Ahlrichs (X2C)',
    'ano':            'ANO',
    'ano_claudino':   'ANO',
    'nasa_ames':      'NASA Ames',
    'jensen':         'Jensen (pc-n)',
    'ccj':            'Jensen (cc-J)',
    'acvxz_j':        'Jensen (acVXZ-J)',
    'jorge':          'Jorge (ADZP)',
    'aug_mcc':        'aug-mcc',
    'binning':        'Binning-Curtiss',
    'blaudeau':       'Blaudeau',
    'cadpac':         'CADPAC',
    'crenb':          'CRENB ECP',
    'cologne':        'Cologne',
    'dfo':            'DFO',
    'demon2k':        'DeMon2k',
    'dgauss':         'DGauss',
    'dgauss_dk':      'DGauss (DK)',
    'dgauss_dzvp':    'DGauss DZVP',
    'dunning_hay':    'Dunning-Hay',
    'epr':            'EPR',
    'hondo':          'HONDO',
    'iglo':           'IGLO',
    'lehtola_hgbs':   'Lehtola HGBS',
    'nlo':            'NLO',
    'ranasinghe':     'Ranasinghe',
    'sap':            'SAP',
    'sarc':           'SARC',
    'ugbs':           'UGBS',
    'zorrilla':       'Zorrilla',
}

# ── Auxiliary basis filter ────────────────────────────────────────────────────
_AUX_SUFFIXES = [
    '-rifit', '-jkfit', '-optri', '-mp2fit', '-cabs', '-ri', '-j',
    '-universal-jfit', '-universal-jkfit', '-rijtmp', '-optri+', '-rifit+',
]
def is_auxiliary(name):
    nl = name.lower()
    return any(nl.endswith(s) for s in _AUX_SUFFIXES)

# ── Harmonic type inference ───────────────────────────────────────────────────
def infer_harmonic(bs_data):
    """
    Returns 'spherical', 'cartesian', or 'unspecified'.
    Examines function_type on shells with angular momentum ≥ 2.
    """
    has_spherical = False
    has_cartesian = False
    for elem_data in bs_data.get('elements', {}).values():
        for shell in elem_data.get('electron_shells', []):
            ft = shell.get('function_type', 'gto')
            if ft == 'gto_spherical':
                has_spherical = True
            elif ft == 'gto_cartesian':
                has_cartesian = True
    if has_spherical and not has_cartesian:
        return 'spherical'
    if has_cartesian and not has_spherical:
        return 'cartesian'
    if has_spherical and has_cartesian:
        return 'spherical'   # mixed: treat as spherical
    # Pure 'gto' – no explicit annotation; default to spherical for modern convention
    return 'unspecified'

# ── Basis function counter ────────────────────────────────────────────────────
def count_functions(elem_data, spherical=True):
    shells_detail = []
    total_funcs = 0
    total_primitives = 0
    for shell in elem_data.get('electron_shells', []):
        am_list = shell['angular_momentum']
        n_contractions = len(shell['coefficients'])
        n_primitives   = len(shell['exponents'])
        n_per_am = n_contractions // len(am_list)
        for am in am_list:
            n_comp = (2 * am + 1) if spherical else ((am + 1) * (am + 2) // 2)
            n_funcs = n_per_am * n_comp
            total_funcs += n_funcs
            total_primitives += n_per_am * n_primitives
            shells_detail.append({
                'am': am,
                'am_name': AM_NAMES.get(am, f'l{am}'),
                'n_contractions': n_per_am,
                'n_primitives': n_primitives,
                'n_funcs': n_funcs,
            })
    return {'shells': shells_detail, 'total_funcs': total_funcs, 'total_primitives': total_primitives}

# ── Main processing ───────────────────────────────────────────────────────────
repo_root = os.path.normpath(os.path.join(os.path.dirname(__file__), '..'))
meta_path  = os.path.join(repo_root, 'src', 'data', 'basisSetMeta.json')
basis_dir  = os.path.join(repo_root, 'public', 'data', 'basis')
os.makedirs(os.path.dirname(meta_path), exist_ok=True)
os.makedirs(basis_dir, exist_ok=True)

all_bs_names = bse.get_all_basis_names()
all_bs_names_lower = {n.lower(): n for n in all_bs_names}
orbital_bs = [b for b in all_bs_names if not is_auxiliary(b)]
print(f'Processing {len(orbital_bs)} orbital basis sets…')

# ── Auxiliary basis lookup helpers ────────────────────────────────────────────
def find_aux_basis(orbital_name, suffix):
    """Find a matching auxiliary basis by appending suffix (e.g. '-RIFIT', '-JKFIT')."""
    candidate = f'{orbital_name}-{suffix}'.lower()
    return all_bs_names_lower.get(candidate)

def count_aux_functions(aux_name, element_zs):
    """Count auxiliary basis functions per element (always spherical harmonics)."""
    try:
        raw_aux = bse.get_basis(aux_name)
    except Exception:
        return {}
    result = {}
    for z in element_zs:
        z_str = str(z)
        if z_str not in raw_aux.get('elements', {}):
            continue
        elem_data = raw_aux['elements'][z_str]
        cf = count_functions(elem_data, spherical=True)
        if cf['total_funcs'] > 0:
            result[z] = cf['total_funcs']
    return result

# Pre-load the def2-universal-JKFIT fallback (Psi4's default for SCF DF)
JKFIT_FALLBACK_NAME = 'def2-universal-JKFIT'
print(f'Loading fallback JKFIT: {JKFIT_FALLBACK_NAME}')

basis_meta = []

for idx, bs_name in enumerate(orbital_bs):
    try:
        raw = bse.get_basis(bs_name)
    except Exception as e:
        print(f'  SKIP {bs_name}: {e}')
        continue

    # Detect harmonic type
    default_harmonic = infer_harmonic(raw)

    # BSE family → display name
    try:
        bse_family = bse.get_basis_family(bs_name)
        family = FAMILY_DISPLAY.get(bse_family, bse_family.replace('_', ' ').title())
    except Exception:
        family = 'Other'

    # Build per-element data
    elements_data = {}
    for z_str, elem_bse in raw['elements'].items():
        z = int(z_str)
        if z not in ELEMENT_SYMBOLS:
            continue
        sym = ELEMENT_SYMBOLS[z]
        sph  = count_functions(elem_bse, spherical=True)
        cart = count_functions(elem_bse, spherical=False)
        # Skip elements that have no electron shells (e.g. ECP-only entries)
        if sph['total_funcs'] == 0:
            continue
        elements_data[sym] = {
            'z': z,
            'name': ELEMENT_NAMES.get(z, sym),
            'total_funcs_sph':  sph['total_funcs'],
            'total_funcs_cart': cart['total_funcs'],
            'total_primitives': sph['total_primitives'],
            'shells': sph['shells'],
        }

    if not elements_data:
        print(f'  SKIP {bs_name}: no supported elements')
        continue

    # ── Look up density-fitting auxiliary basis sets ──────────────────────────
    element_zs = [d['z'] for d in elements_data.values()]

    # RIFIT (correlation DF, e.g. RI-MP2)
    rifit_name = find_aux_basis(bs_name, 'RIFIT')
    rifit_funcs = count_aux_functions(rifit_name, element_zs) if rifit_name else {}

    # JKFIT (SCF DF): try exact match first, fall back to def2-universal-JKFIT
    jkfit_name = find_aux_basis(bs_name, 'JKFIT')
    if jkfit_name:
        jkfit_funcs = count_aux_functions(jkfit_name, element_zs)
    else:
        jkfit_name = JKFIT_FALLBACK_NAME
        jkfit_funcs = count_aux_functions(JKFIT_FALLBACK_NAME, element_zs)

    # Attach auxiliary function counts to element data
    for sym, edata in elements_data.items():
        z = edata['z']
        if z in jkfit_funcs:
            edata['aux_jkfit_funcs'] = jkfit_funcs[z]
        if z in rifit_funcs:
            edata['aux_rifit_funcs'] = rifit_funcs[z]

    # Write per-basis data file
    data_file = os.path.join(basis_dir, f'{idx}.json')
    with open(data_file, 'w') as f:
        json.dump(elements_data, f, separators=(',', ':'))

    supported_syms = sorted(elements_data.keys(), key=lambda s: SYMBOL_TO_Z.get(s, 999))
    meta_entry = {
        'id':               idx,
        'name':             bs_name,
        'family':           family,
        'description':      '',          # BSE doesn't expose free-text descriptions easily
        'elements':         supported_syms,
        'default_harmonic': default_harmonic,
    }
    if jkfit_name:
        meta_entry['jkfit_basis'] = jkfit_name
    if rifit_name:
        meta_entry['rifit_basis'] = rifit_name
    basis_meta.append(meta_entry)

    if idx % 50 == 0:
        aux_info = []
        if rifit_name: aux_info.append(f'RIFIT={rifit_name}')
        if jkfit_name: aux_info.append(f'JKFIT={jkfit_name}')
        print(f'  [{idx}/{len(orbital_bs)}] {bs_name}: {len(elements_data)} elements, harmonic={default_harmonic}, {", ".join(aux_info) or "no DF aux"}')

# Add short descriptions for well-known basis sets
DESCRIPTIONS = {
    'STO-3G':       'Minimal Slater-type orbital basis set',
    '3-21G':        'Split-valence minimal basis',
    '6-31G':        'Split-valence double-zeta (Pople)',
    '6-31G*':       'Split-valence DZ + polarization on heavy atoms',
    '6-31G**':      'Split-valence DZ + polarization on all atoms',
    '6-311G':       'Triple-zeta split-valence (Pople)',
    '6-311G*':      'Triple-zeta + polarization on heavy atoms',
    '6-311G**':     'Triple-zeta + polarization on all atoms',
    '6-311+G*':     'Triple-zeta + diffuse + polarization (heavy atoms)',
    '6-311+G**':    'Triple-zeta + diffuse + polarization (all atoms)',
    'cc-pVDZ':      'Correlation-consistent polarized valence double-zeta',
    'cc-pVTZ':      'Correlation-consistent polarized valence triple-zeta',
    'cc-pVQZ':      'Correlation-consistent polarized valence quadruple-zeta',
    'cc-pV5Z':      'Correlation-consistent polarized valence quintuple-zeta',
    'aug-cc-pVDZ':  'Augmented cc-pVDZ with diffuse functions',
    'aug-cc-pVTZ':  'Augmented cc-pVTZ with diffuse functions',
    'aug-cc-pVQZ':  'Augmented cc-pVQZ with diffuse functions',
    'aug-cc-pV5Z':  'Augmented cc-pV5Z with diffuse functions',
    'def2-SVP':     'Ahlrichs split-valence polarization',
    'def2-TZVP':    'Ahlrichs triple-zeta valence + polarization',
    'def2-TZVPP':   'Ahlrichs triple-zeta valence + double polarization',
    'def2-QZVP':    'Ahlrichs quadruple-zeta valence + polarization',
    'def2-QZVPP':   'Ahlrichs quadruple-zeta valence + double polarization',
}
for entry in basis_meta:
    if entry['name'] in DESCRIPTIONS:
        entry['description'] = DESCRIPTIONS[entry['name']]

# Write metadata
with open(meta_path, 'w') as f:
    json.dump({'basisSets': basis_meta}, f, separators=(',', ':'))

print(f'\nDone. {len(basis_meta)} basis sets written.')
print(f'Metadata: {meta_path} ({os.path.getsize(meta_path)//1024}KB)')
print(f'Data dir: {basis_dir} ({len(os.listdir(basis_dir))} files)')
