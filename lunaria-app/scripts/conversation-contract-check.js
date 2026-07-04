#!/usr/bin/env node

const fs = require('fs')
const childProcess = require('child_process')
const os = require('os')
const path = require('path')

const checks = [
  {
    file: 'lib/lunaria/assistant-reply.ts',
    markers: [
      { label: 'structured reply schema', value: 'AssistantReplySchema' },
      { label: 'emotion metadata', value: 'ASSISTANT_EMOTIONS' },
      { label: 'voice tone metadata', value: 'ASSISTANT_VOICE_TONES' },
      { label: 'expression normalization', value: 'expression: normalizeVisualCue(reply.expression)' },
      { label: 'motion normalization', value: 'motion: normalizeVisualCue(reply.motion)' },
      { label: 'visual cue length cap', value: 'MAX_VISUAL_CUE_CHARS' },
      { label: 'topic tags', value: 'topic_tags' },
      { label: 'topic tag overflow accepted before normalization', value: 'topic_tags: z.array(z.string().min(1)).optional()' },
      { label: 'topic tag normalization', value: 'normalizeTopicTags' },
      { label: 'topic tag dedupe', value: 'new Set(' },
      { label: 'next step signal', value: 'next_step' },
      { label: 'next step normalization', value: 'normalizeNextStep' },
      { label: 'next step length cap', value: 'MAX_NEXT_STEP_CHARS' },
      { label: 'memory candidate signal', value: 'should_create_memory_candidate' },
      { label: 'diary candidate signal', value: 'should_create_diary_candidate' },
      { label: 'message-only fallback', value: 'return { message: raw }' },
      { label: 'object reply fallback', value: 'fallbackAssistantReply' },
      { label: 'object fallback preserves message', value: 'return normalizeAssistantReply({ message: candidateMessage })' },
      { label: 'json object fallback preserves message', value: 'return fallbackAssistantReply(parsedJson.value)' },
      { label: 'text alias fallback', value: 'const text = replyLike.text' },
      { label: 'content alias fallback', value: 'const content = replyLike.content' },
      { label: 'reply alias fallback', value: 'const reply = replyLike.reply' },
      { label: 'text alias fallback preserved as message', value: 'message: candidateMessage' },
    ],
  },
  {
    file: 'lib/lunaria/game-handoff.ts',
    markers: [
      { label: 'game handoff reply keywords', value: 'GAME_HANDOFF_REPLY_KEYWORDS' },
      { label: 'game handoff followup keywords', value: 'GAME_HANDOFF_FOLLOWUP_KEYWORDS' },
      { label: 'game over debrief keywords', value: 'GAME_OVER_DEBRIEF_KEYWORDS' },
      { label: 'game success debrief keywords', value: 'GAME_SUCCESS_DEBRIEF_KEYWORDS' },
      { label: 'game costly debrief keywords', value: 'GAME_COSTLY_DEBRIEF_KEYWORDS' },
      { label: 'game retreat debrief keywords', value: 'GAME_RETREAT_DEBRIEF_KEYWORDS' },
      { label: 'game handoff next step fallback', value: 'GAME_HANDOFF_NEXT_STEP' },
      { label: 'game over debrief next step', value: 'GAME_OVER_DEBRIEF_NEXT_STEP' },
      { label: 'game success debrief next step', value: 'GAME_SUCCESS_DEBRIEF_NEXT_STEP' },
      { label: 'game costly debrief next step', value: 'GAME_COSTLY_DEBRIEF_NEXT_STEP' },
      { label: 'game retreat debrief next step', value: 'GAME_RETREAT_DEBRIEF_NEXT_STEP' },
      { label: 'game handoff response hint', value: 'GAME_HANDOFF_RESPONSE_HINT' },
      { label: 'game over debrief response hint', value: 'GAME_OVER_DEBRIEF_RESPONSE_HINT' },
      { label: 'game success debrief response hint', value: 'GAME_SUCCESS_DEBRIEF_RESPONSE_HINT' },
      { label: 'game costly debrief response hint', value: 'GAME_COSTLY_DEBRIEF_RESPONSE_HINT' },
      { label: 'game retreat debrief response hint', value: 'GAME_RETREAT_DEBRIEF_RESPONSE_HINT' },
      { label: 'game handoff reply fixtures', value: 'GAME_HANDOFF_REPLY_FIXTURES' },
      { label: 'game result fixture', value: 'game result mention gets a next step' },
      { label: 'localized game over fixture', value: 'localized game over debrief gets a specific next step' },
      { label: 'localized success fixture', value: 'localized success debrief gets a specific next step' },
      { label: 'localized costly fixture', value: 'localized costly debrief gets a recovery next step' },
      { label: 'localized retreat fixture', value: 'localized retreat debrief gets a return-condition next step' },
      { label: 'ordinary chat fixture', value: 'ordinary chat stays untouched' },
      { label: 'stale history fixture', value: 'ordinary chat after handoff history stays untouched' },
      { label: 'stale contextual memory fixture', value: 'ordinary chat with game contextual memory stays untouched' },
      { label: 'game handoff specific next step selection', value: 'getGameHandoffNextStep' },
      { label: 'game handoff response hint selection', value: 'buildGameHandoffResponseHint' },
      { label: 'game handoff turn detection', value: 'isGameHandoffTurn' },
      { label: 'game handoff next step injection', value: 'withGameHandoffNextStep' },
    ],
  },
  {
    file: 'app/api/chat/route.ts',
    markers: [
      { label: 'assistant reply parser import', value: 'parseAssistantReply' },
      { label: 'assistant text normalization', value: 'stringifyAssistantMessage' },
      { label: 'assistant meta extraction', value: 'toAssistantMeta(structuredReply)' },
      { label: 'assistant meta stream payload', value: 'assistantMeta,' },
      { label: 'game handoff helper import', value: "from '../../../lib/lunaria/game-handoff'" },
      { label: 'game handoff next step injection', value: 'withGameHandoffNextStep' },
      { label: 'game handoff reply next step computed', value: 'const gameHandoffNextStep = getGameHandoffNextStep(userMessage, contextualMem ?? null, history)' },
      { label: 'game handoff response hint computed', value: 'const gameHandoffResponseHint = buildGameHandoffResponseHint(gameHandoffNextStep)' },
      { label: 'game handoff response hint added to prompt', value: "...(gameHandoffResponseHint ? [{ role: 'system' as const, content: gameHandoffResponseHint }] : [])" },
      { label: 'conversation extraction import', value: 'extractConversation' },
      { label: 'memory candidate save from extraction', value: 'saveMemoryCandidate(' },
      { label: 'extraction unresolved issue persistence', value: 'unresolved_issues:    extraction.unresolved_issues' },
    ],
  },
  {
    file: 'lib/lunaria/extraction.ts',
    markers: [
      { label: 'conversation extraction contract', value: 'EXTRACT_SYSTEM' },
      { label: 'unresolved issue extraction field', value: '"unresolved_issues": []' },
      { label: 'long-term candidate extraction field', value: '"long_term_candidate": null' },
      { label: 'known-name guard', value: 'options?.knownName' },
      { label: 'fallback extraction keeps unresolved issues shape', value: 'status_updates: [], unresolved_issues: [], long_term_candidate: null' },
    ],
  },
  {
    file: 'app/page.tsx',
    markers: [
      { label: 'assistant meta type', value: 'interface AssistantMeta' },
      { label: 'visual state from assistant meta', value: 'visualFromAssistant' },
      { label: 'emotion visual mapping', value: 'expressionFromEmotion' },
      { label: 'current mood group label', value: 'aria-label="Lunaria current mood"' },
      { label: 'current mood live status', value: 'role="group" aria-live="polite" aria-atomic="true" aria-label="Lunaria current mood"' },
      { label: 'next step meta type', value: 'next_step?: string' },
      { label: 'next step UI state', value: 'assistantNextStep' },
      { label: 'next step reset on send', value: "setAssistantNextStep('')" },
      { label: 'next step stream capture', value: 'nextAssistantMeta?.next_step' },
      { label: 'next step blank guard', value: 'nextAssistantMeta.next_step.trim()' },
      { label: 'next step live status', value: 'aria-live="polite"' },
      { label: 'next step atomic live status', value: 'aria-atomic="true"' },
      { label: 'next step accessible label', value: 'aria-label="Lunaria suggested next step"' },
      { label: 'next step wrap guard', value: "overflowWrap: 'anywhere'" },
      { label: 'conversation log role', value: 'role="log"' },
      { label: 'conversation log stable id', value: 'id="lunaria-conversation-log"' },
      { label: 'conversation log non-atomic updates', value: 'aria-atomic="false"' },
      { label: 'conversation live region', value: 'aria-relevant="additions text"' },
      { label: 'conversation accessible label', value: 'aria-label="Lunaria conversation"' },
      { label: 'conversation busy state', value: 'aria-busy={loading}' },
      { label: 'empty conversation hint label', value: 'role="note" aria-label="Start a conversation with Lunaria"' },
      { label: 'message stable key', value: 'key={`${m.role}-${m.ts}-${i}`}' },
      { label: 'assistant message accessible label', value: "'Lunaria message'" },
      { label: 'user message accessible label', value: "'Your message'" },
      { label: 'assistant message decoration hidden', value: 'ai && <div aria-hidden="true"' },
      { label: 'ticket toast live status', value: 'role="status" aria-live="polite" aria-atomic="true" aria-label="Gacha ticket received"' },
      { label: 'typing status label', value: 'aria-label="Lunaria is replying"' },
      { label: 'typing live status', value: 'role="status" aria-live="polite" aria-atomic="true" aria-label="Lunaria is replying"' },
      { label: 'typing decorative dots hidden', value: '<span aria-hidden="true" className="blink-dot"' },
      { label: 'message composer group', value: 'role="group" aria-label="Lunaria message composer"' },
      { label: 'chat input accessible label', value: 'aria-label="Lunaria chat message"' },
      { label: 'chat input Enter shortcut', value: 'aria-keyshortcuts="Enter"' },
      { label: 'chat input conversation control target', value: 'aria-controls="lunaria-conversation-log"' },
      { label: 'chat input mobile send hint', value: 'enterKeyHint="send"' },
      { label: 'send button accessible label', value: 'aria-label="Send message to Lunaria"' },
      { label: 'streamed assistant meta usage', value: 'd.assistantMeta' },
    ],
  },
]

