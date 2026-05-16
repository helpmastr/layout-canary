import type { CanaryOptions, Issue, IssueKind } from './types.js'
import { clearHighlights, highlightElement, removePanel, renderPanel } from './ui.js'
import { detectHorizontalOverflow } from './detectors/overflow.js'
import { detectOffScreen } from './detectors/offscreen.js'
import { detectZIndexConflicts } from './detectors/zindex.js'
import { detectTextClipping } from './detectors/textclip.js'
import { detectBrokenBreakpoints } from './detectors/responsive.js'
import { detectSafeAreaIssues } from './detectors/safearea.js'
import { detectUltrawideIssues } from './detectors/ultrawide.js'

export type { CanaryOptions, Issue, IssueKind } from './types.js'

const DEFAULT_OPTIONS: Required<CanaryOptions> = {
  detectors: [
    'horizontal-overflow',
    'off-screen',
    'z-index-conflict',
    'text-clipping',
    'broken-breakpoint',
    'safe-area',
    'ultrawide',
  ],
  ignore: [],
  ultrawideThreshold: 1800,
  showPanel: true,
  highlightElements: true,
  logToConsole: true,
}

function isProduction(): boolean {
  try {
    // webpack DefinePlugin / CRA / bundlers that define process.env
    const proc = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process
    if (proc?.env?.NODE_ENV === 'production') return true

    // Vite exposes import.meta.env; access via unknown to avoid strict-mode overlap error
    const meta = import.meta as unknown as { env?: { PROD?: boolean; MODE?: string } }
    if (meta.env?.PROD === true || meta.env?.MODE === 'production') return true
  } catch {
    // ignore — some environments don't expose process or import.meta
  }
  return false
}

class LayoutCanary {
  private options: Required<CanaryOptions>
  private mutationObserver: MutationObserver | null = null
  private resizeObserver: ResizeObserver | null = null
  private scanTimer: ReturnType<typeof setTimeout> | null = null
  private active = false

  constructor(options: CanaryOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  start(): void {
    if (this.active) return
    this.active = true

    this.scheduleScan()

    this.mutationObserver = new MutationObserver(() => {
      this.scheduleScan(200)
    })
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    })

    this.resizeObserver = new ResizeObserver(() => {
      this.scheduleScan(150)
    })
    this.resizeObserver.observe(document.documentElement)
  }

  stop(): void {
    this.active = false
    this.mutationObserver?.disconnect()
    this.resizeObserver?.disconnect()
    if (this.scanTimer) clearTimeout(this.scanTimer)
    clearHighlights()
    removePanel()
  }

  private scheduleScan(delay = 0): void {
    if (this.scanTimer) clearTimeout(this.scanTimer)
    this.scanTimer = setTimeout(() => this.scan(), delay)
  }

  scan(): Issue[] {
    clearHighlights()

    const enabled = new Set<IssueKind>(
      this.options.detectors.filter(
        (d) => !this.options.ignore.includes(d),
      ),
    )

    const allIssues: Issue[] = []

    if (enabled.has('horizontal-overflow')) {
      allIssues.push(...detectHorizontalOverflow())
    }
    if (enabled.has('off-screen')) {
      allIssues.push(...detectOffScreen())
    }
    if (enabled.has('z-index-conflict')) {
      allIssues.push(...detectZIndexConflicts())
    }
    if (enabled.has('text-clipping')) {
      allIssues.push(...detectTextClipping())
    }
    if (enabled.has('broken-breakpoint')) {
      allIssues.push(...detectBrokenBreakpoints())
    }
    if (enabled.has('safe-area')) {
      allIssues.push(...detectSafeAreaIssues())
    }
    if (enabled.has('ultrawide')) {
      allIssues.push(...detectUltrawideIssues(this.options.ultrawideThreshold))
    }

    // De-duplicate by element + kind
    const seen = new Set<string>()
    const unique = allIssues.filter((issue) => {
      const key = `${issue.kind}::${issue.element.tagName}::${issue.message}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    if (this.options.highlightElements) {
      unique.forEach((issue) => highlightElement(issue))
    }

    if (this.options.showPanel) {
      renderPanel(unique)
    }

    if (this.options.logToConsole && unique.length > 0) {
      this.logToConsole(unique)
    }

    return unique
  }

  private logToConsole(issues: Issue[]): void {
    const errors = issues.filter((i) => i.severity === 'error')
    const warnings = issues.filter((i) => i.severity === 'warning')
    const infos = issues.filter((i) => i.severity === 'info')

    console.groupCollapsed(
      `%c🐦 layout-canary%c ${issues.length} issue${issues.length !== 1 ? 's' : ''} detected`,
      'font-weight:bold;color:#f97316',
      'font-weight:normal;color:inherit',
    )

    if (errors.length > 0) {
      console.group('%cErrors', 'color:#ef4444;font-weight:bold')
      errors.forEach((i) => {
        console.error(`[${i.kind}] ${i.message}`, i.element)
      })
      console.groupEnd()
    }

    if (warnings.length > 0) {
      console.group('%cWarnings', 'color:#f97316;font-weight:bold')
      warnings.forEach((i) => {
        console.warn(`[${i.kind}] ${i.message}`, i.element)
      })
      console.groupEnd()
    }

    if (infos.length > 0) {
      console.group('%cInfo', 'color:#3b82f6;font-weight:bold')
      infos.forEach((i) => {
        console.info(`[${i.kind}] ${i.message}`, i.element)
      })
      console.groupEnd()
    }

    console.groupEnd()
  }
}

// Exported for programmatic control
export { LayoutCanary }

// Auto-initialize (side-effect import: `import 'layout-canary'`)
let instance: LayoutCanary | null = null

export function init(options?: CanaryOptions): LayoutCanary {
  if (instance) instance.stop()
  instance = new LayoutCanary(options)

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => instance!.start(), { once: true })
    } else {
      instance.start()
    }
  }

  return instance
}

export function destroy(): void {
  instance?.stop()
  instance = null
}

// Auto-start unless in production
if (typeof window !== 'undefined' && !isProduction()) {
  init()
}
