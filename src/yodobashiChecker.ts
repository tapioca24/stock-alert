import * as cheerio from 'cheerio'
import { chromium } from 'playwright'
import type { Checker, StockStatus } from './checker.ts'

export function extractProductCode(url: string): string | null {
  const match = url.match(/\/product\/(\d+)/)
  return match ? match[1] : null
}

export function parseYodobashiStockStatus(html: string): StockStatus {
  const $ = cheerio.load(html)
  const salesInfoTxt = $('#salesInfoTxt').text().trim()
  if (salesInfoTxt === '在庫あり') return 'in_stock'
  if (salesInfoTxt) return 'out_of_stock'
  const salesInfo = $('.salesInfo p').text().trim()
  if (salesInfo) return 'out_of_stock'
  return 'unknown'
}

export function createYodobashiChecker(): Checker {
  return async (product) => {
    try {
      const response = await fetch(product.url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept-Language': 'ja-JP,ja;q=0.9',
        },
      })
      const html = await response.text()
      const status = parseYodobashiStockStatus(html)
      if (status !== 'unknown') return status
    } catch {
      // ignore — fall through to Playwright
    }
    return playwrightFetch(product.url)
  }
}

async function playwrightFetch(url: string): Promise<StockStatus> {
  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      locale: 'ja-JP',
    })
    const page = await context.newPage()
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(3000)
    const html = await page.content()
    return parseYodobashiStockStatus(html)
  } catch {
    return 'unknown'
  } finally {
    await browser.close()
  }
}
