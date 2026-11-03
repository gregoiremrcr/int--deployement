/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const roots = process.argv.slice(2)
const localeRoots = roots.length > 0 ? roots : ['locales/front', 'locales/back']

const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const flattenKeys = (value, prefix = '') => {
  if (!isObject(value)) return prefix ? [prefix] : []

  return Object.entries(value).flatMap(([key, child]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    return isObject(child) ? flattenKeys(child, fullKey) : [fullKey]
  })
}

const readJson = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    throw new Error(`${filePath}: JSON invalide (${error.message})`, {
      cause: error,
    })
  }
}

const findJsonFiles = (directory) => {
  if (!fs.existsSync(directory)) return []

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return findJsonFiles(entryPath)
    return entry.isFile() && entry.name.endsWith('.json') ? [entryPath] : []
  })
}

const difference = (left, right) =>
  [...left].filter((key) => !right.has(key)).sort()

let hasErrors = false
let checkedFiles = 0

for (const root of localeRoots) {
  const absoluteRoot = path.resolve(root)
  const files = findJsonFiles(absoluteRoot)
  const referencePath = files.find(
    (filePath) => path.basename(filePath) === 'en.json',
  )

  if (!referencePath) {
    console.log(`SKIP ${root}: en.json introuvable`)
    continue
  }

  const referenceKeys = new Set(flattenKeys(readJson(referencePath)))
  console.log(
    `Référence ${root}: ${path.relative(process.cwd(), referencePath)}`,
  )

  for (const filePath of files) {
    if (filePath === referencePath) continue
    checkedFiles += 1

    const localeKeys = new Set(flattenKeys(readJson(filePath)))
    const missing = difference(referenceKeys, localeKeys)
    const extra = difference(localeKeys, referenceKeys)

    if (missing.length === 0 && extra.length === 0) {
      console.log(`OK ${path.relative(process.cwd(), filePath)}`)
      continue
    }

    hasErrors = true
    console.error(`ERREUR ${path.relative(process.cwd(), filePath)}`)
    if (missing.length > 0) {
      console.error(`  Clés manquantes: ${missing.join(', ')}`)
    }
    if (extra.length > 0) {
      console.error(`  Clés en trop: ${extra.join(', ')}`)
    }
  }
}

if (checkedFiles === 0) {
  console.log('Aucun fichier de locale à comparer.')
}

process.exitCode = hasErrors ? 1 : 0
