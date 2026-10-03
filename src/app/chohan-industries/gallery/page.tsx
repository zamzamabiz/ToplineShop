"use client";

import { useEffect, useState } from "react";
import { CHOHAN_TENANT_SLUG, ChohanGalleryItem, getPublicChohanContent } from "@/lib/chohan-content-api";

const fallbackGallery: ChohanGalleryItem[] = [
  { id: "fallback-1", title: "Trade in motion", imageUrl: "", altText: "", caption: "A closer look at the routes, partners and people behind dependable delivery." },
  { id: "fallback-2", title: "People and practice", imageUrl: "", altText: "", caption: "Stories from the teams building stronger systems across Karachi and Dubai." },
  { id: "fallback-3", title: "From source to destination", imageUrl: "", altText: "", caption: "Visual notes from the markets and communities we connect." },
];

export default function ChohanGalleryPage() {
  const [items, setItems] = useState<ChohanGalleryItem[]>(fallbackGallery);
  useEffect(() => { getPublicChohanContent(CHOHAN_TENANT_SLUG).then((content) => { if (content.gallery.length) setItems(content.gallery); }).catch(() => undefined); }, []);

  return <main className="min-h-screen bg-[var(--app-canvas)] text-[var(--text-primary)]"><header className="border-b border-[var(--border-default)] bg-[var(--surface-primary)] px-6 py-5"><div className="mx-auto flex max-w-6xl items-center justify-between"><a className="font-semibold" href="/chohan-industries">Chohan Industries</a><nav className="flex gap-4 text-sm font-semibold text-[var(--brand-primary)]"><a href="/chohan-industries/events">Events</a><a href="/chohan-industries/admin">Admin control</a></nav></div></header><section className="mx-auto max-w-6xl px-6 py-16"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-primary)]">Photo gallery</p><h1 className="mt-3 max-w-3xl text-5xl font-semibold tracking-tight">The people, places and movement behind the work.</h1><p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">A governed visual library for company stories, events, operations and community impact.</p><div className="mt-12 grid gap-5 md:grid-cols-3">{items.map((item, index) => <article className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)]" key={item.id}><div className="flex aspect-[4/3] items-end bg-[var(--surface-secondary)]">{item.imageUrl ? <img className="h-full w-full object-cover" src={item.imageUrl} alt={item.altText || item.title} /> : <span className="p-5 text-sm font-bold text-[var(--brand-primary)]">0{index + 1}</span>}</div><div className="p-5"><h2 className="text-xl font-semibold">{item.title}</h2>{item.caption && <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.caption}</p>}</div></article>)}</div></section></main>;
}
