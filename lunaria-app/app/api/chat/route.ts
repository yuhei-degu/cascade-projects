import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import OpenAI from 'openai'
import { calcRoute, getProbeTemplate } from '@/lib/lunaria/routing'
import { applySleepDecay, updateEmotion, getEmotion } from '@/lib/lunaria/emotion'
import { getAffinity } from '@/lib/lunaria/affinity'
import { getMorningOpening } from '@/lib/lunaria/diary'
import { supabaseAdmin } from '@/lib/supabase'
import { LUNARIA_SYSTEM_PROMPT } from '@/lib/prompt'

const gemini = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
})

const USER_ID = '00000000-0000-0000-0000-000000000001'
const T = {
  messages:    'lunaria_messages',
  routingLog:  'lunaria_routing_log',
  extractions: 'lunaria_extractions',
} as const

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const userMessage: string  = body.message
    const prevScores: number[] = body.prevScores ?? []
    const prevHeavy: number    = body.prevHeavy ?? 0
    const history              = body.history ?? []

    // 1. 睡眠トリガー（日付変更で感情減衰）
    await applySleepDecay()

    // 2. ルーティング判定
    const route = calcRoute(userMessage, prevScores, prevHeavy)

    // 3. 感情・親密度を取得してプロンプトに注入
    const [emotion, affinity, morningMsg] = await Promise.all([
      getEmotion(),
      getAffinity(),
      history.length === 0 ? getMorningOpening() : Promise.resolve(null),
    ])

    // 4. 応答生成
    let reply = ''

    if (route.routeType === 'light_probe') {
      reply = morningMsg ?? getProbeTemplate(route.windowScore)
    } else {
      const closenessNote = affinity.unlock_secret
        ? '（親密度MAX：本音・図々しさ全開でOK）'
        : affinity.unlock_honest
          ? '（親密度高：本音や少し図々しい態度OK）'
          : affinity.unlock_casual
            ? '（タメ口・軽口OK）'
            : ''

      const systemWithContext = `${LUNARIA_SYSTEM_PROMPT}

## 現在の感情状態
喜び:${emotion.joy} 怒り:${emotion.anger} 悲しみ:${emotion.sadness}
照れ:${emotion.shyness} 孤独:${emotion.loneliness} 不安:${emotion.anxiety}
${closenessNote}`

      const msgs: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemWithContext },
        ...history.slice(-6).map((m: any) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user', content: morningMsg
            ? `${morningMsg}\n（ユーザーの返答：${userMessage}）`
            : userMessage },
      ]

      const res = await gemini.chat.completions.create({
        model: 'gemini-1.5-flash', max_tokens: 200, messages: msgs,
      })
      reply = res.choices[0]?.message?.content ?? 'ちょい待って'
    }

    // 5. メッセージ保存（fire-and-forget）
    supabaseAdmin.from(T.messages).insert([
      { user_id: USER_ID, role: 'user',      content: userMessage },
      { user_id: USER_ID, role: 'assistant', content: reply, route_type: route.routeType },
    ]).then(() => {})

    // 6. routing_log 保存
    supabaseAdmin.from(T.routingLog).insert({
      user_id:    USER_ID, route_type: route.routeType,
      user_message: userMessage,
      msg_score:  route.msgScore, win_score: route.windowScore,
      heavy_signal_count: route.heavyCount,
      model_used: route.routeType === 'light_probe' ? 'template' : 'gemini-flash',
      assistant_response: reply, prompt_version: 'v6',
    }).then(() => {})

    // 7. 非同期で会話抽出（after()でレスポンス後に実行）
    // 雑談 + 会話が浅い場合はスキップ（コスト削減・性能影響ほぼなし）
    const shouldExtract = route.msgScore >= 2 || history.length >= 6
    if (!shouldExtract) {
      return NextResponse.json({
        reply, routeType: route.routeType,
        prevScores: route.prevScores, prevHeavy: route.heavyCount, morningMsg: morningMsg ?? null,
      })
    }

    after(async () => {
      try {
        const { extractConversation } = await import('@/lib/lunaria/extraction')
        const { updateEmotion: updateEm } = await import('@/lib/lunaria/emotion')
        const recentMsgs = [
          ...history.slice(-4).map((m: any) => ({ role: m.role as 'user' | 'ai', content: m.content })),
          { role: 'user' as const, content: userMessage },
          { role: 'ai'   as const, content: reply },
        ]
        const extraction = await extractConversation(recentMsgs)
        await updateEm(extraction.emotions)
        await supabaseAdmin.from(T.extractions).insert({
          user_id: USER_ID,
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

    return NextResponse.json({
      reply,
      routeType:   route.routeType,
      prevScores:  route.prevScores,
      prevHeavy:   route.heavyCount,
      morningMsg:  morningMsg ?? null,
    })

  } catch (e) {
    console.error('[chat/send]', e)
    return NextResponse.json({ reply: 'ちょい待って', error: true }, { status: 500 })
  }
}
