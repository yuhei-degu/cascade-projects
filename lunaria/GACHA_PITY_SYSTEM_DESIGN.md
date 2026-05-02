# ガチャ天井システム設計案

作成：2026-05-02  
目的：Lunaria の月箱ガチャに、長期未排出をやわらかく救済する天井システムを導入するための設計。  
範囲：設計のみ。DB migration・アプリコードは作成しない。

参照：
- `lunaria/NEXT_PHASE_CANDIDATES.md`
- `lunaria/PHASE_G_GACHA_DESIGN.md`
- `lunaria/MOONBOX_ITEM_GUIDELINES.md`
- `lunaria-app/supabase/migrations/009_gacha.sql`
- `lunaria-app/supabase/migrations/013_gacha_operational_hardening.sql`
- `lunaria-app/scripts/gacha-report.js`
- `lunaria-app/app/admin/gacha/page.tsx`

---

## 0. 結論

推奨は **100 連で urban_legend 確定**のハード天井。

ただし、UI では「天井」「確定」「救済」という語を出さず、Lunaria らしく **月が満ちる** 表現で見せる。

次の migration 番号候補：

- 月箱コンテンツ v2 を先に実装する場合：`014_gacha_content_v2.sql` → `015_gacha_pity_system.sql`
- 天井を先に実装する場合：`014_gacha_pity_system.sql`

現状の流れでは、コンテンツ v2 のレビューが先に進んでいるため、推奨は `015_gacha_pity_system.sql`。

---

## 1. 現在のガチャ構造

### 1.1 DB 構造

`009_gacha.sql` 時点で、ガチャは以下のテーブルで分離されている。

| table | 役割 | 天井との関係 |
|---|---|---|
| `lunaria_gacha_pool` | 排出物マスター。rarity / category / drop_weight / is_active を持つ | urban_legend の候補抽選に使う |
| `lunaria_gacha_tickets` | ユーザーのチケット数 | draw 前提条件。天井でも消費ルールは変えない |
| `lunaria_gacha_coins` | かぶり時のコイン残高 | 天井排出がかぶった場合も通常通り加算 |
| `lunaria_gacha_inventory` | 所持済みアイテム | かぶり判定に使う |
| `lunaria_gacha_history` | draw 履歴。pool_id / rarity / duplicate / coin を記録 | 天井判定・監査・運用レポートに使いたい |
| `lunaria_gacha_daily_bonus` | デイリーボーナス記録 | 影響なし |
| `lunaria_gacha_daily_quota` | 質スコア配布の 1 日上限 | 影響なし |

`013_gacha_operational_hardening.sql` で、`history.pool_id` / `inventory.pool_id` index と RPC search_path 固定は済み。

### 1.2 現在の抽選ロジック

`lib/lunaria/gacha.ts` の流れ：

1. `pickRarity()` で固定確率から rarity を選ぶ
2. `fetchPoolByRarity(rarity)` で active item を取得
3. `pickItemInRarity(items)` で rarity 内の `drop_weight` 抽選
4. `draw_gacha(p_user_id, p_pool_id, p_rarity)` RPC を呼ぶ
5. RPC 内でチケット消費、かぶり判定、inventory / coins / history 記録を 1 トランザクションで実行

現在の確率：

| rarity | probability |
|---|---:|
| common_a | 45% |
| common_b | 30% |
| rare_a | 14% |
| rare_b | 7% |
| epic | 3% |
| legendary | 0.9% |
| urban_legend | 0.1% |

### 1.3 現状の課題

urban_legend は 0.1%。通常の期待値では 1,000 連に 1 回。

1 日 5 回前後のペースだと、100 連は約 20 日。  
1,000 連は約 200 日。

つまり、天井なしでは「半年以上見ない」ことが普通に起きる。Lunaria のガチャは射幸心ではなく日々の贈り物なので、長期で何も起きない状態は避けたい。

---

## 2. DB 変更案

### 2.1 推奨：pity state テーブルを追加する

`gacha_history` から都度 count するより、ユーザー単位の状態テーブルを持つ方が安全。

