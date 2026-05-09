import * as v from 'valibot'
import type { Checker } from './checker.ts'

const ENDPOINT = 'https://app.rakuten.co.jp/services/api/BooksBook/Search/20130522'

const RakutenResponseSchema = v.object({
  Items: v.array(
    v.object({
      Item: v.object({
        availability: v.string(),
      }),
    }),
  ),
})

function extractIsbn(url: string): string | null {
  const match = url.match(/\/rb\/(\d+)\//)
  return match ? match[1] : null
}

export function createRakutenChecker(appId: string): Checker {
  return async (product) => {
    const isbn = extractIsbn(product.url)
    if (!isbn) return 'unknown'

    const params = new URLSearchParams({ applicationId: appId, isbn, format: 'json' })

    try {
      const res = await fetch(`${ENDPOINT}?${params}`)
      const json = await res.json()
      const result = v.safeParse(RakutenResponseSchema, json)
      if (!result.success) return 'unknown'

      const availability = result.output.Items[0]?.Item.availability
      if (!availability) return 'unknown'

      return availability === '1' ? 'in_stock' : 'out_of_stock'
    } catch {
      return 'unknown'
    }
  }
}
