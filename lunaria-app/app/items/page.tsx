'use client'

/**
 * /items
 *
 * mock のアイテム一覧表示。`docs/INITIAL_ITEMS.md` を元にした 30 個の固定 mock データ。
 * DB 接続なし。
 *
 * TODO（Codex 復帰後）：
 *   - `/api/items` を実装し、`lunaria_items` から取得
 *   - `user_items` で所持判定を上書き
 *   - 装備変更 / コイン化 / restore のアクションを足す
 *   - 並び替え（取得日順 / レアリティ順 / カテゴリ順）
 */

import Link from 'next/link'
import { useMemo, useState } from 'react'

type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

type Category =
  | 'outfit'
  | 'accessory'
  | 'background'
  | 'room_item'
  | 'expression_unlock'
  | 'motion_unlock'
  | 'voice_unlock'
  | 'special_diary_skin'
  | 'special_event_item'

type ItemMock = {
  id: string
  name: string
  category: Category
  rarity: Rarity
  description: string
  effect: string
  flavor_text: string
  /** mock の所持判定。実際は user_items 由来 */
  owned: boolean
}

const CATEGORY_LABEL: Record<Category, string> = {
  outfit: '衣装',
  accessory: 'アクセサリー',
  background: '背景',
  room_item: '部屋',
  expression_unlock: '表情解放',
  motion_unlock: 'モーション解放',
  voice_unlock: '声色解放',
  special_diary_skin: '日記スキン',
  special_event_item: '期間限定',
}

const RARITY_LABEL: Record<Rarity, string> = {
  common: 'common',
  rare: 'rare',
  epic: 'epic',
  legendary: 'legendary',
}

const RARITY_COLOR: Record<Rarity, string> = {
  common: '#9E9CC2',
  rare: '#B6CFE6',
  epic: '#D6B26C',
  legendary: '#E5C98E',
}

