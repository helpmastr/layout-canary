import type { Issue, Severity } from './types.js'

const ATTR = 'data-layout-canary'
const TOOLTIP_ATTR = 'data-layout-canary-tooltip'
const PANEL_ID = '__layout_canary_panel__'
const STYLE_ID = '__layout_canary_styles__'

const SEVERITY_COLORS: Record<Severity, string> = {
  error: '#ef4444',
  warning: '#f97316',
  info: '#3b82f6',
}

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    [${ATTR}] {
      outline: 2px dashed var(--lc-color, #ef4444) !important;
      outline-offset: 2px !important;
      position: relative !important;
    }
    [${ATTR}]::after {
      content: attr(${TOOLTIP_ATTR});
      position: absolute;
      top: 0;
      left: 0;
      background: var(--lc-color, #ef4444);
      color: #fff;
      font: 600 11px/1.4 monospace;
      padding: 2px 6px;
      border-radius: 0 0 4px 0;
      white-space: nowrap;
      z-index: 2147483647;
      pointer-events: none;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    #${PANEL_ID} {
      position: fixed;
      bottom: 12px;
      right: 12px;
      z-index: 2147483647;
      font: 13px/1.5 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 360px;
      width: 100%;
      background: #0f172a;
      color: #f8fafc;
      border-radius: 10px;
      box-shadow: 0 8px 32px rgba(0,0,0,.45);
      overflow: hidden;
    }
    #${PANEL_ID} .lc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: #1e293b;
      cursor: pointer;
      user-select: none;
    }
    #${PANEL_ID} .lc-title {
      font-weight: 700;
      font-size: 12px;
      letter-spacing: .05em;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    #${PANEL_ID} .lc-badge {
      background: #ef4444;
      color: #fff;
      border-radius: 99px;
      padding: 1px 7px;
      font-size: 11px;
      font-weight: 700;
    }
    #${PANEL_ID} .lc-toggle {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      padding: 0;
    }
    #${PANEL_ID} .lc-body {
      max-height: 240px;
      overflow-y: auto;
      padding: 8px 0;
    }
    #${PANEL_ID} .lc-body.collapsed { display: none; }
    #${PANEL_ID} .lc-issue {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 6px 14px;
      border-bottom: 1px solid #1e293b;
    }
    #${PANEL_ID} .lc-issue:last-child { border-bottom: none; }
    #${PANEL_ID} .lc-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 5px;
    }
    #${PANEL_ID} .lc-msg {
      font-size: 12px;
      color: #cbd5e1;
    }
    #${PANEL_ID} .lc-detail {
      font-size: 11px;
      color: #64748b;
      margin-top: 1px;
    }
    #${PANEL_ID} .lc-empty {
      padding: 12px 14px;
      font-size: 12px;
      color: #22c55e;
    }
  `
  document.head.appendChild(style)
}

export function highlightElement(issue: Issue): void {
  const el = issue.element as HTMLElement
  const color = SEVERITY_COLORS[issue.severity]
  el.setAttribute(ATTR, issue.kind)
  el.setAttribute(TOOLTIP_ATTR, issue.message)
  el.style.setProperty('--lc-color', color)
}

export function clearHighlights(): void {
  document.querySelectorAll(`[${ATTR}]`).forEach((el) => {
    const h = el as HTMLElement
    h.removeAttribute(ATTR)
    h.removeAttribute(TOOLTIP_ATTR)
    h.style.removeProperty('--lc-color')
  })
}

export function renderPanel(issues: Issue[]): void {
  injectStyles()

  let panel = document.getElementById(PANEL_ID)
  if (!panel) {
    panel = document.createElement('div')
    panel.id = PANEL_ID
    document.body.appendChild(panel)
  }

  const errorCount = issues.filter((i) => i.severity === 'error').length
  const warnCount = issues.filter((i) => i.severity === 'warning').length
  const total = issues.length

  const badgeColor =
    errorCount > 0 ? '#ef4444' : warnCount > 0 ? '#f97316' : '#22c55e'

  const existing = panel.querySelector('.lc-body')
  const isCollapsed = existing?.classList.contains('collapsed') ?? false

  panel.innerHTML = `
    <div class="lc-header" id="__lc_header__">
      <span class="lc-title">
        🐦 layout-canary
        <span class="lc-badge" style="background:${badgeColor}">${total}</span>
      </span>
      <button class="lc-toggle" title="Toggle panel">${isCollapsed ? '▲' : '▼'}</button>
    </div>
    <div class="lc-body${isCollapsed ? ' collapsed' : ''}">
      ${
        total === 0
          ? '<div class="lc-empty">✓ No layout issues detected</div>'
          : issues
              .map(
                (i) => `
        <div class="lc-issue">
          <div class="lc-dot" style="background:${SEVERITY_COLORS[i.severity]}"></div>
          <div>
            <div class="lc-msg">${i.message}</div>
            ${i.detail ? `<div class="lc-detail">${i.detail}</div>` : ''}
          </div>
        </div>`,
              )
              .join('')
      }
    </div>
  `

  panel.querySelector('.lc-header')?.addEventListener('click', () => {
    const body = panel!.querySelector('.lc-body')
    const btn = panel!.querySelector('.lc-toggle')
    if (!body || !btn) return
    const nowCollapsed = body.classList.toggle('collapsed')
    btn.textContent = nowCollapsed ? '▲' : '▼'
  })
}

export function removePanel(): void {
  document.getElementById(PANEL_ID)?.remove()
}
