import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import OpenAI from 'openai'
import { calcRoute, getProbeTemplate } from '../../../lib/lunaria/routing'
import { applySleepDecay, updateEmotion, getEmotion } from '../../../lib/lunaria/emotion'
import { getAffinity } from '../../../lib/lunaria/affinity'
import { getMorningOpening } from '../../../lib/lunaria/diary'
import {
  extractTurnTopic, decideConversationMode,
  getShiftCandidates, updateCoverage, buildModeInstruction, detectResponseMode,
} from '../../../lib/lunaria/topic'
import { FALLBACK_TOPIC, DEFAULT_COVERAGE } from '../../../lib/lunaria/types'
import type { DailyCoverageState, ConversationMode } from '../../../lib/lunaria/types'
import { getCoreMemoryContext, detectNameFromMessage, saveCoreMemory, getContextualMemory, getUserName, getMemoryForProbe, buildMemorySurfaceReply } from '../../../lib/lunaria/memory'
import { applyFreeMemoryDecay, getMemoryFadeHint } from '../../../lib/lunaria/subscription'
import { getProfile, getPendingUpdates, setProfile, savePendingUpdate, clearPendingUpdate, buildProfileContext, detectProfileConflicts } from '../../../lib/lunaria/profile'
import type { ProfileField } from '../../../lib/lunaria/profile'
import { supabaseAdmin } from '../../../lib/supabase'
import { buildNormalPrompt, buildSeriousPrompt } from '../../../lib/lunaria/prompt-builder'
import { buildConversationMoveNote } from '../../../lib/lunaria/conversation-move'
import { tryGrantTicketByScore } from '../../../lib/lunaria/gacha'
import { getJstDateString } from '../../../lib/lunaria/date'
import { parseAssistantReply, stringifyAssistantMessage } from '../../../lib/lunaria/assistant-reply'
import type { AssistantReply } from '../../../lib/lunaria/assistant-reply'
import { buildGameHandoffResponseHint, getGameHandoffNextStep, withGameHandoffNextStep } from '../../../lib/lunaria/game-handoff'
import { getAuthenticatedUserId } from '../_auth'
import { hasWorkSignal, getWorkContext } from '../../../lib/lunaria/work-items'
import { trackEvent } from '../../../lib/track'

const gemini = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
})

const T = {
  messages:    'lunaria_messages',
  routingLog:  'lunaria_routing_log',
  extractions: 'lunaria_extractions',
} as const

const MAX_MESSAGE_CHARS = 2000
const MAX_HISTORY_ITEMS = 20

type ChatHistoryItem = { role: 'user' | 'assistant'; content: string }
type AssistantMeta = Omit<AssistantReply, 'message'>

function asFiniteNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function normalizeScores(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((score): score is number => typeof score === 'number' && Number.isFinite(score))
    .slice(-5)
}

function normalizeHistory(value: unknown): ChatHistoryItem[] {
  if (!Array.isArray(value)) return []
  return value
    .slice(-MAX_HISTORY_ITEMS)
    .filter((message): message is ChatHistoryItem => {
      if (!message || typeof message !== 'object') return false
      const candidate = message as Partial<ChatHistoryItem>
      return (
        (candidate.role === 'user' || candidate.role === 'assistant') &&
        typeof candidate.content === 'string'
      )
    })
    .map(message => ({
      role: message.role,
      content: message.content.slice(0, MAX_MESSAGE_CHARS),
    }))
}

function normalizeCoverage(value: unknown): DailyCoverageState {
  if (!value || typeof value !== 'object') return DEFAULT_COVERAGE
  const candidate = value as Partial<Record<keyof DailyCoverageState, unknown>>
  return {
    work:           candidate.work === true,
    health:         candidate.health === true,
    meal:           candidate.meal === true,
    relation:       candidate.relation === true,
    hobby:          candidate.hobby === true,
    tomorrow:       candidate.tomorrow === true,
    small_positive: candidate.small_positive === true,
  }
}

function toAssistantMeta(reply: AssistantReply): AssistantMeta | null {
  const { message: _message, ...meta } = reply
  return Object.keys(meta).length > 0 ? meta : null
}

