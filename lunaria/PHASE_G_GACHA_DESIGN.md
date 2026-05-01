# Phase G：ガチャ機能 技術設計書

作成：2026-04-28
仕様凍結バージョン：v5（指輪 / 天井は後続検討）

---

## 1. 哲学

ガチャは Lunaria の**サブ機能**。あくまで「会話・関係性」が主軸。
- ガチャで強くなることは無い（ステータス影響ゼロ）
- 排出物は「家具・小物・アクセサリー」など **見た目・コレクション要素のみ**
- 関係性深化（会話・感情・memory）とは**完全に独立**
- 演出は「贈り物」感覚を基調（パチンコ的依存装置にしない）

「日常の小さなドキドキ供給装置」が立ち位置。

---

## 2. 仕様 v5（凍結）

### 2.1 チケット
- デイリーボーナス + 質スコア配布で **1 日 5 回程度引ける**ペース
- 上限 50 枚、期限なし
- 質スコア配布：score 1-2 は 5%、3-4 は 15%、5+ は 30%
- 1 日上限 5 枚（無限累積防止）

### 2.2 確率テーブル（合計 100%）

| レアリティ | 確率 | 内容 | コイン変換レート |
|---|---|---|---|
| common_a | 45% | ささやかな家具・小物 | 10 |
| common_b | 30% | ふつうのアクセサリー | 15 |
| rare_a | 14% | レア家具 | 50 |
| rare_b | 7% | レアアクセサリー | 80 |
| epic | 3% | 上位レア | 200 |
| legendary | 0.9% | 最高レア | 500 |
| urban_legend | 0.1% | 都市伝説枠（5〜10 種シャッフル） | 2000 |

**ネーミング指針**：「安そう」のような価値を毀損する名称を避け、中性的な「ささやか」「ふつう」を使う。

### 2.3 都市伝説枠
- 0.1% は **複数アイテム（5〜10 種）でシャッフル**：指輪、満月の鈴、千束のコート、星の砂時計、宇宙猫等
- 個々の出現率は 0.01〜0.02% 帯
- ユーザー間で互いに違う体験を持てる → コミュニティで永続的に話題が再生産される

### 2.4 かぶり処理
- 既に所持しているアイテムが排出 → **コインに変換**（レアリティ別レート）
- コインで「ガチャ排出物の色違いバリエーション」を購入可能（MVP）
- Phase H 以降で「コイン専用ライン」を追加検討

### 2.5 演出
- MVP：5 秒の短縮演出（運勢色 → カットイン色）
- Phase H：フル演出（4 段階・40〜60 秒、テーマは宝くじ・遺跡発掘等）
- 設定で「フル演出 ON/OFF」切替可能（レア確定時は自動 ON）

### 2.6 後続検討（v5 では未確定）
- 天井（500 連で urban_legend 確定など）
- 指輪のキャラリアクション（プロポーズ的メタファーをどう扱うか）
- フル演出の実素材

### 2.7 ガチャリアクション（外部レビュー反映、v5+ で追加）

ガチャ結果に対してルナが**取得直後だけ** 1〜2 文の短いリアクションを返す。Lunaria のコアバリュー（キャラクター体験）とガチャを統合するための機能。

**厳格な制約**：
- 通常会話プロンプト（`buildNormalPrompt` / `buildSeriousPrompt`）には**一切注入しない**
- `lunaria_core_memory` / `lunaria_user_profile` には**絶対に保存しない**
- 会話履歴（`lunaria_messages`）にも残さない（文脈汚染防止）
- ガチャモーダル表示時のみ、メモリ上で扱う「受け取り演出」

**実装**：
- `lib/lunaria/gacha-reaction.ts`：専用の超軽量プロンプト
- `/api/gacha/draw` のレスポンスに `reaction: string` を追加
- 既存の `prompt-builder.ts` は使わず、独立した micro-prompt
- LLM 失敗時はレアリティ別の静的フォールバック

**プロンプト構造**：
- アイデンティティ核（4 行、千束テンポ、タメ口）
- アイテム情報（name / category / rarity / description / wasDuplicate / coinEarned）
- レアリティ別トーン指針（common = 軽め、urban_legend = 驚愕＋話題性）
- ルール（1〜2 文・60 文字以内・質問禁止・媚び禁止）

**コスト**：
- 1 ガチャあたり 入力 200 トークン + 出力 30〜80 トークン
- 月 150 連で約 1 円/ユーザー（許容範囲）

