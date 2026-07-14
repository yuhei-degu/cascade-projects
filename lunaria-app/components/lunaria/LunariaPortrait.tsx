'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  DEFAULT_REACTION,
  getPortraitAssetFallbacks,
  type LunariaReactionId,
} from '@/lib/lunaria/reactions'

interface LunariaPortraitProps {
  reaction?: LunariaReactionId | null
  outfitId?: string | null
  outfitDefaultReaction?: LunariaReactionId | null
  size?: number | string
  label?: string
  showDebugLabel?: boolean
  className?: string
  style?: CSSProperties
}

export function LunariaPortrait({
  reaction = DEFAULT_REACTION,
  outfitId = 'default',
  outfitDefaultReaction = DEFAULT_REACTION,
  size = 180,
  label = 'Lunaria',
  showDebugLabel = false,
  className,
  style,
}: LunariaPortraitProps) {
  const fallbacks = useMemo(
    () => getPortraitAssetFallbacks({ outfitId, reaction, outfitDefaultReaction }),
    [outfitDefaultReaction, outfitId, reaction],
  )
  const [fallbackIndex, setFallbackIndex] = useState(0)
  const imageSrc = fallbacks[fallbackIndex]

  useEffect(() => {
    setFallbackIndex(0)
  }, [fallbacks])

  const boxSize = typeof size === 'number' ? `${size}px` : size

  return (
    <figure
      className={className}
      style={{
        ...frameStyle,
        width: boxSize,
        minHeight: boxSize,
        ...style,
      }}
      aria-label={`${label}: ${reaction ?? DEFAULT_REACTION}`}
    >
      {imageSrc && fallbackIndex < fallbacks.length ? (
        <img
          src={imageSrc}
          alt={label}
          style={imageStyle}
          onError={() => {
            setFallbackIndex(current => (
              current + 1 < fallbacks.length ? current + 1 : fallbacks.length
            ))
          }}
        />
      ) : (
        <PortraitPlaceholder reaction={reaction ?? DEFAULT_REACTION} />
      )}
      {showDebugLabel && (
        <figcaption style={captionStyle}>
          {outfitId || 'default'} / {reaction ?? DEFAULT_REACTION}
        </figcaption>
      )}
    </figure>
  )
}

function PortraitPlaceholder({ reaction }: { reaction: LunariaReactionId }) {
  const reactionLabel: Record<LunariaReactionId, string> = {
    normal_idle: '通常',
    gentle_idle: 'やさしく待機',
    smile_nod: '笑顔でうなずく',
    small_wave: '小さく手を振る',
    teasing_tilt: 'からかって首をかしげる',
    serious_forward: '真剣に身を乗り出す',
    thinking_pose: '考え中',
    sad_lookdown: '悲しげに目を伏せる',
    surprised_react: '驚き',
    presenting_item: '品を見せる',
  }

  return (
    <div style={placeholderStyle}>
      <div style={moonHaloStyle} />
      <div style={silhouetteStyle}>
        <span style={initialStyle}>月</span>
      </div>
      <div style={reactionStyle}>{reactionLabel[reaction] ?? reaction}</div>
    </div>
  )
}

const frameStyle: CSSProperties = {
  position: 'relative',
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
  borderRadius: 28,
  border: '1px solid rgba(221, 213, 197, .16)',
  background: `
    radial-gradient(circle at 38% 22%, rgba(180, 145, 255, .26), transparent 34%),
    radial-gradient(circle at 72% 18%, rgba(221, 213, 197, .12), transparent 24%),
    linear-gradient(145deg, rgba(35, 31, 42, .94), rgba(15, 13, 18, .98))
  `,
  boxShadow: '0 24px 70px rgba(0, 0, 0, .34), inset 0 0 42px rgba(255, 255, 255, .035)',
}

const imageStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
}

const placeholderStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
  color: 'var(--luna-text-soft)',
}

const moonHaloStyle: CSSProperties = {
  position: 'absolute',
  width: '72%',
  aspectRatio: '1',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(177, 139, 255, .22), transparent 66%)',
  filter: 'blur(1px)',
}

const silhouetteStyle: CSSProperties = {
  position: 'relative',
  display: 'grid',
  placeItems: 'center',
  width: '46%',
  aspectRatio: '1',
  borderRadius: '42% 42% 48% 48%',
  background: 'linear-gradient(160deg, rgba(105, 74, 190, .82), rgba(51, 38, 86, .9))',
  boxShadow: '0 0 36px rgba(177, 139, 255, .26)',
}

const initialStyle: CSSProperties = {
  color: 'rgba(255, 255, 255, .74)',
  fontSize: 'clamp(32px, 22vw, 74px)',
  fontWeight: 700,
  lineHeight: 1,
  transform: 'translateY(-2%)',
}

const reactionStyle: CSSProperties = {
  position: 'absolute',
  left: 12,
  right: 12,
  bottom: 12,
  borderRadius: 999,
  padding: '6px 10px',
  background: 'rgba(10, 9, 12, .58)',
  color: 'rgba(221, 213, 197, .78)',
  fontSize: 11,
  letterSpacing: '.08em',
  textAlign: 'center',
  textTransform: 'uppercase',
}

const captionStyle: CSSProperties = {
  position: 'absolute',
  left: 10,
  top: 10,
  maxWidth: 'calc(100% - 20px)',
  borderRadius: 999,
  padding: '4px 8px',
  background: 'rgba(0, 0, 0, .44)',
  color: 'rgba(221, 213, 197, .72)',
  fontSize: 10,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}
