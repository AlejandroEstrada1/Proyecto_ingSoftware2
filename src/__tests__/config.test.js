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

  it("usa fallback si no existe entorno de Vite inyectado", () => {
    delete globalThis.__ECMART_ENV__

    expect(getApiBaseUrl()).toBe("http://127.0.0.1:3001")
  })

  it("corrige una URL que apunta al mismo host del frontend", () => {
    const page = new URL(window.location.href)
    const sameOrigin = `${page.protocol}//${page.host}`
    globalThis.__ECMART_ENV__ = {
      DEV: false,
      PROD: true,
      VITE_API_URL: sameOrigin,
    }

    expect(getApiBaseUrl()).toBe("http://127.0.0.1:3001")
  })

  it("usa fallback si la URL absoluta no se puede parsear", () => {
    globalThis.__ECMART_ENV__ = {
      DEV: false,
      PROD: true,
      VITE_API_URL: "http://%",
    }

    expect(getApiBaseUrl()).toBe("http://127.0.0.1:3001")
  })

})
