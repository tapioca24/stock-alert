import type { Product } from './config.ts'
import type { Checker } from './checker.ts'
import { loadState, saveState } from './state.ts'
import { sendNotification } from './notifier.ts'

interface RunOnceOptions {
  products: Product[]
  webhookUrl: string
  statePath: string
  checker: Checker
}

export async function runOnce(options: RunOnceOptions): Promise<void> {
  const { products, webhookUrl, statePath, checker } = options
  const state = await loadState(statePath)

  for (const product of products) {
    const newStatus = await checker(product)
    if (newStatus === 'unknown') continue

    const prevStatus = state[product.url]
    if (prevStatus === undefined) {
      state[product.url] = newStatus
      continue
    }

    if (prevStatus !== newStatus) {
      await sendNotification(webhookUrl, product, newStatus)
      state[product.url] = newStatus
    }
  }

  await saveState(statePath, state)
}

export function startOrchestrator(
  options: Omit<RunOnceOptions, 'checker'> & { checker: Checker; intervalSeconds: number },
): NodeJS.Timeout {
  const { intervalSeconds, ...runOptions } = options
  return setInterval(() => {
    runOnce(runOptions).catch(console.error)
  }, intervalSeconds * 1000)
}
