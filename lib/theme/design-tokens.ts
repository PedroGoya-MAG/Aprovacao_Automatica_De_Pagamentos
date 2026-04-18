export const magMindTokens = {
  colors: {
    darkBluePrimary: "#061E2E",
    darkBlueSecondary: "#0A1B3D",
    blueAccent: "#1F4788",
    blueLight: "#0078A8",
    blueLighter: "#1073C9",
    orange: "#F59F00",
    green: "#2CC910",
    red: "#D92D20",
    white: "#FFFFFF",
    textPrimary: "#272B30",
    textSecondary: "#666666",
    textMuted: "#333333"
  },
  gradients: {
    darkPrimary: "linear-gradient(81deg, rgb(6, 20, 46) 0%, rgb(10, 27, 61) 100%)",
    darkSecondary: "linear-gradient(271deg, rgb(0, 15, 45) 0%, rgb(24, 44, 87) 100%)"
  },
  glass: {
    background: "rgba(255, 255, 255, 0.1)",
    backgroundLight: "rgba(255, 255, 255, 0.72)",
    border: "rgba(255, 255, 255, 0.15)",
    borderLight: "rgba(255, 255, 255, 0.52)",
    blur: "blur(10px)"
  },
  typography: {
    fontFamily: "Roboto, Segoe UI, sans-serif",
    display: { fontSize: "32px", fontWeight: "700", lineHeight: "1.15" },
    heading1: { fontSize: "28px", fontWeight: "700", lineHeight: "1.2" },
    heading2: { fontSize: "24px", fontWeight: "700", lineHeight: "1.25" },
    heading3: { fontSize: "20px", fontWeight: "500", lineHeight: "1.35" },
    body: { fontSize: "16px", fontWeight: "400", lineHeight: "1.5" },
    small: { fontSize: "14px", fontWeight: "400", lineHeight: "1.5" },
    label: { fontSize: "12px", fontWeight: "500", lineHeight: "1.35" }
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    "2xl": "48px"
  },
  radius: {
    none: "0px",
    sm: "4px",
    md: "8px",
    lg: "12px"
  },
  shadows: {
    soft: "rgba(0, 0, 0, 0.1) 0px 4px 6px 0px",
    medium: "rgba(0, 0, 0, 0.15) 0px 8px 16px 0px",
    strong: "rgba(0, 0, 0, 0.25) 0px 16px 32px 0px"
  }
} as const;

export type MagMindTokens = typeof magMindTokens;
