# Basis Set Size Calculator

A static web application for calculating the number of basis functions in a quantum chemistry basis set for any chemical system.

## Features

- **23 common basis sets**: cc-pVDZ/TZ/QZ/5Z, aug-cc-pVDZ/TZ/QZ/5Z, 6-31G/6-311G (and starred variants), def2-SVP/TZVP/TZVPP/QZVP/QZVPP, STO-3G, 3-21G
- **36 elements** supported: H through Kr (Z = 1–36)
- **Instant calculation** — all basis set data is bundled into the build; no backend or API calls
- **Educational breakdown** per atom: shell types (s, p, d, f…), contracted vs primitive counts, angular momentum explained
- **Spherical harmonics** (5d, 7f…) or **Cartesian** (6d, 10f…) toggle
- **Formula parser** — type `H2O`, `C6H6`, `Fe(CO)5` and the atoms are parsed automatically
- **Quick presets** for common molecules
- **Manual atom picker** with element browser

## Getting Started

```bash
npm install
npm run dev     # development server at http://localhost:5173
npm run build   # production build in dist/
npm run preview # preview the production build
```

The `dist/` folder contains a self-contained static site ready to deploy on GitHub Pages, Netlify, Vercel, or any static host.

## Data

Basis set data is sourced from the [Basis Set Exchange](https://www.basissetexchange.org/) (MolSSI BSE) via the [`basis_set_exchange`](https://pypi.org/project/basis-set-exchange/) Python package and pre-generated into `src/data/basisSetData.json` at build time. The generation script is at `scripts/generate_basis_data.py`.

## Tech Stack

- [React](https://react.dev/) + [Vite](https://vite.dev/) — fast static build
- [Tailwind CSS v4](https://tailwindcss.com/) — utility-first styling
