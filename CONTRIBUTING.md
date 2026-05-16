# Contributing to layout-canary

Thank you for your interest in contributing! This guide covers how to report bugs, suggest features, and submit pull requests.

## Reporting bugs

Please use [GitHub Issues](https://github.com/helpmastr/layout-canary/issues/new/choose) and select the **Bug Report** template. Include:

- A minimal reproduction (CodeSandbox, StackBlitz, or a short HTML snippet)
- Your browser and OS
- The layout-canary version
- Which detector triggered (or failed to trigger) the issue

## Requesting features

Open a [Feature Request](https://github.com/helpmastr/layout-canary/issues/new/choose) issue. Describe the layout bug category you'd like detected and why existing detectors don't cover it.

## Submitting pull requests

1. Fork the repository and create a branch from `main`:
   ```bash
   git checkout -b feat/my-new-detector
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Make your changes inside `src/`. All detectors live in `src/detectors/`.

4. Build and verify:
   ```bash
   npm run build
   npm run typecheck
   ```

5. Open a PR against `main`. Describe what layout bug you're detecting and how you verified it.

## Adding a new detector

1. Create `src/detectors/mydetector.ts` that exports a function returning `Issue[]`.
2. Add the new `IssueKind` to `src/types.ts`.
3. Import and wire it up in `src/index.ts` inside the `scan()` method.
4. Add it to the `DEFAULT_OPTIONS.detectors` array.

## Code style

- TypeScript strict mode — no `any`
- Zero runtime dependencies — everything stays in stdlib/browser APIs
- Keep detectors focused and fast — they run on every DOM mutation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
