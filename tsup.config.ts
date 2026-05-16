import { defineConfig } from 'tsup'

export default defineConfig([
  // Browser library — ESM + CJS with types
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    target: 'es2017',
  },
  // IIFE scan bundle — injected into pages by the CLI via puppeteer
  {
    entry: { 'scan': 'src/scan.ts' },
    format: ['iife'],
    globalName: '__layoutCanaryBundle',
    sourcemap: false,
    clean: false,
    target: 'es2017',
    outDir: 'dist',
  },
  // Node CLI — CJS so __dirname works
  {
    entry: { cli: 'src/cli.ts' },
    format: ['cjs'],
    sourcemap: false,
    clean: false,
    target: 'node18',
    outDir: 'dist',
    banner: { js: '#!/usr/bin/env node' },
    external: ['puppeteer'],
    noExternal: [],
  },
])
