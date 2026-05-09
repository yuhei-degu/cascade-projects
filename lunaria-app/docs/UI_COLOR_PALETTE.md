# UI Color Palette

作成：2026-05-04
位置付け：UI カラーの固定。Tailwind / CSS 変数 / デザイン data の根拠

---

## 0. ベース方針

- **ダークモード前提**で設計
- 暖色寄りより**冷色寄り**（夜・月モチーフ）
- 高彩度を避ける（PALE / NAVY / WHITE 中心）
- アクセントは warm gold を絞って 1 ヶ所
- コントラスト比 WCAG AA 以上を維持

---

## 1. 5 色の基本パレット

| 役割 | 名前 | HEX | 用途 |
|---|---|---|---|
| メイン暗 | midnight navy | `#1B1F33` | 背景 base |
| メイン明 | moon white | `#F4F1EA` | テキスト main、見出し |
| サブ | soft lavender | `#9E9CC2` | 副テキスト、border |
| アクセント冷 | pale blue | `#B6CFE6` | リンク、active 状態 |
| アクセント暖 | warm gold | `#D6B26C` | CTA、強調、月モチーフ |

---

## 2. 拡張パレット（実装用）

### 2.1 メインカラー段階
```
--c-navy-900: #0E101A  // 最深、modal scrim
--c-navy-800: #14182A  // header / aside 背景
--c-navy-700: #1B1F33  // page 背景（main）
--c-navy-600: #232845  // card 背景
--c-navy-500: #2C3155  // hover / active card
```

### 2.2 文字色
```
--c-text-main: #F4F1EA      // moon white
--c-text-sub: #C5C2D8       // やや薄い文字
--c-text-muted: #9E9CC2     // soft lavender、メタ情報
--c-text-dim: #6B6E8A       // disable、極薄
```

### 2.3 アクセント
```
--c-accent-cool: #B6CFE6    // pale blue
--c-accent-warm: #D6B26C    // warm gold
--c-accent-warm-soft: #E5C98E  // gold の softer
--c-link: #B6CFE6           // = pale blue
--c-link-hover: #D6B26C     // = warm gold
```

### 2.4 状態色（成功 / 警告 / エラー）
```
--c-success: #8FBF9F        // 抑えた緑、月夜の苔色
--c-warning: #D9B85F        // gold 系の警告
--c-error:   #C97A85        // くすんだローズ、強い赤を避ける
--c-info:    #9EB8D6        // pale blue 系
```

→ いずれも**派手にしない**。エラーですら強い赤は使わない。

### 2.5 月モチーフ系の補助色
```
--c-moon-glow: #D6CEE2      // 髪先に近い月光色
--c-night-blue: #2A2F50     // 夜空の中間
--c-star-soft: #F4E9C8      // 微かな星色（ほぼ使わない）
```

---

## 3. 役割マッピング

| UI 要素 | 推奨色 |
|---|---|
| body 背景 | `--c-navy-700` |
| header / aside | `--c-navy-800` |
| card | `--c-navy-600` |
| card hover | `--c-navy-500` |
| 区切り線 | `--c-text-dim` α 0.3 |
| 主要テキスト | `--c-text-main` |
| 副次テキスト | `--c-text-sub` |
| メタ情報（時刻 / カテゴリ） | `--c-text-muted` |
| プライマリボタン背景 | `--c-accent-warm` |
| プライマリボタン文字 | `--c-navy-900` |
| セカンダリボタン背景 | `--c-navy-500` |
| セカンダリボタン文字 | `--c-text-main` |
| リンク | `--c-link` |
| リンク hover | `--c-link-hover` |
| 入力フォーム背景 | `--c-navy-800` |
| 入力フォーム border | `--c-text-dim` |
| エラー背景 | `--c-navy-600` + border `--c-error` |
| 成功背景 | `--c-navy-600` + border `--c-success` |

---

## 4. ダークモード前提の使い方

### 4.1 ベース
- 背景は **必ず暗** (`--c-navy-700` 以下)
- 文字は **必ず明るい** (`--c-text-*`)
- 「明るい背景に暗い文字」は使わない（ライトモードは v3 以降）

### 4.2 グラデーション
- 縦グラデで `--c-navy-800` → `--c-navy-700` の極弱が許容
- 急激な色相変化（青 → 紫）は禁止
- 月光感を出したい場合：`--c-moon-glow` を 5〜10% 透過で重ねる

### 4.3 シャドウ
- ダークモードでは「暗いシャドウ」は見えないので、**明るいリング**で深さを表現
- 例：`box-shadow: 0 0 0 1px rgba(214, 178, 108, 0.15)` (gold ring)

