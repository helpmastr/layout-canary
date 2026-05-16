// Browser-side scan bundle — injected into pages by the CLI via puppeteer.
// No auto-init, no UI. Exposes window.__layoutCanaryScan() which returns
// plain JSON (no DOM element refs) so it can be transferred back to Node.
import { detectHorizontalOverflow } from './detectors/overflow.js'
import { detectOffScreen } from './detectors/offscreen.js'
import { detectZIndexConflicts } from './detectors/zindex.js'
import { detectTextClipping } from './detectors/textclip.js'
import { detectBrokenBreakpoints } from './detectors/responsive.js'
import { detectSafeAreaIssues } from './detectors/safearea.js'
import { detectUltrawideIssues } from './detectors/ultrawide.js'
import type { IssueKind } from './types.js'

export interface ScanResult {
  kind: IssueKind
  severity: 'error' | 'warning' | 'info'
  message: string
  detail?: string
  selector: string
  tagName: string
}

function getSelector(el: Element): string {
  const parts: string[] = []
  let cur: Element | null = el

  while (cur && cur !== document.documentElement) {
    let part = cur.tagName.toLowerCase()
    if ((cur as HTMLElement).id) {
      part += '#' + (cur as HTMLElement).id
      parts.unshift(part)
      break
    }
    const cls = Array.from(cur.classList)
      .filter((c) => !/^(js-|is-|has-)/.test(c))
      .slice(0, 2)
      .join('.')
    if (cls) part += '.' + cls

    const siblings = cur.parentElement?.children
    if (siblings && siblings.length > 1) {
      const idx = Array.from(siblings).indexOf(cur) + 1
      part += `:nth-child(${idx})`
    }

    parts.unshift(part)
    cur = cur.parentElement
    if (parts.length >= 4) break
  }

  return parts.join(' > ') || el.tagName.toLowerCase()
}

;(globalThis as unknown as Record<string, unknown>)['__layoutCanaryScan'] =
  function (ultrawideThreshold = 1800): ScanResult[] {
    const raw = [
      ...detectHorizontalOverflow(),
      ...detectOffScreen(),
      ...detectZIndexConflicts(),
      ...detectTextClipping(),
      ...detectBrokenBreakpoints(),
      ...detectSafeAreaIssues(),
      ...detectUltrawideIssues(ultrawideThreshold),
    ]

    // exclude layout-canary's own UI elements, then deduplicate
    const seen = new Set<string>()
    return raw
      .filter((issue) => {
        const el = issue.element as HTMLElement
        if (el.id === '__layout_canary_panel__') return false
        if (el.closest?.('#__layout_canary_panel__')) return false
        return true
      })
      .filter((issue) => {
        const key = `${issue.kind}::${issue.message}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .map((issue) => ({
        kind: issue.kind,
        severity: issue.severity,
        message: issue.message,
        detail: issue.detail,
        selector: getSelector(issue.element),
        tagName: issue.element.tagName.toLowerCase(),
      }))
  }
