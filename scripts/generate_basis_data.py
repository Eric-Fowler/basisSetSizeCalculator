#!/usr/bin/env python3
"""
Generate src/data/basisSetData.json from the basis_set_exchange Python library.

Usage:
    pip install basis_set_exchange
    python scripts/generate_basis_data.py
"""
import basis_set_exchange as bse
import json
import os

COMMON_BASIS_SETS = [
    {'name': 'STO-3G', 'family': 'Minimal', 'description': 'Minimal Slater-type orbital basis set'},
    {'name': '3-21G', 'family': 'Pople', 'description': 'Split-valence minimal basis'},
    {'name': '6-31G', 'family': 'Pople', 'description': 'Split-valence double-zeta'},
    {'name': '6-31G*', 'family': 'Pople', 'description': 'Split-valence DZ + polarization on heavy atoms'},
    {'name': '6-31G**', 'family': 'Pople', 'description': 'Split-valence DZ + polarization on all atoms'},
    {'name': '6-311G', 'family': 'Pople', 'description': 'Triple-zeta split-valence'},
    {'name': '6-311G*', 'family': 'Pople', 'description': 'Triple-zeta + polarization on heavy atoms'},
    {'name': '6-311G**', 'family': 'Pople', 'description': 'Triple-zeta + polarization on all atoms'},
    {'name': '6-311+G*', 'family': 'Pople', 'description': 'Triple-zeta + diffuse + polarization'},
    {'name': '6-311+G**', 'family': 'Pople', 'description': 'Triple-zeta + diffuse + polarization on all'},
    {'name': 'cc-pVDZ', 'family': 'Dunning', 'description': 'Correlation-consistent polarized valence double-zeta'},
    {'name': 'cc-pVTZ', 'family': 'Dunning', 'description': 'Correlation-consistent polarized valence triple-zeta'},
    {'name': 'cc-pVQZ', 'family': 'Dunning', 'description': 'Correlation-consistent polarized valence quadruple-zeta'},
    {'name': 'cc-pV5Z', 'family': 'Dunning', 'description': 'Correlation-consistent polarized valence quintuple-zeta'},
    {'name': 'aug-cc-pVDZ', 'family': 'Dunning (aug)', 'description': 'Augmented cc-pVDZ with diffuse functions'},
    {'name': 'aug-cc-pVTZ', 'family': 'Dunning (aug)', 'description': 'Augmented cc-pVTZ with diffuse functions'},
    {'name': 'aug-cc-pVQZ', 'family': 'Dunning (aug)', 'description': 'Augmented cc-pVQZ with diffuse functions'},
    {'name': 'aug-cc-pV5Z', 'family': 'Dunning (aug)', 'description': 'Augmented cc-pV5Z with diffuse functions'},
    {'name': 'def2-SVP', 'family': 'Ahlrichs', 'description': 'Ahlrichs split-valence polarization'},
    {'name': 'def2-TZVP', 'family': 'Ahlrichs', 'description': 'Ahlrichs triple-zeta valence + polarization'},
    {'name': 'def2-TZVPP', 'family': 'Ahlrichs', 'description': 'Ahlrichs triple-zeta valence + double polarization'},
    {'name': 'def2-QZVP', 'family': 'Ahlrichs', 'description': 'Ahlrichs quadruple-zeta valence + polarization'},
    {'name': 'def2-QZVPP', 'family': 'Ahlrichs', 'description': 'Ahlrichs quadruple-zeta valence + double polarization'},
]

ELEMENT_SYMBOLS = {
    1: 'H', 2: 'He', 3: 'Li', 4: 'Be', 5: 'B', 6: 'C', 7: 'N', 8: 'O', 9: 'F', 10: 'Ne',
    11: 'Na', 12: 'Mg', 13: 'Al', 14: 'Si', 15: 'P', 16: 'S', 17: 'Cl', 18: 'Ar',
    19: 'K', 20: 'Ca', 21: 'Sc', 22: 'Ti', 23: 'V', 24: 'Cr', 25: 'Mn', 26: 'Fe',
    27: 'Co', 28: 'Ni', 29: 'Cu', 30: 'Zn', 31: 'Ga', 32: 'Ge', 33: 'As', 34: 'Se',
    35: 'Br', 36: 'Kr'
}

