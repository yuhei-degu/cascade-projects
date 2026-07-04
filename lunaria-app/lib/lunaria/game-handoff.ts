type GameHandoffHistoryItem = { content: string }

export const GAME_HANDOFF_REPLY_KEYWORDS = [
  'game carryover',
  'game result',
  'conversation handoff',
  'memory approval',
  '/games',
  'endworld',
  'game over',
  '\u30b2\u30fc\u30e0\u7d50\u679c',
  '\u7d42\u672b\u4e16\u754c\u30b2\u30fc\u30e0',
] as const

export const GAME_HANDOFF_FOLLOWUP_KEYWORDS = [
  'what should',
  'what now',
  'do now',
  'next',
  'talk about it',
  'bring it back',
  '\u3069\u3046\u3057\u305f\u3089',
  '\u6b21',
  '\u632f\u308a\u8fd4\u308a',
  '\u4f5c\u6226\u4f1a\u8b70',
] as const

export const GAME_OVER_DEBRIEF_KEYWORDS = [
  'game over',
  '\u30b2\u30fc\u30e0\u30aa\u30fc\u30d0\u30fc',
  '\u6557\u5317',
] as const

export const GAME_SUCCESS_DEBRIEF_KEYWORDS = [
  'clear',
  'cleared',
  'survived',
  'success',
  'victory',
  '\u30af\u30ea\u30a2',
  '\u751f\u9084',
  '\u6210\u529f',
] as const

export const GAME_COSTLY_DEBRIEF_KEYWORDS = [
  'damaged',
  'injured',
  'wounded',
  'costly',
  '\u30c0\u30e1\u30fc\u30b8',
  '\u8ca0\u50b7',
  '\u50b7',
  '\u4ee3\u511f',
  '\u304e\u308a\u304e\u308a',
] as const

export const GAME_RETREAT_DEBRIEF_KEYWORDS = [
  'retreat',
  'retreated',
  'withdrew',
  'escaped',
  'fled',
  'abandoned',
  'stopped',
  '\u64a4\u9000',
  '\u9000\u5374',
  '\u9003\u3052\u305f',
  '\u4e2d\u65ad',
] as const

export const GAME_HANDOFF_NEXT_STEP = 'Review the game carryover in Memory, then bring the approved result back into the room.'
export const GAME_OVER_DEBRIEF_NEXT_STEP = 'Review the game carryover in Memory, then tell Luna what failed and choose one safer retry plan.'
export const GAME_SUCCESS_DEBRIEF_NEXT_STEP = 'Review the game carryover in Memory, then tell Luna what worked and choose one habit to keep for the next run.'
export const GAME_COSTLY_DEBRIEF_NEXT_STEP = 'Review the game carryover in Memory, then tell Luna what it cost and choose one recovery action before the next run.'
export const GAME_RETREAT_DEBRIEF_NEXT_STEP = 'Review the game carryover in Memory, then tell Luna why you retreated and choose one safer return condition.'
export const GAME_HANDOFF_RESPONSE_HINT = 'Game handoff reply: acknowledge the game result, mention Memory review, and give one concrete return-to-room action.'
export const GAME_OVER_DEBRIEF_RESPONSE_HINT = 'Game over debrief reply: name the failed run, ask what failed, and suggest one safer retry plan after Memory review.'
export const GAME_SUCCESS_DEBRIEF_RESPONSE_HINT = 'Game success debrief reply: name what worked, mention Memory review, and choose one habit to keep for the next run.'
export const GAME_COSTLY_DEBRIEF_RESPONSE_HINT = 'Costly game result reply: name the cost or wound, mention Memory review, and choose one recovery action before retrying.'
export const GAME_RETREAT_DEBRIEF_RESPONSE_HINT = 'Retreat game result reply: name the retreat reason, mention Memory review, and choose one safer return condition.'

