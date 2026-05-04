import { formatMoney } from "../lib/formatMoney.js"

describe("formatMoney", () => {
  it("formatea euros en locale español", () => {
    expect(formatMoney(12.5)).toMatch(/12,50/)
  })
})
