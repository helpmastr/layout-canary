import type { Issue } from '../types.js'

const THRESHOLD = 10 // px outside viewport to trigger

export function detectOffScreen(): Issue[] {
  const issues: Issue[] = []
  const vw = window.innerWidth
  const vh = window.innerHeight

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT)
  let node: Element | null = document.body

  while (node) {
    const el = node as HTMLElement
    const style = getComputedStyle(el)

    if (style.display === 'none' || style.visibility === 'hidden') {
      node = walker.nextNode() as Element | null
      continue
    }

    // Fixed/sticky elements are intentionally positioned; skip
    if (style.position === 'fixed' || style.position === 'sticky') {
      node = walker.nextNode() as Element | null
      continue
    }

    const rect = el.getBoundingClientRect()

    // Ignore zero-size elements
    if (rect.width === 0 || rect.height === 0) {
      node = walker.nextNode() as Element | null
      continue
    }

    const offRight = rect.right > vw + THRESHOLD
    const offLeft = rect.left < -THRESHOLD
    const offBottom = rect.top > vh + THRESHOLD // below fold is acceptable; only flag by > 100vh
    const offTop = rect.bottom < -THRESHOLD

    if (offLeft || offTop || (offRight && !offBottom)) {
      const dir = [
        offLeft && 'left',
        offTop && 'top',
        offRight && 'right',
      ]
        .filter(Boolean)
        .join(', ')

      issues.push({
        kind: 'off-screen',
        severity: 'warning',
        element: el,
        message: `Off-screen element (${dir})`,
        detail: `rect: ${Math.round(rect.left)},${Math.round(rect.top)} ${Math.round(rect.width)}×${Math.round(rect.height)}`,
      })
    }

    node = walker.nextNode() as Element | null
  }

  return issues
}
