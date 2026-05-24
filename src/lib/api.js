import { getApiBaseUrl } from "./config.js"
import { ApiError } from "./apiTypes.js"

export { ApiError, formatValidationDetails } from "./apiTypes.js"

/**
 * Cliente HTTP JSON hacia la API EcoMart (JWT opcional desde localStorage).
 * @param {string} path Ruta absoluta desde la raíz de la API (p. ej. `/auth/login`)
 * @param {RequestInit} [opts]
 */
export async function api(path, opts = {}) {
  const base = getApiBaseUrl()
  const token = localStorage.getItem("ecmart_token")
  const headers = {
    Accept: "application/json",
    ...(opts.body ? { "Content-Type": "application/json" } : {}),
    ...opts.headers,
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`

  const res = await fetch(url, {
    ...opts,
    headers,
  })

  let body = {}
  const text = await res.text()
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      const looksLikeVite =
        text.includes("Cannot POST") || text.includes("<!DOCTYPE html>")
      body = {
        error: looksLikeVite
          ? "La petición llegó a Vite en lugar del API. Arranca el backend (npm run dev) y revisa VITE_PROXY_TARGET / puerto en .env.development.local."
          : text,
      }
    }
  }

  if (!res.ok) {
    const err = new ApiError(
      res.status,
      body.error || res.statusText || "Error de red",
      body.details
    )
    if (res.status === 401 && token) {
      localStorage.removeItem("ecmart_token")
      localStorage.removeItem("ecmart_user")
      window.dispatchEvent(new CustomEvent("ecmart:session-expired"))
    }
    throw err
  }

  return body
}