// docs/INITIAL_ITEMS.md と同期。Codex 復帰後に lunaria_items の seed と同期する
const INITIAL_ITEMS: ItemMock[] = [
  // 衣装 8
  { id: 'outfit_default', name: '月夜の制服', category: 'outfit', rarity: 'common', description: '白と淡藍のワンピース、襟元に小さな三日月。ルナリアの素の姿', effect: '装備で current_outfit_id=outfit_default', flavor_text: 'ふだんの夜、ふだんの私', owned: true },
  { id: 'outfit_cardigan_navy', name: '紺のカーディガン', category: 'outfit', rarity: 'common', description: '制服の上から羽織る、深い紺のカーディガン', effect: '穏やかに見える pose', flavor_text: '寒くなってきたから、これ羽織るね', owned: true },
  { id: 'outfit_room_wear', name: '部屋着セット', category: 'outfit', rarity: 'common', description: '薄手のロング T と膝丈のスカート、リラックス用', effect: 'sleepy 表情の出現確率がやや上がる', flavor_text: '今日は、もう動きたくない日', owned: true },
  { id: 'outfit_yukata_summer', name: '夏の浴衣', category: 'outfit', rarity: 'rare', description: '藍染めに小さな白い月柄の浴衣', effect: '夏季イベントで tilt_head が候補に', flavor_text: '祭りの音、聞こえる？', owned: false },
  { id: 'outfit_winter_coat', name: '月白のコート', category: 'outfit', rarity: 'rare', description: '月光色のロングコート、襟元はファー', effect: '冬季背景との combo で雪舞い', flavor_text: '手、つなぐ？', owned: true },
  { id: 'outfit_birthday_dress', name: '月の誕生日ドレス', category: 'outfit', rarity: 'epic', description: '淡いラベンダー × 白のドレス、銀の刺繍で月相', effect: '誕生日に装備で特別演出', flavor_text: '今日は、特別な日にしようね', owned: false },
  { id: 'outfit_starwatch', name: '星見の装い', category: 'outfit', rarity: 'epic', description: '濃紺のロング丈ワンピース、肩から薄いショール', effect: '夜空背景で星座カーソル', flavor_text: '今夜の星、きれいだね', owned: false },
  { id: 'outfit_lunar_priestess', name: '月の巫女装束', category: 'outfit', rarity: 'legendary', description: '白絹に金糸の月相刺繍、和洋折衷の装束', effect: 'serious + lean_forward が大きくなる', flavor_text: 'あなたのこと、ちゃんと聞くよ', owned: false },

  // アクセサリー 6
  { id: 'acc_moon_pin', name: '三日月のヘアピン', category: 'accessory', rarity: 'common', description: '銀の三日月をかたどった小さなピン', effect: '髪の左サイドに装備', flavor_text: '迷子にならないように、目印', owned: true },
  { id: 'acc_round_glasses', name: '月読み眼鏡', category: 'accessory', rarity: 'common', description: '丸縁の薄い銀フレーム眼鏡', effect: 'thinking 表情でレンズが光る', flavor_text: 'ちょっと、考えるとき用', owned: false },
  { id: 'acc_pearl_earrings', name: '月光の耳飾り', category: 'accessory', rarity: 'rare', description: '小さな真珠の月、片耳のみ', effect: '耳元の slot', flavor_text: '満ちてゆくのが、好き', owned: false },
  { id: 'acc_ribbon_navy', name: '紺のリボン', category: 'accessory', rarity: 'rare', description: '髪を緩く束ねるリボン、紺地に銀糸', effect: 'ハーフアップ pose', flavor_text: 'ちょっと、整えてみた', owned: true },
  { id: 'acc_choker_silver', name: '銀のチョーカー', category: 'accessory', rarity: 'epic', description: '銀の細鎖、中央に三日月', effect: '首元 slot', flavor_text: 'あなたが選んでくれた', owned: false },
  { id: 'acc_pocket_watch', name: '月時計', category: 'accessory', rarity: 'epic', description: '銀のポケットウォッチ、文字盤に月相', effect: 'UI 隅に時刻 + 月相を表示', flavor_text: '時間って、どっちむきだっけ', owned: false },

  // 背景 6
  { id: 'bg_default', name: '夜の自室', category: 'background', rarity: 'common', description: '薄暗い自室、机のランプとカーテンの隙間から月明かり', effect: 'デフォルト背景', flavor_text: 'いつもの場所', owned: true },
  { id: 'bg_window_night', name: '窓辺の夜', category: 'background', rarity: 'common', description: '窓越しに夜景、街のあかりがにじむ', effect: 'チャット背景', flavor_text: '誰かが、まだ起きてる', owned: true },
  { id: 'bg_rooftop_full_moon', name: '屋上と満月', category: 'background', rarity: 'rare', description: '屋上から見上げる満月、夜風の演出', effect: '髪揺れ強め', flavor_text: 'ちょっと、抜け出そうか', owned: false },
  { id: 'bg_old_library', name: '古い図書室', category: 'background', rarity: 'rare', description: '本棚に囲まれた静かな空間、ランプの光', effect: 'thinking 表情と相性良い', flavor_text: 'このページ、読んでた', owned: false },
  { id: 'bg_starlight_sea', name: '星明かりの海', category: 'background', rarity: 'epic', description: '水平線に月、波音がうっすら聞こえそう', effect: 'BGM hint「波」', flavor_text: '海って、夜のほうが好き', owned: false },
  { id: 'bg_lunar_garden', name: '月の庭', category: 'background', rarity: 'legendary', description: '月光の差す中庭、白い花と石畳', effect: '花びらが舞うパーティクル', flavor_text: 'ここ、誰も来ないから', owned: false },

  // 部屋 6
  { id: 'room_mug_warm', name: 'あたたかいマグ', category: 'room_item', rarity: 'common', description: '湯気の立つ白いマグカップ', effect: '部屋ビュー（将来）でテーブル中央', flavor_text: '飲む？', owned: false },
  { id: 'room_notebook', name: '月色のノート', category: 'room_item', rarity: 'common', description: '薄紫の表紙の小さなノート', effect: '日記アイコン横に飾れる', flavor_text: '書きたいこと、ある？', owned: false },
  { id: 'room_lamp_warm', name: '暖色のランプ', category: 'room_item', rarity: 'rare', description: 'オレンジ寄りの暖色ランプ', effect: 'UI 全体の暖色 bias', flavor_text: '明るすぎないのが、いいよね', owned: false },
  { id: 'room_plant_small', name: '小さな観葉植物', category: 'room_item', rarity: 'rare', description: '手のひらサイズの緑、葉が 5 枚', effect: '部屋ビュー隅に配置', flavor_text: '水、あげた？', owned: false },
  { id: 'room_record_player', name: 'レコードプレイヤー', category: 'room_item', rarity: 'epic', description: 'ヴィンテージのレコードプレイヤー', effect: 'BGM 候補が増える（将来）', flavor_text: '今夜は、これ流そうか', owned: false },
  { id: 'room_telescope', name: '小さな望遠鏡', category: 'room_item', rarity: 'epic', description: '銀色の小さな望遠鏡', effect: '満月の日に演出強化', flavor_text: '見える？あの星', owned: false },

  // 表情 / モーション解放 4
  { id: 'expr_excited', name: '「わくわく」表情', category: 'expression_unlock', rarity: 'epic', description: 'excited 表情を解放', effect: 'AI 返答で excited が選ばれる', flavor_text: 'その顔、はじめて見せたかも', owned: false },
  { id: 'expr_embarrassed', name: '「照れ」表情', category: 'expression_unlock', rarity: 'rare', description: 'embarrassed 表情を解放', effect: '親密度上昇イベントで現れる', flavor_text: '…見ないで', owned: true },
  { id: 'motion_small_wave', name: '「手を振る」モーション', category: 'motion_unlock', rarity: 'rare', description: 'small_wave モーションを解放', effect: '起動時 / 終了時の挨拶演出', flavor_text: 'またね、って言いたかっただけ', owned: true },
  { id: 'motion_arms_crossed', name: '「腕組み」モーション', category: 'motion_unlock', rarity: 'epic', description: 'arms_crossed モーションを解放', effect: 'teasing 表情と組み合わせ', flavor_text: 'そう来たか、ふーん？', owned: false },
]

