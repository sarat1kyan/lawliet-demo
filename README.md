<div align="center">

<img src="assets/img/banner.png" alt="Lawliet" width="640">

### The Lawliet website and public documentation

</div>

This repository is the public face of **Lawliet**, the self-hosted compliance and security
operations platform: the landing page at the root and the customer documentation under
`docs/`. It is plain HTML, one stylesheet and one small script. There is no framework, no
build step and nothing to install.

The product itself is not in this repository.

## Contents

| Path | What it is |
|------|------------|
| `index.html` | Landing page, with the demo request form |
| `docs/` | Public documentation: getting started, modules, agents, security, licensing, operations |
| `docs/installation-guide.html` | The printable installation guide customers receive with a bundle |
| `thanks.html` | Shown after the demo form is posted without JavaScript |
| `404.html` | Not-found page |
| `assets/css/styles.css` | All styles, for the landing page and the docs |
| `assets/js/main.js` | Header state, mobile menu and the form post |
| `assets/img/` | Brand mark, wordmark, social banner and icons |
| `tools/generate_docs.py` | Writes the docs pages; edit content there, then run it |
| `netlify.toml` | Headers, caching and redirects |

## Run it locally

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080.

## Edit the documentation

The pages in `docs/` share a header and navigation, so they are generated:

```bash
python3 tools/generate_docs.py
```

Edit the page text in `tools/generate_docs.py`, run it, and commit the generated HTML.
`docs/installation-guide.html` is the exception: it is copied from the product
repository's `docs/getting-started/installation-guide.html` and updated from there.

Every claim on the site must be true of the shipped product. Check a statement against the
product documentation or code before changing it.

## Deploy

Import the repository into Netlify. It deploys as-is: `netlify.toml` sets the publish
directory, security headers and redirects. The demo form is registered by Netlify from the
static HTML and needs no configuration; submissions appear under the site's Forms tab.

## Brand assets

`assets/img/mark.png`, `wordmark.png` and `banner.png` are the brand kit's own files. The
icons are generated from the mark on the brand background (`#06080D`); the 16 and 32 pixel
icons are cropped to the glyph so it stays legible. Do not redraw the mark.
