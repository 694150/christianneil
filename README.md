# Neil’s Workspace

The main portfolio is `index.html`. Only this edition is actively maintained. The original `/v1.html` and previous `/v2.html` are frozen snapshots with their own CSS, JavaScript, and assets.

## Edit and build

Requires Node.js 22 or newer. No npm packages are needed for the site or build.

```sh
npm run build
npm test
npm run preview
```

Preview: `http://127.0.0.1:5174`. Use `/?no-js=1` to test the main page with scripts blocked. `npm run dev` builds once and starts the preview server; rebuild after editing.

- `src/index.html`: main page markup, with build tokens for project cards and metadata.
- `src/projects.json`: project descriptions, categories, artwork, and Behance links.
- `src/app.js`: page navigation, introduction, project dialogs, and filters.
- `src/styles/`: local font declarations, preserved portfolio styling, and mobile refinements.
- `src/asset-manifest.json`: generated thumbnail dimensions and sizes.
- `public/main-assets/`: prepared assets used by the main edition.
- Other files in `public/`: immutable legacy editions and their dependencies.
- `scripts/build.mjs`: deterministic build; hashes main asset URLs for cache invalidation.
- `outputs/portfolio/dist/`: generated deployment output. Do not edit it.
- `archive/legacy-work/`: previous source fragments and tooling, retained for reference.

Builds never read generated output as input. The build copies archived editions byte for byte, and tests check their hashes. Older standalone HTML exports are historical snapshots and are not rebuilt.

## Projects and images

Keep descriptions specific to what the work shows. Website mockups are design presentations, not proof of a live WordPress implementation. Do not add conversion figures, client relationships, or tool claims without evidence. See `docs/content-review.md`.

Add artwork to `public/assets/` only as a source for the optional optimizer; existing files there are frozen. Add a project to `src/projects.json`, run `python scripts/optimize-assets.py` using Python with Pillow, and commit the new files in `public/main-assets/` and `src/asset-manifest.json`. Then build. Asset preparation is separate from deployment and requires no network at build time. Original artwork is retained for project dialogs; small static WebP variants power the gallery.

DM Sans is self-hosted with its OFL license. Existing icon licenses are retained. Inktera is served as WOFF2 (37,700 bytes instead of the original 233,820 bytes, with all glyphs preserved). To regenerate it, install `fonttools[woff]` in a Python environment and run `python scripts/optimize-font.py`. The original supplied file stays in the archive assets. Its commercial webfont license has not been provided and should be confirmed before public launch.

## Vercel preparation

Import this directory as the project root. `vercel.json` configures the **Other** framework preset, `npm run build`, and `outputs/portfolio/dist` output. No SPA rewrite is used: fragments navigate within the page, archive URLs remain files, and unknown URLs receive a 404. Main assets have content-hashed filenames and immutable cache headers.

No production domain is assumed. Set the **`SITE_URL`** environment variable to the chosen HTTPS origin (no path), then rebuild. On Vercel, `VERCEL_PROJECT_PRODUCTION_URL` supplies a fallback when available. The build adds an absolute canonical URL, social image URL, and sitemap when an origin is known. Without one, the canonical and sitemap are omitted. Vercel preview builds use `noindex, nofollow` and a disallowing robots file.

The build does not read `.env` files automatically. `.env.example` documents the optional variable; configure it through your shell or Vercel settings.

The site is prepared, **not deployed**. Configuration follows [Vercel build settings](https://vercel.com/docs/builds/configure-a-build) and [vercel.json configuration](https://vercel.com/docs/project-configuration/vercel-json).
