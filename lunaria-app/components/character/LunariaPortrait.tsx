'use client'

import type { CSSProperties } from 'react'

/**
 * LunariaPortrait
 *
 * 将来の Live2D 差し替え前提の placeholder コンポーネント。
 * 今は SVG / CSS だけで「ルナリアらしさ」を仮表示する。
 *
 * 使い方：
 *   <LunariaPortrait expression="gentle_smile" motion="idle" outfit="default" />
 *
 * 参照：
 *   - docs/CHARACTER_EXPRESSIONS.md（12 種の表情）
 *   - docs/CHARACTER_MOTIONS.md（10 種のモーション）
 *   - docs/LUNARIA_VISUAL_GUIDE.md（髪色 / 目色 / モチーフ）
 *   - docs/ASSISTANT_REPLY_SCHEMA.md（AI 返答の expression / motion をそのまま受ける）
 *
 * TODO（Codex 復帰後）：
 *   - 実立ち絵 PNG を public/lunaria/portrait/{outfit}/{expression}.png に配置
 *   - Live2D Cubism モデルへの段階移行（v1: パーツ差分、v2: Cubism）
 *   - voice_tone を audio prop で受ける
 */

export type LunariaExpression =
  | 'normal'
  | 'smile'
  | 'gentle_smile'
  | 'teasing'
  | 'surprised'
  | 'thinking'
  | 'sad'
  | 'serious'
  | 'embarrassed'
  | 'sleepy'
  | 'excited'
  | 'relieved'

export type LunariaMotion =
  | 'idle'
  | 'tilt_head'
  | 'nod'
  | 'shake_head'
  | 'look_away'
  | 'lean_forward'
  | 'close_eyes'
  | 'small_wave'
  | 'arms_crossed'
  | 'soft_laugh'

export type LunariaPortraitProps = {
  expression?: LunariaExpression | string
  outfit?: string
  motion?: LunariaMotion | string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  /** 立ち絵 PNG の override パス。指定があればそれを表示、なければ SVG プレースホルダー */
  imageUrl?: string
}

const SIZE_PX: Record<NonNullable<LunariaPortraitProps['size']>, number> = {
  sm: 96,
  md: 160,
  lg: 240,
}

// 表情ごとに口角・眉の角度を変えて差別化（雰囲気だけ）
const EXPRESSION_HINT: Record<string, { mouthCurve: number; browAngle: number; eyeOpenness: number; cheek: boolean }> = {
  normal: { mouthCurve: 0, browAngle: 0, eyeOpenness: 1, cheek: false },
  smile: { mouthCurve: 4, browAngle: -3, eyeOpenness: 0.85, cheek: false },
  gentle_smile: { mouthCurve: 2, browAngle: -2, eyeOpenness: 0.95, cheek: false },
  teasing: { mouthCurve: 3, browAngle: -5, eyeOpenness: 0.9, cheek: false },
  surprised: { mouthCurve: 0, browAngle: 5, eyeOpenness: 1.2, cheek: false },
  thinking: { mouthCurve: -1, browAngle: -3, eyeOpenness: 0.9, cheek: false },
  sad: { mouthCurve: -3, browAngle: -6, eyeOpenness: 0.85, cheek: false },
  serious: { mouthCurve: -1, browAngle: 0, eyeOpenness: 1, cheek: false },
  embarrassed: { mouthCurve: 1, browAngle: -2, eyeOpenness: 0.85, cheek: true },
  sleepy: { mouthCurve: 0, browAngle: -2, eyeOpenness: 0.5, cheek: false },
  excited: { mouthCurve: 5, browAngle: 3, eyeOpenness: 1.1, cheek: true },
  relieved: { mouthCurve: 2, browAngle: -4, eyeOpenness: 0.7, cheek: false },
}

const MOTION_CLASS: Record<string, string> = {
  idle: 'lunaria-motion-idle',
  tilt_head: 'lunaria-motion-tilt',
  nod: 'lunaria-motion-nod',
  shake_head: 'lunaria-motion-shake',
  look_away: 'lunaria-motion-lookaway',
  lean_forward: 'lunaria-motion-lean',
  close_eyes: 'lunaria-motion-closeeyes',
  small_wave: 'lunaria-motion-wave',
  arms_crossed: 'lunaria-motion-cross',
  soft_laugh: 'lunaria-motion-laugh',
}

