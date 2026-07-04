# Lunaria Subscription and AI Usage Wallet

Created: 2026-05-27
Status: Feature proposal, not implemented
Risk: Medium if manual-only, High if external account/API integration is added

## 1. Idea

Lunaria can become more useful if it helps the user track:

- active subscriptions
- monthly renewal dates
- monthly cost
- cancellation review dates
- AI service usage limits
- rough remaining AI usage budget
- which AI service is best to use today

The value is not only accounting. This can become a daily conversation topic:

- "今日はClaudeを温存して、軽い整理はCodexに回そう"
- "今月のサブスク、使ってないものを一緒に見直そう"
- "この作業は高いモデルを使う価値があるか、先に下書きで済ませよう"

## 2. Product Fit

This fits Lunaria because it connects practical life management with companion-style conversation.

Good Lunaria framing:

- "節約しろ"ではなく、"使う価値があるものを一緒に選ぶ"
- "管理画面"ではなく、"今月の道具棚"
- "残りトークン"ではなく、"今日どのAIに頼ると気持ちよく進むか"
- "サブスク一覧"ではなく、"今月も味方にする道具 / そろそろ見直す道具"

## 3. MVP Scope

Start manual-only. Do not connect external accounts in the first version.

### MVP Inputs

The user can register:

- service name
- category: AI, dev, design, storage, entertainment, learning, other
- monthly price
- currency
- renewal day
- payment cycle: monthly / yearly / one-time / unknown
- usage limit label: tokens / messages / credits / minutes / unknown
- monthly limit amount
- current used amount
- manual reset date
- memo
- importance: must-have / useful / trial / maybe cancel

### MVP Outputs

Lunaria shows:

- total monthly subscription cost
- next 7-day renewals
- AI usage remaining by service
- "today's recommended AI routing"
- unused or unclear subscriptions
- review prompts for cancellation or downgrade

## 4. Non-MVP / Later

Do not implement these first:

- automatic login to provider dashboards
- scraping subscription pages
- reading email receipts without explicit user consent
- handling payment cards directly
- storing provider API keys for usage reads
- production billing automation

Possible later additions:

- official provider API usage import where available
- CSV import
- Gmail receipt import with explicit review step
- calendar reminders for renewal dates
- local-only encrypted storage for sensitive tokens

## 5. Data Safety Rules

This feature touches money and account-adjacent data, so the rules are strict:

- Do not store passwords.
- Do not ask the user to paste private API keys into chat.
- Do not log account identifiers, receipt contents, or API usage payloads verbatim.
- Keep manual entries editable and deletable.
- Treat costs and usage as private user data.
- Any external import must show a preview before saving.
- Any automatic deletion/cancellation advice must be phrased as a suggestion, not an action.

## 6. Suggested Tables

Migration is not part of this proposal. This is only a design sketch.

```sql
subscription_services
- id
- user_id
- name
- category
- monthly_price
- currency
- billing_cycle
- renewal_day
- renewal_date
- importance
- status
- notes
- created_at
- updated_at
- deleted_at

ai_usage_budgets
- id
- user_id
- service_id
- unit
- monthly_limit
- used_amount
- reset_date
- source_type
- source_ref
- confidence
- created_at
- updated_at
- deleted_at

subscription_reviews
- id
- user_id
- service_id
- review_type
- summary
- luna_suggestion
- user_decision
- reviewed_at
- created_at
```

## 7. Conversation Behavior

Luna should talk like a practical companion, not a finance app.

Good examples:

- "今月のAI枠、けっこう使ってるね。今日は重い相談だけ高いモデルにして、下書きは軽めに回そっか。"
- "これは解約しろって話じゃなくて、今の悠平の味方になってるかを一緒に見るやつ。"
- "使ってないサブスク、責めるより棚卸ししよ。残す理由があるなら、それもちゃんと価値。"

Avoid:

- "無駄遣いです"
- "すぐ解約してください"
- "あなたの支出は危険です"
- exact claims about provider limits unless sourced from the user's own entry or current official API/data

## 8. Implementation Plan

### Phase A: Manual Tracker

- Add a docs-backed mock spec.
- Add `/subscriptions` or `/tools` page.
- Add manual list UI with local mock data.
- Show total cost and next renewal.
- No DB, no external API.

### Phase B: DB-backed Tracker

- Add migration candidate.
- Add RLS policies.
- Add API routes.
- Add edit/delete/review workflow.

### Phase C: Lunaria Conversation Integration

- Add a "今月の道具棚を見て" quick prompt.
- Let chat summarize manual tracker data.
- Add AI routing advice based only on user-provided data.

### Phase D: Optional Imports

- CSV import.
- Explicit Gmail receipt review.
- Official API import where safe and available.

## 9. AI Development Notes

Good first Codex task:

- Create a mock `/subscriptions` page with static sample data and Japanese copy.
- No DB, no auth, no env, no external API.
- Add a smoke check for visible labels.

Good Claude task:

- Review naming/copy so it feels like Lunaria, not an accounting dashboard.
- Propose 20 conversation prompts for subscription and AI-usage review.

## 10. Decision Needed Later

- Page name: `/subscriptions`, `/tools`, `/wallet`, or `/monthly-shelf`
- Whether this belongs in MVP or post-MVP
- Whether to support only AI/dev subscriptions first
- Whether costs should appear in diary/life events
- Whether this data can become memory candidates

Recommended answer for now:

- Treat it as post-MVP but high-value.
- Start manual-only.
- Do not store it in core memory automatically.
- Use it as a conversation and planning surface.
