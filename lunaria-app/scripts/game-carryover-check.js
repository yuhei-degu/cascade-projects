#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const checks = [
  {
    file: 'lib/lunaria/memory-candidates.ts',
    markers: [
      { label: 'game memory candidate source', value: "'game'" },
      { label: 'candidate source_type persistence', value: 'source_type: options.sourceType' },
    ],
  },
  {
    file: 'app/api/memory/candidates/route.ts',
    markers: [
      { label: 'game source type accepted by review API', value: "'manual' || value === 'game'" },
      { label: 'source type returned to reviewer', value: 'source_type: row.source_type' },
      { label: 'candidate approval route preserves source date', value: 'sourceDate: row.source_date' },
    ],
  },
  {
    file: 'app/memory/page.tsx',
    markers: [
      { label: 'candidate source label displayed', value: 'value={sourceTypeLabel(candidate.source_type)}' },
      { label: 'game source label available', value: "game: 'Game carryover'" },
      { label: 'game source date label available', value: "value === 'game' ? 'game day' : 'diary'" },
      { label: 'game candidate review actions available', value: "onAction(candidate.id, 'approve')" },
      { label: 'game carryover return affordance visible', value: 'aria-label="Game carryover return"' },
      { label: 'game carryover room return link', value: 'aria-label="Return to Lunaria room with approved game carryover"' },
      { label: 'game carryover count visible', value: 'Game carryovers' },
      { label: 'game carryover count source', value: "candidate.source_type === 'game'" },
      { label: 'candidate shelf visible', value: 'Memory candidates' },
    ],
  },
  {
    file: 'app/games/page.tsx',
    markers: [
      { label: 'game carryover handoff visible', value: 'aria-label="Game carryover handoff"' },
      { label: 'memory approval step visible', value: 'approve the game carryover candidate' },
      { label: 'conversation return step visible', value: 'approved result in the next conversation' },
    ],
  },
  {
    file: 'lib/lunaria/diary.ts',
    markers: [
      { label: 'unresolved issue carryover', value: 'unresolved_issues' },
      { label: 'next topic carryover', value: 'next_topics' },
    ],
  },
  {
    file: 'lib/lunaria/memory.ts',
    markers: [
      { label: 'contextual memory lookup', value: 'getContextualMemory' },
      { label: 'unresolved issues in contextual memory', value: 'unresolved_issues' },
    ],
  },
  {
    file: 'app/api/chat/route.ts',
    markers: [
      { label: 'contextual memory fetch', value: 'getContextualMemory' },
      { label: 'contextual memory prompt payload', value: 'contextualMem: contextualMem ?? null' },
      { label: 'game handoff response hint computed', value: 'buildGameHandoffResponseHint(gameHandoffNextStep)' },
      { label: 'game handoff response hint prompt injection', value: 'gameHandoffResponseHint ?' },
    ],
  },
  {
    file: 'lib/lunaria/prompt-builder.ts',
    markers: [
      { label: 'contextual memory prompt field', value: 'contextualMem:' },
      { label: 'contextual memory normal prompt layer', value: "p.contextualMem ?? ''" },
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

console.log('Lunaria game carryover source check passed.')
