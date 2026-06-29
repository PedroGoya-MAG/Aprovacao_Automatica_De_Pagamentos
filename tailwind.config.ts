import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        mag: {
          primary: "var(--mag-dark-blue-primary)",
          secondary: "var(--mag-dark-blue-secondary)",
          accent: "var(--mag-blue-accent)",
          info: "var(--mag-blue-light)",
          interactive: "var(--mag-blue-lighter)",
          warning: "var(--mag-orange)",
          success: "var(--mag-green)",
          error: "var(--mag-red)",
          white: "var(--mag-white)",
          text: "var(--mag-text-primary)",
          "text-secondary": "var(--mag-text-secondary)",
          "text-muted": "var(--mag-text-muted)"
        }
      },
      borderRadius: {
        mag: "var(--radius-md)",
        "mag-lg": "var(--radius-lg)"
      },
      boxShadow: {
        "mag-soft": "var(--shadow-soft)",
        "mag-medium": "var(--shadow-medium)",
        "mag-panel": "var(--shadow-panel)"
      },
      spacing: {
        "mag-xs": "var(--space-xs)",
        "mag-sm": "var(--space-sm)",
        "mag-md": "var(--space-md)",
        "mag-lg": "var(--space-lg)",
        "mag-xl": "var(--space-xl)",
        "mag-2xl": "var(--space-2xl)"
      },
      fontFamily: {
        sans: ["var(--font-roboto)", "Roboto", "Segoe UI", "sans-serif"]
      }
    }
  }
};

export default config;
