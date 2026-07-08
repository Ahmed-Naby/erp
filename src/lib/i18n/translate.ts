export type Messages = Record<string, string>

export type TranslateVars = Record<string, string | number>

export function translate(messages: Messages, key: string, vars?: TranslateVars): string {
  let value = messages[key] ?? key
  if (vars) {
    for (const [name, replacement] of Object.entries(vars)) {
      value = value.replace(new RegExp(`\\{${name}\\}`, "g"), String(replacement))
    }
  }
  return value
}
