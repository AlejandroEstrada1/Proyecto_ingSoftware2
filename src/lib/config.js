const FALLBACK_API = "http://127.0.0.1:3001"

function viteEnv() {
  return globalThis.__ECMART_ENV__ ?? {}
}

/**
 * Resuelve la base del API en tiempo de ejecución.
 * - En desarrollo, si `VITE_API_URL` está vacío: cadena vacía → `fetch("/auth/...")` pasa por el proxy de Vite (mismo origen, sin CORS).
 * - Con `VITE_API_URL` http(s) explícita: se usa tal cual (p. ej. E2E o API remota).
 * - Si apunta al mismo host:puerto que la página por error, se corrige al fallback (evita POST al front).
 */
export function getApiBaseUrl() {
  const env = viteEnv()
  const raw = String(env.VITE_API_URL ?? "").trim()

  if (env.DEV && !raw) {
    return ""
  }

  let base =
    raw && (raw.startsWith("http://") || raw.startsWith("https://"))
      ? raw.replace(/\/$/, "")
      : FALLBACK_API

  if (typeof window !== "undefined") {
    try {
      const page = new URL(window.location.href)
      const api = new URL(base)
      if (api.host === page.host) {
        return FALLBACK_API
      }
    } catch {
      return FALLBACK_API
    }
  }

  return base
}

/** Compatibilidad: valor al cargar el módulo (la mayoría de usos deben preferir `getApiBaseUrl()`). */
export const API_URL = getApiBaseUrl()