追加候補：

```sql
create table if not exists public.lunaria_gacha_pity_state (
  user_id uuid primary key references public.lunaria_users(id) on delete cascade,
  draws_since_urban_legend integer not null default 0 check (draws_since_urban_legend >= 0),
  lifetime_draws integer not null default 0 check (lifetime_draws >= 0),
  last_urban_legend_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.lunaria_gacha_pity_state enable row level security;
```

用途：

- `draws_since_urban_legend`：天井判定用
- `lifetime_draws`：運用・admin 表示用
- `last_urban_legend_at`：直近 urban_legend の記録
- `updated_at`：監査用

### 2.2 history に監査カラムを追加する

天井が発動したかどうかは、後から追えるようにしておきたい。

追加候補：

```sql
alter table public.lunaria_gacha_history
  add column if not exists pity_before integer,
  add column if not exists pity_after integer,
  add column if not exists pity_triggered boolean not null default false;
```

理由：

- 「なぜこの draw が urban_legend だったか」を後から説明できる
- `gacha-report.js` や admin dashboard に発動回数を出せる
- 確率検証時に通常排出と天井排出を分けられる

### 2.3 RPC を拡張する

現在の `draw_gacha(uuid, uuid, text)` は、抽選結果を受け取って記録する。

天井導入時は、以下のどちらかが必要。

#### 案 A：RPC 引数を追加する

```sql
create or replace function public.draw_gacha(
  p_user_id uuid,
  p_pool_id uuid,
  p_rarity text,
  p_pity_before integer default null,
  p_pity_triggered boolean default false
)
returns table(...)
```

メリット：

- 既存 TS の抽選ロジックを大きく変えなくてよい
- history に pity 情報を書ける

デメリット：

- pity state の更新も TS 側と RPC 側で整合を取る必要がある
- 同時連打時の race condition を慎重に扱う必要がある

#### 案 B：新 RPC を作る

```sql
create or replace function public.draw_gacha_v2(
  p_user_id uuid,
  p_pool_id uuid,
  p_rarity text,
  p_pity_triggered boolean
)
returns table(...)
```

メリット：

- 既存関数を残せる
- 移行と rollback がしやすい

デメリット：

- アプリ側の呼び出し切替が必要
- 旧 RPC が残るため、どちらを正とするか運用ルールが必要

#### 推奨

`draw_gacha` の置き換えではなく、`draw_gacha_v2` を追加する。

理由：

- 既存 MVP を壊しにくい
- 天井の有効化をアプリ側で段階的に切り替えられる
- 失敗時に旧 RPC へ戻しやすい

### 2.4 可能なら状態更新は RPC 内に寄せる

理想は、以下を 1 トランザクションにまとめること。

1. チケット消費
2. かぶり判定
3. inventory / coins 更新
4. history 追加
5. pity_state 更新

抽選そのものは TS 側でよいが、`pity_before` と `pity_triggered` を受け取った後の状態更新は RPC 内に寄せたい。

同時クリック対策として、RPC 内で `lunaria_gacha_pity_state` の行を `for update` 相当に扱う設計が望ましい。

---

## 3. 推奨案：100 連で urban_legend 確定

### 3.1 仕様

- 通常時の rarity 確率は変更しない
- `draws_since_urban_legend >= 99` のとき、次の draw の rarity を `urban_legend` にする
- urban_legend が出たら、通常排出・天井排出に関わらず `draws_since_urban_legend = 0`
- urban_legend 以外なら `draws_since_urban_legend += 1`
- 天井で選ばれる item は、active な urban_legend の中から `drop_weight` で通常通り抽選する
- かぶりの場合も通常通り coin 変換する

「100 連目に urban_legend」ではなく、実装上は「直近 urban_legend から 99 回外れた状態で次を保証」と考える。

### 3.2 既存確率設計との衝突回避

通常の `RARITY_CUMULATIVE` はそのまま残す。

```ts
const pityTriggered = pity.draws_since_urban_legend >= 99
const rarity = pityTriggered ? 'urban_legend' : pickRarity()
```

