import type { ProjectRegistry } from "@/project/projectRegistry";

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    PLANNED: { bg: "var(--surface-muted)", text: "var(--text-muted)" },
    READY: { bg: "#dbeafe", text: "#1d4ed8" },
    IN_PROGRESS: { bg: "#fef3c7", text: "#b45309" },
    BLOCKED: { bg: "#fee2e2", text: "#dc2626" },
    PARTIAL: { bg: "#ffedd5", text: "#ea580c" },
    PASS: { bg: "#dcfce7", text: "#16a34a" },
    CLOSED: { bg: "var(--surface-muted)", text: "var(--text-muted)" },
    DEFERRED: { bg: "#f3e8ff", text: "#9333ea" },
    NOT_STARTED: { bg: "var(--surface-muted)", text: "var(--text-muted)" },
    ENFORCED: { bg: "#dcfce7", text: "#16a34a" },
    ACTIVE: { bg: "#dcfce7", text: "#16a34a" },
    HIGH: { bg: "#fee2e2", text: "#dc2626" },
    MEDIUM: { bg: "#fef3c7", text: "#b45309" },
    LOW: { bg: "var(--surface-muted)", text: "var(--text-muted)" },
  };
  const colors = colorMap[status] || colorMap.PLANNED;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div
      className="w-full rounded-full h-2"
      style={{ backgroundColor: "var(--surface-muted)" }}
    >
      <div
        className="h-2 rounded-full transition-all duration-300"
        style={{
          width: `${value}%`,
          backgroundColor: "var(--brand-primary)",
        }}
      />
    </div>
  );
}

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border ${className}`}
      style={{
        backgroundColor: "var(--surface-primary)",
        borderColor: "var(--border-default)",
        color: "var(--text-primary)",
      }}
    >
      <div
        className="px-6 py-4 border-b"
        style={{ borderColor: "var(--border-default)" }}
      >
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export function SourceOfTruthBanner() {
  return (
    <div
      className="rounded-lg border px-4 py-3"
      style={{
        backgroundColor: "var(--surface-secondary)",
        borderColor: "var(--border-default)",
      }}
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium" style={{ color: "var(--brand-primary)" }}>
          Source of Truth:
        </span>
        <code
          className="text-xs px-2 py-0.5 rounded font-mono"
          style={{
            backgroundColor: "var(--surface-muted)",
            color: "var(--text-secondary)",
          }}
        >
          src/project/projectRegistry.ts
        </code>
        <span style={{ color: "var(--text-muted)" }}>
          — All dashboard panels render from this canonical registry.
        </span>
      </div>
    </div>
  );
}

export function GitHubPanel({
  registry,
}: {
  registry: ProjectRegistry;
}) {
  const gh = registry.github;
  return (
    <Card title="GitHub Repository">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">
              {gh.url || "Not configured"}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Remote origin
            </div>
          </div>
          <StatusBadge
            status={gh.configured ? "ACTIVE" : "NOT_STARTED"}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Push allowed:</span>
          <span>{gh.pushAllowed ? "Yes" : "No — local only until PM approves"}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Last commit:</span>
          <code className="font-mono">{registry.git.lastCommit || "none"}</code>
        </div>
      </div>
    </Card>
  );
}

export function PhaseReadinessPanel({
  registry,
}: {
  registry: ProjectRegistry;
}) {
  const checks = [
    { label: "Greenfield root confirmed", done: true },
    { label: "Dashboard created", done: true },
    { label: "Registry created", done: true },
    { label: "WDR structure created", done: true },
    { label: "Design-system architecture", done: true },
    { label: "Git initialized", done: registry.git.initialized },
    { label: "Remote configured", done: registry.github.configured },
    { label: "Build passing", done: registry.build.lastResult === "PASS" },
    { label: "PM audit required", done: true },
  ];
  return (
    <Card title="Phase 0 Readiness Checklist">
      <div className="space-y-2">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center gap-2 text-sm">
            <span
              style={{
                color: check.done ? "var(--state-success)" : "var(--text-muted)",
              }}
            >
              {check.done ? "✓" : "○"}
            </span>
            <span>{check.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function FddLane() {
  const stages = [
    { label: "Frontend Foundation", active: true, done: true },
    { label: "Design System", active: true, done: false },
    { label: "Frontend Screens", active: false, done: false },
    { label: "Frontend Freeze", active: false, done: false },
    { label: "Backend Later", active: false, done: false },
  ];
  return (
    <Card title="#FDD Lane — Frontend Development First">
      <div className="flex items-center gap-1">
        {stages.map((stage, i) => (
          <div key={stage.label} className="flex items-center">
            <div
              className="px-3 py-1.5 text-xs font-medium rounded-md"
              style={{
                backgroundColor: stage.done
                  ? "#dcfce7"
                  : stage.active
                    ? "#fef3c7"
                    : "var(--surface-muted)",
                color: stage.done
                  ? "#16a34a"
                  : stage.active
                    ? "#b45309"
                    : "var(--text-muted)",
              }}
            >
              {stage.label}
            </div>
            {i < stages.length - 1 && (
              <span
                className="mx-1"
                style={{ color: "var(--text-muted)" }}
              >
                →
              </span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function MegaPromptPlan({ registry }: { registry: ProjectRegistry }) {
  return (
    <Card title="Mega Prompt Phase Plan">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Phase
              </th>
              <th className="pb-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Target
              </th>
              <th className="pb-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Done
              </th>
              <th className="pb-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Remaining
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {registry.phases.map((phase) => (
              <tr key={phase.id} className="transition-colors" style={{ ["--hover-bg" as string]: "var(--table-row-hover)" }}>
                <td className="py-2 text-xs">
                  <span className="font-mono text-muted-foreground">P{phase.number}</span>{" "}
                  {phase.name}
                </td>
                <td className="py-2 text-center text-xs">{phase.megaPromptTarget}</td>
                <td className="py-2 text-center text-xs">{phase.megaPromptsCompleted}</td>
                <td className="py-2 text-center text-xs">
                  {phase.megaPromptTarget - phase.megaPromptsCompleted}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function ExecutiveSummary({ registry }: { registry: ProjectRegistry }) {
  const completedTasks = registry.tasks.filter(
    (t) => t.status === "PASS" || t.status === "CLOSED"
  ).length;
  const blockedTasks = registry.tasks.filter(
    (t) => t.status === "BLOCKED"
  ).length;

  const cards = [
    {
      label: "Overall Completion",
      value: `${registry.overallCompletion}%`,
      color: "text-primary",
    },
    {
      label: "Current Phase",
      value: registry.currentPhase,
      color: "text-foreground",
    },
    {
      label: "Current Task",
      value: registry.currentTask,
      color: "text-foreground",
    },
    {
      label: "Completed Tasks",
      value: `${completedTasks}/${registry.tasks.length}`,
      color: "text-success",
    },
    {
      label: "Open Blockers",
      value: blockedTasks.toString(),
      color: blockedTasks > 0 ? "text-danger" : "text-success",
    },
    {
      label: "Owner Decisions Required",
      value: registry.approvals.owner === "PLANNED" ? "Yes" : "No",
      color:
        registry.approvals.owner === "PLANNED"
          ? "text-warning"
          : "text-success",
    },
    {
      label: "Build Status",
      value: registry.build.lastResult.replace(/_/g, " "),
      color:
        registry.build.lastResult === "PASS"
          ? "text-success"
          : "text-muted-foreground",
    },
    {
      label: "Test Status",
      value: registry.tests.lastResult.replace(/_/g, " "),
      color:
        registry.tests.lastResult === "PASS"
          ? "text-success"
          : "text-muted-foreground",
    },
  ];

  return (
    <Card title="Executive Summary">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {card.label}
            </div>
            <div className={`text-lg font-bold capitalize ${card.color}`}>
              {card.value}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Progress</span>
          <span>{registry.overallCompletion}%</span>
        </div>
        <ProgressBar value={registry.overallCompletion} />
      </div>
    </Card>
  );
}

export function PhaseTimeline({ registry }: { registry: ProjectRegistry }) {
  return (
    <Card title="Project Phases">
      <div className="space-y-3">
        {registry.phases.map((phase) => (
          <div
            key={phase.id}
            className="rounded-lg border border-border p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    P{phase.number}
                  </span>
                  <span className="font-medium text-sm">{phase.name}</span>
                  <StatusBadge status={phase.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                  {phase.objective}
                </p>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    Tasks: {phase.completedTaskCount}/{phase.taskCount}
                  </span>
                  <span>
                    Mega Prompts: {phase.megaPromptsCompleted}/
                    {phase.megaPromptTarget}
                  </span>
                  {phase.currentTask && (
                    <span>Current: {phase.currentTask}</span>
                  )}
                </div>
              </div>
              <div className="w-24 flex-shrink-0">
                <div className="text-right text-xs text-muted-foreground mb-1">
                  {phase.progress}%
                </div>
                <ProgressBar value={phase.progress} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function TaskRegistry({ registry }: { registry: ProjectRegistry }) {
  return (
    <Card title="Task Registry">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Task ID
              </th>
              <th className="pb-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Phase
              </th>
              <th className="pb-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Title
              </th>
              <th className="pb-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Status
              </th>
              <th className="pb-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Priority
              </th>
              <th className="pb-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Build
              </th>
              <th className="pb-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                PM
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {registry.tasks.map((task) => (
              <tr
                key={task.id}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <td className="py-3 font-mono text-xs">{task.id}</td>
                <td className="py-3 text-xs text-muted-foreground capitalize">
                  {task.phase.replace("phase-", "Phase ")}
                </td>
                <td className="py-3 text-xs max-w-xs truncate">
                  {task.title}
                </td>
                <td className="py-3">
                  <StatusBadge status={task.status} />
                </td>
                <td className="py-3">
                  <StatusBadge status={task.priority} />
                </td>
                <td className="py-3">
                  <StatusBadge status={task.build} />
                </td>
                <td className="py-3">
                  <StatusBadge status={task.pmApproval} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function ModuleMap({ registry }: { registry: ProjectRegistry }) {
  return (
    <Card title="Module / Product Map">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {registry.modules.map((mod) => (
          <div
            key={mod.id}
            className="flex items-center justify-between rounded-lg border border-border p-3"
          >
            <div>
              <div className="text-sm font-medium">{mod.name}</div>
              <div className="text-xs text-muted-foreground">
                {mod.description}
              </div>
            </div>
            <StatusBadge status={mod.status} />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ArchitectureStatus({
  registry,
}: {
  registry: ProjectRegistry;
}) {
  return (
    <Card title="Architecture Status">
      <div className="space-y-2">
        {registry.architecture.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-lg border border-border p-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{item.layer}</span>
                <StatusBadge status={item.status} />
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {item.technology}
              </div>
            </div>
            <div className="text-xs text-muted-foreground text-right ml-4">
              {item.notes}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function GovernancePanel({
  registry,
}: {
  registry: ProjectRegistry;
}) {
  return (
    <Card title="Quality & Governance">
      <div className="space-y-3">
        {registry.qualityGates.map((gate) => (
          <div
            key={gate.id}
            className="flex items-center justify-between rounded-lg border border-border p-3"
          >
            <div>
              <div className="text-sm font-medium">{gate.name}</div>
              <div className="text-xs text-muted-foreground">
                {gate.description}
              </div>
            </div>
            <StatusBadge status={gate.status} />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function RiskPanel() {
  return (
    <Card title="Risk / Deviation Panel">
      <div className="space-y-2">
        <div className="rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Browser verification</span>
            <StatusBadge status="PARTIAL" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Manual browser verification may be pending — build-generated static pages confirm rendering.
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Backend/database intentionally not started</span>
            <StatusBadge status="PLANNED" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Per #FDD policy — frontend-first. Backend starts in Phase 7.
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Phase 1 design system pending</span>
            <StatusBadge status="READY" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Foundation architecture prepared. Full implementation in Phase 1.
          </p>
        </div>
      </div>
    </Card>
  );
}

export function WdrRegister({ registry }: { registry: ProjectRegistry }) {
  return (
    <Card title="WDR Register">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Task ID
              </th>
              <th className="pb-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Phase
              </th>
              <th className="pb-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Status
              </th>
              <th className="pb-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Date
              </th>
              <th className="pb-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Commit
              </th>
              <th className="pb-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                PM Audit
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {registry.wdrs.map((wdr) => (
              <tr key={wdr.id}>
                <td className="py-3 font-mono text-xs">{wdr.taskId}</td>
                <td className="py-3 text-xs capitalize">
                  {wdr.phase.replace("phase-", "Phase ")}
                </td>
                <td className="py-3">
                  <StatusBadge status={wdr.status} />
                </td>
                <td className="py-3 text-xs text-muted-foreground">
                  {wdr.date}
                </td>
                <td className="py-3 font-mono text-xs">
                  {wdr.commitHash || "pending"}
                </td>
                <td className="py-3">
                  <StatusBadge status={wdr.pmAudit} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function ProjectTree() {
  const tree = [
    {
      label: "Governance",
      children: [
        { label: "#FDD — Frontend First", status: "ENFORCED" },
        { label: "#123 — Protocol", status: "ENFORCED" },
        { label: "WDR — Work Done Records", status: "ENFORCED" },
        { label: "Project Constitution", status: "ACTIVE" },
      ],
    },
    {
      label: "Frontend",
      children: [
        { label: "Next.js 16 App Router", status: "ACTIVE" },
        { label: "React 19", status: "ACTIVE" },
        { label: "TypeScript 5", status: "ACTIVE" },
        { label: "Tailwind CSS 4", status: "ACTIVE" },
      ],
    },
    {
      label: "Design System",
      children: [
        { label: "Tokens (spacing, radii, shadows)", status: "ACTIVE" },
        { label: "Status helpers", status: "ACTIVE" },
        { label: "Navigation structure", status: "ACTIVE" },
        { label: "UI primitives (Badge, Card, etc.)", status: "ACTIVE" },
        { label: "shadcn/ui", status: "PLANNED" },
        { label: "Lucide React", status: "PLANNED" },
      ],
    },
    {
      label: "Dashboard",
      children: [
        { label: "Executive Summary", status: "ACTIVE" },
        { label: "Phase Timeline", status: "ACTIVE" },
        { label: "Task Registry", status: "ACTIVE" },
        { label: "Module Map", status: "ACTIVE" },
        { label: "Architecture Status", status: "ACTIVE" },
        { label: "Governance Panel", status: "ACTIVE" },
        { label: "Risk Panel", status: "ACTIVE" },
        { label: "WDR Register", status: "ACTIVE" },
        { label: "GitHub Panel", status: "ACTIVE" },
        { label: "FDD Lane", status: "ACTIVE" },
      ],
    },
    {
      label: "Registry",
      children: [
        { label: "Project Registry (source of truth)", status: "ACTIVE" },
        { label: "Phases 0–10", status: "ACTIVE" },
        { label: "Tasks", status: "ACTIVE" },
        { label: "Modules", status: "ACTIVE" },
      ],
    },
    {
      label: "Future Backend",
      children: [{ label: "NestJS", status: "NOT_STARTED" }],
    },
    {
      label: "Future Database",
      children: [
        { label: "PostgreSQL", status: "NOT_STARTED" },
        { label: "Prisma ORM", status: "NOT_STARTED" },
      ],
    },
    {
      label: "Future Security",
      children: [
        { label: "JWT Auth", status: "NOT_STARTED" },
        { label: "RBAC", status: "NOT_STARTED" },
      ],
    },
    {
      label: "Future Marketplace",
      children: [
        { label: "Public Marketplace", status: "PLANNED" },
        { label: "B2B Wholesale", status: "PLANNED" },
        { label: "Customer Commerce", status: "PLANNED" },
        { label: "Vendor SaaS", status: "PLANNED" },
        { label: "Admin/Owner", status: "PLANNED" },
      ],
    },
    {
      label: "Future Deployment",
      children: [
        { label: "Docker", status: "NOT_STARTED" },
        { label: "CI/CD", status: "NOT_STARTED" },
        { label: "Redis", status: "NOT_STARTED" },
      ],
    },
  ];

  return (
    <Card title="Project Tree / Structure">
      <div className="space-y-4">
        {tree.map((section) => (
          <div key={section.label}>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {section.label}
            </div>
            <div className="space-y-1 pl-2">
              {section.children.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between text-sm py-1"
                >
                  <span>{item.label}</span>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function OwnerSummary() {
  return (
    <Card title="Owner Summary — Plain Language">
      <div className="space-y-3 text-sm">
        <p>
          <strong>What is this?</strong>{" "}
          ToplineShop is a new online marketplace being built from scratch.
          No old code is being reused.
        </p>
        <p>
          <strong>Current status:</strong>{" "}
          We are in <strong>Phase 0 — Foundation</strong>. The project scaffolding,
          management dashboard, and design system architecture are in place.
        </p>
        <p>
          <strong>What&apos;s happening now:</strong>{" "}
          Hardening the foundation and preparing for Phase 1 (Design System).
          The dashboard shows all project phases, tasks, and governance status.
        </p>
        <p>
          <strong>What&apos;s next?</strong>{" "}
          Phase 1 will implement the full design system and UX shell.
          Backend and database work starts much later (Phase 7–8).
        </p>
        <p>
          <strong>How to track progress:</strong>{" "}
          Visit the{" "}
          <a href="/project-management" className="text-primary underline">
            Control Center
          </a>{" "}
          for real-time project status. Everything is driven by a single source
          of truth — the project registry.
        </p>
      </div>
    </Card>
  );
}
