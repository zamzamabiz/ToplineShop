import type { ProjectRegistry } from "@/project/projectRegistry";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PLANNED: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    READY: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    IN_PROGRESS:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    BLOCKED:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    PARTIAL:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    PASS: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    CLOSED: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    DEFERRED:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    NOT_STARTED:
      "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
    ENFORCED:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] || colors.PLANNED}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
      <div
        className="bg-primary h-2 rounded-full transition-all duration-300"
        style={{ width: `${value}%` }}
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
      className={`rounded-xl border border-border bg-white dark:bg-zinc-900 ${className}`}
    >
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
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

export function RiskPanel({ registry }: { registry: ProjectRegistry }) {
  return (
    <Card title="Risk / Blocker Panel">
      <div className="space-y-2">
        {registry.risks.map((risk) => (
          <div
            key={risk.id}
            className="rounded-lg border border-border p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{risk.title}</span>
              <StatusBadge status={risk.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {risk.description}
            </p>
          </div>
        ))}
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

export function ProjectTree({ registry }: { registry: ProjectRegistry }) {
  const tree = [
    {
      label: "Phases",
      children: registry.phases.map((p) => ({
        label: `P${p.number}: ${p.name}`,
        status: p.status,
      })),
    },
    {
      label: "Frontend",
      children: [
        { label: "Next.js App Router", status: "ACTIVE" },
        { label: "React 19", status: "ACTIVE" },
        { label: "TypeScript", status: "ACTIVE" },
        { label: "Tailwind CSS", status: "ACTIVE" },
        { label: "shadcn/ui", status: "PLANNED" },
      ],
    },
    {
      label: "Backend",
      children: [{ label: "NestJS", status: "NOT_STARTED" }],
    },
    {
      label: "Data",
      children: [
        { label: "PostgreSQL", status: "NOT_STARTED" },
        { label: "Prisma ORM", status: "NOT_STARTED" },
      ],
    },
    {
      label: "Security",
      children: [
        { label: "JWT Auth", status: "NOT_STARTED" },
        { label: "RBAC", status: "NOT_STARTED" },
      ],
    },
    {
      label: "Infrastructure",
      children: [
        { label: "Docker", status: "NOT_STARTED" },
        { label: "Redis", status: "NOT_STARTED" },
        { label: "CI/CD", status: "NOT_STARTED" },
      ],
    },
    {
      label: "Governance",
      children: [
        { label: "#FDD", status: "ENFORCED" },
        { label: "#123", status: "ENFORCED" },
        { label: "WDR", status: "ENFORCED" },
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