### 2.8 「DB 分離」と「ロジック分離」の関係（外部レビュー反映の明文化）

- DB は `lunaria_gacha_*` プレフィックスで分けている → これは**念のための副次的措置**
- 本質的な責務分離は**ロジックレイヤー**で実現：
  - `prompt-builder.ts` は `profile` / `core_memory` のみ参照
  - `gacha_*` テーブルには一切触れない（読み込まないし、書き込まない）
  - ガチャ処理は `/api/gacha/*` 経路のみで完結
- 現実装は既にこの責務分離が成立している。設計の意図を本書で明文化

---

## 3. データモデル

### 3.1 マイグレーション：`supabase/migrations/009_gacha.sql` + `010_gacha_seed.sql`

実装メモ（2026-04-28）：
- 既存の規約に合わせて全テーブルを `lunaria_gacha_*` prefix に統一
- `user_id` は `uuid references lunaria_users(id) on delete cascade`（既存テーブルと整合）
- `draw_gacha` RPC + `grant_gacha_ticket` RPC を SQL 関数として用意

```sql
-- ガチャ排出物カタログ（マスターテーブル）
CREATE TABLE gacha_pool (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  rarity        TEXT NOT NULL CHECK (rarity IN (
    'common_a','common_b','rare_a','rare_b','epic','legendary','urban_legend'
  )),
  category      TEXT NOT NULL CHECK (category IN (
    'furniture','small_item','accessory','urban_legend'
  )),
  drop_weight   NUMERIC NOT NULL,         -- レアリティ内での重み（均等なら 1）
  image_url     TEXT,                      -- 後で素材できたら埋める
  description   TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gacha_pool_rarity ON gacha_pool(rarity) WHERE is_active = true;

-- ユーザーのチケット数
CREATE TABLE gacha_tickets (
  user_id     TEXT PRIMARY KEY,           -- 'default'（単一ユーザー前提）
  count       INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0 AND count <= 50),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ユーザーのコイン残高
CREATE TABLE gacha_coins (
  user_id     TEXT PRIMARY KEY,
  balance     INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ユーザーのインベントリ（所持品）
-- かぶりはここに記録されない（コイン化される）
CREATE TABLE gacha_inventory (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL,
  pool_id       UUID NOT NULL REFERENCES gacha_pool(id),
  acquired_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, pool_id)
);

CREATE INDEX idx_gacha_inventory_user ON gacha_inventory(user_id);

-- ガチャ履歴（演出再現・統計・デバッグ用）
CREATE TABLE gacha_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  pool_id         UUID NOT NULL REFERENCES gacha_pool(id),
  rarity          TEXT NOT NULL,
  was_duplicate   BOOLEAN NOT NULL,
  coin_earned     INTEGER NOT NULL DEFAULT 0,
  pulled_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gacha_history_user_time ON gacha_history(user_id, pulled_at DESC);

-- デイリーボーナス記録（チケット二重配布防止）
CREATE TABLE gacha_daily_bonus (
  user_id      TEXT NOT NULL,
  given_date   DATE NOT NULL,
  PRIMARY KEY (user_id, given_date)
);

-- 1 日のチケット獲得上限管理（質スコア配布の累積カウンタ）
CREATE TABLE gacha_daily_quota (
  user_id      TEXT NOT NULL,
  given_date   DATE NOT NULL,
  earned_today INTEGER NOT NULL DEFAULT 0 CHECK (earned_today <= 5),
  PRIMARY KEY (user_id, given_date)
);
```

### 3.2 既存テーブルとの分離方針

- `lunaria_core_memory` / `lunaria_user_profile` とは**完全独立**
- ガチャ排出物は LLM プロンプトに**注入しない**（MVP）
- 関係性深化への影響なし（哲学整合）

---

## 4. RNG ロジック

### 4.1 抽選アルゴリズム

