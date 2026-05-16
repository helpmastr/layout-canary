#!/usr/bin/env node
import('../dist/cli.cjs').catch((err) => {
  console.error(err)
  process.exit(1)
})
