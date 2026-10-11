# klair-site

The landing page for [Klair](https://github.com/evandong1976/Klair), a background macOS study assistant. It's plain HTML, CSS and JavaScript with no build step.

## Run it locally

ES modules don't load from `file://`, so serve the folder:

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173.

## What's here

| Path | What it is |
| --- | --- |
| `index.html` | The whole page: hero with an interactive demo, features, how it works, install guide, keys, privacy, troubleshooting |
| `styles.css` | Styles. Colors and type follow `Klair/design/DESIGN.md` |
| `js/flower.js` | The pixel flower, ported from `Klair/design/reference/flower.ts` |
| `js/main.js` | Flower drawing, the demo (open → ideas → answer → highlights), copy buttons, scroll reveals |
| `assets/fonts/` | Reforma 1918 by PampaType, CC BY-ND 4.0 (see `LICENSE.txt`) |
| `CNAME` | The custom domain for GitHub Pages |

When Klair's setup changes, update the **Install** section of `index.html` to match Klair's README.

## Deploy on GitHub Pages with a .tech domain

1. Push this repo to GitHub.
2. In the repo, go to **Settings › Pages**, set **Source** to "Deploy from a branch", and choose `main` and `/ (root)`.
3. Set `CNAME` to your domain (it's `klair.tech` now) and enter the same domain under **Custom domain**.
4. At your .tech registrar, add DNS records:
   - Apex (`klair.tech`): four `A` records pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`
   - `www`: a `CNAME` record pointing to `<your-github-username>.github.io`
5. Once DNS resolves (minutes to a few hours), tick **Enforce HTTPS**.

Netlify, Vercel or Cloudflare Pages also work: point them at the repo root with no build command.
