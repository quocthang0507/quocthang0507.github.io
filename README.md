# quocthang0507.github.io

[https://quocthang0507.github.io/](https://quocthang0507.github.io/)

## Stylesheet Architecture

The site uses Jekyll's Sass pipeline:

- Entry point: `assets/css/main.scss` (empty front matter) compiles to `assets/css/main.css`.
- Source partials: `_sass/_variables.scss`, `_base.scss`, `_buttons.scss`, `_navigation.scss`, `_components.scss`, `_utilities.scss`, `_dark.scss`, `_legacy.scss`.
- Sourcemaps requested via `_config.yml` (`sass: sourcemap: always`). If the installed `jekyll-sass-converter` version ignores it, output still works—just without maps.

### Development

1. Run: `bundle exec jekyll serve`.
2. Use browser devtools to inspect; rules should point back to partials when sourcemaps supported.
3. Add new partials in `_sass/` and import them in `assets/css/main.scss`.

### Design Tokens

CSS custom properties live in `_variables.scss` (colors, shadows, spacing tokens). Gradients were removed—flat colors only.

### Roadmap Ideas

- Break `_legacy.scss` into smaller focused partials (cookie consent, tables, dark toggle, etc.).
- Optional theme toggle adding/removing `body.custom-theme`.
- Add Stylelint for consistency.

### Example (adding a new component partial)

Create `_sass/_my-component.scss` then add near the bottom of `main.scss`:

`@import "my-component";`

Rebuild / refresh; the styles are included automatically.

