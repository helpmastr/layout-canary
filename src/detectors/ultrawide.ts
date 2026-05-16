import type { Issue } from '../types.js'

export function detectUltrawideIssues(threshold = 1800): Issue[] {
  const issues: Issue[] = []
  const vw = window.innerWidth

  if (vw < threshold) return issues

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT)
  let node: Element | null = document.body

  while (node) {
    const el = node as HTMLElement
    const style = getComputedStyle(el)

    if (style.display === 'none' || style.visibility === 'hidden') {
      node = walker.nextNode() as Element | null
      continue
    }

    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) {
      node = walker.nextNode() as Element | null
      continue
    }

    // Flag elements that stretch to full viewport width without a max-width
    const maxWidth = style.maxWidth
    const hasMaxWidth =
      maxWidth &&
      maxWidth !== 'none' &&
      maxWidth !== '100%' &&
      maxWidth !== '100vw'

    if (!hasMaxWidth && rect.width >= vw - 2 && el !== document.body && el !== document.documentElement) {
      issues.push({
        kind: 'ultrawide',
        severity: 'info',
        element: el,
        message: `Ultrawide issue at ${vw}px: element stretches full viewport width without max-width`,
        detail: `Consider max-width: 1600px + margin: auto for readability on wide screens`,
      })
    }

    node = walker.nextNode() as Element | null
  }

  // Also check if text line lengths are excessively wide
  const allText = document.querySelectorAll('p, li, td, th, h1, h2, h3, h4, h5, h6')
  allText.forEach((el) => {
    const rect = el.getBoundingClientRect()
    if (rect.width > 900) {
      issues.push({
        kind: 'ultrawide',
        severity: 'info',
        element: el,
        message: `Ultrawide readability: text line length is ${Math.round(rect.width)}px (ideal max ~75ch / ~800px)`,
        detail: `Long lines reduce readability on projectors and ultrawide monitors`,
      })
    }
  })

  return issues
}
