'use client'

interface StatusBarProps {
  label: string
  value: number
  color: string
  prevValue?: number
}

export function StatusBar({ label, value, color, prevValue }: StatusBarProps) {
  const delta = prevValue !== undefined ? value - prevValue : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 10, color: '#3a3632', minWidth: 44, textAlign: 'right' }}>{label}</span>
      <div style={{ width: 52, height: 2, background: '#1e1b18', borderRadius: 1, overflow: 'hidden' }}>
        <div style={{
          width: `${value}%`, height: '100%',
          background: color, borderRadius: 1,
          transition: 'width 1.2s cubic-bezier(.25,.8,.25,1)',
        }} />
      </div>
      <span style={{ fontSize: 10, color: '#3a3632', minWidth: 18 }}>{value}</span>
      {delta !== 0 && (
        <span style={{ fontSize: 9, color: delta > 0 ? '#4d8f7a' : '#9e5050' }}>
          {delta > 0 ? '+' : ''}{Math.round(delta)}
        </span>
      )}
    </div>
  )
}

export function ScoreDots({ score }: { score: number }) {
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} style={{
          width: 5, height: 5, borderRadius: '50%',
          background: i <= score ? '#c8963c' : '#252218',
          transition: 'background .3s',
        }} />
      ))}
    </div>
  )
}
