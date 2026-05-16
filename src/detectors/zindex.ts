import type { Issue } from '../types.js'

interface StackEntry {
  el: HTMLElement
  zIndex: number
  rect: DOMRect
}

function collectStackingElements(): StackEntry[] {
  const entries: StackEntry[] = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT)
  let node: Element | null = document.body

  while (node) {
    const el = node as HTMLElement
    const style = getComputedStyle(el)

    if (style.display === 'none' || style.visibility === 'hidden') {
      node = walker.nextNode() as Element | null
      continue
    }

    const z = parseInt(style.zIndex, 10)
    const hasPosition = style.position !== 'static'

    if (hasPosition && !isNaN(z)) {
      const rect = el.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        entries.push({ el, zIndex: z, rect })
      }
    }

    node = walker.nextNode() as Element | null
  }

  return entries
}

function rectsOverlap(a: DOMRect, b: DOMRect): boolean {
  return !(
    a.right <= b.left ||
    b.right <= a.left ||
    a.bottom <= b.top ||
    b.bottom <= a.top
  )
}

export function detectZIndexConflicts(): Issue[] {
  const issues: Issue[] = []
  const entries = collectStackingElements()

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i]
      const b = entries[j]

      // Only flag when one has z-index: 0 or negative and overlaps a higher one
      if (
        a.zIndex !== b.zIndex &&
        rectsOverlap(a.rect, b.rect)
      ) {
        const lower = a.zIndex < b.zIndex ? a : b
        const higher = a.zIndex < b.zIndex ? b : a

        // Only flag negative z-indexes or z:0 buried under positional stacking
        if (lower.zIndex < 0) {
          const tag = (el: HTMLElement) =>
            `<${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}>`

          issues.push({
            kind: 'z-index-conflict',
            severity: 'warning',
            element: lower.el,
            message: `Z-index conflict: ${tag(lower.el)} (z:${lower.zIndex}) hidden behind ${tag(higher.el)} (z:${higher.zIndex})`,
            detail: `Overlapping positioned elements with mismatched z-index`,
          })
        }
      }
    }
  }

  return issues
}
