import { WifiOff } from "lucide-react";

export function TdrPreviewBanner() {
  return (
    <div
      className="rounded-lg border px-4 py-3 mb-6 flex items-start gap-3"
      style={{
        borderColor: "var(--border-default)",
        backgroundColor: "var(--surface-muted)",
      }}
      role="note"
      aria-label="Frontend preview — backend not connected"
    >
      <WifiOff className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }} aria-hidden="true" />
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        <strong style={{ color: "var(--text-secondary)" }}>Frontend Preview — Backend Not Connected.</strong>{" "}
        This page uses synthetic mock data only. No ingestion, validation, API, database, authentication, or RBAC is
        implemented. Import actions are disabled. This preview is for UX approval under #FDD gate G1.
      </p>
    </div>
  );
}