// 文末で切り詰め：100文字超 OR 文末記号で終わっていない場合に最後の文末位置で切る
function truncateAtSentence(text: string, maxChars: number): string {
  const endings = ['。', '！', '？', '…', '!', '?']
  const trimmed = text.trim()

  // 文末記号で終わっているか確認
  const endsCleanly = endings.includes(trimmed[trimmed.length - 1])

  if (trimmed.length <= maxChars && endsCleanly) return trimmed

  // 最後の文末記号位置を探す（maxChars以内）
  const searchUpto = Math.min(trimmed.length, maxChars)
  let lastEnd = -1
  for (let i = searchUpto - 1; i >= 0; i--) {
    if (endings.includes(trimmed[i])) { lastEnd = i; break }
  }
  return lastEnd > 0 ? trimmed.slice(0, lastEnd + 1) : trimmed.slice(0, maxChars)
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserId()
    if ('response' in auth) return auth.response
    const { userId } = auth

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ reply: 'メッセージの形が読めなかったみたい', error: true }, { status: 400 })
    }

    const payload = body as Record<string, unknown>
    const rawMessage = asString(payload.message).trim()
    if (!rawMessage) {
      return NextResponse.json({ reply: 'メッセージが空みたい', error: true }, { status: 400 })
    }
    void trackEvent(supabaseAdmin, userId, 'chat_send')

    const userMessage: string       = rawMessage.slice(0, MAX_MESSAGE_CHARS)
    const prevScores: number[]      = normalizeScores(payload.prevScores)
    const prevHeavy: number         = asFiniteNumber(payload.prevHeavy)
    const lastSeriousAt: number     = asFiniteNumber(payload.lastSeriousAt)
    const history                   = normalizeHistory(payload.history)
    const consecutiveTopicCount: number  = asFiniteNumber(payload.consecutiveTopicCount)
    const coverage: DailyCoverageState   = normalizeCoverage(payload.coverage)
    const lastTopic: string              = asString(payload.lastTopic, 'other')
    const lastSubtopic: string           = asString(payload.lastSubtopic, 'unknown')
    // 記憶表出タイムスタンプ（クライアント側で保持）
    const lastMemorySurfacedAt: number   = asFiniteNumber(payload.lastMemorySurfacedAt)

    // 名前を即時検出して保存（Gemini抽出を待たない）
    const detectedName = detectNameFromMessage(userMessage)
    const sourceDate = getJstDateString()
    if (detectedName) {
      saveCoreMemory('name', detectedName, userId, { sourceDate, confidence: 1, status: 'confirmed', lastConfirmedAt: new Date().toISOString() }).catch(e => console.warn('[memory]', e))
    }

    // 1. 睡眠トリガー（日付変更で感情減衰）
    await applySleepDecay(userId)

    // 2. ルーティング判定
    const route = calcRoute(userMessage, prevScores, prevHeavy, lastSeriousAt)

    // 3. 感情・親密度・話題転換を並列取得
    const [emotion, affinity, morningMsg, topicResult, coreMemCtx, profile, pendingUpdates, userName, workCtx] = await Promise.all([
      getEmotion(userId),
      getAffinity(userId),
      history.length === 0 ? getMorningOpening(userId) : Promise.resolve(null),
      extractTurnTopic(userMessage, history.slice(-4)),
      getCoreMemoryContext(userId),
      getProfile(userId),
      getPendingUpdates(userId),
      getUserName(userId),
      getWorkContext(userId),
    ])

    // 関連する過去記憶を条件付きで取得
    const contextualMem = await getContextualMemory(userId, topicResult.current_topic)

    const newCoverage = updateCoverage(coverage, topicResult)
    const sameTopic = topicResult.current_topic === lastTopic && topicResult.subtopic === lastSubtopic
    const newConsecutiveCount = sameTopic ? consecutiveTopicCount + 1 : 1

    const conversationMode: ConversationMode = decideConversationMode({
      messageScore:          route.msgScore,
      windowScore:           route.windowScore,
      heavySignalCount:      route.heavyCount,
      consecutiveTopicCount: newConsecutiveCount,
      topic:                 topicResult,
    })

    const modeInstruction = buildModeInstruction(conversationMode, getShiftCandidates(newCoverage))

    // ── プロフィール確認フロー ─────────────────────────────────
    // pending がある場合：ユーザーの返答を判定
    let profileConfirmReply: string | null = null
    if (pendingUpdates.length > 0) {
      const pending = pendingUpdates[0]
      const affirm = /(?:そう|うん|はい|yes|そうだよ|そうです|合ってる|正しい|だよ|です|だね)/i.test(userMessage)
      const deny   = /(?:違う|いや|いいえ|no|違います|そうじゃない|女性|女だ|女です)/i.test(userMessage)
      if (affirm) {
        await setProfile(pending.field as ProfileField, pending.detected_value, userId, 'confirmed')
        await clearPendingUpdate(pending.field as ProfileField, userId)
        const fieldLabel: Record<string, string> = { gender: '性別', age: '年齢', marital_status: '婚姻状況', occupation: '職業', living_situation: '居住状況', name: '名前' }
        profileConfirmReply = `了解！${fieldLabel[pending.field] ?? pending.field}を「${pending.detected_value}」に更新したよ。`
      } else if (deny) {
        await clearPendingUpdate(pending.field as ProfileField, userId)
        profileConfirmReply = `わかった、変えないでおくね！`
      }
    }

    // 矛盾検出（pending に追加）
    const conflicts = detectProfileConflicts(userMessage, profile)
    for (const c of conflicts) {
      await savePendingUpdate(c.field as ProfileField, c.detected, userMessage, userId)
    }

    // フリープラン記憶減衰（fire-and-forget）
    applyFreeMemoryDecay(userId).catch(e => console.warn('[subscription] decay error:', e))

    // ── 4. 応答生成（NDJSON ストリーミング）─────────────────────────
    // 即時生成可能な応答（probe テンプレ / 聞き返し / morning）を先に決定
    let newLastMemorySurfacedAt = lastMemorySurfacedAt
    let precomputedReply: string | null = null

    if (route.routeType === 'light_probe') {
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
      const shouldSurfaceMemory = Date.now() - lastMemorySurfacedAt > SEVEN_DAYS_MS
      if (shouldSurfaceMemory && !morningMsg) {
        try {
          const probeMemory = await getMemoryForProbe(userId)
          if (probeMemory) {
            precomputedReply = buildMemorySurfaceReply(probeMemory)
            newLastMemorySurfacedAt = Date.now()
          }
        } catch (e) {
          console.warn('[memory] getMemoryForProbe error:', e)
        }
      }
      if (!precomputedReply) {
        precomputedReply = morningMsg ?? getProbeTemplate(route.windowScore)
      }
    } else if (topicResult.intent === 'clarify_first' && topicResult.clarifying_question) {
      precomputedReply = topicResult.clarifying_question
    }

    // LLM 用 prompt 構築（precomputedReply がある場合は使わない）
    const closenessNote = affinity.unlock_secret
      ? '（親密度MAX：本音・図々しさ全開でOK）'
      : affinity.unlock_honest
        ? '（親密度高：本音や少し図々しい態度OK）'
        : affinity.unlock_casual
          ? '（タメ口・軽口OK）'
          : ''
    const profileCtx   = buildProfileContext(profile)
    const responseMode = detectResponseMode(userMessage)
    const promptPayload = {
      emotion, closenessNote, coreMemCtx,
      contextualMem: contextualMem ?? null,
      modeInstruction, profileCtx, responseMode,
      workCtx,
    }
    const systemWithContext = route.routeType === 'claude_serious'
      ? buildSeriousPrompt(promptPayload)
      : buildNormalPrompt(promptPayload)
    const conversationMoveNote = buildConversationMoveNote(history, userMessage)
    const gameHandoffNextStep = getGameHandoffNextStep(userMessage, contextualMem ?? null, history)
    const gameHandoffResponseHint = buildGameHandoffResponseHint(gameHandoffNextStep)
    const llmMsgs: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemWithContext },
      ...(gameHandoffResponseHint ? [{ role: 'system' as const, content: gameHandoffResponseHint }] : []),
      ...(conversationMoveNote ? [{ role: 'system' as const, content: conversationMoveNote }] : []),
      ...history.slice(-12).map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: morningMsg
          ? `${morningMsg}\n（ユーザーの返答：${userMessage}）`
          : userName
            ? `[話しかけているのは${userName}] ${userMessage}`
            : userMessage },
    ]

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: object) => {
          controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'))
        }

        let reply = ''
        let assistantMeta: AssistantMeta | null = null
        try {
          if (precomputedReply !== null) {
            // テンプレ系：単一 chunk で送出（streaming プロトコルだが内容は一発）
            const structuredReply = withGameHandoffNextStep(parseAssistantReply(precomputedReply), gameHandoffNextStep)
            reply = stringifyAssistantMessage(structuredReply)
            assistantMeta = toAssistantMeta(structuredReply)
            send({ type: 'chunk', text: reply })
          } else {
            // LLM ストリーミング（gemini-2.5-flash → quota 超過時 gemini-1.5-pro へフォールバック）
            const streamFromGemini = async (model: string) => {
              let raw = ''
              const res = await gemini.chat.completions.create({
                model,
                // Gemini 2.5 系は thinking トークンが max_tokens に含まれるため余裕を持たせる
                // （500 だと思考に食われて 30 文字で打ち切られる事象を確認済み）
                max_tokens: 2000,
                messages: llmMsgs,
                stream: true,
              })
              for await (const part of res) {
                const delta = part.choices[0]?.delta?.content ?? ''
                if (delta) {
                  raw += delta
                  send({ type: 'chunk', text: delta })
                }
              }
              return raw
            }

            let raw: string
            try {
              raw = await streamFromGemini('gemini-2.5-flash')
            } catch (primaryErr: any) {
              const isQuotaErr =
                primaryErr?.status === 429 ||
                primaryErr?.status === 402 ||
                String(primaryErr?.message ?? '').toLowerCase().includes('quota') ||
                String(primaryErr?.message ?? '').toLowerCase().includes('resource_exhausted')
              if (isQuotaErr) {
                console.warn('[chat] gemini-2.5-flash quota exceeded, falling back to gemini-1.5-pro')
                // フォールバック前に既に積まれた途中 raw は破棄して replace で上書きする
                send({ type: 'replace', text: '' })
                raw = await streamFromGemini('gemini-1.5-pro')
              } else {
                throw primaryErr
              }
            }
            const structuredReply = withGameHandoffNextStep(parseAssistantReply(raw), gameHandoffNextStep)
            assistantMeta = toAssistantMeta(structuredReply)
            reply = truncateAtSentence(stringifyAssistantMessage(structuredReply), 400)
            // 切り詰めが入った時だけクライアント側に最終形を上書きさせる
            if (reply !== raw) send({ type: 'replace', text: reply })
          }

          // フリープラン記憶フェードヒント（light_normal / light_probe のみ、低確率付加）
          if (route.routeType !== 'claude_serious') {
            try {
              const fadeHint = await getMemoryFadeHint(userId)
              if (fadeHint && Math.random() < 0.15) {
                const tail = `\n\n${fadeHint}`
                reply = `${reply}${tail}`
                send({ type: 'chunk', text: tail })
              }
            } catch (e) {
              console.warn('[subscription] fadeHint error:', e)
            }
          }

          // pending 確認返答を先頭に付加（矛盾確認済み or 新規矛盾検出）
          if (profileConfirmReply) {
            reply = `${profileConfirmReply}\n${reply}`
            send({ type: 'replace', text: reply })
          } else if (conflicts.length > 0) {
            const c = conflicts[0]
            const fieldLabel: Record<string, string> = { gender: '性別', age: '年齢', marital_status: '婚姻状況', occupation: '職業', living_situation: '居住状況', name: '名前' }
            const tail = `\n\nあ、ちょっと確認していい？${fieldLabel[c.field]}って「${c.detected}」ってこと？（設定は「${c.current}」になってる）`
            reply = `${reply}${tail}`
            send({ type: 'chunk', text: tail })
          }

          // 5. メッセージ保存（fire-and-forget）
          // work_items の source_message_id 用にユーザー発言の id だけ拾う（失敗しても会話は壊さない）
          const now = Date.now()
          const userMessageIdPromise: Promise<string | null> = Promise.resolve(
            supabaseAdmin.from(T.messages).insert([
              { user_id: userId, role: 'user',      content: userMessage, created_at: new Date(now).toISOString() },
              { user_id: userId, role: 'assistant', content: reply, route_type: route.routeType, created_at: new Date(now + 1).toISOString() },
            ]).select('id'),
          ).then(
            res => res.data?.[0]?.id ?? null,
            () => null,
          )

          // 6. routing_log 保存
          supabaseAdmin.from(T.routingLog).insert({
            user_id:    userId, route_type: route.routeType,
            user_message: userMessage,
            msg_score:  route.msgScore, win_score: route.windowScore,
            heavy_signal_count: route.heavyCount,
            model_used: route.routeType === 'light_probe' ? 'template' : 'gemini-flash',
            assistant_response: reply, prompt_version: 'v6',
          }).then(() => {})

          // 7. 抽出（条件付き、after() でレスポンス送信後に実行）
          const hasNameHint = /名前|って言|と申し|と呼ん/.test(userMessage)
          // 短い作業報告（「migration書けた」等）は msgScore が低く抽出をスキップしがちなので、
          // 作業シグナルでも起動する（pivot Phase 1: 取り漏らしの方が高くつく）
          const shouldExtract = route.msgScore >= 2 || history.length >= 6 || hasNameHint || hasWorkSignal(userMessage)
          if (shouldExtract) {
            after(async () => {
              try {
                const { extractConversation } = await import('../../../lib/lunaria/extraction')
                const { updateEmotion: updateEm } = await import('../../../lib/lunaria/emotion')
                const recentMsgs = [
                  ...history.slice(-4).map((m: any) => ({ role: m.role as 'user' | 'ai', content: m.content })),
                  { role: 'user' as const, content: userMessage },
                  { role: 'ai'   as const, content: reply },
                ]
                const extraction = await extractConversation(recentMsgs, { knownName: userName ?? undefined })
                await updateEm(extraction.emotions, userId)

                if (extraction.long_term_candidate?.type && extraction.long_term_candidate?.content) {
                  const { saveMemoryCandidate } = await import('../../../lib/lunaria/memory-candidates')
                  await saveMemoryCandidate(
                    extraction.long_term_candidate.type,
                    extraction.long_term_candidate.content,
                    userId,
                    {
                      sourceType: 'conversation',
                      sourceDate,
                      confidence: Math.min(1, Math.max(0.5, (extraction.importance_score ?? 3) / 5)),
                      reason: extraction.summary,
                    },
                  )
                }
                if (extraction.work_items.length > 0) {
                  const { saveWorkItems } = await import('../../../lib/lunaria/work-items')
                  const sourceMessageId = await userMessageIdPromise
                  await saveWorkItems(extraction.work_items, userId, { date: sourceDate, sourceMessageId })
                }
                await supabaseAdmin.from(T.extractions).insert({
                  user_id: userId,
                  session_date: new Date().toISOString().split('T')[0],
                  summary:              extraction.summary,
                  emotions:             extraction.emotions,
                  importance_score:     extraction.importance_score,
                  self_disclosure_depth: extraction.self_disclosure_depth,
                  affinity_delta:       extraction.affinity_delta,
                  status_updates:       extraction.status_updates,
                  unresolved_issues:    extraction.unresolved_issues,
                  long_term_candidate:  extraction.long_term_candidate,
                })
              } catch (e) { console.warn('[extract]', e) }
            })
          }

          // 8. ガチャチケット獲得判定（質スコア配布）
          // 1 日上限 5 枚は gacha.ts 内で吸収。失敗しても会話自体には影響させない。
          let ticketGranted = false
          let ticketTotal = 0
          try {
            const grant = await tryGrantTicketByScore(route.msgScore, userId)
            ticketGranted = grant.granted
            ticketTotal   = grant.ticket_count
          } catch (e) {
            console.warn('[gacha] ticket grant failed', e)
          }

          // 最終 done イベント（クライアントはこの reply を canonical として扱う）
          send({
            type: 'done',
            data: {
              reply,
              routeType:             route.routeType,
              prevScores:            route.prevScores,
              prevHeavy:             route.heavyCount,
              morningMsg:            morningMsg ?? null,
              conversationMode,
              consecutiveTopicCount: newConsecutiveCount,
              lastTopic:             topicResult.current_topic,
              lastSubtopic:          topicResult.subtopic,
              coverage:              newCoverage,
              lastSeriousAt:         route.lastSeriousAt,
              lastMemorySurfacedAt:  newLastMemorySurfacedAt,
              userName:              userName ?? '',
              ticketGranted,
              ticketTotal,
              assistantMeta,
            },
          })
        } catch (e) {
          console.error('[chat/send-stream]', e)
          send({ type: 'done', data: { reply: 'ちょい待って', error: true } })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type':     'application/x-ndjson; charset=utf-8',
        'Cache-Control':    'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    })

  } catch (e) {
    console.error('[chat/send]', e)
    return NextResponse.json({
      reply: 'ちょい待って',
      error: true,
    }, { status: 500 })
  }
}
