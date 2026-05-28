import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export default function globalSetup() {
  const here = dirname(fileURLToPath(import.meta.url))
  const dbPath = resolve(here, 'e2e.sqlite')

  mkdirSync(dirname(dbPath), { recursive: true })
  writeFileSync(dbPath, '')

  process.env.CHATBOT_E2E_DB = dbPath

  const result = spawnSync(
    'vendor/bin/testbench',
    ['migrate:fresh', '--force'],
    {
      cwd: resolve(here, '..', '..'),
      env: { ...process.env, DB_DATABASE: dbPath },
      stdio: 'inherit',
    },
  )

  if (result.status !== 0) {
    throw new Error(`testbench migrate:fresh failed with status ${result.status}`)
  }
}
