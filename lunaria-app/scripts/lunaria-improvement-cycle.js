#!/usr/bin/env node

const { spawnSync } = require('child_process')

const isWin = process.platform === 'win32'
const steps = [
  ['env check', 'npm', ['run', 'env:check']],
  ['production self-check', 'npm', ['run', 'prod:check']],
  ['gacha verification', 'npm', ['run', 'gacha:verify']],
  ['typescript check', 'npx', ['tsc', '--noEmit', '--pretty', 'false']],
  ['top navigation source check', 'npm', ['run', 'top:navigation']],
  ['game carryover source check', 'npm', ['run', 'game:carryover']],
  ['conversation contract source check', 'npm', ['run', 'conversation:contract']],
  ['production build', 'npm', ['run', 'build']],
]

for (const [label, command, args] of steps) {
  console.log(`\n=== Lunaria cycle: ${label} ===`)
  const result = runCommand(command, args)

  if (result.error) {
    console.error(`\nLunaria cycle failed during ${label}: ${result.error.message}`)
    process.exit(1)
  }

  if (result.status !== 0) {
    console.error(`\nLunaria cycle failed during ${label} with exit code ${result.status}`)
    process.exit(result.status || 1)
  }
}

console.log('\nLunaria improvement cycle passed.')

function runCommand(command, args) {
  if (!isWin) {
    return spawnSync(command, args, { stdio: 'inherit' })
  }

  const commandLine = [command, ...args].map(quoteCmdArg).join(' ')
  return spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', commandLine], {
    stdio: 'inherit',
  })
}

function quoteCmdArg(value) {
  if (/^[A-Za-z0-9_:/\\.-]+$/.test(value)) return value
  return `"${value.replace(/"/g, '\\"')}"`
}
