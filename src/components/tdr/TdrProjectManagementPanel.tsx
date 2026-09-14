"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ClipboardList, ShieldAlert, AlertTriangle, FileText, Lightbulb, BarChart3, X } from "lucide-react";

// Static governance preview data — does not read live Git, WDR files, database, or backend.
// Future live metrics require approved backend/API integration.

const TASK_PROGRESS = [
  { id: "TDR-P0-001", title: "Project & Governance Bootstrap", status: "PASS" },
  { id: "TDR-GOV-START-001", title: "Governing AI Briefing", status: "PASS" },
  { id: "TDR-P0-002", title: "Strategic Execution Roadmap", status: "PASS" },
  { id: "TDR-P1-001", title: "TDR Dashboard Shell + Mock Data", status: "PASS" },
  { id: "TDR-P1-002", title: "Search / Filter / Pagination", status: "PASS" },
  { id: "TDR-P1-003", title: "Batch Detail Preview Modal", status: "PASS" },
  { id: "TDR-P1-004", title: "Project Management Dashboard Panel", status: "IN PROGRESS" },
];

const GOVERNANCE_GATES = [
  {
    id: "G1",
    name: "G1 — Frontend Proof / Freeze",
    description: "All required TDR frontend screens visually approved by Owner/PM before any backend work starts.",
    status: "IN_PROGRESS",
  },
  {
    id: "G2",
    name: "G2 — Auth / RBAC / Platform Readiness",
    description: "Platform Auth and RBAC must be implemented and approved before backend/refinery work begins.",
    status: "BLOCKED",
  },
  {
    id: "G3",
    name: "Backend / Refinery Implementation",
    description: "NestJS services, Prisma, ingestion workers, and queue logic. Not authorized until G1 and G2 pass.",
    status: "NOT_STARTED",
  },
  {
    id: "G4",
    name: "Large Data Safety Rule",
    description: "Browser must never load millions of trade rows. Server-side pagination and streaming required.",
    status: "ENFORCED",
  },
];

const RISKS = [
  {
    id: "R1",
    title: "Backend work before frontend freeze",
    detail: "Starting backend before #FDD G1 is approved wastes effort if UX changes post-freeze.",
    severity: "HIGH",
  },
  {
    id: "R2",
    title: "Backend work before Auth/RBAC readiness",
    detail: "Backend trade data without Auth/RBAC exposes sensitive commercial data to unauthorized access.",
    severity: "CRITICAL",
  },
  {
    id: "R3",
    title: "Large trade data loaded into browser",
    detail: "Millions of trade rows in browser memory will cause crashes and data exposure.",
    severity: "HIGH",
  },
  {
    id: "R4",
    title: "Mock UI mistaken for live system",
    detail: "Preview banners must remain visible so stakeholders do not act on synthetic data.",
    severity: "MEDIUM",
  },
];

const WDR_ENTRIES = [
  { id: "TDR-P1-001", path: "WDR/_All/Trade-Data-Refinery/TDR-P1-001_WDR_2026-09-14.md", status: "PASS" },
  { id: "TDR-P1-002", path: "WDR/_All/Trade-Data-Refinery/TDR-P1-002_WDR_2026-09-14.md", status: "PASS" },
  { id: "TDR-P1-003", path: "WDR/_All/Trade-Data-Refinery/TDR-P1-003_WDR_2026-09-14.md", status: "PASS" },
  {
    id: "TDR-P1-003-UX-CORRECTIVE-001",
    path: "WDR/_All/Trade-Data-Refinery/TDR-P1-003-UX-CORRECTIVE-001_WDR_2026-09-14.md",
    status: "PASS",
  },
  {
    id: "TDR-P1-003-UX-CORRECTIVE-002",
    path: "WDR/_All/Trade-Data-Refinery/TDR-P1-003-UX-CORRECTIVE-002_WDR_2026-09-14.md",
    status: "PASS",
  },
  { id: "TDR-P1-004", path: "WDR/_All/Trade-Data-Refinery/TDR-P1-004_WDR_2026-09-14.md", status: "IN PROGRESS" },
];

type SectionId = "tasks" | "gates" | "risks" | "wdrs" | "next";

