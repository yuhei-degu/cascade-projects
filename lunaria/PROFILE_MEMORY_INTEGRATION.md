# プロフィール × コアメモリ 統合設計 v2

作成：2026-04-18
対象：`lunaria_user_profile` と `lunaria_core_memory` の役割重複の整理
改訂：Phase A 実測でスキーマ構造が v1 前提と大きく異なることが判明したため、v2 に全面差し替え（v1 の supersede フラグ案は破棄）
ステータス：**Phase A〜F 完了（2026-04-23）**。実装適用・検証・片付けまで終了。詳細は `PROGRESS.md` 4/23 セクションおよび `implementation/applied/2026-04-18/` 配下の監査ログ参照

---

## 1. 結論サマリ

- **スキーマ変更はゼロ**。既存の `memory_category='profile'` マーカーが既に分離用として機能している。
- **コード2ファイルの修正だけ**で済む：
  - `lib/lunaria/memory.ts`：core_memory 取得時に `memory_category='profile'` を除外
  - `lib/lunaria/extract.ts`：抽出時に profile 相当情報を user_profile 経路へ振り分け、core_memory に流さない
- **データクリーンアップは2行**。SQL 1本で手動実行（`cleanup_profile_duplicates.sql`）。
- pending/archive は既存テーブル（`lunaria_pending_profile_updates` / `lunaria_profile_archive`）に乗るだけ。

v1 で想定していた「supersede フラグ追加」「archived jsonb 追加」「user_profile に列追加」「RPC 新設」は**すべて破棄**。

---

## 2. Phase A で判明した実スキーマ

### 2.1 `lunaria_user_profile`（EAV モデル）

```
(id, user_id, field, value, source, created_at, updated_at)
```

属性は行として格納：

```
field='gender',     value='男性',         source='setting'
field='occupation', value='ITエンジニア・SES', source='setting'
```

→ wide columns ではない。新属性の追加は INSERT だけで済む。

### 2.2 `lunaria_pending_profile_updates`（既存）

```
(id, user_id, field, detected_value, trigger_message, created_at)
```

矛盾検出時にここへ INSERT。確定 or 却下で DELETE する運用（status 列なし）。`trigger_message` に元発話を保持するため UX が良い。

### 2.3 `lunaria_profile_archive`（既存）

```
(id, user_id, field, old_value, new_value, archived_at)
```

属性変更時に old→new を記録。`archived jsonb` を user_profile に追加する必要はない。

### 2.4 `lunaria_core_memory`（既存）

```
(id, user_id, type, content, score, hit_count, last_seen, created_at,
 memory_key, memory_category, updated_at)
```

重要な点：

- 本文列は `content`（`text` ではない）
- 重要度は `score`、参照時刻は `last_seen`
- **`memory_category='profile'` が既にプロフィール相当情報のマーカーとして使われている**
- `type` 値域は `pattern` / `goal` / `name` / `value`（全11件で分布を確認済み）

### 2.5 `lunaria_preferences`（既存・空）

```
(id, user_id, category, key, value, confidence, source, updated_at)
```

嗜好を確信度付きで別管理する用途。現状は 0 件だが、将来的に「好き嫌い」を core_memory から分離する先として使える。今回のスコープでは扱わない。

---

## 3. 実測で見つかった重複の具体例

```
lunaria_user_profile: field='gender',  value='男性'
lunaria_core_memory:  memory_category='profile', memory_key='user_gender',
                      content='ユーザーの性別: 男性'
```

これが PROGRESS.md 4/12 に記載されていた「性別情報の二重管理」の実体。もう1件、`memory_key='user_name', content='悠平'` も core_memory にあるが、user_profile 側に `name` field は未登録。→ 後者は user_profile に移送、前者は削除するだけで解消する。

---

## 4. 設計

### 4.1 レイヤ定義

| 層 | 扱う情報 | テーブル | プロンプト注入 |
|---|---|---|---|
| **user_profile (EAV)** | 安定的属性：gender / occupation / name / age_band / user_nickname / lifestyle_pattern 等 | `lunaria_user_profile` | 全ルートで常時、1 行サマリ |
| **pending** | 矛盾検出結果の確認キュー | `lunaria_pending_profile_updates` | 注入しない。会話で確認質問として表出 |
| **archive** | 属性変更の履歴 | `lunaria_profile_archive` | 注入しない |
| **preferences** | 嗜好（将来） | `lunaria_preferences` | 未使用 |
| **core_memory** | エピソード・パターン・価値観 | `lunaria_core_memory`（`memory_category != 'profile'`） | `claude_serious` 時のみ、最大 1 件 |

### 4.2 プロンプト 5 層構造（v1 と同じ）

```
[Identity]   LUNARIA_CORE_IDENTITY
[State]      state-summary.ts
[Profile]    user_profile (EAV) から 1 行サマリ（★新設・全ルート）
[Memories]   core_memory で memory_category != 'profile' のもの（claude_serious のみ・1 件）
[Rules]      会話ルール
```

### 4.3 書き込み経路（単一入口）

```
session messages
   │
   ├─ [会話中の明示宣言] ──▶ profile.ts
   │                          - 既存 field 値と比較 → 矛盾なら
   │                            lunaria_pending_profile_updates に INSERT
   │                          - 次ターンで trigger_message を引いて確認
   │                          - 確定時：user_profile を UPDATE、
   │                            profile_archive に old/new を INSERT、
   │                            pending 行を DELETE
   │
   └─ [セッション終了時 extraction] ──▶ extract.ts
                                         │
                                         ├─ profile_updates[] ──▶ pending_profile_updates
                                         │   （次回起動で確認）
                                         │
                                         └─ memory_candidates[] ──▶ core_memory
                                             - ガードレール：profile 相当の情報は
                                               core_memory に流さない（memory_category='profile' も付けない）
```

