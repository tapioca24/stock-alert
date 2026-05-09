import type { Product } from './config.ts'

export type StockStatus = 'in_stock' | 'out_of_stock' | 'unknown'
export type Checker = (product: Product) => Promise<StockStatus>
