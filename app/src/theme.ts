export const colors = {
  primary: "#22c55e",
  primaryDark: "#16a34a",
  primaryDeep: "#15803d",
  primaryLight: "#bbf7d0",
  primaryBg: "#f0fdf4",

  bg: "#f0fdf4",
  surface: "#ffffff",
  surfaceGlass: "rgba(255,255,255,0.82)",
  cardBorder: "rgba(0,0,0,0.05)",

  text: "#0f172a",
  textSecondary: "#64748b",
  textTertiary: "#94a3b8",

  success: "#22c55e",
  successBg: "#f0fdf4",
  successText: "#16a34a",
  warning: "#f59e0b",
  warningBg: "#fffbeb",
  warningText: "#92400e",
  error: "#ef4444",
  errorBg: "#fef2f2",
  errorText: "#dc2626",

  severity: {
    healthy: "#22c55e",
    mild: "#eab308",
    moderate: "#f97316",
    severe: "#ef4444",
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: "800" as const, color: colors.text },
  h2: { fontSize: 22, fontWeight: "800" as const, color: colors.text },
  h3: { fontSize: 18, fontWeight: "700" as const, color: colors.text },
  body: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  caption: { fontSize: 13, color: colors.textTertiary },
  label: { fontSize: 13, color: colors.textSecondary, fontWeight: "500" as const },
} as const;

export const shadows = {
  sm: {
    boxShadow: "0 0 6px rgba(0,0,0,0.04)",
    elevation: 2,
  },
  md: {
    boxShadow: "0 0 12px rgba(0,0,0,0.06)",
    elevation: 4,
  },
  lg: {
    boxShadow: "0 0 20px rgba(0,0,0,0.08)",
    elevation: 8,
  },
  glow: (color: string) => ({
    boxShadow: `0 0 16px ${color}33`,
    elevation: 6,
  }),
} as const;
