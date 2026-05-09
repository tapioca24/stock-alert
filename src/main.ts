import type { Config } from './config.ts'
import { createRakutenChecker } from './rakutenChecker.ts'
import { startOrchestrator } from './orchestrator.ts'

const STATE_PATH = 'data/state.json'

export async function main(config: Config): Promise<void> {
  const rakutenChecker = createRakutenChecker(config.rakutenAppId)

  console.log('ready')
  startOrchestrator({
    products: config.products,
    webhookUrl: config.slackWebhookUrl,
    statePath: STATE_PATH,
    checker: async (product) => {
      if (product.siteType === 'rakuten') return rakutenChecker(product)
      return 'unknown'
    },
    intervalSeconds: config.checkIntervalSeconds,
  })
}
