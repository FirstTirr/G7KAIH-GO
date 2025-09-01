export function isMissingInputsColumnError(err: any): boolean {
  const msg = String(err?.message || err?.hint || err || "").toLowerCase()
  return (
    (
      msg.includes("column") &&
      msg.includes("inputs") &&
      (msg.includes("does not exist") || msg.includes("not exist"))
    ) ||
    // Supabase/PostgREST schema cache wording
    (msg.includes("schema cache") && msg.includes("inputs") && msg.includes("could not find"))
  )
}
