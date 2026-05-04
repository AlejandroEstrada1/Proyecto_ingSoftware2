import { getApiBaseUrl } from "../lib/config.js"

describe("getApiBaseUrl", () => {
  afterEach(() => {
    globalThis.__ECMART_ENV__ = {
      VITE_API_URL: "http://127.0.0.1:3001",
      DEV: true,
      PROD: false,
    }
  })

  it("en DEV sin VITE_API_URL devuelve cadena vacía (proxy Vite)", () => {
    globalThis.__ECMART_ENV__ = { DEV: true, PROD: false, VITE_API_URL: "" }
    expect(getApiBaseUrl()).toBe("")
  })

  it("usa URL absoluta cuando está definida", () => {
    globalThis.__ECMART_ENV__ = {
      DEV: false,
      PROD: true,
      VITE_API_URL: "http://127.0.0.1:3044",
    }
    expect(getApiBaseUrl()).toBe("http://127.0.0.1:3044")
  })

  it("sin URL válida usa el fallback en producción", () => {
    globalThis.__ECMART_ENV__ = {
      DEV: false,
      PROD: true,
      VITE_API_URL: "no-es-url",
    }
    expect(getApiBaseUrl()).toBe("http://127.0.0.1:3001")
  })
})
