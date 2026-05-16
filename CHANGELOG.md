# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-05-16

### Added
- Initial release
- Horizontal overflow detection
- Off-screen element detection
- Z-index conflict detection
- Text clipping detection
- Broken responsive breakpoint detection
- iPhone safe-area / notch detection
- Ultrawide layout detection (1800px+)
- MutationObserver + ResizeObserver for live detection
- On-screen panel with collapsible issue list
- Red dashed outline highlighting with inline tooltips
- Grouped console warnings by severity
- Zero runtime dependencies
- ESM + CJS dual output via tsup
- Programmatic API: `init()`, `destroy()`, `LayoutCanary` class
- Auto-disables in production (NODE_ENV check)