let failed = false

for (const check of checks) {
  const filePath = path.join(process.cwd(), check.file)
  const source = fs.readFileSync(filePath, 'utf8')
  const missing = check.markers.filter(marker => !source.includes(marker.value))

  if (missing.length > 0) {
    failed = true
    console.error(`FAIL ${check.file}: missing ${missing.map(marker => marker.label).join(', ')}`)
  } else {
    console.log(`PASS ${check.file}: ${check.markers.map(marker => marker.label).join(', ')}`)
  }
}

if (failed) {
  process.exit(1)
}

if (!runGameHandoffReplyFixtures()) {
  process.exit(1)
}

console.log('Lunaria conversation contract source check passed.')

function runGameHandoffReplyFixtures() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lunaria-game-handoff-'))
  try {
    const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
    const command = [
      npx,
      'tsc',
      'lib/lunaria/game-handoff.ts',
      '--outDir',
      quoteArg(tempDir),
      '--module',
      'commonjs',
      '--target',
      'ES2020',
      '--skipLibCheck',
      '--esModuleInterop',
    ].join(' ')
    childProcess.execSync(command, { cwd: process.cwd(), stdio: 'pipe' })

    const compiledPath = findCompiledFile(tempDir, 'game-handoff.js')
    const gameHandoff = require(compiledPath)

    for (const fixture of gameHandoff.GAME_HANDOFF_REPLY_FIXTURES) {
      const active = gameHandoff.isGameHandoffTurn(fixture.userMessage, fixture.contextualMem, fixture.history)
      const nextStep = gameHandoff.getGameHandoffNextStep(fixture.userMessage, fixture.contextualMem, fixture.history)
      const responseHint = gameHandoff.buildGameHandoffResponseHint(nextStep)
      const reply = gameHandoff.withGameHandoffNextStep({ message: 'ok' }, nextStep)
      if (
        active !== fixture.active ||
        Boolean(nextStep) !== fixture.active ||
        reply.next_step !== fixture.expectedNextStep ||
        responseHint !== fixture.expectedResponseHint
      ) {
        console.error(`FAIL game handoff reply fixture: ${fixture.label}`)
        return false
      }
      console.log(`PASS game handoff reply fixture: ${fixture.label}`)
    }

    return true
  } catch (error) {
    console.error(`FAIL game handoff reply fixtures: ${error.message}`)
    return false
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

function findCompiledFile(root, fileName) {
  const entries = fs.readdirSync(root, { withFileTypes: true })
  for (const entry of entries) {
    const entryPath = path.join(root, entry.name)
    if (entry.isDirectory()) {
      const found = findCompiledFile(entryPath, fileName)
      if (found) return found
    } else if (entry.name === fileName) {
      return entryPath
    }
  }
  throw new Error(`${fileName} was not emitted`)
}

function quoteArg(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`
}