これにより、99 回未満では既存確率と完全に同じ。  
天井時だけ rarity を上書きする。

重要：

- `drop_weight` は urban_legend 内で通常通り使う
- `is_active = true` のみ対象
- urban_legend pool が空なら既存と同じく fallback するが、本来は運用エラーとしてログを出す
- `pity_triggered` は response と history に残す

### 3.3 レスポンス追加案

`/api/gacha/draw` の response に以下を追加する。

```json
{
  "pity": {
    "draws_since_urban_legend": 37,
    "threshold": 100,
    "triggered": false
  }
}
```

UI はこの値をそのまま「天井」と表示しない。コピー変換レイヤーで Lunaria らしい表現にする。

### 3.4 admin / report 追加案

`gacha-report.js`：

- current pity count
- threshold
- last urban_legend date
- pity triggered count
- normal urban_legend count

`/admin/gacha`：

- `Moon fullness: 37/100`
- `Pity triggered draws: N`
- `Last urban legend: YYYY-MM-DD`

管理画面は内部用なので `pity` という語を使ってよい。

---

## 4. 代替案比較

### 4.1 代替案 A：70 連以降のソフト天井

仕様例：

- 70 連までは urban_legend 0.1%
- 71 連目以降、1 回ごとに urban_legend 確率を +0.05%
- 100 連で最大値または確定

メリット：

- 「近づいている」感が自然
- ハード天井よりも途中で出る可能性が増える
- 長期体験としては柔らかい

デメリット：

- 確率検証が難しい
- 既存の 0.1% 設計を実質的に変える
- ユーザーへ説明するとガチャ感・遊技機感が出やすい
- admin で通常排出と補正排出の区別が複雑

判定：保留。最初の天井としては複雑。

### 4.2 代替案 B：月の欠片ポイント交換

仕様例：

- urban_legend 以外の draw ごとに `moon_fragment` を 1 個付与
- 100 個で urban_legend 交換券、または特別な月箱を開けられる
- 交換時に active urban_legend から 1 件を抽選

メリット：

- ユーザーに進捗が見えやすい
- 「貯める」体験として前向き
- コインとは別の長期報酬軸を作れる

デメリット：

- コイン経済と役割が被る
- shop / exchange UI が必要
- 交換対象や所持済み重複時の仕様が増える
- 月箱が「贈り物」から「交換所」に寄りやすい

判定：v3 以降。コイン購入 MVP と一緒に考える方がよい。

### 4.3 代替案 C：月替わりの奥箱チケット

仕様例：

- 30 日ログインまたは 100 draw で「奥箱の鍵」を 1 個付与
- 鍵を使うと urban_legend 率が高い特別箱を 1 回開けられる

メリット：

- Lunaria らしい演出にしやすい
- 「天井」という機械感を避けられる
- 期間の物語を作れる

デメリット：

- 特別箱の別 pool / 別 API / 別 UI が必要
- 通常ガチャの未排出救済としてはやや間接的
- 仕様が大きくなる

判定：演出として魅力はあるが、MVP の天井には重い。

---

## 5. 推奨実装方針

### 5.1 段階導入

1. `lunaria_gacha_pity_state` と history 監査カラムを追加
2. 既存ユーザーの初期 state を作成
3. `draw_gacha_v2` を追加
4. TS 側で pity state を読み、rarity を決める
5. v2 RPC へ `pity_before` / `pity_triggered` を渡す
6. response に pity 情報を追加
7. UI は小さく進捗表示だけ入れる
8. `gacha-report.js` と admin dashboard に内部監視を追加

### 5.2 既存ユーザーの初期化

既存の `gacha_history` から、最後の urban_legend 以降の draw 数を計算して初期値にする。

ただし現状のユーザー数が少ないなら、初期導入時は以下でもよい。

- 既存ユーザー：`draws_since_urban_legend = least(既存履歴数, 99)`
- 履歴なし：0

厳密な backfill SQL は migration 実装時に作る。

### 5.3 同時 draw 対策

