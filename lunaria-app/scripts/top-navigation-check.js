#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const checks = [
  {
    file: 'app/page.tsx',
    links: ['/diary', '/memory', '/character', '/items', '/games', '/gacha'],
    markers: [
      { label: 'navigation landmark', value: '<nav aria-label="Lunaria navigation"' },
      { label: 'decorative header orb hidden', value: 'aria-hidden="true" className="orb-anim"' },
      { label: 'diary accessible label', value: 'aria-label="Open diary"' },
      { label: 'memory accessible label', value: 'aria-label="Open memory"' },
      { label: 'character accessible label', value: 'aria-label="Open character"' },
      { label: 'items accessible label', value: 'aria-label="Open items"' },
      { label: 'games accessible label', value: 'aria-label="Open games"' },
      { label: 'gacha accessible label', value: 'aria-label="Open gacha"' },
      { label: 'developer diagnostics toggle label', value: 'aria-label="Toggle developer diagnostics"' },
      { label: 'developer diagnostics pressed state', value: 'aria-pressed={showDev}' },
    ],
  },
  {
    file: 'app/character/page.tsx',
    links: ['/', '/items', '/gacha'],
    markers: [
      { label: 'character navigation landmark', value: '<nav aria-label="Character navigation"' },
      { label: 'character room link label', value: 'aria-label="Back to Lunaria room"' },
      { label: 'character items link label', value: 'aria-label="Open items"' },
      { label: 'character gacha link label', value: 'aria-label="Open gacha"' },
    ],
  },
  {
    file: 'app/diary/page.tsx',
    links: ['/', '/memory', '/gacha'],
    markers: [
      { label: 'diary navigation landmark', value: '<nav aria-label="Diary navigation"' },
      { label: 'diary room link label', value: 'aria-label="Back to Lunaria room"' },
      { label: 'diary memory link label', value: 'aria-label="Open memory"' },
      { label: 'diary gacha link label', value: 'aria-label="Open gacha"' },
    ],
  },
  {
    file: 'app/memory/page.tsx',
    links: ['/', '/diary', '/games', '/gacha'],
    markers: [
      { label: 'memory navigation landmark', value: '<nav aria-label="Memory navigation"' },
      { label: 'memory room link label', value: 'aria-label="Back to Lunaria room"' },
      { label: 'memory diary link label', value: 'aria-label="Open diary"' },
      { label: 'memory games link label', value: 'aria-label="Open games"' },
      { label: 'memory gacha link label', value: 'aria-label="Open gacha"' },
    ],
  },
  {
    file: 'app/items/page.tsx',
    links: ['/', '/character', '/gacha'],
    markers: [
      { label: 'items navigation landmark', value: '<nav aria-label="Items navigation"' },
      { label: 'items room link label', value: 'aria-label="Back to Lunaria room"' },
      { label: 'items gacha link label', value: 'aria-label="Open gacha"' },
      { label: 'items character link label', value: 'aria-label="Open character"' },
    ],
  },
  {
    file: 'app/games/page.tsx',
    links: ['/', '/memory'],
    markers: [
      { label: 'games navigation landmark', value: '<nav aria-label="Games navigation"' },
      { label: 'games room link label', value: 'aria-label="Back to Lunaria room"' },
      { label: 'games memory link label', value: 'aria-label="Open memory"' },
      { label: 'endworld restoration status', value: 'Route restoration pending' },
      { label: 'game route status region', value: 'aria-label="Game route status"' },
    ],
  },
  {
    file: 'app/gacha/page.tsx',
    links: ['/', '/gacha/inventory'],
    markers: [
      { label: 'gacha navigation landmark', value: '<nav aria-label="Gacha navigation"' },
      { label: 'gacha room link label', value: 'aria-label="Back to Lunaria room"' },
      { label: 'gacha inventory link label', value: 'aria-label="Open gacha inventory"' },
    ],
  },
  {
    file: 'app/gacha/inventory/page.tsx',
    links: ['/', '/gacha'],
    markers: [
      { label: 'gacha inventory navigation landmark', value: '<nav aria-label="Gacha inventory navigation"' },
      { label: 'inventory gacha link label', value: 'aria-label="Back to gacha"' },
      { label: 'inventory room link label', value: 'aria-label="Open Lunaria room"' },
    ],
  },
]

const appRoutes = collectAppRoutes(path.join(process.cwd(), 'app'))
let failed = false

for (const check of checks) {
  const filePath = path.join(process.cwd(), check.file)
  const source = fs.readFileSync(filePath, 'utf8')
  const missing = check.links.filter(link => !hasHref(source, link))
  const missingRouteTargets = check.links.filter(link => link.startsWith('/') && !appRoutes.has(link))
  const missingMarkers = (check.markers ?? []).filter(marker => !source.includes(marker.value))

  if (missing.length > 0 || missingRouteTargets.length > 0 || missingMarkers.length > 0) {
    failed = true
    const missingLabels = [
      ...missing,
      ...missingRouteTargets.map(link => `route target ${link}`),
      ...missingMarkers.map(marker => marker.label),
    ]
    console.error(`FAIL ${check.file}: missing ${missingLabels.join(', ')}`)
  } else {
    const passLabels = [
      ...check.links,
      ...(check.markers ?? []).map(marker => marker.label),
    ]
    console.log(`PASS ${check.file}: ${passLabels.join(', ')}`)
  }
}

if (failed) {
  process.exit(1)
}

console.log('Lunaria top navigation source check passed.')

function hasHref(source, href) {
  const escaped = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`href=["']${escaped}["']`).test(source)
}

function collectAppRoutes(rootDir) {
  const routes = new Set()

  function walk(dir, segments) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    const hasPage = entries.some(entry => entry.isFile() && /^page\.(tsx|ts|jsx|js)$/.test(entry.name))

    if (hasPage) {
      const routeSegments = segments.filter(segment => !segment.startsWith('(') && !segment.startsWith('_'))
      routes.add(routeSegments.length === 0 ? '/' : `/${routeSegments.join('/')}`)
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === 'api') continue
      walk(path.join(dir, entry.name), [...segments, entry.name])
    }
  }

  walk(rootDir, [])
  return routes
}
