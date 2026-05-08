export const LUNARIA_REACTIONS = [
  'normal_idle',
  'gentle_idle',
  'smile_nod',
  'small_wave',
  'teasing_tilt',
  'serious_forward',
  'thinking_pose',
  'sad_lookdown',
  'surprised_react',
  'presenting_item',
] as const

export type LunariaReactionId = (typeof LUNARIA_REACTIONS)[number]

export type LunariaReactionPriority = 'P0' | 'P1'

export interface LunariaReactionDefinition {
  id: LunariaReactionId
  role: string
  expression: readonly string[]
  motion: readonly string[]
  priority: LunariaReactionPriority
}

export const DEFAULT_REACTION: LunariaReactionId = 'normal_idle'
export const DEFAULT_OUTFIT_ID = 'default'

export const LUNARIA_REACTION_DEFINITIONS: Record<
  LunariaReactionId,
  LunariaReactionDefinition
> = {
  normal_idle: {
    id: 'normal_idle',
    role: 'Default waiting pose for neutral home and chat states.',
    expression: ['normal'],
    motion: ['idle'],
    priority: 'P0',
  },
  gentle_idle: {
    id: 'gentle_idle',
    role: 'Soft acceptance, calm listening, and quiet late-night presence.',
    expression: ['gentle_smile'],
    motion: ['idle'],
    priority: 'P0',
  },
  smile_nod: {
    id: 'smile_nod',
    role: 'Light affirmation and warm acknowledgement.',
    expression: ['smile', 'gentle_smile'],
    motion: ['nod'],
    priority: 'P0',
  },
  small_wave: {
    id: 'small_wave',
    role: 'Greeting, farewell, and returning-to-the-room moments.',
    expression: ['smile', 'gentle_smile'],
    motion: ['small_wave'],
    priority: 'P1',
  },
  teasing_tilt: {
    id: 'teasing_tilt',
    role: 'Playful banter, light teasing, and partner-in-crime moments.',
    expression: ['teasing'],
    motion: ['tilt_head'],
    priority: 'P0',
  },
  serious_forward: {
    id: 'serious_forward',
    role: 'Serious support, high-trust conversations, and no-escape honesty.',
    expression: ['serious'],
    motion: ['lean_forward'],
    priority: 'P0',
  },
  thinking_pose: {
    id: 'thinking_pose',
    role: 'Thinking before answering, judging nuance, and reflection.',
    expression: ['thinking'],
    motion: ['tilt_head', 'look_away'],
    priority: 'P1',
  },
  sad_lookdown: {
    id: 'sad_lookdown',
    role: 'Quiet empathy when the user is sad or exhausted.',
    expression: ['sad'],
    motion: ['close_eyes', 'nod'],
    priority: 'P1',
  },
  surprised_react: {
    id: 'surprised_react',
    role: 'High-rarity gacha results and unexpected positive moments.',
    expression: ['surprised'],
    motion: ['idle'],
    priority: 'P1',
  },
  presenting_item: {
    id: 'presenting_item',
    role: 'Gacha rewards, diary completion, and memory candidate presentation.',
    expression: ['gentle_smile', 'smile'],
    motion: ['custom_pose'],
    priority: 'P0',
  },
}

export type LunariaReactionContext =
  | 'home_idle'
  | 'chat_default'
  | 'chat_acceptance'
  | 'chat_positive'
  | 'chat_teasing'
  | 'chat_serious'
  | 'chat_thinking'
  | 'user_sad'
  | 'gacha_result'
  | 'gacha_high_rarity'
  | 'diary_generated'
  | 'memory_candidate'
  | 'late_night_idle'

export const REACTION_BY_CONTEXT: Record<LunariaReactionContext, LunariaReactionId> = {
  home_idle: 'normal_idle',
  chat_default: 'normal_idle',
  chat_acceptance: 'gentle_idle',
  chat_positive: 'smile_nod',
  chat_teasing: 'teasing_tilt',
  chat_serious: 'serious_forward',
  chat_thinking: 'thinking_pose',
  user_sad: 'sad_lookdown',
  gacha_result: 'presenting_item',
  gacha_high_rarity: 'surprised_react',
  diary_generated: 'presenting_item',
  memory_candidate: 'presenting_item',
  late_night_idle: 'gentle_idle',
}

export const REACTION_FALLBACKS: Record<LunariaReactionId, readonly LunariaReactionId[]> = {
  normal_idle: ['normal_idle'],
  gentle_idle: ['gentle_idle', 'normal_idle'],
  smile_nod: ['smile_nod', 'gentle_idle', 'normal_idle'],
  small_wave: ['small_wave', 'smile_nod', 'gentle_idle', 'normal_idle'],
  teasing_tilt: ['teasing_tilt', 'smile_nod', 'normal_idle'],
  serious_forward: ['serious_forward', 'gentle_idle', 'normal_idle'],
  thinking_pose: ['thinking_pose', 'gentle_idle', 'normal_idle'],
  sad_lookdown: ['sad_lookdown', 'gentle_idle', 'normal_idle'],
  surprised_react: ['surprised_react', 'presenting_item', 'normal_idle'],
  presenting_item: ['presenting_item', 'gentle_idle', 'normal_idle'],
}

export interface PortraitAssetFallbackInput {
  outfitId?: string | null
  reaction?: LunariaReactionId | null
  outfitDefaultReaction?: LunariaReactionId | null
  defaultOutfitId?: string
}

export function isLunariaReactionId(value: unknown): value is LunariaReactionId {
  return typeof value === 'string' && LUNARIA_REACTIONS.includes(value as LunariaReactionId)
}

export function getReactionForContext(context: LunariaReactionContext): LunariaReactionId {
  return REACTION_BY_CONTEXT[context]
}

export function getReactionFallbacks(reaction: LunariaReactionId): readonly LunariaReactionId[] {
  return REACTION_FALLBACKS[reaction] ?? REACTION_FALLBACKS[DEFAULT_REACTION]
}

export function getPortraitAssetFallbacks(input: PortraitAssetFallbackInput): string[] {
  const outfitId = input.outfitId || DEFAULT_OUTFIT_ID
  const defaultOutfitId = input.defaultOutfitId || DEFAULT_OUTFIT_ID
  const requestedReaction = input.reaction || DEFAULT_REACTION
  const outfitDefaultReaction = input.outfitDefaultReaction || DEFAULT_REACTION

  const candidates = [
    portraitPath(outfitId, requestedReaction),
    portraitPath(outfitId, outfitDefaultReaction),
    portraitPath(defaultOutfitId, requestedReaction),
    portraitPath(defaultOutfitId, DEFAULT_REACTION),
  ]

  return Array.from(new Set(candidates))
}

function portraitPath(outfitId: string, reaction: LunariaReactionId): string {
  return `/lunaria/portrait/${outfitId}/${reaction}.png`
}