**ガードレール**：抽出プロンプトで「gender / occupation / name / age_band の単純言及は memory_candidates に含めず、profile_updates に出せ」と明示する。

### 4.4 読み出し経路（プロンプト注入）

```
buildProfileSummary(userId):
  SELECT field, value FROM lunaria_user_profile WHERE user_id=? AND source='setting'
  → Map に詰めて 1 行サマリを組み立てる
  → 例：「【相手について】男性・ITエンジニア・SES。ルナのことは「ルナ」と呼ぶ。」

pickMemories(userId, limit):
  SELECT ... FROM lunaria_core_memory
   WHERE user_id=?
     AND (memory_category IS NULL OR memory_category <> 'profile')  -- ★これだけ
   ORDER BY score DESC, last_seen ASC NULLS FIRST
   LIMIT limit
```

v1 にあった「Profile キーワードで substring マッチして除外」というクライアント側フィルタは**不要**になった。既存マーカーで一発。

### 4.5 矛盾時の真実権限

- Profile 優先（従来通り）
- 矛盾を検知したら `lunaria_pending_profile_updates` に積むだけ。DB レベルの supersede フラグは不要
- 確定時に `lunaria_profile_archive` に old/new を記録

---

## 5. 実装プラン（ローカル lunaria-app への適用手順）

### 5.1 マイグレーション：不要

v1 で用意した `007_user_profile_extend.sql` / `008_profile_memory_sync.sql` は破棄済み（deprecation notice のみ残してある）。Supabase への DDL 変更はゼロ。

### 5.2 データクリーンアップ（手動 SQL 1 本）

ファイル：`implementation/scripts/cleanup_profile_duplicates.sql`

内容：
1. `core_memory` の `memory_key='user_name'` 行を `user_profile` に移送してから削除
2. `core_memory` の `memory_key='user_gender'` 行を削除（`user_profile` に同値が既存）

dev user 1 人分なので手動で十分。

### 5.3 コード差分

`implementation/patches/` 以下：

- `profile.patch.md`：EAV 前提の `getActiveProfile` / `buildProfileSummary`。pending 書き込み・confirm 処理は既存テーブルに合わせる
- `memory.patch.md`：`pickMemories` に `memory_category != 'profile'` を追加するだけ
- `prompt-builder.patch.md`：v1 とほぼ同じ（5 層化・Profile 層追加）
- `extract.patch.md`：profile_updates と memory_candidates の振り分けロジック、pending_profile_updates への書き込み

### 5.4 実行順序

1. **データクリーンアップ**：Supabase SQL Editor で `cleanup_profile_duplicates.sql` を実行（2 行の移送＋削除）
2. **コード差分**：`profile.ts` → `memory.ts` → `prompt-builder.ts` → `extract.ts` の順にパッチを当て、各段階で `tsc --noEmit`
3. **dev パネルで動作確認**：検証シナリオ（§5.5）を通す
4. **Phase F 完了**：`implementation/` 以下のライフサイクル（`implementation/README.md` 準拠）で片付け

### 5.5 検証シナリオ

| # | 入力 / 状態 | 期待挙動 |
|---|---|---|
| 1 | 起動直後、claude_serious 突入 | プロンプトに Profile 層が出る。core_memory は `memory_category='profile'` を含まない |
| 2 | 「俺フリーランスになったわ」 | occupation の pending 行が `lunaria_pending_profile_updates` に積まれる。core_memory には流れない |
| 3 | 次ターンでルナが trigger_message を引いて確認 → 「うん」 | user_profile.occupation 更新、profile_archive に old/new、pending 行 DELETE |
| 4 | 「彼女ともう半年」 | profile 不動、core_memory 昇格候補（`memory_category=NULL` として挿入） |
| 5 | extraction プロンプトが gender/name 相当を含む候補を出した | extract.ts のガードレールで core_memory に流れない |

---

## 6. v1 からの変更点まとめ

| 項目 | v1 | v2 |
|---|---|---|
| 007 マイグレーション | user_profile に 5 列追加 | **破棄（不要）** |
| 008 マイグレーション | core_memory に supersede フラグ + RPC | **破棄（不要）** |
| Profile のスキーマ | wide columns（gender enum 等） | **EAV そのまま** |
| pending 管理 | 新設 | **既存 `lunaria_pending_profile_updates`** |
| 履歴管理 | `archived jsonb` | **既存 `lunaria_profile_archive`** |
| core_memory 側の重複排除 | substring キーワード一致フィルタ | **既存 `memory_category='profile'` を除外するだけ** |
| audit スクリプト | substring マッチで洗い出し | **不要**（マーカーで一発特定、2 行だけ） |
| プロンプト 5 層化 | 追加 | **追加（維持）** |

---

## 7. 原則との整合（SPEC.md）

- 「1セッション限定の話題を core_memory に入れない」崩さない
- 「claude_serious 時のみ、自然な言及を 1 件」崩さない（注入条件は `memory_category != 'profile'` に限定）
- 「適当そうで理解は正確」：profile 更新は明示宣言 or 抽出バッチ経由のみ、推定しない
- プロンプト 4 層構造 → 5 層化だけ変更（Profile 層を State と Memories の間）
