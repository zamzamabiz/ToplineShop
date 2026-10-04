"use client";

import { useEffect, useState } from "react";
import { CHOHAN_TENANT_SLUG, getPublicChohanContent } from "@/lib/chohan-content-api";

const defaultCopy = {
  aboutHeading: "About Chohan Industries",
  aboutCopy: "Chohan Industries partners with founders, operators, and communities to build enduring businesses that balance commercial discipline with long-term stewardship, applying patient capital and hands-on governance across every venture in our portfolio.",
  servicesHeading: "Services",
  servicesCopy: "Chohan Industries provides integrated corporate services across our operating companies, including strategic management, capital allocation, operational governance, and long-horizon advisory for the businesses, communities, and partners we serve.",
  responsibilityHeading: "Responsibility",
  responsibilityCopy: "Chohan Industries is committed to responsible corporate citizenship across our operating companies, embedding environmental stewardship, ethical governance, and community partnership into every decision we make and every business we steward.",
  contactHeading: "Contact",
  contactCopy: "Chohan Industries welcomes enquiries from partners, investors, and the communities we serve. Our corporate office responds to all correspondence in support of long-term collaboration.",
};

const defaultHero = {
  eyebrow: "Trade with purpose",
  heading: "Trade that moves possibility.",
  copy: "We connect trusted products, practical expertise and responsible logistics to help businesses grow with confidence.",
  image: "",
};

export default function ChohanIndustriesPage() {
  const [copy, setCopy] = useState(defaultCopy);
  const [hero, setHero] = useState(defaultHero);
  useEffect(() => { getPublicChohanContent(CHOHAN_TENANT_SLUG).then((content) => { const published = content.config?.content; if (published) { setCopy((current) => ({ ...current, ...published })); setHero((current) => ({ eyebrow: published.heroEyebrow ?? current.eyebrow, heading: published.heroHeading ?? current.heading, copy: published.heroCopy ?? current.copy, image: published.heroImageUrl ?? current.image })); if (published.seoTitle) document.title = published.seoTitle; const description = document.querySelector('meta[name="description"]'); if (published.seoDescription && description) description.setAttribute("content", published.seoDescription); if (published.seoDescription && !description) { const tag = document.createElement("meta"); tag.name = "description"; tag.content = published.seoDescription; document.head.appendChild(tag); } if (published.noIndex) { const robots = document.querySelector('meta[name="robots"]') ?? document.createElement("meta"); robots.setAttribute("name", "robots"); robots.setAttribute("content", "noindex,nofollow"); if (!robots.parentElement) document.head.appendChild(robots); } } }).catch(() => undefined); }, []);
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <header className="border-b border-slate-200 px-6 py-4">
        <span className="text-sm font-semibold tracking-wide uppercase text-slate-600">
          Chohan Industries
        </span>
      </header>

      <section className="flex-1 px-6 py-16 max-w-6xl mx-auto w-full">
        <div className="grid items-end gap-8 rounded-xl bg-slate-900 p-8 text-white md:grid-cols-[1.1fr_0.9fr] md:p-12">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">{hero.eyebrow}</p><h1 className="mt-4 text-5xl font-semibold tracking-tight md:text-7xl">{hero.heading}</h1><p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-200">{hero.copy}</p></div>
          {hero.image ? <img className="aspect-[4/3] w-full rounded-lg object-cover" src={hero.image} alt="Chohan Industries hero" loading="eager" decoding="sync" fetchPriority="high" /> : <div className="aspect-[4/3] rounded-lg bg-emerald-800/60" aria-hidden="true" />}
        </div>

        <nav aria-label="Chohan Industries sections" className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <a href="#services" className="rounded-lg border border-slate-300 px-4 py-3 text-center hover:bg-slate-50">
            Services
          </a>
          <a href="#responsibility" className="rounded-lg border border-slate-300 px-4 py-3 text-center hover:bg-slate-50">
            Responsibility
          </a>
          <a href="#contact" className="rounded-lg border border-slate-300 px-4 py-3 text-center hover:bg-slate-50">
            Contact
          </a>
          <a href="/chohan-industries/gallery" className="rounded-lg border border-slate-300 px-4 py-3 text-center hover:bg-slate-50">
            Photo gallery
          </a>
          <a href="/chohan-industries/products" className="rounded-lg border border-slate-300 px-4 py-3 text-center hover:bg-slate-50">
            Products and services
          </a>
          <a href="/chohan-industries/events" className="rounded-lg border border-slate-300 px-4 py-3 text-center hover:bg-slate-50">
            Company events
          </a>
          <a href="/chohan-industries/progress" className="rounded-lg border border-slate-300 px-4 py-3 text-center hover:bg-slate-50">
            Project progress
          </a>
          <a href="/chohan-industries/admin" className="rounded-lg border border-slate-300 px-4 py-3 text-center hover:bg-slate-50">
            Content studio
          </a>
          <a href="/chohan-industries/search" className="rounded-lg border border-slate-300 px-4 py-3 text-center hover:bg-slate-50">
            Search
          </a>
        </nav>
      </section>

      <section id="about" className="px-6 py-12 max-w-3xl mx-auto w-full">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          {copy.aboutHeading}
        </h2>
        <p className="text-base md:text-lg text-slate-700 leading-relaxed">
          {copy.aboutCopy}
        </p>
      </section>

      <section id="industries" className="px-6 py-12 max-w-3xl mx-auto w-full">
        <div className="flex items-end justify-between gap-4"><h2 className="text-3xl md:text-4xl font-bold mb-4">Products and Industries</h2><a href="/chohan-industries/products" className="mb-4 text-sm font-bold text-[var(--brand-primary)]">Explore all →</a></div>
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <li className="rounded-lg border border-slate-300 px-4 py-3 text-center hover:bg-slate-50">
            Agribusiness and Food Systems
          </li>
          <li className="rounded-lg border border-slate-300 px-4 py-3 text-center hover:bg-slate-50">
            Industrial Logistics
          </li>
          <li className="rounded-lg border border-slate-300 px-4 py-3 text-center hover:bg-slate-50">
            Renewable Energy Infrastructure
          </li>
        </ul>
      </section>

      <section id="services" className="px-6 py-12 max-w-3xl mx-auto w-full">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          {copy.servicesHeading}
        </h2>
        <p className="text-base md:text-lg text-slate-700 leading-relaxed">
          {copy.servicesCopy}
        </p>
      </section>

      <section id="responsibility" className="px-6 py-12 max-w-3xl mx-auto w-full">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          {copy.responsibilityHeading}
        </h2>
        <p className="text-base md:text-lg text-slate-700 leading-relaxed">
          {copy.responsibilityCopy}
        </p>
      </section>

      <section id="sustainability" className="px-6 py-12 max-w-3xl mx-auto w-full">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Sustainability
        </h2>
        <p className="text-base md:text-lg text-slate-700 leading-relaxed">
          At Chohan Industries, sustainability is a core responsibility. We design our processes, sourcing, and operations to minimize environmental impact, support worker safety, and contribute positively to the communities we serve.
        </p>
      </section>

      <section id="contact" className="px-6 py-12 max-w-3xl mx-auto w-full">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          {copy.contactHeading}
        </h2>
        <p className="text-base md:text-lg text-slate-700 leading-relaxed">
          {copy.contactCopy}
        </p>
      </section>

      <footer className="border-t border-slate-200 px-6 py-4 text-sm text-slate-500 text-center">
        © {new Date().getFullYear()} Chohan Industries. All rights reserved.
      </footer>
    </main>
  );
}
