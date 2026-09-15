"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ClipboardList, ShieldAlert, AlertTriangle, FileText, Lightbulb, BarChart3, X } from "lucide-react";
import { projectRegistry } from "@/project/projectRegistry";

const TDR_TASKS = projectRegistry.tasks.filter((task) => task.id.startsWith("TDR-"));
const TDR_WDRS = projectRegistry.wdrs.filter((wdr) => wdr.taskId.startsWith("TDR-"));
const TDR_GATES = projectRegistry.qualityGates.filter((gate) =>
  ["qg-fdd", "qg-123", "qg-frontend-freeze", "qg-backend-gate", "qg-database-gate", "qg-wdr", "qg-pm-approval"].includes(gate.id),
);
const TDR_RISKS = projectRegistry.risks.filter((risk) => risk.id.startsWith("risk-tdr-"));

function taskProgress(status: string) {
  if (status === "PASS" || status === "CLOSED") return 100;
  if (status === "PARTIAL") return 75;
  if (status === "IN_PROGRESS") return 50;
  return 0;
}

const TASK_PROGRESS = TDR_TASKS.map((task) => ({
  ...task,
  progress: taskProgress(task.status),
}));

const GOVERNANCE_GATES = TDR_GATES;
const RISKS = TDR_RISKS;
const frontendFreezeGate = projectRegistry.qualityGates.find((gate) => gate.id === "qg-frontend-freeze");
const frontendFreezeAudit = projectRegistry.tasks.find((task) => task.id === "TDR-P1-008");
const WDR_ENTRIES = TDR_WDRS.map((wdr) => {
  const task = projectRegistry.tasks.find((candidate) => candidate.id === wdr.taskId);
  const hasCommit = Boolean(wdr.commitHash ?? task?.commitHash);
  const evidenceStatus = !task?.wdrPath ? "MISSING" : !hasCommit ? "STALE" : wdr.status;
  return { ...wdr, task, evidenceStatus };
});

type SectionId = "tasks" | "gates" | "risks" | "wdrs" | "next";

function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string }> = {
    PASS:           { bg: "#d1fae5", text: "#065f46" },
    "IN PROGRESS":  { bg: "#fef3c7", text: "#92400e" },
    BLOCKED:        { bg: "#fee2e2", text: "#991b1b" },
    PARTIAL:        { bg: "#fef3c7", text: "#92400e" },
    READY:          { bg: "#dbeafe", text: "#1e40af" },
    CLOSED:         { bg: "#d1fae5", text: "#065f46" },
    NOT_STARTED:    { bg: "#f3f4f6", text: "#374151" },
    IN_PROGRESS:    { bg: "#fef3c7", text: "#92400e" },
    MISSING:        { bg: "#fee2e2", text: "#991b1b" },
    STALE:          { bg: "#ffedd5", text: "#9a3412" },
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
  const currentTask = TDR_TASKS.find((task) => task.status === "IN_PROGRESS") ?? TDR_TASKS[0];
  const completedTaskCount = TDR_TASKS.filter((task) => task.status === "PASS" || task.status === "CLOSED").length;
  const latestEvidenceDate = TDR_WDRS.reduce((latest, wdr) => (wdr.date > latest ? wdr.date : latest), "");
  const missingEvidenceCount = TDR_TASKS.filter((task) => !TDR_WDRS.some((wdr) => wdr.taskId === task.id)).length;
  const staleEvidenceCount = WDR_ENTRIES.filter((wdr) => wdr.evidenceStatus === "STALE").length;
  const approvedNextAction = currentTask?.objective ?? projectRegistry.nextPlannedTask;

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
                {frontendFreezeGate?.name ?? "Frontend Freeze Gate"} &nbsp;·&nbsp; Governance preview only
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
              <strong>Frontend/static preview only.</strong> This panel reads the canonical project registry snapshot
              only. It does not read live Git, WDR files, database, or backend status. Future live project metrics
              require approved backend/API integration.
            </p>
          </div>

          {/* Summary key metrics */}
          <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: "Registry Phase", value: projectRegistry.currentPhase },
              { label: "Completed TDR Tasks", value: `${completedTaskCount} of ${TDR_TASKS.length}` },
              { label: "Current Task", value: currentTask?.id ?? "None" },
              { label: "Current Progress", value: currentTask ? `${taskProgress(currentTask.status)}%` : "0%" },
              {
                label: frontendFreezeGate?.name ?? "Frontend Freeze Gate",
                value: frontendFreezeAudit?.status ?? frontendFreezeGate?.status ?? "MISSING",
              },
              { label: "Latest Evidence", value: latestEvidenceDate || "Missing" },
              { label: "Commit References", value: `${TDR_TASKS.filter((task) => task.commitHash).length} recorded` },
              { label: "Stale Evidence", value: String(staleEvidenceCount) },
              { label: "Missing Evidence", value: String(missingEvidenceCount) },
              { label: "Data Mode", value: "Registry snapshot / preview only" },
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
                    <th className="text-right pb-2 font-medium text-xs" style={{ color: "var(--text-muted)" }}>Progress</th>
                    <th className="text-right pb-2 font-medium text-xs" style={{ color: "var(--text-muted)" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {TASK_PROGRESS.map((task) => (
                    <tr key={task.id} className="border-t" style={{ borderColor: "var(--border-default)" }}>
                      <td className="py-2 pr-3 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{task.id}</td>
                      <td className="py-2 pr-3 text-xs" style={{ color: "var(--text-primary)" }}>{task.title}</td>
                      <td className="py-2 text-right text-xs" style={{ color: "var(--text-secondary)" }}>{task.progress}%</td>
                      <td className="py-2 text-right">{statusBadge(task.status)}</td>
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
                {RISKS.map((risk) => (
                  <div
                    key={risk.id}
                    className="rounded-lg border p-3"
                    style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-secondary)" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{risk.title}</p>
                      {statusBadge(risk.severity)}
                    </div>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{risk.description}</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>Mitigation: {risk.mitigation}</p>
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
                    <th className="text-left pb-2 font-medium" style={{ color: "var(--text-muted)" }}>Commit</th>
                    <th className="text-left pb-2 font-medium" style={{ color: "var(--text-muted)" }}>Evidence</th>
                    <th className="text-right pb-2 font-medium" style={{ color: "var(--text-muted)" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {WDR_ENTRIES.map((wdr) => (
                    <tr key={wdr.id} className="border-t" style={{ borderColor: "var(--border-default)" }}>
                      <td className="py-2 pr-3 font-mono" style={{ color: "var(--text-secondary)" }}>{wdr.taskId}</td>
                      <td className="py-2 pr-3 font-mono break-all" style={{ color: "var(--text-muted)" }}>{wdr.task?.wdrPath ?? "Missing WDR reference"}</td>
                      <td className="py-2 pr-3 font-mono" style={{ color: "var(--text-muted)" }}>{wdr.commitHash ?? wdr.task?.commitHash ?? "Missing"}</td>
                      <td className="py-2 pr-3">{statusBadge(wdr.evidenceStatus)}</td>
                      <td className="py-2 text-right">{statusBadge(wdr.status)}</td>
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
                  {currentTask?.id ?? projectRegistry.nextPlannedTask}
                </p>
                <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                  {approvedNextAction}
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
