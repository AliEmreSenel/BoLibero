import type { Config } from "tailwindcss"
import tailwindcssAnimate from "tailwindcss-animate"

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        ink: {
          DEFAULT: "var(--ink)",
          foreground: "var(--ink-foreground)",
        },
        track: "var(--track)",
        free: {
          DEFAULT: "var(--free)",
          foreground: "var(--free-foreground)",
          bar: "var(--free-bar)",
          "bar-muted": "var(--free-bar-muted)",
          soft: "var(--free-soft)",
          "soft-foreground": "var(--free-soft-foreground)",
          tint: "var(--free-tint)",
          "tint-border": "var(--free-tint-border)",
          border: "var(--free-border)",
        },
        soon: {
          DEFAULT: "var(--soon)",
          foreground: "var(--soon-foreground)",
          bar: "var(--soon-bar)",
          soft: "var(--soon-soft)",
          "soft-foreground": "var(--soon-soft-foreground)",
          border: "var(--soon-border)",
        },
        study: {
          DEFAULT: "var(--study)",
          foreground: "var(--study-foreground)",
          "bar-muted": "var(--study-bar-muted)",
          soft: "var(--study-soft)",
          "soft-foreground": "var(--study-soft-foreground)",
          border: "var(--study-border)",
        },
        busy: {
          DEFAULT: "var(--busy)",
          foreground: "var(--busy-foreground)",
        },
        warn: {
          DEFAULT: "var(--warn)",
          border: "var(--warn-border)",
          foreground: "var(--warn-foreground)",
        },
        notice: {
          DEFAULT: "var(--notice)",
          border: "var(--notice-border)",
          foreground: "var(--notice-foreground)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

export default config