export const GAME_HANDOFF_REPLY_FIXTURES = [
  {
    label: 'game result mention gets a next step',
    userMessage: 'The game result from /games felt rough. What should I do next?',
    contextualMem: null,
    history: [],
    active: true,
    expectedNextStep: GAME_HANDOFF_NEXT_STEP,
    expectedResponseHint: GAME_HANDOFF_RESPONSE_HINT,
  },
  {
    label: 'conversation handoff in history gets a next step',
    userMessage: 'What should we do now?',
    contextualMem: null,
    history: [{ content: 'Previous turn: conversation handoff after endworld survival.' }],
    active: true,
    expectedNextStep: GAME_HANDOFF_NEXT_STEP,
    expectedResponseHint: GAME_HANDOFF_RESPONSE_HINT,
  },
  {
    label: 'localized game over debrief gets a specific next step',
    userMessage: '\u7d42\u672b\u4e16\u754c\u30b2\u30fc\u30e0\u3067game over\u306b\u306a\u3063\u3066\u3001\u7d50\u679c\u304c\u3061\u3087\u3063\u3068\u6016\u304b\u3063\u305f\u3002\u30eb\u30ca\u30ea\u30a2\u3068\u4f5c\u6226\u4f1a\u8b70\u3057\u305f\u3044\u3002',
    contextualMem: null,
    history: [],
    active: true,
    expectedNextStep: GAME_OVER_DEBRIEF_NEXT_STEP,
    expectedResponseHint: GAME_OVER_DEBRIEF_RESPONSE_HINT,
  },
  {
    label: 'localized success debrief gets a specific next step',
    userMessage: '\u7d42\u672b\u4e16\u754c\u30b2\u30fc\u30e0\u3092\u30af\u30ea\u30a2\u3057\u3066\u751f\u9084\u3067\u304d\u305f\u3002\u7d50\u679c\u3092\u30eb\u30ca\u30ea\u30a2\u3068\u632f\u308a\u8fd4\u308a\u305f\u3044\u3002',
    contextualMem: null,
    history: [],
    active: true,
    expectedNextStep: GAME_SUCCESS_DEBRIEF_NEXT_STEP,
    expectedResponseHint: GAME_SUCCESS_DEBRIEF_RESPONSE_HINT,
  },
  {
    label: 'localized costly debrief gets a recovery next step',
    userMessage: '\u7d42\u672b\u4e16\u754c\u30b2\u30fc\u30e0\u306f\u751f\u9084\u3057\u305f\u3051\u3069\u3001\u30c0\u30e1\u30fc\u30b8\u3068\u4ee3\u511f\u304c\u304e\u308a\u304e\u308a\u3067\u6016\u304b\u3063\u305f\u3002',
    contextualMem: null,
    history: [],
    active: true,
    expectedNextStep: GAME_COSTLY_DEBRIEF_NEXT_STEP,
    expectedResponseHint: GAME_COSTLY_DEBRIEF_RESPONSE_HINT,
  },
  {
    label: 'localized retreat debrief gets a return-condition next step',
    userMessage: '\u7d42\u672b\u4e16\u754c\u30b2\u30fc\u30e0\u306f\u30af\u30ea\u30a2\u305b\u305a\u306b\u64a4\u9000\u3057\u305f\u3002\u30eb\u30ca\u30ea\u30a2\u3068\u623b\u308b\u6761\u4ef6\u3092\u6c7a\u3081\u305f\u3044\u3002',
    contextualMem: null,
    history: [],
    active: true,
    expectedNextStep: GAME_RETREAT_DEBRIEF_NEXT_STEP,
    expectedResponseHint: GAME_RETREAT_DEBRIEF_RESPONSE_HINT,
  },
  {
    label: 'ordinary chat stays untouched',
    userMessage: 'I made tea and want to talk for a minute.',
    contextualMem: null,
    history: [],
    active: false,
    expectedNextStep: undefined,
    expectedResponseHint: null,
  },
  {
    label: 'ordinary chat after handoff history stays untouched',
    userMessage: 'I made tea and want to talk for a minute.',
    contextualMem: null,
    history: [{ content: 'Previous turn: conversation handoff after endworld survival.' }],
    active: false,
    expectedNextStep: undefined,
    expectedResponseHint: null,
  },
  {
    label: 'ordinary chat with game contextual memory stays untouched',
    userMessage: 'I made tea and want to talk for a minute.',
    contextualMem: 'Recent Memory: game carryover from endworld survival.',
    history: [],
    active: false,
    expectedNextStep: undefined,
    expectedResponseHint: null,
  },
] as const

