import { describe, it, expect, vi, afterEach } from 'vitest'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'
import { runOnce } from '../src/orchestrator.ts'
import type { Checker } from '../src/checker.ts'

function tempPath() {
  return join(tmpdir(), `orch-test-${randomUUID()}.json`)
}

const PRODUCTS = [
  { name: '商品A', url: 'https://example.com/a', siteType: 'rakuten' as const },
  { name: '商品B', url: 'https://example.com/b', siteType: 'yodobashi' as const },
]

const WEBHOOK_URL = 'https://hooks.slack.com/test'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('runOnce', () => {
  it('各商品に対して checker を呼び出す', async () => {
    const statePath = tempPath()
    const checker: Checker = vi.fn().mockResolvedValue('in_stock')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }))

    await runOnce({ products: PRODUCTS, webhookUrl: WEBHOOK_URL, statePath, checker })

    expect(checker).toHaveBeenCalledTimes(2)
    expect(checker).toHaveBeenCalledWith(PRODUCTS[0])
    expect(checker).toHaveBeenCalledWith(PRODUCTS[1])
  })

  it('初回実行（前状態なし）: ベースラインを保存するだけで通知しない', async () => {
    const statePath = tempPath()
    const checker: Checker = vi.fn().mockResolvedValue('in_stock')
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }))

    await runOnce({ products: PRODUCTS, webhookUrl: WEBHOOK_URL, statePath, checker })

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('状態変化 out_of_stock → in_stock: 通知 + 状態更新', async () => {
    const statePath = tempPath()
    const { saveState } = await import('../src/state.ts')
    await saveState(statePath, { 'https://example.com/a': 'out_of_stock' })

    const checker: Checker = vi.fn().mockResolvedValue('in_stock')
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }))

    await runOnce({ products: [PRODUCTS[0]], webhookUrl: WEBHOOK_URL, statePath, checker })

    expect(fetchSpy).toHaveBeenCalledOnce()
    const { loadState } = await import('../src/state.ts')
    const state = await loadState(statePath)
    expect(state['https://example.com/a']).toBe('in_stock')
  })

  it('状態変化 in_stock → out_of_stock: 通知 + 状態更新', async () => {
    const statePath = tempPath()
    const { saveState } = await import('../src/state.ts')
    await saveState(statePath, { 'https://example.com/a': 'in_stock' })

    const checker: Checker = vi.fn().mockResolvedValue('out_of_stock')
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }))

    await runOnce({ products: [PRODUCTS[0]], webhookUrl: WEBHOOK_URL, statePath, checker })

    expect(fetchSpy).toHaveBeenCalledOnce()
    const { loadState } = await import('../src/state.ts')
    const state = await loadState(statePath)
    expect(state['https://example.com/a']).toBe('out_of_stock')
  })

  it('状態変化なし: 通知しない', async () => {
    const statePath = tempPath()
    const { saveState } = await import('../src/state.ts')
    await saveState(statePath, { 'https://example.com/a': 'in_stock' })

    const checker: Checker = vi.fn().mockResolvedValue('in_stock')
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }))

    await runOnce({ products: [PRODUCTS[0]], webhookUrl: WEBHOOK_URL, statePath, checker })

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('"unknown" を返した場合: 状態を更新せず通知しない', async () => {
    const statePath = tempPath()
    const { saveState } = await import('../src/state.ts')
    await saveState(statePath, { 'https://example.com/a': 'in_stock' })

    const checker: Checker = vi.fn().mockResolvedValue('unknown')
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }))

    await runOnce({ products: [PRODUCTS[0]], webhookUrl: WEBHOOK_URL, statePath, checker })

    expect(fetchSpy).not.toHaveBeenCalled()
    const { loadState } = await import('../src/state.ts')
    const state = await loadState(statePath)
    expect(state['https://example.com/a']).toBe('in_stock')
  })
})