```ts
// lib/gacha/draw.ts
import { randomBytes } from 'crypto'

// 暗号論的安全な乱数 [0, 1)
function secureRandom(): number {
  const buf = randomBytes(4)
  return buf.readUInt32BE(0) / 0x100000000
}

const RARITY_WEIGHTS: { rarity: string; cumulative: number }[] = [
  { rarity: 'common_a',     cumulative: 0.45 },
  { rarity: 'common_b',     cumulative: 0.75 },
  { rarity: 'rare_a',       cumulative: 0.89 },
  { rarity: 'rare_b',       cumulative: 0.96 },
  { rarity: 'epic',         cumulative: 0.99 },
  { rarity: 'legendary',    cumulative: 0.999 },
  { rarity: 'urban_legend', cumulative: 1.0 },
]

function pickRarity(): string {
  const r = secureRandom()
  return RARITY_WEIGHTS.find(w => r < w.cumulative)!.rarity
}

async function pickItemInRarity(rarity: string): Promise<PoolItem> {
  const items = await fetchPoolByRarity(rarity)  // is_active = true のみ
  const totalWeight = items.reduce((s, i) => s + i.drop_weight, 0)
  let r = secureRandom() * totalWeight
  for (const item of items) {
    r -= item.drop_weight
    if (r <= 0) return item
  }
  return items[items.length - 1]
}
```

### 4.2 ガチャ実行フロー

```
1. チケット数チェック（>= 1）
2. チケット -1（楽観ロック：UPDATE ... WHERE count >= 1 AND updated_at = ?）
3. レアリティ抽選（pickRarity）
4. レアリティ内アイテム抽選（pickItemInRarity）
5. 既存所持判定（gacha_inventory に user_id, pool_id があるか）
6a. 新規 → gacha_inventory に追加
6b. かぶり → gacha_coins.balance にレアリティ別コイン加算
7. gacha_history に結果を記録
8. 結果を返却（演出に必要な情報を含む）
```

トランザクションは Supabase の RPC（PL/pgSQL 関数）でまとめると安全。

### 4.3 RPC 関数（参考）

```sql
CREATE OR REPLACE FUNCTION draw_gacha(p_user_id TEXT, p_pool_id UUID, p_rarity TEXT)
RETURNS TABLE(was_duplicate BOOLEAN, coin_earned INTEGER) AS $$
DECLARE
  v_existing UUID;
  v_coin INTEGER;
BEGIN
  -- チケット消費
  UPDATE gacha_tickets SET count = count - 1, updated_at = NOW()
    WHERE user_id = p_user_id AND count >= 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'no_ticket';
  END IF;

  -- 既存所持判定
  SELECT id INTO v_existing FROM gacha_inventory
    WHERE user_id = p_user_id AND pool_id = p_pool_id;

  IF v_existing IS NULL THEN
    INSERT INTO gacha_inventory(user_id, pool_id) VALUES (p_user_id, p_pool_id);
    v_coin := 0;
  ELSE
    v_coin := CASE p_rarity
      WHEN 'common_a' THEN 10
      WHEN 'common_b' THEN 15
      WHEN 'rare_a' THEN 50
      WHEN 'rare_b' THEN 80
      WHEN 'epic' THEN 200
      WHEN 'legendary' THEN 500
      WHEN 'urban_legend' THEN 2000
    END;
    INSERT INTO gacha_coins(user_id, balance) VALUES (p_user_id, v_coin)
      ON CONFLICT (user_id) DO UPDATE SET balance = gacha_coins.balance + v_coin, updated_at = NOW();
  END IF;

  INSERT INTO gacha_history(user_id, pool_id, rarity, was_duplicate, coin_earned)
    VALUES (p_user_id, p_pool_id, p_rarity, v_existing IS NOT NULL, v_coin);

  RETURN QUERY SELECT v_existing IS NOT NULL, v_coin;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. API エンドポイント

| メソッド | パス | 用途 |
|---|---|---|
| POST | `/api/gacha/draw` | ガチャ 1 連実行（チケット 1 消費） |
| GET  | `/api/gacha/state` | チケット数・コイン残高・本日獲得済みチケット数 |
| GET  | `/api/gacha/inventory` | 所持品一覧（カテゴリ別ソート可） |
| GET  | `/api/gacha/pool` | 排出物カタログ（公開可能なもののみ） |
| POST | `/api/gacha/daily` | デイリーボーナス受取（1 日 1 回） |

### 5.1 `/api/gacha/draw` レスポンス例

```json
{
  "result": {
    "pool_id": "uuid",
    "name": "やわらかいクッション",
    "rarity": "common_a",
    "category": "furniture",
    "image_url": "/img/gacha/cushion.png",
    "description": "ふわふわで居心地いい"
  },
  "was_duplicate": true,
  "coin_earned": 10,
  "ticket_remaining": 4,
  "coin_balance": 130,
  "production_seed": 12345
}
```

`production_seed` は演出の段階決定（運勢色・天気・カットイン色）に使う。クライアントが seed から決定論的に演出シーケンスを構築。

---

## 6. チケット獲得を `/api/chat` に統合

### 6.1 配布ロジック

`/api/chat` の応答 `done` イベント送出**前**に：

```ts
const dailyQuota = await getDailyQuota(today)
if (dailyQuota.earned_today < 5) {
  const score = route.msgScore  // routing.ts が既に計算
  const probability =
    score >= 5 ? 0.30 :
    score >= 3 ? 0.15 :
    0.05
  if (Math.random() < probability) {
    await incrementTicket(1)
    await incrementDailyQuota()
    ticketEarned = true
  }
}
```

### 6.2 stream `done` イベントへの追加

```json
{
  "type": "done",
  "data": {
    "reply": "...",
    "routeType": "...",
    "ticketEarned": true,
    "ticketTotal": 7
  }
}
```

クライアントは `ticketEarned=true` 時にトースト通知（「ガチャ券もらった！」）を出す。

### 6.3 デイリーボーナス

ユーザーが `/api/gacha/daily` を叩いた時に処理：

```ts
const today = new Date().toISOString().slice(0, 10)
const exists = await checkDailyBonus(today)
if (exists) return { error: 'already_claimed' }
await incrementTicket(1)
await markDailyBonusGiven(today)
```

ホーム画面にボタン配置、未受取なら通知バッジ。

---

## 7. UI コンポーネント

### 7.1 ガチャ画面（`/gacha`）

```
[ガチャ]
チケット：5/50
コイン：130

