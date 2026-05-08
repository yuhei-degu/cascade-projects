# Claude Handoff Tasks 2026-05-09

作成: 2026-05-09

目的: Codex 側で作成した戦略統合メモを、Claude Code にレビューしてもらうための作業指示集。

注意:
- コード編集はしない。
- DB migration は作らない。
- 既存ドキュメントを勝手に上書きしない。
- 出力は指定ファイルに新規作成する。

---

## Task 1: Product Strategy Review

```text
Lunaria の 2026-05-09 戦略統合メモを実装前レビューして。

Repo:
- C:\Users\yuuve\CascadeProjects

対象:
- lunaria/LUNARIA_PRODUCT_STRATEGY_SYNTHESIS_2026-05-09.md
- lunaria/LUNARIA_ARCHITECTURE_PRINCIPLES.md
- lunaria-app/docs/LUNARIA_VISUAL_GUIDE.md
- lunaria-app/docs/CHARACTER_EXPRESSIONS.md
- lunaria-app/docs/CHARACTER_MOTIONS.md

見てほしいこと:
1. 「AI日記アプリ」から「AIコンパニオン型ライフログOS」への拡張前提として破綻がないか
2. Core / Diary / Memory / Character / Gacha / Event の分離が保てているか
3. reaction 方式を先に採用し、expression + motion 分離を後回しにする判断が妥当か
4. ルナリア1人集中方針と将来の女性向けモデル展開の切り分けが妥当か
5. 終末世界ゲームを後回しにする判断が妥当か
6. 次に Codex が実装すべき順番に抜けや危険がないか

出力先:
- lunaria/LUNARIA_PRODUCT_STRATEGY_REVIEW_2026-05-09.md

注意:
- コード編集はしない
- DB migration は作らない
- レビューは「採用 / 修正 / 保留 / 危険」の分類で書く
```

---

## Task 2: Reaction MVP Spec Review

```text
Lunaria の 2D reaction MVP 仕様をレビューして。

Repo:
- C:\Users\yuuve\CascadeProjects

対象:
- lunaria/LUNARIA_PRODUCT_STRATEGY_SYNTHESIS_2026-05-09.md
- lunaria-app/docs/LUNARIA_VISUAL_GUIDE.md
- lunaria-app/docs/CHARACTER_EXPRESSIONS.md
- lunaria-app/docs/CHARACTER_MOTIONS.md
- lunaria/GACHA_REACTION_REVIEW.md

前提:
- 初期は expression と motion を分けず、reaction として束ねる案を採用予定
- 候補 reaction:
  - normal_idle
  - gentle_idle
  - smile_nod
  - small_wave
  - teasing_tilt
  - serious_forward
  - thinking_pose
  - sad_lookdown
  - surprised_react
  - presenting_item

見てほしいこと:
1. reaction 10 種がチャット / 日記 / ガチャ / 記憶候補提示をカバーできるか
2. ルナリアらしさに合わない reaction がないか
3. 既存の expression / motion doc と衝突していないか
4. fallback 設計で必要な優先順位
5. Codex が次に作るべき `lib/lunaria/reactions.ts` の仕様案

出力先:
- lunaria/LUNARIA_REACTION_MVP_REVIEW_2026-05-09.md

注意:
- コード編集はしない
- DB migration は作らない
```

---

## Task 3: User Communication Profile Design Review

```text
Lunaria の user_communication_profiles 設計案を作って。

Repo:
- C:\Users\yuuve\CascadeProjects

対象:
- lunaria/LUNARIA_PRODUCT_STRATEGY_SYNTHESIS_2026-05-09.md
- lunaria/LUNARIA_ARCHITECTURE_PRINCIPLES.md
- lunaria/PROFILE_MEMORY_INTEGRATION.md
- lunaria/LUNARIA_DIARY_MEMORY_DESIGN.md
- lunaria/LUNARIA_DIARY_MEMORY_REVIEW.md

やってほしいこと:
1. core_memories / user_profiles / character_personality_settings と混ざらない設計にする
2. 「ユーザーの性格断定」ではなく「返答スタイルの傾向」として扱う項目を提案する
3. confidence / evidence_summary / reset 가능性を含める
4. 将来の設定画面でユーザーが上書きできる前提にする
5. DB migration はまだ作らず、設計書だけにする

出力先:
- lunaria/USER_COMMUNICATION_PROFILE_DESIGN.md

注意:
- コード編集はしない
- DB migration は作らない
- センシティブな属性推定を強くしすぎない
```

---

## Task 4: End-World Game Scope Cut Review

```text
Lunaria の「終末世界ゲーム」案を、実装前にスコープカットして。

Repo:
- C:\Users\yuuve\CascadeProjects

対象:
- lunaria/LUNARIA_PRODUCT_STRATEGY_SYNTHESIS_2026-05-09.md
- C:\Users\yuuve\Downloads\lunaria_end_world_game_rough_plan.md
- lunaria/PHASE_G_GACHA_DESIGN.md
- lunaria/MOONBOX_ITEM_GUIDELINES.md

やってほしいこと:
1. いま実装しない理由を整理する
2. 将来実装するなら MVP に残す要素を 5 つ以内に絞る
3. ガチャ外れアイテム / 親密度 / 日記ログとの接続案を書く
4. DB が必要になる最小テーブル案を出す。ただし migration は作らない
5. 「週1イベント」として重すぎない UX 文言を提案する

出力先:
- lunaria/END_WORLD_GAME_SCOPE_REVIEW.md

注意:
- コード編集はしない
- DB migration は作らない
- 企画を膨らませるより、実装を遅らせないために切る
```

---

## Codex 側の次候補

Claude レビュー待ちの間に Codex が進めやすいもの:

1. 既存の未コミット差分を別コミットで整理する。
2. `memory_candidates` の承認 / 却下 / 保留 API を実装する。
3. `lib/lunaria/reactions.ts` を追加して、reaction ID と fallback だけ先に固定する。
4. `/memory` の candidate UI を実操作可能にする。

優先は 2。
