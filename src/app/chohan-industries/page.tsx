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

      <section id="about" className="px-6 py-12 max-w-3xl mx-auto w-full">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          About Chohan Industries
        </h2>
        <p className="text-base md:text-lg text-slate-700 leading-relaxed">
          Chohan Industries partners with founders, operators, and communities to build enduring businesses that balance commercial discipline with long-term stewardship, applying patient capital and hands-on governance across every venture in our portfolio.
        </p>
      </section>

      <section id="services" className="px-6 py-12 max-w-3xl mx-auto w-full">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Services
        </h2>
        <p className="text-base md:text-lg text-slate-700 leading-relaxed">
          Chohan Industries provides integrated corporate services across our operating companies, including strategic management, capital allocation, operational governance, and long-horizon advisory for the businesses, communities, and partners we serve.
        </p>
      </section>

      <section id="responsibility" className="px-6 py-12 max-w-3xl mx-auto w-full">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Responsibility
        </h2>
        <p className="text-base md:text-lg text-slate-700 leading-relaxed">
          Chohan Industries is committed to responsible corporate citizenship across our operating companies, embedding environmental stewardship, ethical governance, and community partnership into every decision we make and every business we steward.
        </p>
      </section>

      <section id="contact" className="px-6 py-12 max-w-3xl mx-auto w-full">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Contact
        </h2>
        <p className="text-base md:text-lg text-slate-700 leading-relaxed">
          Chohan Industries welcomes enquiries from partners, investors, and the communities we serve. Our corporate office responds to all correspondence in support of long-term collaboration.
        </p>
      </section>

      <footer className="border-t border-slate-200 px-6 py-4 text-sm text-slate-500 text-center">
        © {new Date().getFullYear()} Chohan Industries. All rights reserved.
      </footer>
    </main>
  );
}
