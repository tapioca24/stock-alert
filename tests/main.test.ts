import { describe, it, expect, vi, afterEach } from 'vitest'
import type { Config } from '../src/config.ts'

const STUB_CONFIG: Config = {
  products: [],
  slackWebhookUrl: 'https://hooks.slack.com/test',
  rakutenAppId: 'test-app-id',
  checkIntervalSeconds: 300,
}

describe('main', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('起動時に "ready" をログ出力する', async () => {
    const spy = vi.spyOn(console, 'log')
    const { main } = await import('../src/main.ts')
    await main(STUB_CONFIG)
    expect(spy).toHaveBeenCalledWith('ready')
  })
})
