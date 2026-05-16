# 🐦 layout-canary

[![npm version](https://img.shields.io/npm/v/layout-canary.svg)](https://www.npmjs.com/package/layout-canary)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Zero-config runtime layout bug detector for development.**

Two modes:

- **Browser mode** — drop one import into any JS/TS project. layout-canary highlights broken elements with a red outline and plain-English tooltips, live as the DOM changes. Auto-disables in production.
- **CLI mode** — point it at any URL and get a full bug report in the terminal. Works without touching your codebase. Built for coding agents, CI pipelines, and quick audits.

---

## Install

```bash
npm install --save-dev layout-canary
# or
yarn add -D layout-canary
# or
pnpm add -D layout-canary
```

---

## Browser mode

### Usage

```js
// Add to your main entry file (main.ts, index.tsx, app.js, etc.)
import 'layout-canary'
```

That's it. layout-canary auto-starts on page load and watches for DOM changes using `MutationObserver` + `ResizeObserver`. It auto-disables itself when `NODE_ENV=production`.

### What you see

- **Red/orange dashed outlines** on every broken element
- **Inline tooltip** on each element with a plain-English label
- **Floating panel** in the bottom-right corner listing all issues by severity
- **Grouped console output** under a collapsible `layout-canary` header

### Vite / React example

```tsx
// src/main.tsx
if (import.meta.env.DEV) {
  import('layout-canary')
}
```

### Programmatic API

```ts
import { init, destroy, LayoutCanary } from 'layout-canary'

const canary = init({
  ignore: ['ultrawide'],        // skip specific detectors
  showPanel: true,              // on-screen panel (default: true)
  highlightElements: true,      // red outlines (default: true)
  logToConsole: true,           // grouped console warnings (default: true)
  ultrawideThreshold: 1920,     // px above which ultrawide activates (default: 1800)
})

// Manually trigger a scan and get results
const issues = canary.scan()

// Stop watching
destroy()
```

---

## CLI mode

Scan any URL from the terminal — no code changes needed. Uses headless Chromium via Puppeteer.

### Usage

```bash
# Scan at default viewport (1280×800)
npx layout-canary https://yoursite.com

# Scan at iPhone SE size
npx layout-canary https://yoursite.com --viewport 375x812

# Scan all 7 standard breakpoints in one run
npx layout-canary https://yoursite.com --all-breakpoints

# Machine-readable JSON output
npx layout-canary https://yoursite.com --json

# Custom ultrawide threshold
npx layout-canary https://yoursite.com --threshold 1920
```

### Terminal output

```
🐦 layout-canary
   https://yoursite.com

  Viewport 1280×800
  ──────────────────────────────────────────────────────────

  ERRORS (2)
    ● [horizontal-overflow] Element extends 368px past viewport
      body > div.page > div.hero > div.inner
      <div.inner>

    ● [text-clipping] Content is 98px tall inside a 80px container
      body > div.page > div.card
      overflow-y: hidden; height: 80px

  WARNINGS (3)
    ● [off-screen] Off-screen element (left)
    ● [z-index-conflict] <div> (z:-1) hidden behind <div> (z:10)
    ● [broken-breakpoint] Element is 300px wider than its container at ~1280px

  Total: 5 issues  (2 errors, 3 warnings, 0 info)
```

### JSON output (`--json`)

```json
{
  "url": "https://yoursite.com",
  "scannedAt": "2026-05-16T10:00:00.000Z",
  "viewports": [
    {
      "width": 1280,
      "height": 800,
      "label": "1280×800",
      "issueCount": 5,
      "issues": [
        {
          "kind": "horizontal-overflow",
          "severity": "error",
          "message": "Element extends 368px past viewport",
          "selector": "body > div.page > div.hero > div.inner",
          "tagName": "div"
        }
      ]
    }
  ],
  "summary": { "total": 5, "errors": 2, "warnings": 3, "info": 0 }
}
```

### CI usage

layout-canary exits with code `1` if any errors are found — plug it straight into a CI pipeline:

```yaml
- name: Layout audit
  run: npx layout-canary https://staging.yoursite.com --all-breakpoints
```

### Coding agent usage

Feed JSON output directly to an AI agent:

```bash
npx layout-canary https://yoursite.com --json | your-agent fix-layout
```

---

## What it detects

| Detector | Severity | What it catches |
|----------|----------|-----------------|
| `horizontal-overflow` | Error | Elements extending past the right edge of the viewport, causing a hidden horizontal scrollbar |
| `off-screen` | Warning | Elements rendered left, right, or above the visible viewport — caused by negative margins or translate transforms |
| `z-index-conflict` | Warning | Positioned elements with negative z-index hidden behind siblings or the background |
| `text-clipping` | Error | Text cut off by `overflow: hidden` or a fixed height — `scrollHeight > clientHeight` |
| `broken-breakpoint` | Warning | Elements wider than their parent container at the current viewport width |
| `safe-area` | Warning | Fixed-position elements overlapping iPhone notch (top) or home indicator (bottom) — missing `env(safe-area-inset-*)` |
| `ultrawide` | Info | Full-width elements or text lines exceeding ~800px at viewport widths above 1800px |

---

## Supported breakpoints

| Breakpoint | Target devices |
|-----------|----------------|
| 375px | iPhone SE, small Android phones |
| 390px | iPhone 14 / iPhone 15 |
| 768px | iPad, Android tablets |
| 1024px | iPad Pro, small laptops |
| 1280px | Standard laptops |
| 1920px | Desktop / Full HD monitors |
| 2560px+ | Ultrawide monitors, projectors |

---

## Configuration options (browser mode)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `detectors` | `IssueKind[]` | all | Which detectors to run |
| `ignore` | `IssueKind[]` | `[]` | Detectors to skip |
| `ultrawideThreshold` | `number` | `1800` | Viewport width (px) above which ultrawide detection activates |
| `showPanel` | `boolean` | `true` | Show the on-screen panel |
| `highlightElements` | `boolean` | `true` | Add outlines to broken elements |
| `logToConsole` | `boolean` | `true` | Log issues to the browser console |

## CLI options

| Flag | Default | Description |
|------|---------|-------------|
| `--viewport WxH` | `1280x800` | Set viewport size |
| `--all-breakpoints` | off | Scan all 7 standard breakpoints |
| `--json` | off | Output as JSON |
| `--threshold <px>` | `1800` | Ultrawide detection threshold |
| `--help` | — | Show help |

---

## Framework support

Works with any tool that produces a rendered webpage:

- Vanilla JS / HTML
- React (Vite, Next.js, CRA)
- Vue (Vite, Nuxt)
- Svelte / SvelteKit
- Angular
- Astro
- Any other bundler or framework

---

## Production safety

layout-canary checks `process.env.NODE_ENV` and `import.meta.env.PROD` at startup. If either indicates a production build, it silently does nothing. Modern bundlers (Vite, webpack, Parcel) tree-shake it entirely in production, so it adds **zero bytes** to your production bundle when imported conditionally.

---

## Contributing

Bug reports and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

Found a bug? [Open an issue](https://github.com/helpmastr/layout-canary/issues).

---

## License

[MIT](LICENSE)
