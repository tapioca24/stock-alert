import { readFileSync } from 'node:fs'
import { loadConfig, ConfigError } from './config.ts'
import { main } from './main.ts'

function readYaml(path: string): string {
  try {
    return readFileSync(path, 'utf-8')
  } catch {
    console.error('products.yaml が見つかりません')
    process.exit(1)
  }
}

const yamlContent = readYaml('products.yaml')

let config
try {
  config = loadConfig(yamlContent)
} catch (err) {
  if (err instanceof ConfigError) {
    console.error(err.message)
    process.exit(1)
  }
  throw err
}

main(config)
