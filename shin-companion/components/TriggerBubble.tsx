'use client'
import { SLOT_CONFIG } from '@/lib/constants'
import type { Slot } from '@/lib/types'

interface Props {
  text: string
  slot: Slot
  loading?: boolean
}

export function TriggerBubble({ text, slot, loading }: Props) {
  const cfg = SLOT_CONFIG[slot]
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        background: cfg.orbColor, flexShrink: 0, marginBottom: 3,
      }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {cfg.label && (
          <span style={{
            fontSize: 9, color: cfg.labelColor,
            letterSpacing: '.12em', fontWeight: 600, paddingLeft: 2,
          }}>
            {cfg.label}
          </span>
        )}
        <div style={{
          maxWidth: '74%', fontSize: 14, lineHeight: 1.65,
          padding: '9px 13px', background: '#1a1815',
          border: `1px solid ${cfg.triggerBorder}`,
          borderRadius: '4px 14px 14px 14px',
          color: loading ? '#3a3632' : cfg.triggerTextColor,
          transition: 'color .5s',
        }}>
          {loading ? '...' : text}
        </div>
      </div>
    </div>
  )
}
