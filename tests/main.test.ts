import { describe, it, expect, vi, afterEach } from 'vitest'

describe('main', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('起動時に "ready" をログ出力する', async () => {
    const spy = vi.spyOn(console, 'log')
    const { main } = await import('../src/main.ts')
    await main()
    expect(spy).toHaveBeenCalledWith('ready')
  })
})