const CATEGORY_FILTERS: Array<{ id: 'all' | Category; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'outfit', label: '衣装' },
  { id: 'accessory', label: 'アクセサリー' },
  { id: 'background', label: '背景' },
  { id: 'room_item', label: '部屋' },
  { id: 'expression_unlock', label: '表情' },
  { id: 'motion_unlock', label: 'モーション' },
]

const PAGE_BG = '#0e0d0b'
const CARD_BG = '#181612'
const TEXT_MAIN = '#ddd5c5'
const TEXT_SUB = '#a39c8c'
const TEXT_DIM = '#7a7468'

export default function ItemsPage() {
  const [filter, setFilter] = useState<'all' | Category>('all')
  const [showUnowned, setShowUnowned] = useState(true)

  const filtered = useMemo(() => {
    return INITIAL_ITEMS.filter(it => {
      if (filter !== 'all' && it.category !== filter) return false
      if (!showUnowned && !it.owned) return false
      return true
    })
  }, [filter, showUnowned])

  const ownedCount = INITIAL_ITEMS.filter(i => i.owned).length

  return (
    <div style={{ minHeight: '100dvh', background: PAGE_BG, color: TEXT_MAIN, padding: 24, overflow: 'auto', height: '100dvh' }}>
      <header style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <Link href="/" style={{ color: TEXT_SUB, fontSize: 12, textDecoration: 'none' }}>← ルナの部屋へ</Link>
        <Link href="/diary" style={{ color: TEXT_SUB, fontSize: 12, textDecoration: 'none' }}>日記へ</Link>
        <Link href="/memory" style={{ color: TEXT_SUB, fontSize: 12, textDecoration: 'none' }}>記憶へ</Link>
        <Link href="/character" style={{ color: TEXT_SUB, fontSize: 12, textDecoration: 'none' }}>ルナの状態へ</Link>
        <h1 style={{ fontSize: 22, fontWeight: 400, letterSpacing: 1, marginLeft: 'auto' }}>アイテム棚</h1>
      </header>

      <p style={{ color: TEXT_SUB, fontSize: 13, marginBottom: 16 }}>
        ルナと過ごすうちに、ちょっとずつ集まったもの。<br />
        所持 {ownedCount} / {INITIAL_ITEMS.length} 個
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        {CATEGORY_FILTERS.map(c => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              background: filter === c.id ? '#2a2620' : 'transparent',
              color: filter === c.id ? TEXT_MAIN : TEXT_SUB,
              border: `1px solid ${filter === c.id ? TEXT_SUB : TEXT_DIM}`,
              borderRadius: 999,
              cursor: 'pointer',
            }}
          >
            {c.label}
          </button>
        ))}
        <label style={{ marginLeft: 'auto', fontSize: 12, color: TEXT_SUB, display: 'inline-flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
          <input type="checkbox" checked={showUnowned} onChange={e => setShowUnowned(e.target.checked)} />
          まだ持っていないものも見る
        </label>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        {filtered.map(item => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={{ color: TEXT_DIM, fontSize: 13, marginTop: 32 }}>該当するアイテムがないみたい。</p>
      )}

      <p style={{ color: TEXT_DIM, fontSize: 11, marginTop: 32, lineHeight: 1.6 }}>
        ※ これは mock 表示です。Codex 復帰後に <code>lunaria_items</code> + <code>user_items</code> から取得するように切り替えます。
      </p>
    </div>
  )
}

function ItemCard({ item }: { item: ItemMock }) {
  const owned = item.owned
  const accent = RARITY_COLOR[item.rarity]

  return (
    <div
      style={{
        background: CARD_BG,
        border: `1px solid ${owned ? '#2a2620' : '#1a1814'}`,
        borderRadius: 8,
        padding: 14,
        opacity: owned ? 1 : 0.65,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 11, color: TEXT_SUB }}>{CATEGORY_LABEL[item.category]}</span>
        <span style={{ fontSize: 10, color: accent, letterSpacing: 1, textTransform: 'uppercase' }}>{RARITY_LABEL[item.rarity]}</span>
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 500, color: TEXT_MAIN, marginTop: 2 }}>{item.name}</h3>
      <p style={{ fontSize: 12, color: TEXT_SUB, lineHeight: 1.5, minHeight: 36 }}>{item.description}</p>
      <p style={{ fontSize: 11, color: TEXT_DIM, fontStyle: 'italic', marginTop: 4 }}>「{item.flavor_text}」</p>
      <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: TEXT_DIM }}>{item.effect}</span>
        <span
          style={{
            fontSize: 10,
            color: owned ? accent : TEXT_DIM,
            border: `1px solid ${owned ? accent : TEXT_DIM}`,
            borderRadius: 999,
            padding: '2px 8px',
          }}
        >
          {owned ? '所持' : '未所持'}
        </span>
      </div>
    </div>
  )
}
