export default function ChohanIndustriesPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <header className="border-b border-slate-200 px-6 py-4">
        <span className="text-sm font-semibold tracking-wide uppercase text-slate-600">
          Chohan Industries
        </span>
      </header>

      <section className="flex-1 px-6 py-12 max-w-3xl mx-auto w-full">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Chohan Industries
        </h1>
        <p className="text-base md:text-lg text-slate-700 leading-relaxed mb-10">
          Chohan Industries is a multi-disciplinary holding group focused on building
          durable products, nurturing responsible operations, and partnering with the
          communities where we operate. We invest in people, technology, and long-term value.
        </p>

        <nav className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a href="#services" className="rounded-lg border border-slate-300 px-4 py-3 text-center hover:bg-slate-50">
            Services
          </a>
          <a href="#responsibility" className="rounded-lg border border-slate-300 px-4 py-3 text-center hover:bg-slate-50">
            Responsibility
          </a>
          <a href="#contact" className="rounded-lg border border-slate-300 px-4 py-3 text-center hover:bg-slate-50">
            Contact
          </a>
        </nav>
      </section>

      <footer className="border-t border-slate-200 px-6 py-4 text-sm text-slate-500 text-center">
        © {new Date().getFullYear()} Chohan Industries. All rights reserved.
      </footer>
    </main>
  );
}