天井 state は race condition の影響を受けやすい。

最低限：

- UI 側で draw ボタン連打を disabled
- API 側で 1 request ずつ処理される前提にしない
- RPC 内で pity_state 更新を一緒に行う
- 可能なら `insert ... on conflict ... returning` と row lock を使う

同時 draw が起きた場合でも、チケット消費・履歴・pity count が二重にズレないことを受け入れ条件にする。

---

## 6. UX 文言案

### 6.1 表示名

内部名は `pity` でよいが、UI では使わない。

| internal | UI copy |
|---|---|
| pity | 月の満ち具合 |
| threshold | 月が満ちるまで |
| pity triggered | 奥の箱がひらいた |
| draws since urban legend | 月明かりのしずく |

### 6.2 通常表示

短く、押しつけない。

- `月が満ちるまで 37/100`
- `奥の棚まで、あと少し`
- `月明かりが少しずつ溜まっている`
- `今夜の箱は、静かに光っている`

### 6.3 80 回以降の表示

煽らず、近づいている気配だけ出す。

- `奥の棚が、少し明るい`
- `月箱の奥から、かすかな音がした`
- `今日は、箱の底がいつもより深く見える`

### 6.4 発動時の表示

「確定」「保証」は使わない。

- `月が満ちた。今日は奥の箱まで手が届く`
- `ずっと開かなかった棚が、静かにこちらを向いた`
- `ルナ、こういう夜は覚えておくタイプ`
- `今日は、月箱が少しだけ本気を出した`

### 6.5 禁止語

UI / reaction / prompt では使わない。

- 天井
- 確定
- 保証
- 救済
- 爆死
- 神引き
- 激熱
- 当たり
- 100連目

内部コード・admin・設計書では `pity` / `threshold` を使ってよい。

---

## 7. テスト観点

### 7.1 DB / RPC

- pity state が存在しないユーザーでも draw できる
- 99 回 non-urban の状態で次 draw が urban_legend になる
- urban_legend 後に `draws_since_urban_legend = 0`
- non-urban 後に `draws_since_urban_legend += 1`
- `pity_triggered` が history に記録される
- duplicate 時も coin 変換が従来通り動く
- ticket がない場合は pity state が変化しない

### 7.2 確率

- 99 回未満では既存の `RARITY_CUMULATIVE` と同じ
- 天井発動時だけ rarity が上書きされる
- urban_legend 内の item 選択は `drop_weight` 通り
- `is_active=false` の item は選ばれない

### 7.3 UI

- 通常時は小さな進捗として表示される
- 発動時もパチンコ的演出にならない
- チケットなし時に進捗だけが過度に煽らない
- result modal の Luna reaction と衝突しない

### 7.4 運用

- `gacha-report.js` で pity state が読める
- admin dashboard で現在値と発動回数が見える
- production self-check は、pity table の存在確認を追加できる

---

## 8. ロールバック方針

天井はデータを持つため、即 drop はしない。

推奨 rollback：

1. アプリ側で pity 判定を無効化
2. `draw_gacha_v2` の呼び出しを旧 `draw_gacha` に戻す
3. `lunaria_gacha_pity_state` と history カラムは残す
4. 運用確認後、必要なら後続 migration で drop を検討

データを残しておけば、再導入時に進捗を復元できる。

---

## 9. 最終提案

最初の実装は、以下で進める。

- 方式：100 連 hard pity
- UI 表現：月が満ちる / 奥の箱がひらく
- DB：`lunaria_gacha_pity_state` 追加 + `lunaria_gacha_history` に監査カラム追加
- RPC：`draw_gacha_v2` を追加し、旧 RPC は残す
- 確率：99 回未満は既存確率を維持。100 回目だけ urban_legend に上書き
- migration 番号：コンテンツ v2 後なら `015_gacha_pity_system.sql`

Lunaria の思想としては、「たくさん回したから報われる」よりも「月が少しずつ満ちて、いつか奥の箱まで届く」の方が合う。  
実装は堅く、見せ方は静かにするのがよい。
