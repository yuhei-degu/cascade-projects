# `implementation/` の運用ルール

確定日：2026-04-18

## トップレベル構造

| ディレクトリ | 位置付け | 正本（Source of Truth） |
|---|---|---|
| `lunaria/` | 設計の正本 | SPEC / PROGRESS / KNOWLEDGE / PROFILE_MEMORY_INTEGRATION など |
| `lunaria-app/` | 実装の正本 | Next.js アプリのコード・マイグレーション・スクリプト |
| `lunaria/implementation/` | **未適用差分の一時置き場**（このフォルダ） | 適用されるまでの間だけ存在 |

## `implementation/` に置いてよいもの

- まだローカルに適用していないマイグレーション（`.sql`）
- まだ配置していないスクリプト（`.ts`）
- まだ当てていないコードパッチ（`.patch.md`）
- 適用作業中のチェックリスト（`APPLY_CHECKLIST.md`）

要するに「未適用キュー」。適用が終わったら下記のルールで処理する。

## Phase F 完了後の処理ルール

適用・動作確認まで通ったら、対応する成果物を以下のとおり片付ける。

| 種別 | 処理 |
|---|---|
| `migrations/*.sql` | `lunaria-app/supabase/migrations/` に**移動**して正式配置 |
| `scripts/*.ts` | `lunaria-app/scripts/` に**移動**（運用で使い続けるものは残す） |
| `patches/*.patch.md` | **削除**（中身は既に実コードに反映済みなので残さない） |
| `APPLY_CHECKLIST.md` | `lunaria/` 側に**移動**して記録化（この適用の 1 次ログとして永続化） |

処理後、`implementation/` 直下が再び空（または未適用の次のキュー分だけ）になる状態を保つ。

## 例外：監査ログとして残したい場合

「どう適用したか」を将来確認できるようにしたい時だけ、以下の形で退避する：

```
implementation/applied/2026-04-18/
  ├── migrations/
  ├── scripts/
  ├── patches/
  └── APPLY_CHECKLIST.md   # 実測値が埋まった状態で退避
```

ただしこれは例外運用。通常は上の表どおりに移動・削除してよい。普段の `implementation/` 直下には**未適用のものだけ**置くのが運用の要。

## やってはいけないこと

- `implementation/` にファイルを置いたまま forget して他の作業に移る（未適用キューの意味が壊れる）
- 適用後の `.sql` を `implementation/migrations/` に残したまま `lunaria-app/` にもコピーする（2箇所に同じファイルがある状態は必ず lag る）
- `lunaria/` の設計ドキュメントを `implementation/` に置く（設計の正本は `lunaria/` 固定）

## 判断に迷ったら

- 「これは設計か実装か」→ 設計なら `lunaria/`、実装なら `lunaria-app/`
- 「まだ適用してないが、近々適用するもの」→ `implementation/`
- 「過去の適用ログとして残したい」→ `implementation/applied/YYYY-MM-DD/`
