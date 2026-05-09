import { describe, it, expect, vi, afterEach } from 'vitest'
import { parseYodobashiStockStatus, extractProductCode, createYodobashiChecker } from '../src/yodobashiChecker.ts'

const IN_STOCK_HTML = `<span class="stockInfo"><span class="green" id="salesInfoTxt">在庫あり</span></span>`
const NO_ELEMENT_HTML = '<div>ページが読み込めません</div>'

function makeProduct(url = 'https://www.yodobashi.com/product/100000001009544793/') {
  return { name: 'テスト商品', url, siteType: 'yodobashi' as const }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('extractProductCode', () => {
  it('ヨドバシ商品URLから商品コードを抽出する', () => {
    expect(extractProductCode('https://www.yodobashi.com/product/100000001009544793/')).toBe('100000001009544793')
  })

  it('末尾スラッシュなしのURLでも抽出できる', () => {
    expect(extractProductCode('https://www.yodobashi.com/product/100000001009063421')).toBe('100000001009063421')
  })

  it('商品コードが含まれないURLのとき null を返す', () => {
    expect(extractProductCode('https://www.yodobashi.com/')).toBeNull()
  })
})

describe('parseYodobashiStockStatus', () => {
  it('#salesInfoTxt が「在庫あり」のとき in_stock を返す', () => {
    const html = `<span class="stockInfo"><span class="green" id="salesInfoTxt">在庫あり</span></span>`
    expect(parseYodobashiStockStatus(html)).toBe('in_stock')
  })

  it('.salesInfo p があるとき out_of_stock を返す', () => {
    const html = `<div class="salesInfo"><p>予定数の販売を終了しました</p></div>`
    expect(parseYodobashiStockStatus(html)).toBe('out_of_stock')
  })

  it('在庫情報要素が存在しないとき unknown を返す', () => {
    const html = '<div>ページが読み込めません</div>'
    expect(parseYodobashiStockStatus(html)).toBe('unknown')
  })

  it('空の HTML のとき unknown を返す', () => {
    expect(parseYodobashiStockStatus('')).toBe('unknown')
  })
})

describe('createYodobashiChecker', () => {
  it('fetch で在庫ありHTMLが返ったとき in_stock を返す', async () => {
    const checker = createYodobashiChecker()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(IN_STOCK_HTML, { status: 200 }),
    )

    const result = await checker(makeProduct())

    expect(result).toBe('in_stock')
  })

  it('fetch がエラーを throw したとき Playwright にフォールバックして結果を返す', async () => {
    const checker = createYodobashiChecker()
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network error'))
    const { chromium } = await import('playwright')
    const mockPage = {
      goto: vi.fn(),
      waitForTimeout: vi.fn(),
      content: vi.fn().mockResolvedValue(IN_STOCK_HTML),
    }
    const mockContext = { newPage: vi.fn().mockResolvedValue(mockPage) }
    const mockBrowser = {
      newContext: vi.fn().mockResolvedValue(mockContext),
      close: vi.fn(),
    }
    vi.spyOn(chromium, 'launch').mockResolvedValue(mockBrowser as never)

    const result = await checker(makeProduct())

    expect(result).toBe('in_stock')
  })

  it('fetch で HTTP エラーが返ったとき Playwright にフォールバックして結果を返す', async () => {
    const checker = createYodobashiChecker()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', { status: 503 }),
    )
    const { chromium } = await import('playwright')
    const mockPage = {
      goto: vi.fn(),
      waitForTimeout: vi.fn(),
      content: vi.fn().mockResolvedValue(IN_STOCK_HTML),
    }
    const mockContext = { newPage: vi.fn().mockResolvedValue(mockPage) }
    const mockBrowser = {
      newContext: vi.fn().mockResolvedValue(mockContext),
      close: vi.fn(),
    }
    vi.spyOn(chromium, 'launch').mockResolvedValue(mockBrowser as never)

    const result = await checker(makeProduct())

    expect(result).toBe('in_stock')
  })

  it('fetch で在庫情報なしのHTMLが返ったとき Playwright にフォールバックして結果を返す', async () => {
    const checker = createYodobashiChecker()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(NO_ELEMENT_HTML, { status: 200 }),
    )
    const { chromium } = await import('playwright')
    const mockPage = {
      goto: vi.fn(),
      waitForTimeout: vi.fn(),
      content: vi.fn().mockResolvedValue(IN_STOCK_HTML),
    }
    const mockContext = { newPage: vi.fn().mockResolvedValue(mockPage) }
    const mockBrowser = {
      newContext: vi.fn().mockResolvedValue(mockContext),
      close: vi.fn(),
    }
    vi.spyOn(chromium, 'launch').mockResolvedValue(mockBrowser as never)

    const result = await checker(makeProduct())

    expect(result).toBe('in_stock')
  })
})
