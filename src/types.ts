export type Severity = 'error' | 'warning' | 'info'

export type IssueKind =
  | 'horizontal-overflow'
  | 'off-screen'
  | 'z-index-conflict'
  | 'text-clipping'
  | 'broken-breakpoint'
  | 'safe-area'
  | 'ultrawide'

export interface Issue {
  kind: IssueKind
  severity: Severity
  element: Element
  message: string
  detail?: string
}

export interface DetectorResult {
  issues: Issue[]
}

export type Detector = () => Issue[]

export interface CanaryOptions {
  /** Detectors to enable. Defaults to all. */
  detectors?: IssueKind[]
  /** Detectors to disable. */
  ignore?: IssueKind[]
  /** Pixels above which a layout is considered "ultrawide". Default 1800. */
  ultrawideThreshold?: number
  /** Whether to show the on-screen panel. Default true. */
  showPanel?: boolean
  /** Whether to highlight elements inline. Default true. */
  highlightElements?: boolean
  /** Log to console. Default true. */
  logToConsole?: boolean
}
