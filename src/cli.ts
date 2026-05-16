import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import type { ScanResult } from './scan.js'

// ── arg parsing ────────────────────────────────────────────────────────────

const args = process.argv.slice(2)

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
  layout-canary <url> [options]

  Options:
    --json                  Output issues as JSON
    --viewport <WxH>        Set viewport size (default: 1280x800)
    --all-breakpoints       Scan at all standard breakpoints
    --threshold <px>        Ultrawide threshold in px (default: 1800)
    --help                  Show this help

  Examples:
    layout-canary https://example.com
    layout-canary https://example.com --json
    layout-canary https://example.com --viewport 375x812
    layout-canary https://example.com --all-breakpoints
  `)
  process.exit(0)
}

const url = args.find((a) => !a.startsWith('--') && !a.match(/^\d/)) ?? ''
const jsonMode = args.includes('--json')
const allBreakpoints = args.includes('--all-breakpoints')

const vpIdx = args.indexOf('--viewport')
const viewportArg = vpIdx !== -1 ? args[vpIdx + 1] : null
const [vpW, vpH] = viewportArg
  ? viewportArg.split('x').map(Number)
  : [1280, 800]

const threshIdx = args.indexOf('--threshold')
const thresholdArg = threshIdx !== -1 ? args[threshIdx + 1] : null
const ultrawideThreshold = thresholdArg ? parseInt(thresholdArg, 10) : 1800

const BREAKPOINTS = [
  { width: 375, height: 812, label: 'iPhone SE / small phones' },
  { width: 390, height: 844, label: 'iPhone 14/15' },
  { width: 768, height: 1024, label: 'iPad / tablets' },
  { width: 1024, height: 768, label: 'iPad Pro / small laptops' },
  { width: 1280, height: 800, label: 'Laptops' },
  { width: 1920, height: 1080, label: 'Desktop / Full HD' },
  { width: 2560, height: 1440, label: 'Ultrawide / projector' },
]

// ── severity colours (ANSI) ─────────────────────────────────────────────────

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  orange: '\x1b[33m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  gray: '\x1b[90m',
  white: '\x1b[97m',
}

function colorize(s: string, ...codes: string[]) {
  return codes.join('') + s + C.reset
}

// ── scan ────────────────────────────────────────────────────────────────────

const scanBundlePath = path.join(__dirname, 'scan.global.js')
// tsup names IIFE outputs as <entry>.global.js

async function scanViewport(
  page: puppeteer.Page,
  width: number,
  height: number,
): Promise<ScanResult[]> {
  await page.setViewport({ width, height })
  // let layout settle after resize
  await new Promise((r) => setTimeout(r, 300))

  return page.evaluate((threshold) => {
    const fn = (globalThis as unknown as Record<string, unknown>)[
      '__layoutCanaryScan'
    ] as (t: number) => ScanResult[]
    return fn(threshold)
  }, ultrawideThreshold) as Promise<ScanResult[]>
}

// ── output ──────────────────────────────────────────────────────────────────

interface ViewportResult {
  width: number
  height: number
  label: string
  issues: ScanResult[]
}

function severityColor(s: ScanResult['severity']) {
  if (s === 'error') return C.red
  if (s === 'warning') return C.orange
  return C.blue
}

function printResults(results: ViewportResult[]) {
  const allIssues = results.flatMap((r) =>
    r.issues.map((i) => ({ ...i, viewport: `${r.width}x${r.height}` })),
  )

  const errors = allIssues.filter((i) => i.severity === 'error')
  const warnings = allIssues.filter((i) => i.severity === 'warning')
  const infos = allIssues.filter((i) => i.severity === 'info')

  console.log()
  console.log(colorize('🐦 layout-canary', C.bold, C.white))
  console.log(colorize(`   ${url}`, C.dim))
  console.log()

  if (allIssues.length === 0) {
    console.log(colorize('  ✓ No layout issues found', C.green, C.bold))
    console.log()
    return
  }

  for (const result of results) {
    if (result.issues.length === 0) continue

    const label = results.length > 1
      ? `  Viewport ${result.width}×${result.height} — ${result.label}`
      : `  Viewport ${result.width}×${result.height}`

    console.log(colorize(label, C.bold, C.white))
    console.log(colorize('  ' + '─'.repeat(58), C.dim))

    const groups: Record<string, ScanResult[]> = { error: [], warning: [], info: [] }
    result.issues.forEach((i) => groups[i.severity].push(i))

    for (const [sev, issues] of Object.entries(groups)) {
      if (issues.length === 0) continue
      const label =
        sev === 'error' ? '  ERRORS' : sev === 'warning' ? '  WARNINGS' : '  INFO'
      console.log(colorize(`\n${label} (${issues.length})`, severityColor(sev as ScanResult['severity']), C.bold))

      for (const issue of issues) {
        console.log(
          colorize(`    ● `, severityColor(issue.severity)) +
          colorize(`[${issue.kind}] `, C.bold) +
          issue.message,
        )
        console.log(colorize(`      ${issue.selector}`, C.gray))
        if (issue.detail) {
          console.log(colorize(`      ${issue.detail}`, C.dim))
        }
      }
    }

    console.log()
  }

  const summaryColor = errors.length > 0 ? C.red : warnings.length > 0 ? C.orange : C.blue
  console.log(
    colorize(
      `  Total: ${allIssues.length} issue${allIssues.length !== 1 ? 's' : ''}` +
      `  (${errors.length} errors, ${warnings.length} warnings, ${infos.length} info)`,
      summaryColor,
      C.bold,
    ),
  )
  console.log()
}

function printJson(results: ViewportResult[]) {
  const out = {
    url,
    scannedAt: new Date().toISOString(),
    viewports: results.map((r) => ({
      width: r.width,
      height: r.height,
      label: r.label,
      issueCount: r.issues.length,
      issues: r.issues,
    })),
    summary: {
      total: results.reduce((n, r) => n + r.issues.length, 0),
      errors: results.reduce(
        (n, r) => n + r.issues.filter((i) => i.severity === 'error').length,
        0,
      ),
      warnings: results.reduce(
        (n, r) => n + r.issues.filter((i) => i.severity === 'warning').length,
        0,
      ),
      info: results.reduce(
        (n, r) => n + r.issues.filter((i) => i.severity === 'info').length,
        0,
      ),
    },
  }
  console.log(JSON.stringify(out, null, 2))
}

// ── main ────────────────────────────────────────────────────────────────────

;(async () => {
  if (!url) {
    console.error('layout-canary: no URL provided. Run with --help for usage.')
    process.exit(1)
  }

  if (!fs.existsSync(scanBundlePath)) {
    console.error(
      `layout-canary: scan bundle not found at ${scanBundlePath}\nRun "npm run build" first.`,
    )
    process.exit(1)
  }

  let browser: puppeteer.Browser | null = null

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()

    // Suppress console noise from the target page
    page.on('console', () => {})
    page.on('pageerror', () => {})

    if (!jsonMode) {
      process.stdout.write(colorize(`  Loading ${url} …`, C.dim))
    }

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30_000 })

    // Inject scan bundle once — reused across all viewport resizes
    await page.addScriptTag({ path: scanBundlePath })

    if (!jsonMode) {
      process.stdout.write('\r' + ' '.repeat(60) + '\r')
    }

    const viewportsToTest = allBreakpoints
      ? BREAKPOINTS
      : [{ width: vpW, height: vpH, label: `${vpW}×${vpH}` }]

    const results: ViewportResult[] = []

    for (const vp of viewportsToTest) {
      const issues = await scanViewport(page, vp.width, vp.height)
      results.push({ ...vp, issues })
    }

    if (jsonMode) {
      printJson(results)
    } else {
      printResults(results)
    }

    const hasErrors = results.some((r) =>
      r.issues.some((i) => i.severity === 'error'),
    )
    process.exit(hasErrors ? 1 : 0)
  } catch (err) {
    console.error(
      colorize('\n  layout-canary error: ', C.red, C.bold) +
      (err instanceof Error ? err.message : String(err)),
    )
    process.exit(1)
  } finally {
    await browser?.close()
  }
})()