export function getGameHandoffNextStep(
  userMessage: string,
  contextualMem: string | null,
  history: GameHandoffHistoryItem[],
): string | null {
  const userText = userMessage.toLowerCase()
  const contextText = buildGameHandoffContextText(contextualMem, history)
  const userHasHandoff = matchesAnyKeyword(userText, GAME_HANDOFF_REPLY_KEYWORDS)
  const contextHasHandoff = matchesAnyKeyword(contextText, GAME_HANDOFF_REPLY_KEYWORDS)
  if (!userHasHandoff && !contextHasHandoff) return null
  if (!userHasHandoff && !matchesAnyKeyword(userText, GAME_HANDOFF_FOLLOWUP_KEYWORDS)) return null

  const recentText = [userText, contextText].join('\n')
  if (!matchesAnyKeyword(recentText, GAME_HANDOFF_REPLY_KEYWORDS)) return null
  if (matchesAnyKeyword(recentText, GAME_OVER_DEBRIEF_KEYWORDS)) return GAME_OVER_DEBRIEF_NEXT_STEP
  if (matchesAnyKeyword(recentText, GAME_COSTLY_DEBRIEF_KEYWORDS)) return GAME_COSTLY_DEBRIEF_NEXT_STEP
  if (matchesAnyKeyword(recentText, GAME_RETREAT_DEBRIEF_KEYWORDS)) return GAME_RETREAT_DEBRIEF_NEXT_STEP
  if (matchesAnyKeyword(recentText, GAME_SUCCESS_DEBRIEF_KEYWORDS)) return GAME_SUCCESS_DEBRIEF_NEXT_STEP
  return GAME_HANDOFF_NEXT_STEP
}

export function isGameHandoffTurn(
  userMessage: string,
  contextualMem: string | null,
  history: GameHandoffHistoryItem[],
): boolean {
  return getGameHandoffNextStep(userMessage, contextualMem, history) !== null
}

export function withGameHandoffNextStep<T extends { next_step?: string }>(reply: T, nextStep: string | null | boolean): T {
  const fallbackNextStep = typeof nextStep === 'string' ? nextStep : nextStep ? GAME_HANDOFF_NEXT_STEP : null
  if (!fallbackNextStep || reply.next_step?.trim()) return reply
  return {
    ...reply,
    next_step: fallbackNextStep,
  }
}

export function buildGameHandoffResponseHint(nextStep: string | null): string | null {
  if (!nextStep) return null
  if (nextStep === GAME_OVER_DEBRIEF_NEXT_STEP) return GAME_OVER_DEBRIEF_RESPONSE_HINT
  if (nextStep === GAME_COSTLY_DEBRIEF_NEXT_STEP) return GAME_COSTLY_DEBRIEF_RESPONSE_HINT
  if (nextStep === GAME_RETREAT_DEBRIEF_NEXT_STEP) return GAME_RETREAT_DEBRIEF_RESPONSE_HINT
  if (nextStep === GAME_SUCCESS_DEBRIEF_NEXT_STEP) return GAME_SUCCESS_DEBRIEF_RESPONSE_HINT
  return GAME_HANDOFF_RESPONSE_HINT
}

function buildGameHandoffContextText(
  contextualMem: string | null,
  history: GameHandoffHistoryItem[],
): string {
  return [
    contextualMem ?? '',
    ...history.slice(-4).map(message => message.content),
  ].join('\n').toLowerCase()
}

function matchesAnyKeyword(text: string, keywords: readonly string[]): boolean {
  return keywords.some(keyword => text.includes(keyword.toLowerCase()))
}
