export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
  "3xl": "4rem",
} as const;

export const radii = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.5rem",
  full: "9999px",
} as const;

export const shadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
} as const;

export const typography = {
  xs: { fontSize: "0.75rem", lineHeight: "1rem" },
  sm: { fontSize: "0.875rem", lineHeight: "1.25rem" },
  base: { fontSize: "1rem", lineHeight: "1.5rem" },
  lg: { fontSize: "1.125rem", lineHeight: "1.75rem" },
  xl: { fontSize: "1.25rem", lineHeight: "1.75rem" },
  "2xl": { fontSize: "1.5rem", lineHeight: "2rem" },
  "3xl": { fontSize: "1.875rem", lineHeight: "2.25rem" },
  "4xl": { fontSize: "2.25rem", lineHeight: "2.5rem" },
} as const;

export type StatusType =
  | "PLANNED"
  | "READY"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "PARTIAL"
  | "PASS"
  | "CLOSED"
  | "DEFERRED"
  | "NOT_STARTED"
  | "ACTIVE"
  | "ENFORCED";

export const statusColors: Record<StatusType, { bg: string; text: string }> = {
  PLANNED: {
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-700 dark:text-zinc-300",
  },
  READY: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
  },
  IN_PROGRESS: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
  },
  BLOCKED: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
  },
  PARTIAL: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-400",
  },
  PASS: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
  },
  CLOSED: {
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-700 dark:text-zinc-300",
  },
  DEFERRED: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-400",
  },
  NOT_STARTED: {
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-500 dark:text-zinc-400",
  },
  ACTIVE: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
  },
  ENFORCED: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
  },
};

export function getStatusClasses(status: string): string {
  const colors =
    statusColors[status as StatusType] || statusColors.PLANNED;
  return `${colors.bg} ${colors.text}`;
}

export const phaseLabels: Record<string, string> = {
  "phase-0": "P0: Foundation",
  "phase-1": "P1: Design System",
  "phase-2": "P2: Public Marketplace",
  "phase-3": "P3: B2B Wholesale",
  "phase-4": "P4: Customer Commerce",
  "phase-5": "P5: Vendor SaaS",
  "phase-6": "P6: Admin/Owner",
  "phase-7": "P7: Backend/API",
  "phase-8": "P8: Database/Auth",
  "phase-9": "P9: Real Wiring",
  "phase-10": "P10: Quality/Launch",
};

export const priorityLabels: Record<string, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const governanceLabels = {
  fdd: "#FDD — Frontend Development First",
  protocol: "#123 — DISCUSS → DECIDE → EXECUTE → VERIFY → CLOSE → NEXT",
  wdr: "WDR required after every governed task",
  pmAudit: "PM audit required before next task",
} as const;