function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string }> = {
    PASS:           { bg: "#d1fae5", text: "#065f46" },
    "IN PROGRESS":  { bg: "#fef3c7", text: "#92400e" },
    BLOCKED:        { bg: "#fee2e2", text: "#991b1b" },
    NOT_STARTED:    { bg: "#f3f4f6", text: "#374151" },
    IN_PROGRESS:    { bg: "#fef3c7", text: "#92400e" },
    ENFORCED:       { bg: "#dbeafe", text: "#1e40af" },
    CRITICAL:       { bg: "#fee2e2", text: "#991b1b" },
    HIGH:           { bg: "#ffedd5", text: "#9a3412" },
    MEDIUM:         { bg: "#fef9c3", text: "#854d0e" },
    LOW:            { bg: "#f0fdf4", text: "#166534" },
  };
  const style = map[status] ?? { bg: "#f3f4f6", text: "#374151" };
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {status}
    </span>
  );
}

function AccordionSection({
  id,
  open,
  onToggle,
  icon,
  title,
  children,
}: {
  id: SectionId;
  open: boolean;
  onToggle: (id: SectionId) => void;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: "var(--border-default)" }}
    >
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={open}
        aria-controls={`pm-section-${id}`}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ backgroundColor: "var(--surface-secondary)" }}
      >
        <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {icon}
          {title}
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} aria-hidden="true" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} aria-hidden="true" />
        )}
      </button>
      {open && (
        <div
          id={`pm-section-${id}`}
          className="px-4 py-4 space-y-3"
          style={{ backgroundColor: "var(--surface-primary)" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface TdrProjectManagementPanelProps {
  isModuleDisabled?: boolean;
}

export function TdrProjectManagementPanel({ isModuleDisabled = false }: TdrProjectManagementPanelProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Set<SectionId>>(new Set());

  const toggleSection = (id: SectionId) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  return (
    <div className="mb-6">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setPanelOpen((v) => !v)}
        aria-expanded={panelOpen}
        aria-controls="tdr-pm-panel"
        className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          borderColor: "var(--border-default)",
          backgroundColor: "var(--surface-primary)",
          color: "var(--text-primary)",
        }}
      >
        <BarChart3 className="h-4 w-4 shrink-0" style={{ color: "var(--brand-primary)" }} aria-hidden="true" />
        TDR Project Metrics
        {panelOpen ? (
          <ChevronDown className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} aria-hidden="true" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} aria-hidden="true" />
        )}
      </button>

      {/* Expandable panel */}
      {panelOpen && (
        <div
          id="tdr-pm-panel"
          role="region"
          aria-label="TDR Project Management Metrics"
          className="mt-3 rounded-xl border"
          style={{
            borderColor: "var(--border-default)",
            backgroundColor: "var(--surface-primary)",
          }}
        >
          {/* Panel header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: "var(--border-default)" }}
          >
            <div>
              <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                TDR Project Management
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Phase P1 — Frontend Proof &nbsp;·&nbsp; Governance preview only
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              aria-label="Close project management panel"
              className="rounded-md p-1 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Static preview warning */}
          <div
            className="mx-5 mt-4 rounded-lg border px-4 py-3 flex items-start gap-3"
            style={{ borderColor: "#fbbf24", backgroundColor: "#fffbeb" }}
            role="note"
            aria-label="Preview-only notice"
          >
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#b45309" }} aria-hidden="true" />
            <p className="text-xs" style={{ color: "#92400e" }}>
              <strong>Frontend/static preview only.</strong> This panel does not read live Git, WDR files, database, or
              backend status. All data is static governance reference. Future live project metrics require approved
              backend/API integration.
            </p>
          </div>

          {/* Summary key metrics */}
          <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: "Current TDR Phase", value: "P1 — Frontend Proof" },
              { label: "Completed TDR Tasks", value: "6 of 7" },
              { label: "Current Task", value: "TDR-P1-004" },
              { label: "Next Planned Task", value: "TDR-P1-005 (Owner/PM to decide)" },
              { label: "Frontend Gate G1", value: "In progress — not frozen" },
              { label: "Backend Gate G2", value: "Blocked — not started" },
              { label: "Backend Status", value: "Not started" },
              { label: "Data Mode", value: "Mock / synthetic only" },
              { label: "Last Accepted WDR", value: "TDR-P1-003" },
              { label: "Open Blockers", value: "0" },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-lg border p-3"
                style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-secondary)" }}
              >
                <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Accordion sections */}
          <div className="px-5 pb-5 space-y-2">
            {/* Task Progress */}
            <AccordionSection
              id="tasks"
              open={openSections.has("tasks")}
              onToggle={toggleSection}
              icon={<ClipboardList className="h-4 w-4 shrink-0" style={{ color: "var(--brand-primary)" }} aria-hidden="true" />}
              title="Task Progress"
            >
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left pb-2 font-medium text-xs" style={{ color: "var(--text-muted)" }}>Task</th>
                    <th className="text-left pb-2 font-medium text-xs" style={{ color: "var(--text-muted)" }}>Title</th>
                    <th className="text-right pb-2 font-medium text-xs" style={{ color: "var(--text-muted)" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {TASK_PROGRESS.map((t) => (
                    <tr key={t.id} className="border-t" style={{ borderColor: "var(--border-default)" }}>
                      <td className="py-2 pr-3 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{t.id}</td>
                      <td className="py-2 pr-3 text-xs" style={{ color: "var(--text-primary)" }}>{t.title}</td>
                      <td className="py-2 text-right">{statusBadge(t.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AccordionSection>

            {/* Governance Gates */}
            <AccordionSection
              id="gates"
              open={openSections.has("gates")}
              onToggle={toggleSection}
              icon={<ShieldAlert className="h-4 w-4 shrink-0" style={{ color: "#f59e0b" }} aria-hidden="true" />}
              title="Governance Gates"
            >
              <div className="space-y-3">
                {GOVERNANCE_GATES.map((g) => (
                  <div
                    key={g.id}
                    className="rounded-lg border p-3"
                    style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-secondary)" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{g.name}</p>
                      {statusBadge(g.status)}
                    </div>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{g.description}</p>
                  </div>
                ))}
              </div>
            </AccordionSection>

            {/* Risk Register */}
            <AccordionSection
              id="risks"
              open={openSections.has("risks")}
              onToggle={toggleSection}
              icon={<AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "#ef4444" }} aria-hidden="true" />}
              title="Risk Register"
            >
              <div className="space-y-3">
                {RISKS.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-lg border p-3"
                    style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-secondary)" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{r.title}</p>
                      {statusBadge(r.severity)}
                    </div>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{r.detail}</p>
                  </div>
                ))}
              </div>
            </AccordionSection>

            {/* WDR Evidence */}
            <AccordionSection
              id="wdrs"
              open={openSections.has("wdrs")}
              onToggle={toggleSection}
              icon={<FileText className="h-4 w-4 shrink-0" style={{ color: "#6366f1" }} aria-hidden="true" />}
              title="WDR Evidence"
            >
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left pb-2 font-medium" style={{ color: "var(--text-muted)" }}>Task</th>
                    <th className="text-left pb-2 font-medium" style={{ color: "var(--text-muted)" }}>Path</th>
                    <th className="text-right pb-2 font-medium" style={{ color: "var(--text-muted)" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {WDR_ENTRIES.map((w) => (
                    <tr key={w.id} className="border-t" style={{ borderColor: "var(--border-default)" }}>
                      <td className="py-2 pr-3 font-mono" style={{ color: "var(--text-secondary)" }}>{w.id}</td>
                      <td className="py-2 pr-3 font-mono break-all" style={{ color: "var(--text-muted)" }}>{w.path}</td>
                      <td className="py-2 text-right">{statusBadge(w.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AccordionSection>

            {/* Next Recommended Task */}
            <AccordionSection
              id="next"
              open={openSections.has("next")}
              onToggle={toggleSection}
              icon={<Lightbulb className="h-4 w-4 shrink-0" style={{ color: "#10b981" }} aria-hidden="true" />}
              title="Next Recommended Task"
            >
              <div
                className="rounded-lg border p-4"
                style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-secondary)" }}
              >
                <p className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                  TDR-P1-005 — Candidate
                </p>
                <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                  Next task will be decided by Owner/PM after visual audit of TDR-P1-004.
                  Candidates include: additional frontend screens, accessibility hardening, or frontend freeze gate
                  review.
                </p>
                <div
                  className="rounded border px-3 py-2"
                  style={{ borderColor: "#fbbf24", backgroundColor: "#fffbeb" }}
                >
                  <p className="text-xs font-medium" style={{ color: "#92400e" }}>
                    Backend/refinery work is NOT authorized until G1 (frontend freeze) and G2 (Auth/RBAC) gates pass.
                    Do not start TDR backend work without Owner/PM explicit authorization.
                  </p>
                </div>
              </div>
            </AccordionSection>
          </div>

          {/* Module disabled override notice */}
          {isModuleDisabled && (
            <div
              className="mx-5 mb-5 rounded-lg border px-4 py-3"
              style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-muted)" }}
              role="note"
            >
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                <strong style={{ color: "var(--text-secondary)" }}>Governance admin preview only.</strong> Module is
                disabled for this tenant. This panel shows governance/project tracking data that is independent of
                tenant module access.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
