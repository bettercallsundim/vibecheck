#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const os = require('os')

const args = process.argv.slice(2)
const isGlobal = args.includes('--global') || args.includes('-g')

const SKILL_SRC = path.join(__dirname, '..', 'SKILL.md')

const destinations = isGlobal
  ? [
      path.join(os.homedir(), '.agents', 'skills', 'vibecheck', 'SKILL.md'),
      path.join(os.homedir(), '.claude', 'skills', 'vibecheck', 'SKILL.md'),
      path.join(os.homedir(), '.codeium', 'windsurf', 'skills', 'vibecheck', 'SKILL.md'),
      path.join(os.homedir(), '.gemini', 'config', 'skills', 'vibecheck', 'SKILL.md'),
    ]
  : [
      path.join(process.cwd(), '.agents', 'skills', 'vibecheck', 'SKILL.md'),
    ]

let installed = 0
for (const dest of destinations) {
  try {
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(SKILL_SRC, dest)
    console.log(`✓ ${dest}`)
    installed++
  } catch (err) {
    console.error(`✗ ${dest} — ${err.message}`)
  }
}

if (installed === 0) {
  console.error('Install failed.')
  process.exit(1)
}

console.log('\nRestart your AI coding tool, then run:')
console.log(isGlobal ? '  /vibecheck' : '  /vibecheck  (in this project)')
