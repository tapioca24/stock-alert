import type { Config } from './config.ts'
import { createRakutenChecker } from './rakutenChecker.ts'
import { createNintendoChecker } from './nintendoChecker.ts'
import { createYodobashiChecker } from './yodobashiChecker.ts'
import { startOrchestrator } from './orchestrator.ts'

const STATE_PATH = 'data/state.json'

export async function main(config: Config): Promise<void> {
  const rakutenChecker = createRakutenChecker(config.rakutenAppId)
  const nintendoChecker = createNintendoChecker()
  const yodobashiChecker = createYodobashiChecker()

  console.log('ready')
  startOrchestrator({
    products: config.products,
    webhookUrl: config.slackWebhookUrl,
    statePath: STATE_PATH,
    checker: async (product) => {
      if (product.siteType === 'rakuten') return rakutenChecker(product)
      if (product.siteType === 'nintendo') return nintendoChecker(product)
      if (product.siteType === 'yodobashi') return yodobashiChecker(product)
      return 'unknown'
    },
    intervalSeconds: config.checkIntervalSeconds,
  })
}
