"use client";

import { useEffect, useState } from "react";
import { CHOHAN_TENANT_SLUG, ChohanCompanyEvent, getPublicChohanContent } from "@/lib/chohan-content-api";

const fallbackEvents: ChohanCompanyEvent[] = [
  { id: "fallback-1", title: "Gulf-Pakistan trade briefing", location: "Dubai", startsAt: "2026-10-15T10:00:00.000Z", summary: "A focused conversation on sourcing, export readiness and dependable cross-border partnerships.", imageUrl: null },
  { id: "fallback-2", title: "Chohan partner roundtable", location: "Karachi", startsAt: "2026-11-12T10:00:00.000Z", summary: "Bringing operators, suppliers and customers together around practical growth.", imageUrl: null },
  { id: "fallback-3", title: "Community and responsibility day", location: "Karachi", startsAt: "2026-12-05T10:00:00.000Z", summary: "A local programme connecting responsible business with the communities around us.", imageUrl: null },
];

const formatEventDate = (value: string) => value.slice(0, 10);

export default function ChohanEventsPage() {
  const [events, setEvents] = useState<ChohanCompanyEvent[]>(fallbackEvents);
  useEffect(() => { getPublicChohanContent(CHOHAN_TENANT_SLUG).then((content) => { if (content.events.length) setEvents(content.events); }).catch(() => undefined); }, []);

  return <main className="min-h-screen bg-[var(--app-canvas)] text-[var(--text-primary)]"><header className="border-b border-[var(--border-default)] bg-[var(--surface-primary)] px-6 py-5"><div className="mx-auto flex max-w-6xl items-center justify-between"><a className="font-semibold" href="/chohan-industries">Chohan Industries</a><nav className="flex gap-4 text-sm font-semibold text-[var(--brand-primary)]"><a href="/chohan-industries/gallery">Gallery</a><a href="/chohan-industries/admin">Admin control</a></nav></div></header><section className="mx-auto max-w-5xl px-6 py-16"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-primary)]">Company events</p><h1 className="mt-3 max-w-3xl text-5xl font-semibold tracking-tight">Where the next conversations begin.</h1><p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">A clear calendar for the briefings, partner moments and community work that shape Chohan Industries.</p><div className="mt-12 grid gap-4">{events.map((event) => <article className="grid gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-6 md:grid-cols-[1fr_auto]" key={event.id}><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand-primary)]">{formatEventDate(event.startsAt)} · {event.location}</p><h2 className="mt-2 text-2xl font-semibold">{event.title}</h2><p className="mt-2 max-w-2xl text-[var(--text-secondary)]">{event.summary}</p></div><a className="self-end text-sm font-semibold text-[var(--brand-primary)]" href="/chohan-industries#contact">Connect with us ↗</a></article>)}</div></section></main>;
}
