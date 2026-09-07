import { projectRegistry } from "@/project/projectRegistry";
import {
  SourceOfTruthBanner,
  GitHubPanel,
  PhaseReadinessPanel,
  FddLane,
  MegaPromptPlan,
  ExecutiveSummary,
  PhaseTimeline,
  TaskRegistry,
  ModuleMap,
  ArchitectureStatus,
  GovernancePanel,
  RiskPanel,
  WdrRegister,
  ProjectTree,
  OwnerSummary,
} from "@/components/dashboard/DashboardCards";
import Link from "next/link";
import { DashboardThemeOverride } from "@/components/layout/DashboardThemeOverride";

export default function ProjectManagement() {
  const registry = projectRegistry;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--app-canvas)" }}>
      {/* Header */}
      <header className="border-b sticky top-0 z-10" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">
                    T
                  </span>
                </div>
                <span className="text-lg font-semibold">ToplineShop</span>
              </Link>
              <span style={{ color: "var(--text-muted)" }}>|</span>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                Project Management Control Center
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
              <span>Protocol: {registry.protocol}</span>
              <span>Policy: {registry.developmentPolicy}</span>
              <span>
                Updated:{" "}
                {new Date(registry.lastUpdated).toLocaleDateString()}
              </span>
              <DashboardThemeOverride dashboard="project-management" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Source of Truth Banner */}
        <div className="mb-6">
          <SourceOfTruthBanner />
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            Project Management Control Center
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Current Phase: {registry.currentPhase} — Task:{" "}
            {registry.currentTask} — Overall: {registry.overallCompletion}%
          </p>
        </div>

        {/* FDD Lane */}
        <div className="mb-6">
          <FddLane />
        </div>

        {/* Executive Summary */}
        <div className="mb-8">
          <ExecutiveSummary registry={registry} />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-8">
            <GitHubPanel registry={registry} />
            <PhaseReadinessPanel registry={registry} />
            <PhaseTimeline registry={registry} />
            <ModuleMap registry={registry} />
            <GovernancePanel registry={registry} />
            <WdrRegister registry={registry} />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <MegaPromptPlan registry={registry} />
            <TaskRegistry registry={registry} />
            <ArchitectureStatus registry={registry} />
            <RiskPanel />
            <ProjectTree />
          </div>
        </div>

        {/* Owner Summary */}
        <div className="mt-8">
          <OwnerSummary />
        </div>

        {/* Decisions */}
        <div className="mt-8 rounded-xl border p-6" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}>
          <h3 className="text-sm font-semibold mb-4">Key Decisions</h3>
          <div className="space-y-2">
            {registry.decisions.map((decision) => (
              <div
                key={decision.id}
                className="flex items-center justify-between rounded-lg border p-3"
                style={{ borderColor: "var(--border-default)" }}
              >
                <div>
                  <div className="text-sm font-medium">{decision.title}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {decision.description} — by {decision.decidedBy} on{" "}
                    {decision.date}
                  </div>
                </div>
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "var(--state-success)" }}
                >
                  {decision.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-8" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm" style={{ color: "var(--text-muted)" }}>
            <span>
              ToplineShop v{registry.version} — {registry.developmentPolicy}
            </span>
            <span>Protocol: {registry.protocol}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
