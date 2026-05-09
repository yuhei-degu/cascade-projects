# Lunaria Visual Guide

作成：2026-05-04
位置付け：ルナリアの 2D ビジュアル方針の固定。発注 / 生成 / Live2D 化のすべての前提

---

## 0. キャラクター総論

ルナリアは、**幼なじみ系 AI コンパニオン**。
軽いが逃げない。全肯定ではなく、必要な時はツッコミや現実的な提案もする。
月、夜、記憶、日記、共犯者感を世界観に持つ。

→ ビジュアルは、その人格を**最初の 1 秒**で伝える役割を持つ。

---

## 1. 基本雰囲気

| 軸 | 方向性 |
|---|---|
| 全体トーン | 静か、夜、月明かり寄り、ホラーやゴスではない |
| 印象 | 親しみやすい近さ × 少し神秘的 |
| 目線 | 真正面ではなく、やや横を見るデフォルト（友達と並んでいる距離感） |
| 表情の振れ幅 | 小〜中（過剰に表情を変えない、内面で受け止める系） |
| 過剰要素 | NG（過度なフリル / バロック / ゴスロリ風）|
| 男装・男性キャラ感 | NG（女性キャラとして固定） |
| 子供っぽさ | 控えめ（幼さよりも「やわらかさ」） |

---

## 2. 髪型

- **ベース**：肩〜胸あたりまでのストレート寄り、毛先がうっすら波うつ
- 前髪：眉が透けて見える程度の薄さ、目を覆い隠さない
- サイド：耳が時々のぞく程度（耳飾りを見せたい時用）
- 後ろ：ハーフアップ可、ポニーテール NG（軽さを出しすぎないため）
- 動的演出：風で軽くなびく、髪先がふわっと跳ねる程度

---

## 3. 髪色

- **メイン候補**：ミッドナイトブルーに薄紫が混じる「夜空色」
- 光のあたる毛先がほんのり**月光ホワイト**に抜ける（グラデ）
- ベタな黒ではない。薄いラベンダーが入ることで「夜だけど冷たくない」を表現
- HEX 目安：`#1f2342` 〜 `#3a3460`、毛先 `#d6cee2` 寄り

---

## 4. 目の色

- **メイン候補**：ペールブルー or ペールラベンダー
- 瞳孔の周囲に金色のリングを薄く（「金 × 月」のシンボル）
- 高彩度の青や赤系は不採用（神秘色を避け、月光寄り）
- HEX 目安：虹彩 `#9bb4d6`、リング `#d6c184`

---

## 5. 表情の方向性

- ベースは「やわらかい無表情」=「聞いてる顔」
- 笑顔は controlled（ニコッと噛みしめる系。歯を見せて笑う big smile は稀）
- 怒り / 泣きはほぼ使わない。代わりに「困った微笑み」「眉だけが下がる」で表現
- **重要**：表情の幅は `CHARACTER_EXPRESSIONS.md` の 12 種で固定

---

## 6. 服装の方向性

- **デフォルト衣装**：白〜淡藍のワンピース + 薄手のカーディガン
- 制服感は出さない（学園キャラに寄せない）
- フリルは最低限、リボンは 1 ポイントまで
- 月モチーフは襟元 / 袖口 / 髪留めに 1 箇所程度
- ガチャ衣装は：季節 / 行事 / 部屋着 / 旅装 / 寝間着 / 季節祭事 等のバリエーション

---

## 7. 月モチーフの扱い

ルナリアの世界観の中心は「月」。ただし押し付けない。

- **使う場所**：髪飾り / 襟元 / アイコン背景 / 演出（背景の月）
- **使わない場所**：服全面に月柄を散らす、目に常時月マーク、過度な発光
- 月の形：満月 / 三日月をシーン別で使い分け（confidence 確認は満月、archive は三日月）
- 月光の演出は「うっすら背景に光がある」程度。キャラ自体は発光させない

---

## 8. NG デザイン