### 4.4 透過 / overlay
- modal scrim：`rgba(14, 16, 26, 0.75)`（navy-900 75%）
- card 上にさらに浮かせる時：`backdrop-filter: blur(8px)` + `bg-navy-600/80`

---

## 5. アクセシビリティ

### 5.1 コントラスト比（WCAG AA：4.5:1）
- `--c-text-main` on `--c-navy-700`：~13:1 ✅
- `--c-text-sub` on `--c-navy-700`：~8:1 ✅
- `--c-text-muted` on `--c-navy-700`：~5:1 ✅（ぎりぎり）
- `--c-text-dim` on `--c-navy-700`：~3:1 ❌（meta-meta 専用、本文 NG）

### 5.2 カラーバインド
- 状態色だけで意味を伝えない（必ずアイコン or テキスト併用）
- リンクは色だけでなく下線 or hover で視認確保

---

## 6. ボタン / CTA

### 6.1 プライマリ（warm gold）
- 用途：1 画面に 1 つ。「日記を生成」「ガチャを引く」「保存」
- 色：bg `--c-accent-warm`、文字 `--c-navy-900`
- hover：bg `--c-accent-warm-soft`

### 6.2 セカンダリ（navy）
- 用途：補助 action。「キャンセル」「閉じる」「設定」
- 色：bg `--c-navy-500`、文字 `--c-text-main`
- hover：bg `--c-navy-500` + ring `--c-text-muted`

### 6.3 ゴースト（border のみ）
- 用途：低重要度。「もっと見る」「外したものを見る」
- 色：bg transparent、border `--c-text-muted`、文字 `--c-text-sub`
- hover：bg `--c-navy-600`

### 6.4 危険（archive / delete）
- 用途：archive モーダルの確定ボタン
- 色：bg transparent、border `--c-error`、文字 `--c-error`
- 「赤いボタン」にしない（過剰圧）

---

## 7. ガチャ / レアリティ別アクセント

| レアリティ | アクセント色 | 補助 |
|---|---|---|
| common | `--c-text-muted` | 控えめ |
| rare | `--c-accent-cool` | pale blue glow |
| epic | `--c-accent-warm` | gold ring |
| legendary | `--c-accent-warm` + `--c-moon-glow` | gold + 月光パーティクル |

→ レア度を**色の派手さ**で示すのではなく、**演出の細やかさ**で示す。

---

## 8. ライトモード（将来）

- 想定：v3 以降
- ベース背景：`--c-text-main` (#F4F1EA)
- 文字：`--c-navy-900`
- アクセントはそのまま
- **今はやらない**（夜のアプリだから暗背景がベース）

---

## 9. CSS 実装例

```css
:root {
  --c-navy-900: #0E101A;
  --c-navy-800: #14182A;
  --c-navy-700: #1B1F33;
  --c-navy-600: #232845;
  --c-navy-500: #2C3155;

  --c-text-main: #F4F1EA;
  --c-text-sub: #C5C2D8;
  --c-text-muted: #9E9CC2;
  --c-text-dim: #6B6E8A;

  --c-accent-cool: #B6CFE6;
  --c-accent-warm: #D6B26C;
  --c-accent-warm-soft: #E5C98E;

  --c-success: #8FBF9F;
  --c-warning: #D9B85F;
  --c-error: #C97A85;
  --c-info: #9EB8D6;

  --c-moon-glow: #D6CEE2;
  --c-night-blue: #2A2F50;
}

body {
  background: var(--c-navy-700);
  color: var(--c-text-main);
}
```

→ Tailwind を使う場合は `tailwind.config.ts` の `theme.extend.colors` に展開。

---

## 10. NG カラー運用

- 蛍光色（`#00FF00` / `#FF00FF` 等）
- 純赤（`#FF0000`）：エラー含めて使わない
- 純黒（`#000000`）：navy-900 で代用
- 純白（`#FFFFFF`）：moon white で代用
- パステル過多（甘くなる）
- グラデーションの色相変化が大きいもの

---

## 11. 議論したい論点

1. **アクセント warm gold の使用頻度**：CTA だけ vs リンク hover も含む
2. **エラー色**：`--c-error` (#C97A85) で十分か、赤強めにするか
3. **ライトモード**：v3 で出すか、Lunaria は暗背景固定にするか
4. **ガチャ legendary の専用色**：gold 強調 vs 月光パーティクルだけで足りるか
5. **`--c-text-muted` のコントラスト**：5:1 ぎりぎり、もう少し明るくすべきか

---

## 12. 関連
- `BRAND_GUIDE.md`（ブランド方針）
- `LOGO_DIRECTION.md`（ロゴカラー）
- `LUNARIA_VISUAL_GUIDE.md`（キャラ髪色 / 目色との整合）
- `app/globals.css`（既存の CSS 変数、要 sync）
