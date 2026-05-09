import { describe, it, expect } from 'vitest'
import { parseNintendoStockStatus } from '../src/nintendoChecker.ts'

const BTN_ID = 'ProductDetailSuper_AddCartButton_AddCartButton'

describe('parseNintendoStockStatus', () => {
  it('カートに入れるボタン（有効）があるとき in_stock を返す', () => {
    const html = `<button id="${BTN_ID}" type="button">カートに入れる</button>`
    expect(parseNintendoStockStatus(html)).toBe('in_stock')
  })

  it('品切れボタン（disabled）があるとき out_of_stock を返す', () => {
    const html = `<button id="${BTN_ID}" type="button" disabled="" aria-disabled="true">品切れ</button>`
    expect(parseNintendoStockStatus(html)).toBe('out_of_stock')
  })

  it('対象ボタンが存在しないとき unknown を返す', () => {
    const html = '<div>ページが読み込めません</div>'
    expect(parseNintendoStockStatus(html)).toBe('unknown')
  })

  it('空の HTML のとき unknown を返す', () => {
    expect(parseNintendoStockStatus('')).toBe('unknown')
  })
})
