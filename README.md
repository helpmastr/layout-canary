# 🐦 layout-canary

[![npm version](https://img.shields.io/npm/v/layout-canary.svg)](https://www.npmjs.com/package/layout-canary)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**Zero-config runtime layout bug detector for development.**

Drop one import into any JS/TS project and layout-canary will automatically highlight broken elements with a red outline and plain-English warnings — live, as the DOM changes. It auto-disables itself in production so you never ship it to users.

---

## Install

```bash
npm install --save-dev layout-canary
# or
yarn add -D layout-canary
# or
pnpm add -D layout-canary
```

## Usage

```js
// Add this to your main entry file (e.g. main.ts, index.tsx, app.js)
import 'layout-canary'
```

That's it. layout-canary auto-starts when the page loads and watches for DOM changes with `MutationObserver` + `ResizeObserver`.

### Programmatic API

For custom control over which detectors run or when scanning happens:

```ts
import { init, destroy, LayoutCanary } from 'layout-canary'

// Custom options
const canary = init({
  ignore: ['ultrawide'],         // skip specific detectors
  showPanel: true,               // on-screen panel (default: true)
  highlightElements: true,       // red outlines (default: true)
  logToConsole: true,            // grouped console warnings (default: true)
  ultrawideThreshold: 1920,      // px at which ultrawide kicks in (default: 1800)
})

// Manually trigger a scan and get results
const issues = canary.scan()
console.log(issues)

// Stop watching
destroy()
```

### Vite / React example

```tsx
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

if (import.meta.env.DEV) {
  import('layout-canary')
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
```

---

## What it detects

| Detector | Severity | What it catches |
|----------|----------|-----------------|
| `horizontal-overflow` | Error | Elements extending past the right edge of the viewport, causing a hidden horizontal scrollbar |
| `off-screen` | Warning | Elements rendered left, right, or above the visible viewport — typically caused by negative margins or translate transforms |
| `z-index-conflict` | Warning | Positioned elements with negative z-index hidden behind siblings or the background |
| `text-clipping` | Error | Text content cut off by `overflow: hidden` or a fixed height — `scrollHeight > clientHeight` |
| `broken-breakpoint` | Warning | Elements wider than their parent container at the current viewport width |
| `safe-area` | Warning | Fixed-position elements overlapping iPhone notch (top) or home indicator (bottom) — missing `env(safe-area-inset-*)` |
| `ultrawide` | Info | Elements that stretch full-width or text lines exceeding ~800px at viewport widths above 1800px |

---

## Supported breakpoints and devices

layout-canary is always active and watches live DOM changes. When reporting broken-breakpoint issues it annotates the nearest named breakpoint:

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

## UI

When issues are found, layout-canary:

1. **Outlines** broken elements with a dashed red/orange border
2. **Shows a tooltip** on the element with a plain-English label
3. **Renders a panel** in the bottom-right corner listing all issues grouped by severity
4. **Logs** to the browser console with `console.error` / `console.warn` / `console.info` grouped under a collapsible header

The panel is draggable and can be collapsed by clicking the header.

---

## Framework support

layout-canary is framework-agnostic. It works with any tool that runs JavaScript in a browser:

- Vanilla JS / HTML
- React (Vite, Next.js, CRA)
- Vue (Vite, Nuxt)
- Svelte / SvelteKit
- Angular
- Astro
- Any other bundler or framework

---

## Configuration options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `detectors` | `IssueKind[]` | all | Which detectors to run |
| `ignore` | `IssueKind[]` | `[]` | Detectors to skip |
| `ultrawideThreshold` | `number` | `1800` | Viewport width (px) above which ultrawide detection activates |
| `showPanel` | `boolean` | `true` | Show the on-screen panel |
| `highlightElements` | `boolean` | `true` | Add outlines to broken elements |
| `logToConsole` | `boolean` | `true` | Log issues to the browser console |

---

## Production safety

layout-canary checks `process.env.NODE_ENV` and `import.meta.env.PROD` at startup. If either indicates a production build, the tool silently does nothing. All modern bundlers (Vite, webpack, Parcel) tree-shake dead code in production builds, so layout-canary adds **zero bytes** to your production bundle when imported conditionally.

---

## Contributing

Bug reports and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

Found a bug? [Open an issue](https://github.com/YOUR_USERNAME/layout-canary/issues).

---

## License

[MIT](LICENSE)
