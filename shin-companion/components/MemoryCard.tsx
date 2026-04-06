'use client'
import { ScoreDots } from './StatusBar'
import { relativeTime } from '@/lib/memory'

interface MemCardProps {
  type: string
  label: string
  color: string
  content: string
  ts: number
  score: number
  isDuplicate: boolean
  onDelete: () => void
}

export function MemoryCard({
  label, color, content, ts, score, isDuplicate, onDelete,
}: MemCardProps) {
  return (
    <div style={{
      background: '#121110',
      border: `1px solid ${isDuplicate ? 'rgba(200,150,60,.22)' : 'rgba(255,255,255,.06)'}`,
      borderRadius: 10, padding: '11px 12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 9, color, fontWeight: 600, letterSpacing: '.1em' }}>{label}</span>
            {isDuplicate && (
              <span style={{
                fontSize: 9, color: '#c8963c',
                border: '1px solid rgba(200,150,60,.3)',
                borderRadius: 3, padding: '1px 5px',
              }}>近似あり</span>
            )}
          </div>
          <div style={{ fontSize: 13, color: '#c8c0b0', lineHeight: 1.6, marginBottom: 8, wordBreak: 'break-all' }}>
            {content}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ScoreDots score={score} />
            <span style={{ fontSize: 9, color: '#3a3632' }}>{relativeTime(ts)}</span>
          </div>
        </div>
        <button
          onClick={onDelete}
          style={{
            fontSize: 16, color: '#2e2a26', background: 'none',
            border: 'none', cursor: 'pointer', padding: '0 2px',
            lineHeight: 1, flexShrink: 0,
          }}
          onMouseOver={e => (e.currentTarget.style.color = '#7a7068')}
          onMouseOut={e => (e.currentTarget.style.color = '#2e2a26')}
        >×</button>
      </div>
    </div>
  )
}