export default function LunariaPortrait({
  expression = 'normal',
  outfit = 'default',
  motion = 'idle',
  className,
  size = 'md',
  imageUrl,
}: LunariaPortraitProps) {
  const px = SIZE_PX[size]
  const hint = EXPRESSION_HINT[expression] ?? EXPRESSION_HINT.normal
  const motionClass = MOTION_CLASS[motion] ?? MOTION_CLASS.idle

  const wrapperStyle: CSSProperties = {
    width: px,
    height: px,
    position: 'relative',
    display: 'inline-block',
  }

  // 実画像があればそれを優先
  if (imageUrl) {
    return (
      <div className={className} style={wrapperStyle} data-expression={expression} data-motion={motion} data-outfit={outfit}>
        <img
          src={imageUrl}
          alt={`Lunaria (${expression})`}
          className={motionClass}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
        <PortraitMotionStyles />
      </div>
    )
  }

  // SVG プレースホルダー
  const eyeRy = 4 * (hint.eyeOpenness ?? 1)
  const mouthPath =
    hint.mouthCurve === 0
      ? 'M 36 60 Q 50 60 64 60'
      : hint.mouthCurve > 0
      ? `M 36 60 Q 50 ${60 + hint.mouthCurve * 1.2} 64 60`
      : `M 36 ${60 - hint.mouthCurve * 0.6} Q 50 ${60 + hint.mouthCurve * 1.0} 64 ${60 - hint.mouthCurve * 0.6}`
  const browLeftY = 35 - hint.browAngle * 0.4
  const browRightY = 35 - hint.browAngle * 0.4

  return (
    <div className={className} style={wrapperStyle} data-expression={expression} data-motion={motion} data-outfit={outfit}>
      <svg
        viewBox="0 0 100 100"
        width={px}
        height={px}
        className={motionClass}
        aria-label={`Lunaria portrait (expression=${expression}, motion=${motion})`}
        role="img"
      >
        <defs>
          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1f2342" />
            <stop offset="60%" stopColor="#3a3460" />
            <stop offset="100%" stopColor="#d6cee2" />
          </linearGradient>
          <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#d6cee2" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#d6cee2" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 月光の背景 */}
        <circle cx="50" cy="50" r="48" fill="url(#moonGlow)" />

        {/* 髪（後ろ） */}
        <path d="M 18 38 Q 18 18 50 14 Q 82 18 82 38 L 82 78 Q 50 92 18 78 Z" fill="url(#hairGrad)" />

        {/* 顔 */}
        <ellipse cx="50" cy="48" rx="20" ry="24" fill="#F4E9D8" />

        {/* 髪（前） */}
        <path d="M 30 30 Q 38 24 50 26 Q 62 24 70 30 Q 65 35 50 33 Q 35 35 30 30 Z" fill="url(#hairGrad)" />

        {/* 眉 */}
        <path d={`M 36 ${browLeftY} Q 40 ${browLeftY - 1} 44 ${browLeftY + 0.3}`} stroke="#2a2440" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d={`M 56 ${browRightY + 0.3} Q 60 ${browRightY - 1} 64 ${browRightY}`} stroke="#2a2440" strokeWidth="1.2" fill="none" strokeLinecap="round" />

        {/* 目（瞳孔 + 金リング） */}
        <ellipse cx="40" cy="48" rx="3" ry={eyeRy} fill="#9bb4d6" />
        <ellipse cx="40" cy="48" rx="3" ry={eyeRy} fill="none" stroke="#d6c184" strokeWidth="0.4" />
        <ellipse cx="60" cy="48" rx="3" ry={eyeRy} fill="#9bb4d6" />
        <ellipse cx="60" cy="48" rx="3" ry={eyeRy} fill="none" stroke="#d6c184" strokeWidth="0.4" />

        {/* 口 */}
        <path d={mouthPath} stroke="#a36a6f" strokeWidth="1.2" fill="none" strokeLinecap="round" />

        {/* 頬（embarrassed / excited 時） */}
        {hint.cheek && (
          <>
            <ellipse cx="34" cy="55" rx="3" ry="1.5" fill="#e3a1a8" opacity="0.5" />
            <ellipse cx="66" cy="55" rx="3" ry="1.5" fill="#e3a1a8" opacity="0.5" />
          </>
        )}

        {/* 月モチーフ（襟元） */}
        <circle cx="50" cy="86" r="2" fill="#d6c184" opacity="0.8" />
      </svg>

      <PortraitMotionStyles />

      {/* outfit / motion のメタ表示（dev 用、size=lg のみ） */}
      {size === 'lg' && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: -22,
            textAlign: 'center',
            fontSize: 10,
            color: '#9E9CC2',
            letterSpacing: 0.5,
          }}
        >
          {expression} · {motion} · {outfit}
        </div>
      )}
    </div>
  )
}

/**
 * モーション用の CSS を 1 度だけ inline で吐く。
 * 重複描画は許容（コンポーネント数本程度）。本番では globals.css に移動推奨。
 */
const PORTRAIT_MOTION_CSS = `
.lunaria-motion-idle { animation: lunaria-breathe 4.5s ease-in-out infinite; }
.lunaria-motion-tilt { animation: lunaria-tilt 1.4s ease-in-out; }
.lunaria-motion-nod { animation: lunaria-nod 0.6s ease-out; }
.lunaria-motion-shake { animation: lunaria-shake 0.6s ease-in-out; }
.lunaria-motion-lookaway { animation: lunaria-lookaway 1.0s ease-in-out; }
.lunaria-motion-lean { animation: lunaria-lean 1.6s ease-in-out; }
.lunaria-motion-closeeyes { animation: lunaria-breathe 4.5s ease-in-out infinite; }
.lunaria-motion-wave { animation: lunaria-wave 0.8s ease-in-out; }
.lunaria-motion-cross { animation: lunaria-breathe 5s ease-in-out infinite; }
.lunaria-motion-laugh { animation: lunaria-laugh 0.6s ease-out; }

@keyframes lunaria-breathe {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}
@keyframes lunaria-tilt {
  0% { transform: rotate(0); }
  40% { transform: rotate(-5deg); }
  70% { transform: rotate(-5deg); }
  100% { transform: rotate(0); }
}
@keyframes lunaria-nod {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(4px); }
}
@keyframes lunaria-shake {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-4deg); }
  75% { transform: rotate(4deg); }
}
@keyframes lunaria-lookaway {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(3px); }
}
@keyframes lunaria-lean {
  0%, 100% { transform: scale(1) translateY(0); }
  50% { transform: scale(1.02) translateY(-3px); }
}
@keyframes lunaria-wave {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-6deg); }
  75% { transform: rotate(6deg); }
}
@keyframes lunaria-laugh {
  0%, 100% { transform: translateY(0); }
  25% { transform: translateY(2px); }
  75% { transform: translateY(2px); }
}
`

function PortraitMotionStyles() {
  return <style dangerouslySetInnerHTML={{ __html: PORTRAIT_MOTION_CSS }} />
}
