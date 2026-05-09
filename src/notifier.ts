import type { Product } from './config.ts'
import type { StockStatus } from './checker.ts'

export class NotifierError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotifierError'
  }
}

export async function sendNotification(
  webhookUrl: string,
  product: Product,
  newStatus: StockStatus,
): Promise<void> {
  const text = `[在庫アラート] ${product.name} (${product.siteType})\nステータス: ${newStatus}\nURL: ${product.url}`
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) {
    throw new NotifierError(`Slack への通知に失敗しました: HTTP ${res.status}`)
  }
}
