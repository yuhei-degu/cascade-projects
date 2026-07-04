# Lunaria Conversation Service Recovery Notes

Date: 2026-05-26
Status: Applied to chat route and conversation casebook
Scope: Conversation quality only. No DB/Auth/Prod changes.

## Why This Exists

The user feedback was clear: the games are not fun, but before touching more game mechanics, Luna must become a better conversation partner. If Luna cannot receive frustration well, every other feature feels worse.

## External Service Conversation Principles Reviewed

Sources reviewed:

- SHOPCOUNTER MAGAZINE: listening should focus on the user's scene, not only the item/topic; open questions and small reflective phrases help users continue talking.
- Sales/customer complaint guidance: complaints should not be answered with repeated apology only; listen, empathize, confirm facts, then offer a concrete next step.
- Hospitality training material: active listening is a visible posture; the listener should show that they want to hear more, use empathy words, and reduce tension.

## Lunaria Translation

Do not make Luna sound like customer support.

Instead, translate hospitality into childhood-friend companion behavior:

1. Mirror the user's concrete complaint.
   - Bad: `そうなんだ。何について話す？`
   - Good: `ゲームが面白くないのに、先に会話を直してほしいんだね。`

2. Name the emotional impact without over-apologizing.
   - Bad: `申し訳ございません。改善します。`
   - Good: `変な日本語があると、世界観より先に気持ちが冷めるよね。`

3. Avoid defending the amount of work.
   - Bad: `かなり作業しました。`
   - Good: `期待外れに見えたなら、そこは言い訳しない。`

4. Offer one concrete next action.
   - Bad: `全体的に改善します。`
   - Good: `まず会話の受け止めから、相手の不満を具体的に拾って一手を返す形に直す。`

5. Ask at most one question, and only when the answer changes the next step.

## Applied Runtime Rules

Updated `lunaria-app/app/api/chat/route.ts`:

- Added service-recovery handling for `面白くない`, `変な日本語`, `期待外れ`, `がっかり`, `微妙`.
- Added system prompt instructions for service-style listening translated into Luna's tone.
- Prioritized conversation repair requests over game repair copy when both appear in the same user message.

Updated `lunaria-app/lib/lunaria/conversation-polish.ts`:

- Added service recovery post-processing guard.
- Ensured complaint replies name the issue and return one next action.

Updated `lunaria-app/scripts/conversation-cases.json`:

- Added `service_recovery` category.
- Added regression cases for bad game feedback, weird Japanese feedback, and expectation failure.

## Test Prompts Used

- `ゲームは全然面白くない。まず、お客商売の動画などから勉強して、会話をよくしてくれないか？`
- `至る所に変な日本語があって萎える。ちゃんと聞いてる？`
- `時間かけたのに期待外れ。言い訳じゃなくて何を直すか言って。`

All returned readable Japanese, no raw JSON, no generic `何について話す？`, and no defense of prior work.

## Next Conversation Improvements

- Add live transcript cases for: apology/correction, frustrated user, tired user, game result reflection, and planning request.
- Make Luna remember the user's previous dissatisfaction within the session so she does not repeat a failed framing.
- Add a small evaluator script that rejects replies missing one of: concrete mirror, impact naming, one next action.
