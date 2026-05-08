# Lunaria Doc Triage 2026-05-09

作成: 2026-05-09

目的: AI_DEV_OS 適用後に残っていた未コミットドキュメント差分を、採用 / 保留 / 後で統合に分類する。

---

## 結論

今回の未コミット docs は、すべて即実装に進むためのものではない。

安全に採用するもの:

- `lunaria/DIARY_UI_REVIEW_2026-05-04.md` の小修正
- `lunaria/MEMORY_VIEWER_NEXT_PHASE_PLAN.md` の小修正
- `lunaria/NEXT_IMPLEMENTATION_QUEUE_2026-05-04.md`

いったん保留するもの:

- `lunaria-app/docs/`

理由:

- `lunaria-app/docs/` は視覚・表情・モーション仕様として有用な内容を含む。
- ただし `TASK_BOARD.md` が、現在存在しない doc や mock UI 実装を完了済みとして参照している。
- 2026-05-09 の `LUNARIA_PRODUCT_STRATEGY_SYNTHESIS_2026-05-09.md` では、初期は `expression + motion` より `reaction` 方式を優先する方針に寄せた。
- そのため、`lunaria-app/docs/CHARACTER_EXPRESSIONS.md` / `CHARACTER_MOTIONS.md` は将来参照としては使えるが、今の実装キューにそのまま入れると優先順位がぶれる。

---

## 採用する差分

### 1. `DIARY_UI_REVIEW_2026-05-04.md`

分類: 採用

内容:

- `/diary` の Must-A/B/C をより実装向けに整理。
- `memory_changes` は折りたたみ。
- Stat ブロックは dev panel または折りたたみへ。
- transcript は main column 末尾へ。
- `NEXT_IMPLEMENTATION_QUEUE_2026-05-04.md` への参照を追加。

判断:

- 既存仕様を壊さない UI 改善メモ。
- AI_DEV_OS の `TASKS.md` とも整合する。

### 2. `MEMORY_VIEWER_NEXT_PHASE_PLAN.md`

分類: 採用

内容:

- `/memory` の次段階を D4a/D4b/D4c/D4d として整理。
- confirm / archive / restore / inline edit / diary 連動の段階を明確化。
- 「外してもいい」を明示する UX 方針を追加。

判断:

- Memory governance の設計として有効。
- 既に candidate review actions まで一部実装済みなので、今後の restore/edit 設計に使える。

### 3. `NEXT_IMPLEMENTATION_QUEUE_2026-05-04.md`

分類: 採用。ただし historical queue として扱う。

内容:

- 2026-05-04 時点での実装候補 8 件を整理。
- 既に完了済みの項目も含む。

判断:

- 当時の意思決定ログとして価値がある。
- 最新の現在地は root `TASKS.md` / `PROGRESS.md` を優先する。

運用ルール:

- 古い完了状況をそのまま現在タスクとして読まない。
- 最新タスクは root `TASKS.md` に集約する。

---

## 保留する差分

### `lunaria-app/docs/`

分類: 保留

含まれるファイル:

- `CHARACTER_EXPRESSIONS.md`
- `CHARACTER_MOTIONS.md`
- `LUNARIA_VISUAL_GUIDE.md`
- `STATUS.md`
- `TASK_BOARD.md`

有用な点:

- 表情タグ・モーションタグ・ビジュアル方向性のメモとして使える。
- 将来 Live2D / 2D asset 発注時の材料になる。
- ルナリアの静かで月明かり寄りのビジュアル方針は、現在の戦略とも大きくは矛盾しない。

保留理由:

- `TASK_BOARD.md` が存在しない docs や未実装 mock UI を完了済みとして参照している。
- `STATUS.md` は 2026-05-04 時点で古く、現在の PR #55 / #57 後の状態を反映していない。
- 現在の優先方針は `reaction` MVP であり、`expression + motion` 分離を直ちに実装する段階ではない。
- app 内 `docs/` に置くより、製品設計 docs として `lunaria/` に統合した方がよい可能性が高い。

次にやるなら:

1. `LUNARIA_PRODUCT_STRATEGY_SYNTHESIS_2026-05-09.md` と照合する。
2. `reaction` MVP に必要な部分だけ抜き出す。
3. `lunaria/LUNARIA_REACTION_MVP_SPEC.md` に統合する。
4. `lunaria-app/docs/STATUS.md` / `TASK_BOARD.md` は、最新 root `PROGRESS.md` / `TASKS.md` と重複するため採用しないか、archive 扱いにする。

---

## 最新の正本

今後の判断では、以下を正本として優先する。

1. `SPEC.md`
2. `PROGRESS.md`
3. `TASKS.md`
4. `HANDOFF.md`
5. `lunaria/LUNARIA_ARCHITECTURE_PRINCIPLES.md`
6. `lunaria/LUNARIA_PRODUCT_STRATEGY_SYNTHESIS_2026-05-09.md`

古い queue / status docs は、経緯を見るための history として扱う。

---

## 次の推奨作業

1. `lunaria-app/docs/CHARACTER_EXPRESSIONS.md` / `CHARACTER_MOTIONS.md` / `LUNARIA_VISUAL_GUIDE.md` から、`reaction` MVP に必要な要素だけ抽出する。
2. `lunaria/LUNARIA_REACTION_MVP_SPEC.md` を作る。
3. その後、`lib/lunaria/reactions.ts` を小さく追加する。

この順なら、2D 表現の土台を作りつつ、expression/motion 分離に早く入りすぎるリスクを避けられる。
