import { describe, it, expect } from 'vitest'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { loadState, saveState } from '../src/state.ts'

function tempPath() {
  return join(tmpdir(), `state-test-${randomUUID()}.json`)
}

describe('loadState', () => {
  it('ファイルが存在しないとき空の状態を返す', async () => {
    const path = tempPath()
    const state = await loadState(path)
    expect(state).toEqual({})
  })

  it('既存の JSON ファイルから状態を読み込む', async () => {
    const path = tempPath()
    const expected = {
      'https://example.com/a': 'in_stock',
      'https://example.com/b': 'out_of_stock',
    }
    await writeFile(path, JSON.stringify(expected), 'utf-8')
    const state = await loadState(path)
    expect(state).toEqual(expected)
  })
})

describe('saveState', () => {
  it('状態を JSON ファイルに書き込む', async () => {
    const path = tempPath()
    const data = { 'https://example.com/a': 'in_stock' as const }
    await saveState(path, data)
    const loaded = await loadState(path)
    expect(loaded).toEqual(data)
  })

  it('既存エントリを上書き更新できる', async () => {
    const path = tempPath()
    await saveState(path, { 'https://example.com/a': 'in_stock' })
    await saveState(path, { 'https://example.com/a': 'out_of_stock' })
    const loaded = await loadState(path)
    expect(loaded['https://example.com/a']).toBe('out_of_stock')
  })
})
