# AI Company OS v3 — SPEC(2026-07-05)

## 目的
案件発掘から完成まで、人間の関与を「週5分の判断2つ」まで圧縮した自動開発会社。

## v1の死因と対策(設計の根拠)
| v1の死因 | v3の対策 |
|---|---|
| 案件が空想から量産された(30+プロジェクト) | SCOUTは実在URL・支払い意思の証拠を必須とし、週1件しか出せない |
| 「完成」が内部状態(promoted)だった | 完成 = デプロイ済み + 第三者が7日連続利用。それ以外はKILL |
| メタタスクの無限再帰 | タスク源は (a)承認済み案件の初期分解 (b)実利用データ のみ |
| 並行30案件で全部未完 | WIP上限 = 1(buildingは常に1件だけ) |
| OSが自分自身を肥大させた | OSのコード変更は人間+Claudeのセッションでのみ行う |

## パイプライン(状態はPIPELINE.mdのみ)
candidate → approved → building → deployed → in-use → done / killed

- SCOUT(scout.py): Gemini(Google検索グラウンディング)で証拠付き案件を1件生成し
  CANDIDATES.md に追記。未判断の候補がある間・building中は新規発掘を拒否する。
- 人間ゲート①: 候補に GO/NO。GOならキル基準(例: 公開4週で利用者0なら殺す)を1行書く。
- BUILD: v2 run.py --all(既存)。TASKS.mdの初期タスクはClaudeが案件から分解。
- DEPLOY: Vercel(git push → 自動デプロイ)。スモークはverify_commandに統合。
- MEASURE: 利用ログ(最小: ページビュー+主要アクション)を週次で確認し、
  実利用に基づくタスクだけをTASKS.mdに追加。
- 人間ゲート②: キル基準に該当したら確認の上killed。粘らない。

## 役割
- scout.py / run.py = 機械
- Claude = 案件分解・コミットレビュー・週次計測レポート
- 人間 = GO/NO(5分) + キル確認(5分) + アカウント作業(Vercel/Supabase/Stripe)

## 現在のパイプライン状態
- Lunaria: **building → deployed への移行中**(本OSの案件第1号として扱う。
  残作業: Supabaseプロジェクト作成のみ。これが完了して初めてOSは「実在」する)
