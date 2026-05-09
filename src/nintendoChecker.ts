import { chromium } from 'playwright'
import type { Checker, StockStatus } from './checker.ts'

const BTN_ID = 'ProductDetailSuper_AddCartButton_AddCartButton'
const BTN_PATTERN = new RegExp(`<button[^>]*id="${BTN_ID}"[^>]*>`)

export function parseNintendoStockStatus(html: string): StockStatus {
  const match = html.match(BTN_PATTERN)
  if (!match) return 'unknown'
  return match[0].includes('disabled') ? 'out_of_stock' : 'in_stock'
}

export function createNintendoChecker(): Checker {
  return async (product) => {
    const browser = await chromium.launch({ headless: true })
    try {
      const context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        locale: 'ja-JP',
      })
      const page = await context.newPage()
      await page.goto(product.url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForTimeout(5000)
      const html = await page.content()
      return parseNintendoStockStatus(html)
    } catch {
      return 'unknown'
    } finally {
      await browser.close()
    }
  }
}