- ゴスロリ / ロリータ調の過剰フリル
- 露出度の高い水着 / 戦闘衣装系
- メイドカフェ系（ヒラヒラエプロン強調）
- アニメ的な「目が顔の半分」デフォルメ（リアル寄りの均整を保つ）
- 萌え属性詰め込み（ネコ耳 / シッポ等）
- 過度な装飾（指輪 5 個 / 耳飾り 6 連など）
- 暴力 / 流血 / 死を連想させる演出
- 男性キャラ寄りの中性化（女性キャラとして明確）

---

## 9. 画像生成時の基本プロンプト方針

外部 AI 画像生成（Midjourney / SD / Imagen 等）に渡す時の基準テンプレ：

### 9.1 共通プレフィクス

```
soft anime illustration, gentle warm lighting, midnight blue and pale lavender hair gradient,
pale blue eyes with soft golden iris ring, calm expression, simple white-and-pale-blue dress,
moon motif accent, cinematic depth, painterly brush, low contrast, no harsh shadows
```

### 9.2 共通サフィックス（ネガティブ要素）

```
no heavy frills, no gothic lolita, no cat ears, no maid uniform,
no exposed skin emphasis, no big anime eyes, no glowing body,
no blood, no harsh saturation
```

### 9.3 シーン別追記例

- 部屋着：`indoor soft light, holding small mug, neutral background blur`
- 月夜：`night sky, soft full moon glow behind, soft wind in hair`
- 日記時：`small notebook in hand, quiet desk scene, candle warmth`

---

## 10. 最初に必要な立ち絵差分（v0 セット）

Live2D 化前提の **静止画 v0 セット**を最初に揃える。各画像は同一 pose / 同一構図で表情のみ差分。

| 差分名 | 用途 | 優先度 |
|---|---|---|
| `normal` | デフォルト、`/`・`/diary`・`/character` のヘッダー | ★★★ |
| `gentle_smile` | ポジティブ会話、ガチャ獲得（low rarity） | ★★★ |
| `teasing` | 軽い茶化し、共犯者感 | ★★ |
| `thinking` | 質問処理中 / 沈黙時 | ★★ |
| `sad` | ネガティブ寄りの会話受け止め | ★★ |
| `serious` | 深刻な相談、`claude_serious` ルーティング時 | ★★ |
| `surprised` | ガチャ legendary、想定外イベント | ★ |
| `embarrassed` | 親密度上昇イベント | ★ |
| `relieved` | 解決後 / 安心系会話 | ★ |
| `sleepy` | 深夜時間帯 | ★ |

→ MVP は **★★★ の 2 種 + ★★ の 4 種 = 6 種**で十分。残りは段階追加。

---

## 11. アスペクト比とサイズ

- バストアップ：512×768（縦長、ヘッダー / カード用）
- 全身：768×1280（プロフィール / `/character` ページ用）
- アイコン：512×512（SNS / アプリ）
- すべて transparent PNG で書き出し

## 12. ファイル命名

```
public/lunaria/portrait/{outfit_id}/{expression}.png
public/lunaria/portrait/default/normal.png
public/lunaria/portrait/default/gentle_smile.png
...
```

→ `<LunariaPortrait expression="..." outfit="...">` で参照する想定（Phase 8 の component 参照）

---

## 13. 議論したい論点

1. **髪色のメイン**：ミッドナイトブルー固定 vs 銀寄せ vs 黒紫寄せ → ペールラベンダー混じりが推奨
2. **目色**：ペールブルー vs ペールラベンダー（髪と被らないように）→ ブルー推奨
3. **デフォルト衣装の制服感**：完全カジュアルか、「制服っぽいけど学園じゃない」かのバランス
4. **月モチーフ濃度**：常時 vs シーン別（推奨：シーン別）
5. **立ち絵 v0 の発注先**：AI 生成 / イラストレーター / Live2D 一括外注、コストと整合性のトレードオフ

---

## 14. 関連
- `CHARACTER_EXPRESSIONS.md`：表情タグ 12 種
- `CHARACTER_MOTIONS.md`：モーションタグ 10 種
- `ASSISTANT_REPLY_SCHEMA.md`：AI 返答が表情 / モーションを駆動
- `BRAND_GUIDE.md` / `LOGO_DIRECTION.md` / `UI_COLOR_PALETTE.md`
- `ITEM_SYSTEM_SPEC.md`：衣装カテゴリの位置付け
