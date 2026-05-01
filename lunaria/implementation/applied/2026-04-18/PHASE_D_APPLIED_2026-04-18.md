# Phase D 実施記録（2026-04-18）

> Phase E（動作確認）通過後に `lunaria/applied/2026-04-18/` へ退避予定。
> 失敗時はここを見てロールバック内容を判断する。

## 方針の決定

Phase D 着手時点で **パッチ 4 本と現行 lunaria-app ソースのシグネチャが大きく乖離**していることが判明（HANDOFF §6 で予告済）。フル rewrite はリスク高＋時間も読めないため、ユーザーと相談のうえ **「中間：設計の核だけ」** の適用範囲に決定。

採択した変更範囲：
- memory.ts：`memory_category='profile'` 自動タグを廃止。name は profile へリダイレクト。profile 相当言及はガードレールで拒否。`pickMemories` 新設
- profile.ts：`ProfileField` union 拡張（name, age_band, user_nickname, lunaria_nickname, lifestyle_pattern）＋ label 追加
- prompt-builder.ts：`buildNormalPrompt` から core_memory 層を外す（Memories 層は serious 専用）
- route.ts：`fieldLabel` Record に `name: '名前'` 追加のみ

見送った変更（次回以降）：
- extraction.ts の 2 配列化（`profile_updates[]` / `memory_candidates[]`）
- `buildProfileSummary(userId)` 1 行サマリ化（現状の `buildProfileContext` 多行プロンプトをそのまま残した）
- `buildPrompt(ctx)` への全面再構成（現状の `buildNormalPrompt` / `buildSeriousPrompt` 2 本を残した）
- ローカルな namedetection の明示的な profile 連動（route.ts:69-73 は memory.ts 側で自動リダイレクトされるため触らず）

## 変更ファイル一覧

| ファイル | 概要 |
|---|---|
| `lib/lunaria/profile.ts` | `ProfileField` 型拡張、`FIELD_LABEL` 5 件追加 |
| `lib/lunaria/memory.ts` | `CANONICAL_KEYS`／`resolveCanonical` 廃止、`saveCoreMemory` 全面書き直し、`pickMemories` 新設、`getUserName` / `getCoreMemoryContext` に防御フィルタ |
| `lib/lunaria/prompt-builder.ts` | `buildNormalPrompt` から `coreMemCtx` 注入削除。変数名 `memories` → `layers` に改名して意図明示 |
| `app/api/chat/route.ts` | 2 箇所の `fieldLabel` Record に `name: '名前'` 追加 |

## 挙動サマリ（期待値）

| 経路 | 旧挙動 | 新挙動 |
|---|---|---|
| `detectNameFromMessage` で名前検出 → `saveCoreMemory('name', X)` | `lunaria_core_memory` に `memory_key='user_name', memory_category='profile'` で upsert | `lunaria_user_profile` に `field='name', source='setting'` で upsert。`lunaria_profile_archive` に old/new |
| Gemini extract が `long_term_candidate: {type:'name', content:X}` を返す | 同上（core_memory に profile マーカー付き） | 同上（profile へリダイレクト） |
| Gemini extract が `{type:'value', content:'ユーザーの性別: 男性'}` を返す | 旧 `CANONICAL_KEYS` にマッチ → core_memory に `memory_category='profile'` 付きで upsert | `looksLikeProfileMention` で弾いて書かない（ログに skip 記録） |
| `light_normal` / `light_probe` ルートでのプロンプト | `coreMemCtx` が Profile と並んで注入される（最大 3 件のエピソード） | Profile 層のみ。Memories 層は入らない |
| `claude_serious` ルートでのプロンプト | Profile + Memories（最大 3 件） | 変更なし（Profile + Memories） |

## 回帰テスト（自動）

### regex 自己テスト（2026-04-18 実施・パス）

`looksLikeProfileMention` の `PROFILE_MENTION_PATTERNS` に対して：

REJECT 期待（9 件すべて REJ）：
- "ユーザーの性別: 男性" / "ユーザーの性別: 女性"
- "ユーザーの職業: ITエンジニア" / "SESで働いている" / "フリーランスになった" / "会社員です"
- "ユーザーの年齢: 30代" / "30代です"
- "ユーザーの居住: 東京"

PASS 期待（11 件すべて PASS）：
- エピソード系：「ユーザーが疲労やしんどさを感じる状況や頻度」「ルナの会話途切れ改善」「夜型」「ユーザーは夜型人間」「AIの応答の長さ/スタイル」「彼女ともう半年付き合っている」
- 紛らわしい語：「ユーザーの価値観として効率を重視する」「長男である」「男性的な話し方をする」「性的マイノリティの話題」「彼は男だ」

### tsc --noEmit

```
exit=0
```

## Phase E への申し送り（検証してほしい観点）

1. **serious 突入時**：プロンプトに Profile 層（男性・ITエンジニア・SES・悠平）が出るか → 特に name 行を cleanup で追加したので「名前：悠平」が出ること
2. **light_normal 時のプロンプト肥大解消**：core_memory が注入されなくなったことの体感（プロンプトが短くなっている）
3. **regex ガードレールのログ**：抽出が profile 相当を返したら `[saveCoreMemory] skipped profile-like content:` が console に出るか
4. **detectNameFromMessage のリダイレクト**：「俺は〇〇って言うんだ」系の発話で `[saveCoreMemory] redirected type=name to user_profile:` が console に出ること
5. **DB 状態**：`SELECT count(*) FROM lunaria_core_memory WHERE memory_category='profile'` が常に 0 であり続けること

## ロールバック手順（Phase E で致命的な問題が出た場合）

### コード

lunaria-app は git 管理されていないため、手動ロールバックとなる：
- `lib/lunaria/profile.ts` → Phase D 前の状態（`ProfileField` から name 他 4 種を外し、`FIELD_LABEL` を元の 5 件に戻す）
- `lib/lunaria/memory.ts` → この `implementation/patches/memory.patch.md` は前状態のコードを含まないので、バックアップから戻す必要あり。もし戻せない場合は：
  - `PROFILE_MENTION_PATTERNS` / `looksLikeProfileMention` を残して害はない
  - `saveCoreMemory` の name 分岐と profile ガードを外せば旧挙動に近い（ただし `CANONICAL_KEYS` が失われているので名前以外の重複除去は効かなくなる）
- `lib/lunaria/prompt-builder.ts` → `buildNormalPrompt` に `coreMemCtx` を戻す
- `app/api/chat/route.ts` → `fieldLabel` から name を外す（無害）

### DB

cleanup SQL の巻き戻しは `APPLY_CHECKLIST.md` Phase G-2 に記載の SQL を使用。`backups/2026-04-18-*.json` が事前スナップショット。
