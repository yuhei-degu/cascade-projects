import { supabaseAdmin, T } from '../supabase'

export type CharacterItemCategory =
  | 'outfit'
  | 'accessory'
  | 'background'
  | 'room_item'
  | 'expression_unlock'
  | 'motion_unlock'
  | 'special_diary_skin'
  | 'small_item'
  | 'urban_legend'

export type CharacterItemRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'urban_legend'

export interface CharacterItemView {
  id: string
  pool_id?: string
  name: string
  category: CharacterItemCategory
  rarity: CharacterItemRarity
  description: string
  effect: string
  flavor_text: string
  owned: boolean
  duplicate_count: number
  obtained_at: string | null
  source: 'user_items' | 'gacha_inventory' | 'mock'
}

export interface ItemsOverview {
  items: CharacterItemView[]
  source: 'user_items' | 'gacha_inventory' | 'mock'
  db_ready: boolean
  note: string
}

export interface CharacterStateView {
  character_profile_id: string
  current_outfit_id: string
  current_outfit_name: string
  current_background_id: string
  current_background_name: string
  current_expression: string
  current_motion: string
  affinity_level: number
  affinity_streak_days: number
  unlocked_expressions: string[]
  unlocked_motions: string[]
  total_items_owned: number
  total_items_pool: number
  last_interaction_at: string | null
  source: 'character_states' | 'mock'
  db_ready: boolean
  note: string
}

const FALLBACK_ITEMS: CharacterItemView[] = [
  {
    id: 'outfit_default',
    name: 'Moonlit Uniform',
    category: 'outfit',
    rarity: 'common',
    description: 'Lunaria default outfit for quiet night conversations.',
    effect: 'default outfit',
    flavor_text: 'An ordinary night, an ordinary me.',
    owned: true,
    duplicate_count: 0,
    obtained_at: null,
    source: 'mock',
  },
  {
    id: 'acc_moon_pin',
    name: 'Crescent Hairpin',
    category: 'accessory',
    rarity: 'common',
    description: 'A small moon-shaped pin that catches the light.',
    effect: 'hair accessory',
    flavor_text: 'A marker so I do not get lost.',
    owned: true,
    duplicate_count: 0,
    obtained_at: null,
    source: 'mock',
  },
  {
    id: 'bg_window_night',
    name: 'Window at Night',
    category: 'background',
    rarity: 'common',
    description: 'A room where moonlight and streetlights blur together.',
    effect: 'background',
    flavor_text: 'Someone is still awake out there.',
    owned: true,
    duplicate_count: 0,
    obtained_at: null,
    source: 'mock',
  },
  {
    id: 'expr_embarrassed',
    name: 'Embarrassed Expression',
    category: 'expression_unlock',
    rarity: 'rare',
    description: 'A shy look that slips away for half a second.',
    effect: 'unlocks embarrassed expression',
    flavor_text: 'Do not stare. Well, maybe just a little.',
    owned: false,
    duplicate_count: 0,
    obtained_at: null,
    source: 'mock',
  },
  {
    id: 'motion_small_wave',
    name: 'Small Wave',
    category: 'motion_unlock',
    rarity: 'rare',
    description: 'A small wave at the edge of goodbye.',
    effect: 'unlocks small_wave motion',
    flavor_text: 'I just wanted to say see you.',
    owned: false,
    duplicate_count: 0,
    obtained_at: null,
    source: 'mock',
  },
]

function isMissingTable(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const record = error as { code?: unknown; message?: unknown }
  const text = `${String(record.code ?? '')} ${String(record.message ?? '')}`
  return (
    text.includes('PGRST205') ||
    text.includes('PGRST202') ||
    text.includes('42P01') ||
    text.includes('lunaria_user_items') ||
    text.includes('lunaria_character_states')
  )
}

function mapRarity(rarity: string | null | undefined): CharacterItemRarity {
  if (rarity === 'urban_legend') return 'urban_legend'
  if (rarity === 'legendary') return 'legendary'
  if (rarity === 'epic') return 'epic'
  if (rarity === 'rare_a' || rarity === 'rare_b' || rarity === 'rare') return 'rare'
  return 'common'
}

function mapCategory(category: string | null | undefined, rarity?: string | null): CharacterItemCategory {
  if (rarity === 'urban_legend' || category === 'urban_legend') return 'urban_legend'
  if (category === 'accessory') return 'accessory'
  if (category === 'furniture') return 'room_item'
  if (category === 'small_item') return 'small_item'
  return 'small_item'
}

function flavorFor(rarity: CharacterItemRarity): string {
  if (rarity === 'urban_legend') return 'Quiet enough to become a rumor.'
  if (rarity === 'legendary') return 'Special has its own temperature.'
  if (rarity === 'epic') return 'A small shine at the edge of night.'
  if (rarity === 'rare') return 'A sign only someone watching closely would notice.'
  return 'The kind of thing that belongs on a desk corner.'
}

