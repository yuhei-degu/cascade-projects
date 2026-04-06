'use client'
import type { Message } from '@/lib/types'

export function ChatMessage({ msg }: { msg: Message }) {
  const isAI = msg.role === 'assistant'
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', gap: 8,
      justifyContent: isAI ? 'flex-start' : 'flex-end',
    }}>
      {isAI && (
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#c8963c', flexShrink: 0, marginBottom: 3,
        }} />
      )}
      <div style={{
        maxWidth: '74%', fontSize: 14, lineHeight: 1.65,
        padding: '9px 13px',
        background: isAI ? '#1a1815' : '#231f1b',
        border: `1px solid ${isAI ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.04)'}`,
        borderRadius: isAI ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
        color: isAI ? '#ddd5c5' : '#c5bdb0',
      }}>
        {msg.content}
      </div>
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        background: '#c8963c', flexShrink: 0, marginBottom: 3,
      }} />
      <div style={{
        background: '#1a1815', border: '1px solid rgba(255,255,255,.07)',
        borderRadius: '4px 14px 14px 14px', padding: '9px 14px', fontSize: 14,
      }}>
        <span className="blink-dot" style={{ color: '#c8963c', animationDelay: '0s' }}>・</span>
        <span className="blink-dot" style={{ color: '#c8963c', animationDelay: '.3s' }}>・</span>
        <span className="blink-dot" style={{ color: '#c8963c', animationDelay: '.6s' }}>・</span>
      </div>
    </div>
  )
}
