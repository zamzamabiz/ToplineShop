"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ProjectRegistry } from "@/project/projectRegistry";
import {
  Activity,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FileCheck2,
  GitBranch,
  LayoutDashboard,
  ListChecks,
  Map,
  Network,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  Workflow,
  X,
} from "lucide-react";
import { DashboardThemeOverride } from "@/components/layout/DashboardThemeOverride";
import Link from "next/link";

type SectionId =
  | "overview"
  | "phases"
  | "tasks"
  | "wdr"
  | "governance"
  | "architecture"
  | "modules"
  | "repository"
  | "risks"
  | "map";

type SectionDefinition = {
  id: SectionId;
  label: string;
  description: string;
  metric: string;
  icon: typeof LayoutDashboard;
};

const sectionDefinitions: SectionDefinition[] = [
  { id: "overview", label: "Overview", description: "Current project position", metric: "Live", icon: LayoutDashboard },
  { id: "phases", label: "Phases", description: "Progress and readiness", metric: "10 phases", icon: Workflow },
  { id: "tasks", label: "Tasks", description: "Execution and approvals", metric: "Registry", icon: ListChecks },
  { id: "wdr", label: "WDR evidence", description: "Work records and audits", metric: "Traceable", icon: FileCheck2 },
  { id: "governance", label: "Governance", description: "Gates and decisions", metric: "#123", icon: ShieldCheck },
  { id: "architecture", label: "Architecture", description: "Technology readiness", metric: "Layers", icon: Network },
  { id: "modules", label: "Modules", description: "Product capability map", metric: "Portfolio", icon: Boxes },
  { id: "repository", label: "Repository", description: "Git and verification", metric: "Local", icon: GitBranch },
  { id: "risks", label: "Risks", description: "Risks and deviations", metric: "Review", icon: TriangleAlert },
  { id: "map", label: "Project map", description: "Structure and ownership", metric: "System", icon: Map },
];

const statusStyles: Record<string, { background: string; color: string }> = {
  PASS: { background: "rgba(22, 163, 74, 0.12)", color: "var(--state-success)" },
  CLOSED: { background: "var(--surface-muted)", color: "var(--text-secondary)" },
  BLOCKED: { background: "rgba(220, 38, 38, 0.12)", color: "var(--state-danger)" },
  PLANNED: { background: "rgba(217, 119, 6, 0.12)", color: "var(--state-warning)" },
  READY: { background: "rgba(2, 132, 199, 0.12)", color: "var(--state-info)" },
  IN_PROGRESS: { background: "rgba(217, 119, 6, 0.12)", color: "var(--state-warning)" },
  PARTIAL: { background: "rgba(234, 88, 12, 0.12)", color: "#c2410c" },
  ACTIVE: { background: "rgba(22, 163, 74, 0.12)", color: "var(--state-success)" },
  ENFORCED: { background: "rgba(22, 163, 74, 0.12)", color: "var(--state-success)" },
  NOT_STARTED: { background: "var(--surface-muted)", color: "var(--text-muted)" },
  HIGH: { background: "rgba(220, 38, 38, 0.12)", color: "var(--state-danger)" },
  MEDIUM: { background: "rgba(217, 119, 6, 0.12)", color: "var(--state-warning)" },
  LOW: { background: "var(--surface-muted)", color: "var(--text-muted)" },
};

function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] || statusStyles.PLANNED;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide"
      style={{ backgroundColor: style.background, color: style.color }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--surface-muted)" }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(value, 100))}%`, backgroundColor: "var(--brand-primary)" }} />
    </div>
  );
}

function DetailShell({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <section id="dashboard-detail" className="scroll-mt-24 border-t pt-6" aria-label={`${title} details`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--brand-primary)" }}>Detail view</p>
          <h2 className="mt-1 text-xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{description}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close detail view"
          title="Close detail view"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors hover:bg-[var(--interactive-hover)]"
          style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}
        >
          <X size={16} />
        </button>
      </div>
      {children}
    </section>
  );
}

function DetailRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`border-b py-3 last:border-b-0 ${className}`} style={{ borderColor: "var(--border-subtle)" }}>{children}</div>;
}

