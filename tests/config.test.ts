import { describe, it, expect } from 'vitest'
import { loadConfig, ConfigError } from '../src/config.ts'

const VALID_YAML = `
products:
  - name: テスト商品
    url: https://example.com/product/1
    siteType: rakuten
`

const VALID_ENV: Record<string, string | undefined> = {
  SLACK_WEBHOOK_URL: 'https://hooks.slack.com/test',
  RAKUTEN_APP_ID: 'test-app-id',
  CHECK_INTERVAL_SECONDS: '600',
}

describe('loadConfig', () => {
  it('有効な設定から Config を返す', () => {
    const config = loadConfig(VALID_YAML, VALID_ENV)
    expect(config).toEqual({
      products: [
        {
          name: 'テスト商品',
          url: 'https://example.com/product/1',
          siteType: 'rakuten',
        },
      ],
      slackWebhookUrl: 'https://hooks.slack.com/test',
      rakutenAppId: 'test-app-id',
      checkIntervalSeconds: 600,
    })
  })

  it('CHECK_INTERVAL_SECONDS が未設定のとき checkIntervalSeconds は 300 になる', () => {
    const env = { ...VALID_ENV, CHECK_INTERVAL_SECONDS: undefined }
    const config = loadConfig(VALID_YAML, env)
    expect(config.checkIntervalSeconds).toBe(300)
  })

  it('SLACK_WEBHOOK_URL が欠損したら SLACK_WEBHOOK_URL を含む ConfigError を throw する', () => {
    const env = { ...VALID_ENV, SLACK_WEBHOOK_URL: undefined }
    expect(() => loadConfig(VALID_YAML, env)).toThrow(ConfigError)
    expect(() => loadConfig(VALID_YAML, env)).toThrow(/SLACK_WEBHOOK_URL/)
  })

  it('RAKUTEN_APP_ID が欠損したら RAKUTEN_APP_ID を含む ConfigError を throw する', () => {
    const env = { ...VALID_ENV, RAKUTEN_APP_ID: undefined }
    expect(() => loadConfig(VALID_YAML, env)).toThrow(ConfigError)
    expect(() => loadConfig(VALID_YAML, env)).toThrow(/RAKUTEN_APP_ID/)
  })

  it('siteType が不正な値のとき ConfigError を throw する', () => {
    const invalidYaml = VALID_YAML.replace('rakuten', 'amazon')
    expect(() => loadConfig(invalidYaml, VALID_ENV)).toThrow(ConfigError)
  })

  it('products の name が欠損したら ConfigError を throw する', () => {
    const invalidYaml = `
products:
  - url: https://example.com/product/1
    siteType: rakuten
`
    expect(() => loadConfig(invalidYaml, VALID_ENV)).toThrow(ConfigError)
  })
})
