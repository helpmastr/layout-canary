import type { Issue } from '../types.js'

export function detectHorizontalOverflow(): Issue[] {
  const issues: Issue[] = []
  const docWidth = document.documentElement.scrollWidth
  const viewWidth = window.innerWidth

  if (docWidth <= viewWidth) return issues

  // Walk all elements to find the offender(s)
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT)
  let node: Element | null = document.body

  while (node) {
    const el = node as HTMLElement
    const rect = el.getBoundingClientRect()
    const style = getComputedStyle(el)

    // Skip elements that are themselves hidden or off-flow
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.position === 'fixed'
    ) {
      node = walker.nextNode() as Element | null
      continue
    }

    const rightEdge = rect.left + rect.width
    if (rightEdge > viewWidth + 1) {
      issues.push({
        kind: 'horizontal-overflow',
        severity: 'error',
        element: el,
        message: `Horizontal overflow: element extends ${Math.round(rightEdge - viewWidth)}px past viewport`,
        detail: `<${el.tagName.toLowerCase()}${el.id ? '#' + el.id : el.className ? '.' + el.className.split(' ')[0] : ''}>`,
      })
    }

    node = walker.nextNode() as Element | null
  }

  return issues
}
