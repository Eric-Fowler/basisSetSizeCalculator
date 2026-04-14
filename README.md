# Basis Set Size Calculator

A static web application for calculating the number of basis functions in a quantum chemistry basis set for any chemical system.

## Features

- **622 basis sets** from the Basis Set Exchange: Pople, Dunning (cc-pV*Z), Ahlrichs (def2-*), ANO, Jensen, and many more
- **36 elements** supported: H through Kr (Z = 1–36)
- **Instant calculation** — basis metadata is bundled at build time; per-basis shell data is loaded on demand
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

Basis set data is sourced from the [Basis Set Exchange](https://www.basissetexchange.org/) (MolSSI BSE) via the [`basis_set_exchange`](https://pypi.org/project/basis-set-exchange/) Python package and pre-generated as static JSON payloads. The generation script is at `scripts/generate_basis_data.py`.

Two output artifacts are produced:
- `src/data/basisSetMeta.json` — lightweight metadata (basis name, family, supported elements, default harmonic type) bundled into the app at build time
- `public/data/basis/*.json` — per-basis element/shell data loaded lazily at runtime when the user selects a basis set; in production builds these are shipped as `dist/data/basis/*.json`

## Tech Stack

- [React](https://react.dev/) + [Vite](https://vite.dev/) — fast static build
- [Tailwind CSS v4](https://tailwindcss.com/) — utility-first styling

## Deploying to GitHub Pages

To deploy this app to GitHub Pages:

1. **Set the base path in Vite config**
   
   Edit `vite.config.js` and add the `base` option to match your repository name:
   
   ```js
   // vite.config.js
   export default defineConfig({
     base: '/your-repo-name/', // <-- replace with your repo name
     plugins: [react(), tailwindcss()],
   })
   ```

2. **Build the site**
   
   ```bash
   npm run build
   ```
   This creates a `dist/` folder with the static site.

3. **Deploy to GitHub Pages**
   
   You can use the [gh-pages](https://www.npmjs.com/package/gh-pages) package or push manually:
   
   - Install gh-pages (if you want to automate):
     ```bash
     npm install --save-dev gh-pages
     ```
   - Add these scripts to your `package.json`:
     ```json
     "scripts": {
       ...existing scripts...
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
     ```
   - Deploy:
     ```bash
     npm run deploy
     ```
   
   Or, manually push `dist/` to a `gh-pages` branch:
   ```bash
   git checkout --orphan gh-pages
   git --work-tree dist add --all
   git --work-tree dist commit -m 'Deploy'
   git push origin gh-pages --force
   git checkout main
   ```

4. **Configure GitHub Pages**
   
   In your repository settings on GitHub, set Pages to deploy from the `gh-pages` branch (root).

5. **Access your site**
   
   Visit `https://<your-username>.github.io/<your-repo-name>/` after a few minutes.

For more details, see the [Vite deployment guide](https://vitejs.dev/guide/static-deploy.html#github-pages).
