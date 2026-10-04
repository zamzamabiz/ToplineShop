"use client";

import { useMemo, useState } from "react";

const pages = [
  { title: "About Chohan Industries", href: "/chohan-industries#about", summary: "Our approach, people and long-term operating philosophy." },
  { title: "Products and Industries", href: "/chohan-industries#industries", summary: "Agribusiness, industrial logistics and renewable infrastructure." },
  { title: "Services", href: "/chohan-industries#services", summary: "Strategic management, governance and operating support." },
  { title: "Responsibility and Sustainability", href: "/chohan-industries#responsibility", summary: "Responsible operations, ethical governance and community partnership." },
  { title: "Photo Gallery", href: "/chohan-industries/gallery", summary: "Approved visual stories from people, places and operations." },
  { title: "Company Events", href: "/chohan-industries/events", summary: "Briefings, partner moments and community work." },
  { title: "Contact", href: "/chohan-industries#contact", summary: "Connect with Chohan Industries and our operating teams." },
];

export default function ChohanSearchPage() {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? pages.filter((page) => `${page.title} ${page.summary}`.toLowerCase().includes(normalized)) : pages;
  }, [query]);

  return <main className="min-h-screen bg-[var(--app-canvas)] text-[var(--text-primary)]"><header className="border-b border-[var(--border-default)] bg-[var(--surface-primary)] px-6 py-5"><div className="mx-auto flex max-w-6xl items-center justify-between"><a className="font-semibold" href="/chohan-industries">Chohan Industries</a><a className="text-sm font-semibold text-[var(--brand-primary)]" href="/chohan-industries/admin">Admin control</a></div></header><section className="mx-auto max-w-4xl px-6 py-16"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-primary)]">Search</p><h1 className="mt-3 text-5xl font-semibold tracking-tight">Find your way through Chohan Industries.</h1><label className="mt-8 block"><span className="sr-only">Search corporate pages</span><input autoFocus className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-4 text-lg" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pages, services or responsibility" /></label><div className="mt-8 grid gap-3">{matches.map((page) => <a className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-5 hover:border-[var(--brand-primary)]" href={page.href} key={page.href}><h2 className="text-xl font-semibold">{page.title}</h2><p className="mt-2 text-[var(--text-secondary)]">{page.summary}</p></a>)}{matches.length === 0 && <p className="text-[var(--text-secondary)]">No corporate pages match that search.</p>}</div></section></main>;
}
