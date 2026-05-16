import type { Issue } from '../types.js'

const BREAKPOINTS = [375, 390, 768, 1024, 1280, 1920, 2560]

export function detectBrokenBreakpoints(): Issue[] {
  const issues: Issue[] = []
  const vw = window.innerWidth

  // Find the nearest named breakpoint for context
  const nearestBp = BREAKPOINTS.reduce((prev, curr) =>
    Math.abs(curr - vw) < Math.abs(prev - vw) ? curr : prev,
  )

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT)
  let node: Element | null = document.body

  while (node) {
    const el = node as HTMLElement
    const style = getComputedStyle(el)

    if (style.display === 'none' || style.visibility === 'hidden') {
      node = walker.nextNode() as Element | null
      continue
    }

    if (style.position === 'fixed' || style.position === 'absolute') {
      node = walker.nextNode() as Element | null
      continue
    }

    const parent = el.parentElement
    if (!parent) {
      node = walker.nextNode() as Element | null
      continue
    }

    const elWidth = el.getBoundingClientRect().width
    const parentWidth = parent.getBoundingClientRect().width

    // Skip tiny or zero-size elements and root-level elements
    if (elWidth === 0 || parentWidth === 0 || parent === document.body) {
      node = walker.nextNode() as Element | null
      continue
    }

    // Flag elements wider than their parent by more than 4px (rounding tolerance)
    if (elWidth > parentWidth + 4) {
      const overflow = Math.round(elWidth - parentWidth)
      issues.push({
        kind: 'broken-breakpoint',
        severity: 'warning',
        element: el,
        message: `Breakpoint overflow at ~${nearestBp}px: element is ${overflow}px wider than its container`,
        detail: `element: ${Math.round(elWidth)}px, container: ${Math.round(parentWidth)}px`,
      })
    }

    node = walker.nextNode() as Element | null
  }

  return issues
}