export async function getItemsOverview(userId: string): Promise<ItemsOverview> {
  const poolResult = await supabaseAdmin
    .from(T.gachaPool)
    .select('id, name, rarity, category, description, image_url')
    .eq('is_active', true)
    .limit(1000)

  if (poolResult.error) {
    return {
      items: FALLBACK_ITEMS,
      source: 'mock',
      db_ready: false,
      note: `gacha pool unavailable: ${poolResult.error.message}`,
    }
  }

  const pool = poolResult.data ?? []
  const userItemsResult = await supabaseAdmin
    .from(T.userItems)
    .select('pool_id, duplicate_count, obtained_at, last_obtained_at')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .limit(5000)

  if (!userItemsResult.error) {
    const owned = new Map((userItemsResult.data ?? []).map(row => [row.pool_id, row]))
    return {
      items: pool.map(item => {
        const rarity = mapRarity(item.rarity)
        const ownership = owned.get(item.id)
        return {
          id: item.id,
          pool_id: item.id,
          name: item.name,
          category: mapCategory(item.category, item.rarity),
          rarity,
          description: item.description ?? 'A small item delivered from the Moonbox.',
          effect: item.category ?? 'moonbox item',
          flavor_text: flavorFor(rarity),
          owned: Boolean(ownership),
          duplicate_count: ownership?.duplicate_count ?? 0,
          obtained_at: ownership?.last_obtained_at ?? ownership?.obtained_at ?? null,
          source: 'user_items',
        }
      }),
      source: 'user_items',
      db_ready: true,
      note: 'Using lunaria_user_items.',
    }
  }

  if (!isMissingTable(userItemsResult.error)) throw userItemsResult.error

  const inventoryResult = await supabaseAdmin
    .from(T.gachaInventory)
    .select('pool_id, acquired_at')
    .eq('user_id', userId)
    .limit(5000)

  if (inventoryResult.error) {
    return {
      items: FALLBACK_ITEMS,
      source: 'mock',
      db_ready: false,
      note: `inventory fallback unavailable: ${inventoryResult.error.message}`,
    }
  }

  const owned = new Map((inventoryResult.data ?? []).map(row => [row.pool_id, row]))
  return {
    items: pool.map(item => {
      const rarity = mapRarity(item.rarity)
      const ownership = owned.get(item.id)
      return {
        id: item.id,
        pool_id: item.id,
        name: item.name,
        category: mapCategory(item.category, item.rarity),
        rarity,
        description: item.description ?? 'A small item delivered from the Moonbox.',
        effect: item.category ?? 'moonbox item',
        flavor_text: flavorFor(rarity),
        owned: Boolean(ownership),
        duplicate_count: 0,
        obtained_at: ownership?.acquired_at ?? null,
        source: 'gacha_inventory',
      }
    }),
    source: 'gacha_inventory',
    db_ready: false,
    note: 'lunaria_user_items is not available yet; using lunaria_gacha_inventory fallback.',
  }
}

export async function getCharacterStateOverview(userId: string): Promise<CharacterStateView> {
  const [itemsOverview, stateResult] = await Promise.all([
    getItemsOverview(userId),
    supabaseAdmin
      .from(T.characterStates)
      .select('character_profile_id, current_outfit_pool_id, current_background_pool_id, current_expression, current_motion, affinity_level, affinity_streak_days, unlocked_expressions, unlocked_motions, last_interaction_at')
      .eq('user_id', userId)
      .eq('character_profile_id', 'lunaria')
      .maybeSingle(),
  ])

  const ownedItems = itemsOverview.items.filter(item => item.owned)
  const itemByPoolId = new Map(itemsOverview.items.map(item => [item.pool_id ?? item.id, item]))

  if (!stateResult.error && stateResult.data) {
    const state = stateResult.data
    const outfit = state.current_outfit_pool_id ? itemByPoolId.get(state.current_outfit_pool_id) : null
    const background = state.current_background_pool_id ? itemByPoolId.get(state.current_background_pool_id) : null
    return {
      character_profile_id: state.character_profile_id ?? 'lunaria',
      current_outfit_id: state.current_outfit_pool_id ?? 'default',
      current_outfit_name: outfit?.name ?? 'Moonlit Uniform',
      current_background_id: state.current_background_pool_id ?? 'default',
      current_background_name: background?.name ?? 'Window at Night',
      current_expression: state.current_expression ?? 'normal',
      current_motion: state.current_motion ?? 'idle',
      affinity_level: state.affinity_level ?? 0,
      affinity_streak_days: state.affinity_streak_days ?? 0,
      unlocked_expressions: state.unlocked_expressions ?? ['normal', 'gentle_smile', 'thinking', 'sad', 'serious'],
      unlocked_motions: state.unlocked_motions ?? ['idle', 'nod', 'tilt_head'],
      total_items_owned: ownedItems.length,
      total_items_pool: itemsOverview.items.length,
      last_interaction_at: state.last_interaction_at ?? null,
      source: 'character_states',
      db_ready: true,
      note: 'Using lunaria_character_states.',
    }
  }

  if (stateResult.error && !isMissingTable(stateResult.error)) throw stateResult.error

  return {
    character_profile_id: 'lunaria',
    current_outfit_id: 'outfit_default',
    current_outfit_name: 'Moonlit Uniform',
    current_background_id: 'bg_window_night',
    current_background_name: 'Window at Night',
    current_expression: 'gentle_smile',
    current_motion: 'idle',
    affinity_level: 47,
    affinity_streak_days: 12,
    unlocked_expressions: ['normal', 'smile', 'gentle_smile', 'teasing', 'thinking', 'sad', 'serious', 'embarrassed'],
    unlocked_motions: ['idle', 'nod', 'tilt_head', 'lean_forward', 'close_eyes', 'small_wave'],
    total_items_owned: ownedItems.length || FALLBACK_ITEMS.filter(item => item.owned).length,
    total_items_pool: itemsOverview.items.length || FALLBACK_ITEMS.length,
    last_interaction_at: null,
    source: 'mock',
    db_ready: false,
    note: stateResult.error
      ? 'lunaria_character_states is not available yet; using mock character state.'
      : 'No character state row yet; using mock character state.',
  }
}
