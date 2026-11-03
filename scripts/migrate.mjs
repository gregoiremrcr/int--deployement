import 'dotenv/config'

import { readdir, readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { Client } = require('pg')

const projectRoot = fileURLToPath(new URL('..', import.meta.url))
const migrationsDirectory = join(projectRoot, 'supabase', 'migrations')
const connectionString = process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL

if (!connectionString) {
  throw new Error(
    'DATABASE_URL ou SUPABASE_DB_URL doit être défini pour lancer les migrations.',
  )
}

const migrationFiles = (await readdir(migrationsDirectory))
  .filter((file) => /^\d+_[a-z0-9_-]+\.sql$/i.test(file))
  .sort((left, right) => left.localeCompare(right, 'en'))

const client = new Client({ connectionString })
let connected = false

try {
  await client.connect()
  connected = true
  await client.query(
    "select pg_advisory_lock(hashtext('pokemon-wishlist:migrations'))",
  )

  await client.query(`
    create schema if not exists public;

    create table if not exists public.schema_migrations (
      version text primary key,
      applied_at timestamptz not null default timezone('utc', now())
    );
  `)

  const { rows } = await client.query(
    'select version from public.schema_migrations',
  )
  const appliedVersions = new Set(rows.map(({ version }) => version))

  for (const file of migrationFiles) {
    if (appliedVersions.has(file)) {
      process.stdout.write(`Déjà appliquée : ${file}\n`)
      continue
    }

    const sql = await readFile(join(migrationsDirectory, file), 'utf8')

    await client.query('begin')
    try {
      await client.query(sql)
      await client.query(
        'insert into public.schema_migrations (version) values ($1)',
        [file],
      )
      await client.query('commit')
      process.stdout.write(`Appliquée : ${file}\n`)
    } catch (error) {
      await client.query('rollback')
      throw new Error(`Échec de la migration ${file}`, { cause: error })
    }
  }
} finally {
  if (connected) {
    await client.query(
      "select pg_advisory_unlock(hashtext('pokemon-wishlist:migrations'))",
    )
    await client.end()
  }
}
