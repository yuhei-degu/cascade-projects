import { supabaseAdmin } from '../supabase'

export type ProfileField =
  | 'gender'
  | 'age'
  | 'marital_status'
  | 'occupation'
  | 'living_situation'
  | 'name'
  // 今回は未使用だが将来の EAV 拡張用
  | 'age_band'
  | 'user_nickname'
  | 'lunaria_nickname'
  | 'lifestyle_pattern'

export interface ProfileEntry {
  field: ProfileField
  value: string
  source: 'setting' | 'confirmed'
}

export interface PendingUpdate {
  field: ProfileField
  detected_value: string
  trigger_message: string
}

// ── 取得 ─────────────────────────────────────────────────────
export async function getProfile(userId: string): Promise<ProfileEntry[]> {
  const { data } = await supabaseAdmin
    .from('lunaria_user_profile')
    .select('field, value, source')
    .eq('user_id', userId)
  return (data ?? []) as ProfileEntry[]
}

export async function getPendingUpdates(userId: string): Promise<PendingUpdate[]> {
  const { data } = await supabaseAdmin
    .from('lunaria_pending_profile_updates')
    .select('field, detected_value, trigger_message')
    .eq('user_id', userId)
  return (data ?? []) as PendingUpdate[]
}

// ── 保存・アーカイブ ──────────────────────────────────────────
export async function setProfile(
  field: ProfileField,
  value: string,
  userId: string,
  source: 'setting' | 'confirmed' = 'setting',
): Promise<void> {
  // 既存値をアーカイブ
  const { data: existing } = await supabaseAdmin
    .from('lunaria_user_profile')
    .select('value')
    .eq('user_id', userId)
    .eq('field', field)
    .single()

  if (existing?.value && existing.value !== value) {
    await supabaseAdmin.from('lunaria_profile_archive').insert({
      user_id: userId, field,
      old_value: existing.value, new_value: value,
    })
  }

  await supabaseAdmin.from('lunaria_user_profile').upsert({
    user_id: userId, field, value, source,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,field' })
}

// ── 矛盾検出・pending 保存 ────────────────────────────────────
export async function savePendingUpdate(
  field: ProfileField,
  detected_value: string,
  trigger_message: string,
  userId: string,
): Promise<void> {
  await supabaseAdmin.from('lunaria_pending_profile_updates').upsert({
    user_id: userId, field, detected_value, trigger_message,
    created_at: new Date().toISOString(),
  }, { onConflict: 'user_id,field' })
}

export async function clearPendingUpdate(field: ProfileField, userId: string): Promise<void> {
  await supabaseAdmin.from('lunaria_pending_profile_updates')
    .delete()
    .eq('user_id', userId)
    .eq('field', field)
}

// ── プロンプト用コンテキスト生成 ──────────────────────────────
const FIELD_LABEL: Record<ProfileField, string> = {
  gender:           '性別',
  age:              '年齢',
  marital_status:   '婚姻状況',
  occupation:       '職業',
  living_situation: '居住状況',
  name:             '名前',
  age_band:         '年代',
  user_nickname:    '呼び名',
  lunaria_nickname: 'ルナの呼ばれ方',
  lifestyle_pattern:'生活パターン',
}

export function buildProfileContext(profile: ProfileEntry[]): string {
  if (profile.length === 0) return ''
  const lines = profile.map(p => `・${FIELD_LABEL[p.field] ?? p.field}：${p.value}`)
  return `\n\n## ユーザーの基本情報（設定値・変更は確認必須）\n${lines.join('\n')}`
}

// ── 会話テキストから矛盾を検出 ────────────────────────────────
const CONFLICT_PATTERNS: Array<{
  field: ProfileField
  patterns: RegExp[]
  extract: (m: RegExpMatchArray) => string
}> = [
  {
    // 「俺は男」「男です」など明確な性別宣言のみ（「俺」単体は除外）
    field: 'gender',
    patterns: [/(?:俺|僕)は男/, /男(?:です|だよ|なんだ|なの)/],
    extract: () => '男性',
  },
  {
    field: 'gender',
    patterns: [/(?:私|あたし)は女/, /女(?:です|だよ|なんだ|なの)/],
    extract: () => '女性',
  },
  {
    field: 'marital_status',
    patterns: [/(?:結婚|既婚|妻|夫|旦那|嫁)(?:して|がいる|です|した)/],
    extract: () => '既婚',
  },
  {
    field: 'marital_status',
    patterns: [/離婚(?:した|しました|してて)/],
    extract: () => '離婚',
  },
  {
    // 「フリーランスになった」「独立した」など、明確な職業変更宣言のみ
    field: 'occupation',
    patterns: [/フリーランス(?:になった|になりました|です|始めた)/, /独立(?:した|しました)/],
    extract: () => 'フリーランス',
  },
  {
    // 正社員／会社員へ移行を宣言したケース
    field: 'occupation',
    patterns: [/(正社員|会社員)(?:になった|になりました)/],
    extract: (m) => m[1] ?? '会社員',
  },
]

export function detectProfileConflicts(
  text: string,
  profile: ProfileEntry[],
): Array<{ field: ProfileField; detected: string; current: string }> {
  const conflicts: Array<{ field: ProfileField; detected: string; current: string }> = []
  const profileMap = Object.fromEntries(profile.map(p => [p.field, p.value]))

  for (const { field, patterns, extract } of CONFLICT_PATTERNS) {
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        const detected = extract(match)
        const current = profileMap[field]
        if (current && current !== detected) {
          conflicts.push({ field, detected, current })
        }
        break
      }
    }
  }
  return conflicts
}
