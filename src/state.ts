import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { StockStatus } from './checker.ts'

export type State = Record<string, StockStatus>

export async function loadState(filePath: string): Promise<State> {
  try {
    const content = await readFile(filePath, 'utf-8')
    return JSON.parse(content) as State
  } catch {
    return {}
  }
}

export async function saveState(filePath: string, state: State): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(state), 'utf-8')
}
