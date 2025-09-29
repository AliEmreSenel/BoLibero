export type Theme = "dark" | "light" | "system"

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return

  const root = document.documentElement

  if (theme === "dark") {
    root.classList.add("dark")
  } else {
    root.classList.remove("dark")
  }
}

export function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light"

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}
