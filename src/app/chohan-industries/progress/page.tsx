export default function ChohanIndustriesProgressPage() {
  const phases: [string, string, string[]][] = [
    ["1. Discovery and governance", "100%", ["Stakeholder charter: cadence set.", "Risk register: owners assigned.", "Decision log: key choices recorded."]],
    ["2. Architecture and foundation", "90%", ["Repo scaffolding: sandbox branch ready.", "Routing and layouts: core routes created.", "Content governance: tenant-scoped draft and revision model implemented."]],
    ["3. Corporate content", "70%", ["Brand copy: company voice drafted.", "Service, gallery and event structures: implemented.", "Business facts, case studies and approved media: still pending confirmation."]],
    ["4. Responsive experience", "60%", ["Mobile layouts: responsive classes added.", "Tablet layouts: responsive grid implemented.", "Cross-browser and accessibility checks: pending final pass."]],
    ["5. Quality verification", "70%", ["Frontend typecheck: passing.", "Backend governance tests: 3/3 passing.", "Production-like browser and accessibility audit: not yet complete."]],
    ["6. Release readiness", "25%", ["Static release artifact: prepared.", "Database migration and object storage: prepared, not applied.", "Production cutover: awaiting explicit authorization."]],
  ];

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 px-6 py-4"><span className="text-sm font-semibold uppercase tracking-wide text-slate-600">Chohan Industries</span></header>
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">Chohan Industries Project Progress</h1>
        <p className="mb-10 text-base leading-relaxed text-slate-700 md:text-lg">A clear view of the current delivery position across discovery, build, verification, and release.</p>
        <div className="mb-10 rounded-lg border border-slate-200 p-6"><p className="text-sm font-semibold uppercase tracking-wide text-slate-600">Overall completion</p><p className="text-5xl font-bold">69%</p><div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-slate-900" style={{ width: "69%" }} /></div></div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {phases.map(([title, percent, topics]) => <article key={title} className="rounded-lg border border-slate-200 p-6"><div className="mb-3 flex items-baseline justify-between gap-4"><h2 className="text-lg font-semibold">{title}</h2><span className="text-sm font-semibold">{percent}</span></div><div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-slate-900" style={{ width: percent }} /></div><ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">{topics.map((topic) => <li key={topic}>{topic}</li>)}</ul></article>)}
        </div>
        <p className="mt-10 text-sm text-slate-500">Note: Percentages are current sandbox estimates. Production deployment is not complete.</p>
      </section>
    </main>
  );
}
