import { supabaseAdmin } from '../supabase'
import { setProfile } from './profile'

const USER_ID = '00000000-0000-0000-0000-000000000001'
const T = { coreMem: 'lunaria_core_memory' } as const

// ── Profile と core_memory の役割分離ガード ────────────────────
// プロフィール相当の属性言及は core_memory に流さない。
// （gender / occupation / age などは user_profile 側が真実権限）
const PROFILE_MENTION_PATTERNS: RegExp[] = [
  /ユーザーの性別|性別[:：]|(?:^|[^男女長])(?:男性|女性)(?:$|[^的性])/,
  /ユーザーの年齢|ユーザーの年代|(?:^|\D)(?:10|20|30|40|50|60)代(?:$|\D)/,
  /ユーザーの職業|IT\s*エンジニア|会社員(?:$|です)|フリーランス|SES/,
  /ユーザーの(?:居住|住所|在住|住まい)/,
]

function looksLikeProfileMention(content: string): boolean {
  const t = (content ?? '').trim()
  if (t.length === 0) return false
  return PROFILE_MENTION_PATTERNS.some(p => p.test(t))
}

// 名前を直接検出（Gemini抽出に依存しない）
const NAME_PATTERNS = [
  /(?:俺|私|僕|自分)(?:は|の名前は|って)[\s]*([^\s。、！？]{1,8})(?:って|と|です|だ|という|ていう)/,
  /名前は[\s]*([^\s。、！？]{1,8})(?:です|だ|って|ね|よ)/,
  /([^\s。、！？]{1,8})って(?:名前|いう名前)/,
  /([^\s。、！？]{2,6})(?:という名前|って名前|っていう名前)/,
]

export function detectNameFromMessage(message: string): string | null {
  for (const pattern of NAME_PATTERNS) {
    const match = message.match(pattern)
    if (match?.[1]) {
      const name = match[1].trim()
      if (name.length >= 2 && name.length <= 6) return name
    }
  }
  return null
}

// core_memory に保存。
// - type='name'：user_profile へリダイレクト（core_memory には書かない）
// - 内容が profile 相当（性別・職業・年齢・居住）：書き込みをスキップ
// - それ以外：content ベースで重複チェックして INSERT / UPDATE
// （4/18 設計変更：memory_category='profile' を付ける canonical ルールは廃止。
//   属性系の真実権限は user_profile 側へ一元化した）
export async function saveCoreMemory(
  type: string,
  content: string,
): Promise<void> {
  const normalized = (content ?? '').trim()
  if (normalized.length === 0) {
    console.log('[saveCoreMemory] skipped empty content')
    return
  }

  // name はプロフィール層へリダイレクト
  if (type === 'name') {
    try {
      await setProfile('name', normalized, 'setting')
      console.log('[saveCoreMemory] redirected type=name to user_profile:', normalized)
    } catch (e) {
      console.warn('[saveCoreMemory] name redirect failed:', e)
    }
    return
  }

  // Profile 相当の属性言及は core_memory に流さない（ガードレール）
  if (looksLikeProfileMention(normalized)) {
    console.log('[saveCoreMemory] skipped profile-like content:', type, normalized)
    return
  }

  // content ベースで重複チェック
  const { data: existing } = await supabaseAdmin
    .from(T.coreMem)
    .select('id')
    .eq('user_id', USER_ID)
    .eq('type', type)
    .eq('content', normalized)
    .maybeSingle()

  if (existing) {
    await supabaseAdmin.from(T.coreMem)
      .update({ score: 5, hit_count: 1, last_seen: new Date().toISOString() })
      .eq('id', existing.id)
    console.log('[saveCoreMemory] updated:', type, normalized)
  } else {
    await supabaseAdmin.from(T.coreMem)
      .insert({ user_id: USER_ID, type, content: normalized, score: 5, hit_count: 1 })
    console.log('[saveCoreMemory] inserted:', type, normalized)
  }
}

// claude_serious 時のプロンプト注入用：memory_category != 'profile' を 1 件
export type PickedMemory = {
  id: string
  type: string
  content: string
  score: number | null
  last_seen: string | null
  memory_category: string | null
}

export async function pickMemories(limit: number = 1): Promise<PickedMemory[]> {
  const { data, error } = await supabaseAdmin
    .from(T.coreMem)
    .select('id, type, content, score, last_seen, memory_category')
    .eq('user_id', USER_ID)
    .or('memory_category.is.null,memory_category.neq.profile')
    .order('score', { ascending: false })
    .order('last_seen', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('[memory] pickMemories failed', error)
    return []
  }
  return (data ?? []) as PickedMemory[]
}

