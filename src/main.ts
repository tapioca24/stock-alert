import type { Config } from './config.ts'
import type { Checker } from './checker.ts'
import { startOrchestrator } from './orchestrator.ts'

const STATE_PATH = 'data/state.json'

// チェッカーのスタブ（#5/#6/#7 実装後に差し替え）
const stubChecker: Checker = async (_product) => 'unknown'

export async function main(config: Config): Promise<void> {
  console.log('ready')
  startOrchestrator({
    products: config.products,
    webhookUrl: config.slackWebhookUrl,
    statePath: STATE_PATH,
    checker: stubChecker,
    intervalSeconds: config.checkIntervalSeconds,
  })
}
