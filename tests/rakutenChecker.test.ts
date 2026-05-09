import { describe, it, expect, vi, afterEach } from 'vitest'
import { createRakutenChecker } from '../src/rakutenChecker.ts'

const APP_ID = 'test-app-id'
const RAKUTEN_URL = 'https://books.rakuten.co.jp/rb/18210481/'

function makeProduct(url: string) {
  return { name: 'テスト商品', url, siteType: 'rakuten' as const }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createRakutenChecker', () => {
  it('availability "1" のとき in_stock を返す', async () => {
    const checker = createRakutenChecker(APP_ID)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          Items: [{ Item: { availability: '1' } }],
        }),
        { status: 200 },
      ),
    )

    const result = await checker(makeProduct(RAKUTEN_URL))

    expect(result).toBe('in_stock')
  })

  it('availability "1" 以外のとき out_of_stock を返す', async () => {
    const checker = createRakutenChecker(APP_ID)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          Items: [{ Item: { availability: '4' } }],
        }),
        { status: 200 },
      ),
    )

    const result = await checker(makeProduct(RAKUTEN_URL))

    expect(result).toBe('out_of_stock')
  })

  it('ネットワークエラーのとき unknown を返す', async () => {
    const checker = createRakutenChecker(APP_ID)
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network error'))

    const result = await checker(makeProduct(RAKUTEN_URL))

    expect(result).toBe('unknown')
  })

  it('予期しないレスポンス構造のとき unknown を返す', async () => {
    const checker = createRakutenChecker(APP_ID)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'invalid_param' }), { status: 200 }),
    )

    const result = await checker(makeProduct(RAKUTEN_URL))

    expect(result).toBe('unknown')
  })
})
