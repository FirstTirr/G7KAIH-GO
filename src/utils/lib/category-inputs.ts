export type FieldType = "text" | "time" | "image" | "text_image" | "multiselect"

export type CategoryInputField = {
  key: string
  label: string
  type: FieldType
  required?: boolean
  order?: number
  // Arbitrary per-type configuration, e.g. options for multiselect, accept for image, etc.
  config?: Record<string, any>
}

export function validateCategoryInputs(raw: any): {
  ok: boolean
  value?: CategoryInputField[]
  error?: string
} {
  if (raw == null) return { ok: true, value: [] }
  if (!Array.isArray(raw)) return { ok: false, error: "inputs must be an array" }

  const allowed: FieldType[] = ["text", "time", "image", "text_image", "multiselect"]
  const result: CategoryInputField[] = []
  const seenKeys = new Set<string>()

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i]
    if (typeof item !== "object" || item == null) {
      return { ok: false, error: `inputs[${i}] must be an object` }
    }
    const key = String(item.key || "").trim()
    const label = String(item.label || "").trim()
    const type = String(item.type || "").trim() as FieldType
    if (!key) return { ok: false, error: `inputs[${i}].key is required` }
    if (!label) return { ok: false, error: `inputs[${i}].label is required` }
    if (!allowed.includes(type)) {
      return { ok: false, error: `inputs[${i}].type must be one of ${allowed.join(", ")}` }
    }
    if (seenKeys.has(key)) {
      return { ok: false, error: `inputs contain duplicate key: ${key}` }
    }
    seenKeys.add(key)

    result.push({
      key,
      label,
      type,
      required: Boolean(item.required ?? false),
      order: Number.isFinite(Number(item.order)) ? Number(item.order) : i,
      config: typeof item.config === "object" && item.config != null ? item.config : undefined,
    })
  }

  // sort by order for consistency
  result.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  return { ok: true, value: result }
}
