/**
 * @jest-environment node
 */
import { getApiBaseUrl } from "../lib/config.js"

describe("getApiBaseUrl en entorno Node", () => {
  afterEach(() => {
    delete globalThis.__ECMART_ENV__
  })

  it("funciona cuando window no existe", () => {
    globalThis.__ECMART_ENV__ = {
      DEV: false,
      PROD: true,
      VITE_API_URL: "https://api.example.com",
    }

    expect(typeof window).toBe("undefined")
    expect(getApiBaseUrl()).toBe("https://api.example.com")
  })
})
