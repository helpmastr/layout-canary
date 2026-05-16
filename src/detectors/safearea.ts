import type { Issue } from '../types.js'

// Approximate safe area thresholds for common iPhone notch / home-bar heights
const NOTCH_THRESHOLD = 44  // status bar / notch area
const HOME_BAR_THRESHOLD = 34  // home indicator area

function getSafeAreaInset(side: 'top' | 'bottom' | 'left' | 'right'): number {
  const probe = document.createElement('div')
  probe.style.cssText = `
    position: fixed;
    ${side}: env(safe-area-inset-${side}, 0px);
    width: 1px;
    height: 1px;
    pointer-events: none;
    opacity: 0;
  `
  document.body.appendChild(probe)
  const rect = probe.getBoundingClientRect()
  document.body.removeChild(probe)

  // env() not supported — return 0
  if (side === 'top') return rect.top
  if (side === 'bottom') return window.innerHeight - rect.bottom
  if (side === 'left') return rect.left
  if (side === 'right') return window.innerWidth - rect.right
  return 0
}

export function detectSafeAreaIssues(): Issue[] {
  const issues: Issue[] = []

  // Only relevant on mobile-like viewports or when safe-area env vars are active
  const vw = window.innerWidth
  const vh = window.innerHeight
  const isMobileLike = vw <= 430

  const topInset = getSafeAreaInset('top')
  const bottomInset = getSafeAreaInset('bottom')

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT)
  let node: Element | null = document.body

  while (node) {
    const el = node as HTMLElement
    const style = getComputedStyle(el)

    if (style.display === 'none' || style.visibility === 'hidden') {
      node = walker.nextNode() as Element | null
      continue
    }

    if (style.position !== 'fixed') {
      node = walker.nextNode() as Element | null
      continue
    }

    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) {
      node = walker.nextNode() as Element | null
      continue
    }

    const effectiveTopThreshold = topInset > 0 ? topInset : (isMobileLike ? NOTCH_THRESHOLD : 0)
    const effectiveBottomThreshold = bottomInset > 0 ? bottomInset : (isMobileLike ? HOME_BAR_THRESHOLD : 0)

    if (effectiveTopThreshold > 0 && rect.top < effectiveTopThreshold) {
      issues.push({
        kind: 'safe-area',
        severity: 'warning',
        element: el,
        message: `Safe-area issue: fixed element overlaps notch/status-bar area (top: ${Math.round(rect.top)}px)`,
        detail: `Use padding-top: env(safe-area-inset-top) or padding-top: ${NOTCH_THRESHOLD}px`,
      })
    }

    if (effectiveBottomThreshold > 0 && rect.bottom > vh - effectiveBottomThreshold) {
      issues.push({
        kind: 'safe-area',
        severity: 'warning',
        element: el,
        message: `Safe-area issue: fixed element overlaps home indicator (bottom: ${Math.round(vh - rect.bottom)}px from edge)`,
        detail: `Use padding-bottom: env(safe-area-inset-bottom) or padding-bottom: ${HOME_BAR_THRESHOLD}px`,
      })
    }

    node = walker.nextNode() as Element | null
  }

  return issues
}
