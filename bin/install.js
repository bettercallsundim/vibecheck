#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const os = require('os')
const https = require('https')

const args = process.argv.slice(2)
const isGlobal = args.includes('--global') || args.includes('-g')
const isUpdate = args.includes('--update') || args.includes('-u')
const isVersion = args.includes('--version') || args.includes('-v')

const pkg = require('../package.json')
const SKILL_SRC = path.join(__dirname, '..', 'SKILL.md')
const SKILL_URL = 'https://raw.githubusercontent.com/bettercallsundim/vibecheck/main/SKILL.md'

const globalDestinations = [
  path.join(os.homedir(), '.claude', 'skills', 'vibecheck', 'SKILL.md'),
  path.join(os.homedir(), '.cursor', 'skills', 'vibecheck', 'SKILL.md'),
  path.join(os.homedir(), '.codeium', 'windsurf', 'skills', 'vibecheck', 'SKILL.md'),
  path.join(os.homedir(), '.copilot', 'skills', 'vibecheck', 'SKILL.md'),
  path.join(os.homedir(), '.agents', 'skills', 'vibecheck', 'SKILL.md'),
  path.join(os.homedir(), '.gemini', 'config', 'skills', 'vibecheck', 'SKILL.md'),
]

if (isVersion) {
  console.log(`${pkg.name} v${pkg.version}`)
  process.exit(0)
}

if (isUpdate) {
  console.log('Fetching latest SKILL.md from GitHub...')
  const req = https.get(SKILL_URL, (res) => {
    if (res.statusCode !== 200) {
      console.error(`✗ Failed to fetch SKILL.md (HTTP ${res.statusCode})`)
      process.exit(1)
    }
    let data = ''
    res.on('data', chunk => data += chunk)
    res.on('end', () => {
      const installed = findInstalledPaths()
      if (installed.length === 0) {
        console.error(`✗ No installed vibecheck skills found. Run npx ${pkg.name} first.`)
        process.exit(1)
      }
      for (const dest of installed) {
        fs.writeFileSync(dest, data)
        console.log(`✓ Updated ${dest}`)
      }
      console.log('\nRestart your AI coding tool to use the updated skill.')
    })
  })
  req.setTimeout(10000, () => {
    req.destroy()
    console.error('✗ Request timed out after 10s')
    process.exit(1)
  })
  req.on('error', err => {
    console.error(`✗ ${err.message}`)
    process.exit(1)
  })
  return
}

const destinations = isGlobal ? globalDestinations : [
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

function findInstalledPaths() {
  return globalDestinations
    .concat([path.join(process.cwd(), '.agents', 'skills', 'vibecheck', 'SKILL.md')])
    .filter(p => fs.existsSync(p))
}