[1 連引く] ← クリックで /api/gacha/draw

[結果モーダル]
- 5 秒短縮演出（運勢色 → カットイン色 → 排出）
- 排出アイテム表示（画像 / 名前 / レアリティ）
- かぶり時：「コイン +10」表示
```

### 7.2 インベントリ画面（`/gacha/inventory`）

```
[コレクション]
カテゴリ：[家具] [小物] [アクセサリー] [都市伝説]

家具（27 / ?）
[画像] やわらかいクッション
[画像] 木の椅子
...
```

### 7.3 演出（MVP）

5 秒の段階演出、CSS アニメーション + 静止画：

1. 運勢色（赤 / 黄 / 青 / 緑、レアリティに応じた重み付け）：1.5 秒
2. カットイン色（金 / 銀 / 銅）：1.5 秒
3. アイテム登場：2 秒

`production_seed` から決定論的に色を選ぶことで、サーバ側演算と整合。

---

## 8. 実装順序

1. **設計書**（この文書）— 完了
2. **DB マイグレーション**：`supabase/migrations/009_gacha.sql` 作成・適用 ✅
3. **シードデータ投入**：`supabase/migrations/010_gacha_seed.sql`（25 アイテム） ✅
4. **`lib/gacha/draw.ts`**：RNG ロジック、Supabase RPC 呼び出し
5. **`/api/gacha/*`**：5 エンドポイント実装
6. **ガチャ画面 UI**（`app/gacha/page.tsx`）：最小 UI + 5 秒演出
7. **インベントリ画面 UI**（`app/gacha/inventory/page.tsx`）
8. **`/api/chat` 統合**：チケット獲得ロジック追加・stream `done` 拡張
9. **動作確認**：プレースホルダーで E2E

各段階で動作確認を挟む。

---

## 9. テスト項目

- 確率分布の統計テスト（10000 回 draw して各レアリティの実出現率を確認）
- かぶり処理の正確性（同じ pool_id を 2 回当てる → 2 回目はコイン変換）
- チケット消費の楽観ロック（同時リクエスト下で重複消費が起きないか）
- デイリーボーナスの重複防止（同じ日に 2 回叩いても 1 回だけ）
- 1 日チケット獲得上限の遵守（6 枚目以降は配布されないか）
- インベントリ表示のカテゴリ別ソート

---

## 10. 工数見積（粗い）

| 項目 | 工数 |
|---|---|
| DB マイグレーション + シード | 0.5 日 |
| draw.ts + RPC 関数 | 1 日 |
| API エンドポイント 5 本 | 1 日 |
| ガチャ画面 UI + 演出 | 1.5 日 |
| インベントリ画面 UI | 0.5 日 |
| /api/chat 統合 | 0.5 日 |
| 動作確認・テスト | 1 日 |
| **合計** | **6 日**（プレースホルダー素材で動作する MVP まで） |

実素材投入は別軸（悠平側のアート作業と並行）。
