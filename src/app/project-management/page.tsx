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

export default function ProjectManagement() {
  const registry = projectRegistry;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-border bg-white dark:bg-zinc-900 sticky top-0 z-10">
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
              <span className="text-muted-foreground">|</span>
              <span className="text-sm text-muted-foreground">
                Project Management Control Center
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
              <span>Protocol: {registry.protocol}</span>
              <span>Policy: {registry.developmentPolicy}</span>
              <span>
                Updated:{" "}
                {new Date(registry.lastUpdated).toLocaleDateString()}
              </span>
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
          <p className="mt-1 text-sm text-muted-foreground">
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
        <div className="mt-8 rounded-xl border border-border bg-white dark:bg-zinc-900 p-6">
          <h3 className="text-sm font-semibold mb-4">Key Decisions</h3>
          <div className="space-y-2">
            {registry.decisions.map((decision) => (
              <div
                key={decision.id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div>
                  <div className="text-sm font-medium">{decision.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {decision.description} — by {decision.decidedBy} on{" "}
                    {decision.date}
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {decision.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white dark:bg-zinc-900 mt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
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
