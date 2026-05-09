# Character Motions

作成：2026-05-04
位置付け：ルナリアのモーションタグ。AI 返答の `motion` と Live2D / CSS アニメで共通参照

---

## 0. モーションの役割

表情だけでは伝わらない「身体の動き」を補う。
ルナリアは過剰に動かない。**静か × ときどき動く**で、距離感の親密さを維持する。

各モーションには：
- 意味
- 使う場面
- 表情との相性
- CSS アニメで仮実装する場合の方針

---

## 1. タグ一覧（10 種）

| ID | 日本語 | 優先度 |
|---|---|---|
| `idle` | アイドル（静止微動） | ★★★ |
| `tilt_head` | 首をかしげる | ★★ |
| `nod` | うなずく | ★★ |
| `shake_head` | 首を横に振る | ★ |
| `look_away` | 視線を逸らす | ★ |
| `lean_forward` | 前に寄る | ★★ |
| `close_eyes` | 目を閉じる | ★ |
| `small_wave` | 小さく手を振る | ★ |
| `arms_crossed` | 腕組み | ★ |
| `soft_laugh` | 小さく笑う（肩が揺れる） | ★ |

---

## 2. 各タグ詳細

### 2.1 `idle`
- **意味**：何もしていないが「いる」感
- **使う場面**：会話していない時、ヘッダー、`/character` page デフォルト
- **表情との相性**：`normal` / `gentle_smile` / `sleepy`
- **CSS 実装**：
  - 軽い縦揺れ（呼吸）：`@keyframes breathe { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }`
  - 周期 4〜5 秒、ease-in-out
  - 髪先がうっすら揺れる（同期）

### 2.2 `tilt_head`
- **意味**：「ん？」「どうしたの？」聞き返し / 確認
- **使う場面**：ユーザーの曖昧な発話への聞き返し、軽い疑問
- **表情との相性**：`thinking` / `teasing` / `gentle_smile`
- **CSS 実装**：`transform: rotate(-5deg)` を 0.4 秒で当て、0.8 秒キープ、戻し 0.3 秒

### 2.3 `nod`
- **意味**：肯定 / 受容 / 「うん」
- **使う場面**：ユーザーの発話を受け止める時、共感
- **表情との相性**：`gentle_smile` / `sad` / `serious`
- **CSS 実装**：`translateY(0 → 4px → 0)` 1 サイクル 0.5 秒。連続 2 回まで（`nod nod`）

### 2.4 `shake_head`
- **意味**：否定 / 「ううん」/ 控えめな反対
- **使う場面**：ユーザーの自己否定をやんわり否定する時、間違いを指摘する時
- **表情との相性**：`gentle_smile`（やわらかな否定）/ `serious`（強い否定）
- **CSS 実装**：`rotate(-5deg → 5deg → -5deg → 0)` を 0.6 秒で

### 2.5 `look_away`
- **意味**：照れ / 言いにくいこと / 距離調整
- **使う場面**：`embarrassed` 表情と組む、深い質問への躊躇
- **表情との相性**：`embarrassed` / `thinking` / `sad`
- **CSS 実装**：目の `transform-origin` を変えて `translateX(3px)` を 0.5 秒、戻し遅め

### 2.6 `lean_forward`
- **意味**：聞いてる / 関心 / 真剣
- **使う場面**：`claude_serious` 経路、ユーザーの感情シェアへの寄り添い
- **表情との相性**：`serious` / `sad` / `gentle_smile`
- **CSS 実装**：`scale(1.02)` + `translateY(-3px)` を 0.6 秒、戻しは長く 1.0 秒

### 2.7 `close_eyes`
- **意味**：受け止め / 噛みしめ / 「うん…」の余韻
- **使う場面**：深刻な発話を一拍受け止める時、感謝された時
- **表情との相性**：`sad` / `gentle_smile` / `relieved`
- **CSS 実装**：目だけ `scaleY(0.1)` を 0.5 秒キープ、戻し 0.3 秒

### 2.8 `small_wave`
- **意味**：挨拶 / 別れ / 「またね」
- **使う場面**：起動時 / 終了時 / 久しぶり再訪時
- **表情との相性**：`gentle_smile` / `smile`
- **CSS 実装**：手だけ `rotate(-15deg → 15deg → -15deg → 0)` を 0.8 秒。立ち絵側で手を見せる構図必要

