'use client'

import type { CSSProperties } from 'react'

const DEFAULT_MESSAGE = '通信に失敗しました。もう一度お試しください。'

type ApiErrorStateProps = {
  message?: string | null
  onRetry?: () => void
  retryLabel?: string
  compact?: boolean
  style?: CSSProperties
}

export default function ApiErrorState({
  message = DEFAULT_MESSAGE,
  onRetry,
  retryLabel = '再試行',
  compact = false,
  style,
}: ApiErrorStateProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        display: 'grid',
        gap: compact ? 8 : 10,
        color: '#e6a58d',
        fontSize: compact ? 12 : 13,
        lineHeight: 1.7,
        padding: compact ? '9px 11px' : '12px 14px',
        border: '1px solid rgba(230,165,141,.24)',
        borderRadius: compact ? 10 : 14,
        background: 'rgba(230,165,141,.065)',
        ...style,
      }}
    >
      <span>{message || DEFAULT_MESSAGE}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            justifySelf: 'start',
            minHeight: 34,
            border: '1px solid rgba(230,165,141,.32)',
            borderRadius: 8,
            background: 'rgba(230,165,141,.11)',
            color: '#ffd2c2',
            cursor: 'pointer',
            font: 'inherit',
            fontSize: compact ? 12 : 13,
            padding: '6px 11px',
          }}
        >
          {retryLabel}
        </button>
      )}
    </div>
  )
}

export { DEFAULT_MESSAGE as DEFAULT_API_ERROR_MESSAGE }
