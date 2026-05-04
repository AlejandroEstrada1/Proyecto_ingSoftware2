export class ApiError extends Error {
  constructor(status, message, details) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.details = details
  }
}

/** Une mensajes de `fieldErrors` (Zod flatten del backend) para mostrarlos en la UI. */
export function formatValidationDetails(details) {
  if (!details || typeof details !== "object") return ""
  const fe = details.fieldErrors
  if (!fe || typeof fe !== "object") return ""
  const parts = []
  for (const arr of Object.values(fe)) {
    if (!Array.isArray(arr)) continue
    for (const m of arr) {
      if (typeof m === "string" && m.trim()) parts.push(m.trim())
    }
  }
  return parts.join(" ")
}
