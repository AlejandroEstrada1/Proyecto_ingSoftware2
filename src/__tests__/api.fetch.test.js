import { api } from "../lib/api.js"
import { ApiError } from "../lib/apiTypes.js"

describe("api() cliente HTTP", () => {
  beforeEach(() => {
    globalThis.__ECMART_ENV__ = {
      VITE_API_URL: "http://127.0.0.1:3001",
      DEV: false,
      PROD: true,
    }
    localStorage.clear()
  })

  it("devuelve JSON cuando la respuesta es correcta", async () => {
    globalThis.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ ok: true })),
      })
    )

    const body = await api("/health")
    expect(body).toEqual({ ok: true })
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:3001/health",
      expect.objectContaining({ headers: expect.any(Object) })
    )
  })

  it("acepta rutas sin slash inicial y respuesta vacia", async () => {
    globalThis.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 204,
        text: () => Promise.resolve(""),
      })
    )

    await expect(api("health")).resolves.toEqual({})
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:3001/health",
      expect.any(Object)
    )
  })

  it("lanza ApiError cuando el servidor responde error", async () => {
    globalThis.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: () =>
          Promise.resolve(JSON.stringify({ error: "Datos inválidos" })),
      })
    )

    await expect(
      api("/auth/login", { method: "POST", body: "{}" })
    ).rejects.toMatchObject({
      message: "Datos inválidos",
      status: 400,
    })
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  it("con 401 y token borra sesión y lanza ApiError", async () => {
    localStorage.setItem("ecmart_token", "x")
    globalThis.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: () => Promise.resolve(JSON.stringify({ error: "No autorizado" })),
      })
    )

    await expect(api("/cart")).rejects.toThrow(ApiError)
    expect(localStorage.getItem("ecmart_token")).toBeNull()
  })

  it("con 401 sin token no dispara limpieza de sesión", async () => {
    const listener = jest.fn()
    window.addEventListener("ecmart:session-expired", listener)
    globalThis.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: () => Promise.resolve(JSON.stringify({ error: "No autorizado" })),
      })
    )

    await expect(api("/cart")).rejects.toThrow(ApiError)
    expect(listener).not.toHaveBeenCalled()
    window.removeEventListener("ecmart:session-expired", listener)
  })

  it("interpreta HTML como error de proxy (Vite)", async () => {
    globalThis.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve("<!DOCTYPE html><html></html>"),
      })
    )

    await expect(api("/auth/register")).rejects.toMatchObject({
      message: expect.stringContaining("Vite"),
    })
  })

  it("usa texto plano como mensaje de error cuando no hay JSON", async () => {
    globalThis.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: "",
        text: () => Promise.resolve("fallo plano"),
      })
    )

    await expect(api("/x")).rejects.toMatchObject({
      message: "fallo plano",
    })
  })

  it("usa mensaje generico si el error no trae cuerpo ni statusText", async () => {
    globalThis.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 503,
        statusText: "",
        text: () => Promise.resolve(""),
      })
    )

    await expect(api("/x")).rejects.toMatchObject({
      message: "Error de red",
    })
  })
})