// ユーザー名だけ取得（devパネル表示用）。
// 4/18 以降、user_profile が真実権限。core_memory に user_name が残っている
// ケース（レガシー）にも一応フォールバックする。
export async function getUserName(): Promise<string | null> {
  // 1) まず user_profile を優先
  const { data: prof } = await supabaseAdmin
    .from('lunaria_user_profile')
    .select('value')
    .eq('user_id', USER_ID)
    .eq('field', 'name')
    .maybeSingle()
  if (prof?.value) return prof.value

  // 2) レガシーフォールバック：core_memory 側
  const { data } = await supabaseAdmin
    .from(T.coreMem)
    .select('content')
    .eq('user_id', USER_ID)
    .eq('memory_key', 'user_name')
    .maybeSingle()
  return data?.content ?? null
}

export async function getCoreMemoryContext(): Promise<string> {
  // memory_category='profile' は除外（Profile 層で注入済み／二重注入防止）
  const { data } = await supabaseAdmin
    .from(T.coreMem)
    .select('type, content, memory_key, memory_category')
    .eq('user_id', USER_ID)
    .or('memory_category.is.null,memory_category.neq.profile')
    .order('score', { ascending: false })
    .limit(5)

  if (!data || data.length === 0) return ''

  // name は Profile 層に移ったため、ここでは特別扱いしない
  const lines: string[] = []
  data.slice(0, 3).forEach((m: any) => {
    const content = m.content.length > 30 ? m.content.slice(0, 30) + '…' : m.content
    lines.push(`・${content}`)
  })

  return `\n\n## 知っていること\n${lines.join('\n')}`
}

// 過去の重要記憶を条件付きで注入
// - 関連トピックが出た時
// - 重要度4以上
// - 3日以上前
export async function getContextualMemory(
  currentTopic: string,
): Promise<string | null> {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

  const { data } = await supabaseAdmin
    .from('lunaria_extractions')
    .select('summary, unresolved_issues, created_at')
    .eq('user_id', USER_ID)
    .gte('importance_score', 4)
    .lte('created_at', threeDaysAgo)
    .order('created_at', { ascending: false })
    .limit(5)

  if (!data || data.length === 0) return null

  // トピック関連性チェック
  const TOPIC_KEYWORDS: Record<string, string[]> = {
    work:     ['仕事', '職場', '会社', '上司', '同僚', '転職', '休職', '診断'],
    health:   ['体調', '病気', '精神科', '病院', '診断書', '休職'],
    relation: ['恋愛', '彼女', '彼氏', '別れ', '友達'],
    money:    ['給料', '収入', 'お金', '借金'],
  }

  const keywords = TOPIC_KEYWORDS[currentTopic] ?? []
  const relevant = data.filter((e: any) =>
    keywords.some(k => (e.summary ?? '').includes(k) ||
      (e.unresolved_issues ?? []).some((u: string) => u.includes(k)))
  )

  if (relevant.length === 0) return null

  const latest = relevant[0]
  const issues = (latest.unresolved_issues ?? []).slice(0, 1)
  if (issues.length === 0) return null

  return `\n\n## 前回の未解決の話題（自然な流れで1文だけ触れてよい）\n・${issues[0]}`
}

// ── light_probe 時の伏線回収用 ────────────────────────────────
// 7日以上前の重要な未解決トピックを1件返す
export async function getMemoryForProbe(): Promise<string | null> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data } = await supabaseAdmin
    .from('lunaria_extractions')
    .select('unresolved_issues, summary, created_at')
    .eq('user_id', USER_ID)
    .gte('importance_score', 3)
    .lte('created_at', sevenDaysAgo)
    .order('importance_score', { ascending: false })
    .limit(5)

  if (!data || data.length === 0) return null

  // unresolved_issues がある抽出結果を優先
  for (const item of data) {
    const issues: string[] = item.unresolved_issues ?? []
    if (issues.length > 0) return issues[0]
  }

  // なければ summary（30字以内に切る）
  const summary = data[0]?.summary ?? ''
  return summary.length > 30 ? summary.slice(0, 30) + '…' : summary || null
}

// 伏線回収テンプレートを生成（「こないだ〇〇って言ってたじゃん」系）
export function buildMemorySurfaceReply(memoryContent: string): string {
  const templates = [
    `こないだ「${memoryContent}」って話してたじゃん、あれどうなった？`,
    `そういえば前に「${memoryContent}」って言ってたけど、その後どう？`,
    `ちょっと気になってたんだけど、前の「${memoryContent}」の件さ、今どんな感じ？`,
    `前に「${memoryContent}」って話してたこと、まだ続いてたりする？`,
  ]
  return templates[Math.floor(Math.random() * templates.length)]
}