### 2.9 `arms_crossed`
- **意味**：軽い拗ね / 茶化し受け流し / 「ふーん？」
- **使う場面**：`teasing` 表情と組む、ユーザーの言い訳への返し
- **表情との相性**：`teasing` / `normal`
- **CSS 実装**：腕の差分立ち絵が必要。pose 切替（アニメではなくフレーム差し替え）

### 2.10 `soft_laugh`
- **意味**：小さく笑う、肩が揺れる
- **使う場面**：軽い面白さ / 共犯的おかしさ
- **表情との相性**：`smile` / `teasing` / `gentle_smile`
- **CSS 実装**：肩 `translateY(0 → 2px → 0 → 2px → 0)` を 0.6 秒、表情は smile キープ

---

## 3. 表情 × モーションの推奨組み合わせ

| 表情 | 相性の良いモーション |
|---|---|
| `normal` | `idle` / `nod` |
| `smile` | `idle` / `soft_laugh` / `small_wave` |
| `gentle_smile` | `nod` / `close_eyes` / `lean_forward` |
| `teasing` | `tilt_head` / `arms_crossed` / `soft_laugh` |
| `surprised` | （急に動かない、idle のまま）|
| `thinking` | `tilt_head` / `look_away` |
| `sad` | `close_eyes` / `nod` / `lean_forward` |
| `serious` | `lean_forward` / `nod` |
| `embarrassed` | `look_away` |
| `sleepy` | `idle`（呼吸ゆっくり） |
| `excited` | `nod` / `soft_laugh` |
| `relieved` | `close_eyes` / `nod` |

---

## 4. CSS アニメの段階的実装方針

### 4.1 v0（mock）：transform のみ
- 立ち絵 1 枚 PNG に対して `transform` ベースで簡易動作
- `<LunariaPortrait>` コンポーネント側で `motion` prop に応じて class 切替
- 実装例：

```tsx
const motionClass: Record<string, string> = {
  idle: 'animate-breathe',
  nod: 'animate-nod',
  tilt_head: 'animate-tilt',
  // ...
}
```

### 4.2 v1（パーツ差分）：手 / 目だけ別レイヤー
- 立ち絵を「ボディ」「手」「目」のレイヤーに分ける
- 手だけ `small_wave`、目だけ `close_eyes` を独立に動かす
- 構造：`<div class="portrait"><img class="body" /><img class="eyes" /><img class="hand" /></div>`

### 4.3 v2（Live2D）：パーツ差分廃止
- Live2D Cubism モデルに置き換え
- モーション ID を Cubism のモーションファイルにマップ
- `motion` prop 入力 → Cubism Live2DCubismFramework モーション再生
- このフェーズは Codex 復帰 + Live2D モデル素材後

→ MVP は **v0**。発注予算 / Live2D タイムライン次第で v1 / v2 に進める。

---

## 5. モーション再生ルール（ガイドライン）

- **同時再生は 2 種まで**：`idle` 永続 + `nod` などのワンショット
- **ワンショットモーションの長さ**：0.5〜0.8 秒。長すぎると重い
- **連続再生は避ける**：`nod` を 5 連続させない（rate-limit を component 側で）
- **クールダウン**：同モーションを 1.5 秒以内に再発火しない
- **return-to-idle**：すべてのモーション終了後は `idle` に戻る

---

## 6. NG モーション運用

- 過剰モーション：1 秒に 2〜3 個切替（チラつき）
- 表情と矛盾：`sad` 中に `small_wave`、など
- 全モーションをガチャ獲得で `excited` + `nod` 連発（特別感が消える）
- `arms_crossed` を default にする（拗ね常駐は人格と合わない）

---

## 7. AI 返答 JSON との連動

`ASSISTANT_REPLY_SCHEMA.md` の `AssistantReply.motion` で本 ID を返す。

```json
{
  "message": "うん、聞いてるよ。",
  "expression": "gentle_smile",
  "motion": "nod"
}
```

motion が省略された場合、コンポーネント側は `expression` から推奨モーションを選ぶ（§3 表）。

---

## 8. 関連
- `LUNARIA_VISUAL_GUIDE.md`
- `CHARACTER_EXPRESSIONS.md`
- `ASSISTANT_REPLY_SCHEMA.md`
- `components/character/LunariaPortrait.tsx`（mock 実装）
