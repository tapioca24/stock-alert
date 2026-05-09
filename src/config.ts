import { parse as parseYaml } from 'yaml'
import * as v from 'valibot'

export class ConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigError'
  }
}

const SiteTypeSchema = v.picklist(['rakuten', 'yodobashi', 'nintendo'])

const ProductSchema = v.object({
  name: v.string(),
  url: v.string(),
  siteType: SiteTypeSchema,
})

const ProductsYamlSchema = v.object({
  products: v.array(ProductSchema),
})

const EnvSchema = v.object({
  SLACK_WEBHOOK_URL: v.string(),
  RAKUTEN_APP_ID: v.string(),
  CHECK_INTERVAL_SECONDS: v.optional(v.string(), '300'),
})

export interface Product {
  name: string
  url: string
  siteType: 'rakuten' | 'yodobashi' | 'nintendo'
}

export interface Config {
  products: Product[]
  slackWebhookUrl: string
  rakutenAppId: string
  checkIntervalSeconds: number
}

export function loadConfig(
  yamlContent: string,
  env: Record<string, string | undefined> = process.env,
): Config {
  const rawYaml = parseYaml(yamlContent)
  const yamlResult = v.safeParse(ProductsYamlSchema, rawYaml)
  if (!yamlResult.success) {
    const issues = v.flatten(yamlResult.issues)
    throw new ConfigError(`products.yaml の設定が不正です: ${JSON.stringify(issues)}`)
  }

  const envResult = v.safeParse(EnvSchema, env)
  if (!envResult.success) {
    const issues = v.flatten(envResult.issues)
    throw new ConfigError(`.env の設定が不正です: ${JSON.stringify(issues)}`)
  }

  return {
    products: yamlResult.output.products,
    slackWebhookUrl: envResult.output.SLACK_WEBHOOK_URL,
    rakutenAppId: envResult.output.RAKUTEN_APP_ID,
    checkIntervalSeconds: Number(envResult.output.CHECK_INTERVAL_SECONDS),
  }
}
