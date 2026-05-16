import type { Issue } from '../types.js'

export function detectTextClipping(): Issue[] {
  const issues: Issue[] = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT)
  let node: Element | null = document.body

  while (node) {
    const el = node as HTMLElement
    const style = getComputedStyle(el)

    if (style.display === 'none' || style.visibility === 'hidden') {
      node = walker.nextNode() as Element | null
      continue
    }

    const overflowY = style.overflowY
    const overflowX = style.overflowX
    const isClipping =
      overflowY === 'hidden' || overflowY === 'clip' ||
      overflowX === 'hidden' || overflowX === 'clip'

    if (!isClipping) {
      node = walker.nextNode() as Element | null
      continue
    }

    // Check if text content is taller than the container
    const hasText = el.textContent && el.textContent.trim().length > 0
    if (!hasText) {
      node = walker.nextNode() as Element | null
      continue
    }

    const scrollH = el.scrollHeight
    const clientH = el.clientHeight
    const scrollW = el.scrollWidth
    const clientW = el.clientWidth

    if (scrollH > clientH + 1) {
      issues.push({
        kind: 'text-clipping',
        severity: 'error',
        element: el,
        message: `Text clipped vertically: content is ${scrollH}px tall inside a ${clientH}px container`,
        detail: `overflow-y: ${overflowY}; height: ${style.height}`,
      })
    } else if (scrollW > clientW + 1 && overflowX === 'hidden') {
      issues.push({
        kind: 'text-clipping',
        severity: 'warning',
        element: el,
        message: `Text clipped horizontally: content is ${scrollW}px wide inside a ${clientW}px container`,
        detail: `overflow-x: ${overflowX}; width: ${style.width}`,
      })
    }

    node = walker.nextNode() as Element | null
  }

  return issues
}