ELEMENT_NAMES = {
    1: 'Hydrogen', 2: 'Helium', 3: 'Lithium', 4: 'Beryllium', 5: 'Boron', 6: 'Carbon',
    7: 'Nitrogen', 8: 'Oxygen', 9: 'Fluorine', 10: 'Neon', 11: 'Sodium', 12: 'Magnesium',
    13: 'Aluminum', 14: 'Silicon', 15: 'Phosphorus', 16: 'Sulfur', 17: 'Chlorine', 18: 'Argon',
    19: 'Potassium', 20: 'Calcium', 21: 'Scandium', 22: 'Titanium', 23: 'Vanadium',
    24: 'Chromium', 25: 'Manganese', 26: 'Iron', 27: 'Cobalt', 28: 'Nickel',
    29: 'Copper', 30: 'Zinc', 31: 'Gallium', 32: 'Germanium', 33: 'Arsenic',
    34: 'Selenium', 35: 'Bromine', 36: 'Krypton'
}

AM_NAMES = {0: 's', 1: 'p', 2: 'd', 3: 'f', 4: 'g', 5: 'h', 6: 'i'}

def count_functions_for_element(elem_data, spherical=True):
    shells_detail = []
    total_funcs = 0
    total_primitives = 0
    
    for shell in elem_data.get('electron_shells', []):
        am_list = shell['angular_momentum']
        n_contractions = len(shell['coefficients'])
        n_primitives = len(shell['exponents'])
        n_contractions_per_am = n_contractions // len(am_list)
        
        for am in am_list:
            if spherical:
                n_comp = 2 * am + 1
            else:
                n_comp = (am + 1) * (am + 2) // 2
            
            n_funcs = n_contractions_per_am * n_comp
            total_funcs += n_funcs
            total_primitives += n_contractions_per_am * n_primitives
            
            shells_detail.append({
                'am': am,
                'am_name': AM_NAMES.get(am, f'l{am}'),
                'n_contractions': n_contractions_per_am,
                'n_primitives': n_primitives,
                'n_funcs': n_funcs
            })
    
    return {
        'shells': shells_detail,
        'total_funcs': total_funcs,
        'total_primitives': total_primitives
    }

all_data = {}
basis_meta = []

for bs_info in COMMON_BASIS_SETS:
    bs_name = bs_info['name']
    print(f'Processing {bs_name}...')
    
    try:
        meta = bse.get_basis(bs_name)
    except Exception as e:
        print(f'  FAILED: {e}')
        continue
    
    elements_data = {}
    for z_str, elem_data_bse in meta['elements'].items():
        z = int(z_str)
        if z not in ELEMENT_SYMBOLS:
            continue
        sym = ELEMENT_SYMBOLS[z]
        result = count_functions_for_element(elem_data_bse, spherical=True)
        result_cart = count_functions_for_element(elem_data_bse, spherical=False)
        elements_data[sym] = {
            'z': z,
            'name': ELEMENT_NAMES.get(z, sym),
            'total_funcs_sph': result['total_funcs'],
            'total_funcs_cart': result_cart['total_funcs'],
            'total_primitives': result['total_primitives'],
            'shells': result['shells'],
        }
    
    all_data[bs_name] = elements_data
    basis_meta.append({
        'name': bs_name,
        'family': bs_info['family'],
        'description': bs_info['description'],
        'elements': sorted(elements_data.keys(), key=lambda s: ELEMENT_SYMBOLS.get(next(k for k,v in ELEMENT_SYMBOLS.items() if v==s), 999) if s in ELEMENT_SYMBOLS.values() else 999)
    })
    print(f'  Done: {len(elements_data)} elements')

output = {
    'basisSets': basis_meta,
    'elementSymbols': ELEMENT_SYMBOLS,
    'elementNames': ELEMENT_NAMES,
    'data': all_data
}

print(f'\nTotal basis sets: {len(basis_meta)}')
out_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'basisSetData.json')
out_path = os.path.normpath(out_path)
os.makedirs(os.path.dirname(out_path), exist_ok=True)
with open(out_path, 'w') as f:
    json.dump(output, f, separators=(',', ':'))
print(f'Written to {out_path}')
print(f'File size: {len(json.dumps(output))} bytes')