function Metric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "warning" | "danger" }) {
  const colors = { default: "var(--text-primary)", success: "var(--state-success)", warning: "var(--state-warning)", danger: "var(--state-danger)" };
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="mt-1 text-xl font-bold" style={{ color: colors[tone] }}>{value}</p>
    </div>
  );
}

function formatCompletionDate(value: string | null) {
  if (!value) return "Pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function OverviewDetail({ registry }: { registry: ProjectRegistry }) {
  const completedTasks = registry.tasks.filter((task) => task.status === "PASS" || task.status === "CLOSED").length;
  const blockedTasks = registry.tasks.filter((task) => task.status === "BLOCKED").length;
  const currentPhase = registry.phases.find((phase) => `Phase ${phase.number}` === registry.currentPhase);
  const nextTask = registry.tasks.find((task) => task.id === registry.nextPlannedTask);
  const lane = [
    { label: "Frontend foundation", done: true },
    { label: "Design system", done: true },
    { label: "Frontend screens", done: false },
    { label: "Frontend freeze", done: false },
    { label: "Backend later", done: false },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Metric label="Overall completion" value={`${registry.overallCompletion}%`} tone="success" />
        <Metric label="Completed tasks" value={`${completedTasks}/${registry.tasks.length}`} tone="success" />
        <Metric label="Open blockers" value={`${blockedTasks}`} tone={blockedTasks ? "danger" : "success"} />
        <Metric label="Next planned" value={nextTask?.id || registry.nextPlannedTask || "None"} tone="warning" />
      </div>
      <ProgressBar value={registry.overallCompletion} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="border-l-2 pl-4" style={{ borderColor: "var(--brand-primary)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Current position</p>
          <p className="mt-1 text-sm font-medium">{registry.currentPhase} - {registry.currentTask || "No task in progress"}</p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{currentPhase?.objective || "Registry-driven project control"}</p>
        </div>
        <div className="border-l-2 pl-4" style={{ borderColor: "var(--state-warning)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Decision state</p>
          <p className="mt-1 text-sm font-medium">Owner approval: {registry.approvals.owner}</p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>PM approval is required before the next governed task.</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t pt-4" style={{ borderColor: "var(--border-subtle)" }}>
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>#FDD lane</span>
        {lane.map((stage, index) => (
          <span key={stage.label} className="inline-flex items-center gap-2 text-xs">
            {index > 0 && <ArrowRight size={12} style={{ color: "var(--text-muted)" }} />}
            <span className="rounded-md px-2.5 py-1.5 font-medium" style={{ backgroundColor: stage.done ? "rgba(22, 163, 74, 0.12)" : "var(--surface-muted)", color: stage.done ? "var(--state-success)" : "var(--text-muted)" }}>{stage.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function PhasesDetail({ registry }: { registry: ProjectRegistry }) {
  return (
    <div className="space-y-1">
      {registry.phases.map((phase) => (
        <DetailRow key={phase.id}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>P{phase.number}</span><span className="text-sm font-semibold">{phase.name}</span><StatusBadge status={phase.status} /></div>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{phase.objective}</p>
              <p className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>Tasks {phase.completedTaskCount}/{phase.taskCount} · Mega prompts {phase.megaPromptsCompleted}/{phase.megaPromptTarget} · {Math.max(phase.megaPromptTarget - phase.megaPromptsCompleted, 0)} remaining</p>
            </div>
            <div className="w-full md:w-40"><div className="mb-1 text-right text-xs" style={{ color: "var(--text-muted)" }}>{phase.progress}%</div><ProgressBar value={phase.progress} /></div>
          </div>
        </DetailRow>
      ))}
    </div>
  );
}

function TasksDetail({ registry }: { registry: ProjectRegistry }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead><tr className="border-b text-[11px] uppercase tracking-wide" style={{ borderColor: "var(--border-default)", color: "var(--text-muted)" }}><th className="pb-3 pr-3">Task</th><th className="pb-3 pr-3">Phase</th><th className="pb-3 pr-3">Status</th><th className="pb-3 pr-3">Completed</th><th className="pb-3 pr-3">Build</th><th className="pb-3">PM</th></tr></thead>
        <tbody>{registry.tasks.map((task) => <tr key={task.id} className="border-b last:border-0" style={{ borderColor: "var(--border-subtle)" }}><td className="py-3 pr-3"><div className="font-mono text-xs">{task.id}</div><div className="mt-1 max-w-xl text-xs" style={{ color: "var(--text-secondary)" }}>{task.title}</div></td><td className="py-3 pr-3 text-xs" style={{ color: "var(--text-muted)" }}>{task.phase.replace("phase-", "P")}</td><td className="py-3 pr-3"><StatusBadge status={task.status} /></td><td className="whitespace-nowrap py-3 pr-3 text-xs" style={{ color: task.completedAt ? "var(--state-success)" : "var(--text-muted)" }}>{task.completedAt ? <time dateTime={task.completedAt}>{formatCompletionDate(task.completedAt)}</time> : "Pending"}</td><td className="py-3 pr-3"><StatusBadge status={task.build} /></td><td className="py-3"><StatusBadge status={task.pmApproval} /></td></tr>)}</tbody>
      </table>
    </div>
  );
}

function WdrDetail({ registry }: { registry: ProjectRegistry }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead><tr className="border-b text-[11px] uppercase tracking-wide" style={{ borderColor: "var(--border-default)", color: "var(--text-muted)" }}><th className="pb-3 pr-3">WDR</th><th className="pb-3 pr-3">Task</th><th className="pb-3 pr-3">Status</th><th className="pb-3 pr-3">Commit</th><th className="pb-3">Audit</th></tr></thead>
        <tbody>{registry.wdrs.map((wdr) => <tr key={wdr.id} className="border-b last:border-0" style={{ borderColor: "var(--border-subtle)" }}><td className="py-3 pr-3 font-mono text-xs">{wdr.id}</td><td className="py-3 pr-3 text-xs">{wdr.taskId}</td><td className="py-3 pr-3"><StatusBadge status={wdr.status} /></td><td className="py-3 pr-3 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{wdr.commitHash || "pending"}</td><td className="py-3"><StatusBadge status={wdr.pmAudit} /></td></tr>)}</tbody>
      </table>
    </div>
  );
}

function GovernanceDetail({ registry }: { registry: ProjectRegistry }) {
  return (
    <div className="grid gap-x-8 gap-y-1 md:grid-cols-2">
      {registry.qualityGates.map((gate) => <DetailRow key={gate.id}><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold">{gate.name}</p><p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{gate.description}</p><p className="mt-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>Enforced by {gate.enforcedBy}</p></div><StatusBadge status={gate.status} /></div></DetailRow>)}
    </div>
  );
}

function ArchitectureDetail({ registry }: { registry: ProjectRegistry }) {
  return <div className="grid gap-x-8 gap-y-1 md:grid-cols-2">{registry.architecture.map((item) => <DetailRow key={item.id}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{item.layer}</p><p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>{item.technology}</p><p className="mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>{item.notes}</p></div><StatusBadge status={item.status} /></div></DetailRow>)}</div>;
}

function ModulesDetail({ registry }: { registry: ProjectRegistry }) {
  return <div className="grid gap-x-8 gap-y-1 md:grid-cols-2">{registry.modules.map((module) => <DetailRow key={module.id}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{module.name}</p><p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{module.description}</p></div><StatusBadge status={module.status} /></div></DetailRow>)}</div>;
}

function RepositoryDetail({ registry }: { registry: ProjectRegistry }) {
  return <div className="grid gap-4 md:grid-cols-3"><Metric label="Remote" value={registry.github.configured ? "Configured" : "Missing"} tone={registry.github.configured ? "success" : "danger"} /><Metric label="Build" value={registry.build.lastResult} tone={registry.build.lastResult === "PASS" ? "success" : "danger"} /><Metric label="Tests" value={registry.tests.lastResult} tone={registry.tests.lastResult === "PASS" ? "success" : "danger"} /><div className="md:col-span-3 border-t pt-4" style={{ borderColor: "var(--border-subtle)" }}><p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Repository</p><p className="mt-1 break-all text-sm">{registry.github.url || "No remote configured"}</p><p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>Push allowed: {registry.github.pushAllowed ? "Yes" : "No, local only until PM approval"}</p><p className="mt-1 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>Registry commit: {registry.git.lastCommit || "none"}</p></div></div>;
}

function RisksDetail({ registry }: { registry: ProjectRegistry }) {
  return <div className="space-y-5"><div><div className="mb-2 flex items-center gap-2"><ShieldAlert size={16} style={{ color: "var(--state-warning)" }} /><h3 className="text-sm font-semibold">Risks and deviations</h3></div>{registry.risks.map((risk) => <DetailRow key={risk.id}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{risk.title}</p><p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{risk.description}</p><p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>Mitigation: {risk.mitigation}</p></div><div className="flex shrink-0 gap-2"><StatusBadge status={risk.severity} /><StatusBadge status={risk.status} /></div></div></DetailRow>)}</div><div><div className="mb-2 flex items-center gap-2"><ClipboardCheck size={16} style={{ color: "var(--brand-primary)" }} /><h3 className="text-sm font-semibold">Key decisions</h3></div>{registry.decisions.map((decision) => <DetailRow key={decision.id}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{decision.title}</p><p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{decision.description}</p><p className="mt-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>{decision.decidedBy} · {decision.date}</p></div><StatusBadge status={decision.status} /></div></DetailRow>)}</div></div>;
}

function ProjectMapDetail({ registry }: { registry: ProjectRegistry }) {
  const groups = [
    ["Governance", ["#FDD — Frontend First", "#123 — Protocol", "WDR — Work Done Records"]],
    ["Frontend", ["Next.js 16 App Router", "React 19", "TypeScript 5", "Tailwind CSS 4"]],
    ["Future backend", registry.technology.backend],
    ["Future database", registry.technology.database],
    ["Future infrastructure", registry.technology.infrastructure],
  ];
  return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{groups.map(([label, items]) => <div key={String(label)} className="border-l-2 pl-4" style={{ borderColor: "var(--border-default)" }}><p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</p><ul className="mt-2 space-y-2">{(items as string[]).map((item) => <li key={item} className="flex items-start gap-2 text-sm"><CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: "var(--brand-primary)" }} />{item}</li>)}</ul></div>)}</div>;
}

function DetailContent({ id, registry }: { id: SectionId; registry: ProjectRegistry }) {
  if (id === "overview") return <OverviewDetail registry={registry} />;
  if (id === "phases") return <PhasesDetail registry={registry} />;
  if (id === "tasks") return <TasksDetail registry={registry} />;
  if (id === "wdr") return <WdrDetail registry={registry} />;
  if (id === "governance") return <GovernanceDetail registry={registry} />;
  if (id === "architecture") return <ArchitectureDetail registry={registry} />;
  if (id === "modules") return <ModulesDetail registry={registry} />;
  if (id === "repository") return <RepositoryDetail registry={registry} />;
  if (id === "risks") return <RisksDetail registry={registry} />;
  return <ProjectMapDetail registry={registry} />;
}

export function ProjectManagementDashboard({ registry }: { registry: ProjectRegistry }) {
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const detailRef = useRef<HTMLDivElement>(null);
  const phase = registry.phases.find((item) => `Phase ${item.number}` === registry.currentPhase);
  const remainingMegaPrompts = phase ? Math.max(phase.megaPromptTarget - phase.megaPromptsCompleted, 0) : 0;
  const completedTasks = useMemo(() => registry.tasks.filter((task) => task.status === "PASS" || task.status === "CLOSED").length, [registry.tasks]);
  const blockedTasks = useMemo(() => registry.tasks.filter((task) => task.status === "BLOCKED").length, [registry.tasks]);

  useEffect(() => {
    if (activeSection !== "overview") detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeSection]);

  const selectSection = (id: SectionId) => setActiveSection((current) => current === id && id !== "overview" ? "overview" : id);
  const activeDefinition = sectionDefinitions.find((section) => section.id === activeSection) || sectionDefinitions[0];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--app-canvas)" }}>
      <header className="sticky top-0 z-20 border-b" style={{ borderColor: "var(--border-default)", backgroundColor: "color-mix(in srgb, var(--surface-primary) 92%, transparent)" }}>
        <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3 hover:opacity-80"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">T</span><span className="truncate text-base font-semibold">ToplineShop</span><span className="hidden border-l pl-3 text-xs sm:inline" style={{ borderColor: "var(--border-default)", color: "var(--text-muted)" }}>Project Management Control Center</span></Link>
          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}><span className="hidden md:inline">Updated {new Date(registry.lastUpdated).toLocaleDateString()}</span><DashboardThemeOverride dashboard="project-management" /></div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div><div className="mb-2 flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}><Activity size={14} style={{ color: "var(--brand-primary)" }} />Live registry dashboard</div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Project Management Control Center</h1><p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{registry.currentPhase} · {registry.currentTask || "No task in progress"} · {registry.protocol}</p></div>
          <div className="flex items-center gap-2 text-xs"><StatusBadge status={registry.status} /><span style={{ color: "var(--text-muted)" }}>Source: <code className="font-mono">src/project/projectRegistry.ts</code></span></div>
        </div>

        <section className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border sm:grid-cols-5" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--border-default)" }} aria-label="Project summary metrics">
          <div className="bg-[var(--surface-primary)] p-4"><Metric label="Overall" value={`${registry.overallCompletion}%`} tone="success" /></div>
          <div className="bg-[var(--surface-primary)] p-4"><Metric label="Current phase" value={registry.currentPhase} /></div>
          <div className="bg-[var(--surface-primary)] p-4"><Metric label="Completed tasks" value={`${completedTasks}/${registry.tasks.length}`} tone="success" /></div>
          <div className="bg-[var(--surface-primary)] p-4"><Metric label="Mega prompts left" value={`${remainingMegaPrompts}`} tone={remainingMegaPrompts ? "warning" : "success"} /></div>
          <div className="bg-[var(--surface-primary)] p-4"><Metric label="Blockers" value={`${blockedTasks}`} tone={blockedTasks ? "danger" : "success"} /></div>
        </section>

        <section className="mb-6 rounded-lg border p-4" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }} aria-labelledby="dashboard-sections-heading">
          <div className="mb-4 flex items-center justify-between gap-3"><div><h2 id="dashboard-sections-heading" className="text-sm font-semibold">Control center sections</h2><p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>Select a section to open its live registry details.</p></div><span className="hidden text-xs sm:inline" style={{ color: "var(--text-muted)" }}>{phase ? `${phase.name} · ${phase.status}` : "Registry connected"}</span></div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
            {sectionDefinitions.map((section) => {
              const Icon = section.icon;
              const selected = activeSection === section.id;
              const metric = section.id === "phases" ? `${remainingMegaPrompts} mega prompts left` : section.id === "tasks" ? `${registry.tasks.length} total` : section.id === "wdr" ? `${registry.wdrs.length} records` : section.metric;
              return <button key={section.id} type="button" onClick={() => selectSection(section.id)} aria-expanded={selected} aria-controls="dashboard-detail" data-section-id={section.id} className="group min-h-24 rounded-md border p-3 text-left transition-colors hover:bg-[var(--interactive-hover)]" style={{ borderColor: selected ? "var(--brand-primary)" : "var(--border-default)", backgroundColor: selected ? "var(--interactive-active)" : "var(--surface-primary)" }}><span className="flex items-center justify-between"><Icon size={17} style={{ color: selected ? "var(--brand-primary)" : "var(--text-secondary)" }} /><ChevronDown size={14} className={`transition-transform ${selected ? "rotate-180" : ""}`} style={{ color: "var(--text-muted)" }} /></span><span className="mt-3 block text-sm font-semibold">{section.label}</span><span className="mt-1 block truncate text-xs" style={{ color: "var(--text-muted)" }}>{metric}</span><span className="sr-only">{section.description}</span></button>;
            })}
          </div>
        </section>

        <div ref={detailRef} className="rounded-lg border p-5 sm:p-6" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}>
          <DetailShell title={activeDefinition.label} description={activeDefinition.description} onClose={() => setActiveSection("overview")}><DetailContent id={activeSection} registry={registry} /></DetailShell>
        </div>

        <footer className="flex flex-col gap-2 border-t py-5 text-xs sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border-default)", color: "var(--text-muted)" }}><span>ToplineShop v{registry.version} · {registry.developmentPolicy}</span><span>Protocol {registry.protocol} · {registry.lastUpdated}</span></footer>
      </main>
    </div>
  );
}
