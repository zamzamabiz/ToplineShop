"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";

type ThemeName = "midnight-shell" | "emerald-night" | "mint-executive";
type Draft = {
  theme: ThemeName;
  colors: { primary: string; accent: string; canvas: string };
  hero: { eyebrow: string; heading: string; copy: string; image: string };
  gallery: { title: string; image: string }[];
  events: { title: string; date: string; location: string }[];
};

const initialDraft: Draft = {
  theme: "midnight-shell",
  colors: { primary: "#16A34A", accent: "#2DD4BF", canvas: "#F3F9F6" },
  hero: {
    eyebrow: "Trade with purpose",
    heading: "Trade that moves possibility.",
    copy: "We connect trusted products, practical expertise and responsible logistics to help businesses grow with confidence.",
    image: "",
  },
  gallery: [],
  events: [],
};

const themes: { id: ThemeName; label: string; detail: string }[] = [
  { id: "midnight-shell", label: "Midnight shell", detail: "Deep green, mint and clear contrast" },
  { id: "emerald-night", label: "Emerald night", detail: "Dark executive surfaces with bright accents" },
  { id: "mint-executive", label: "Mint executive", detail: "Light, calm and boardroom-ready" },
];

export default function ChohanAdminPage() {
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("Local draft mode. Backend publishing is intentionally gated.");

  useEffect(() => {
    const raw = window.localStorage.getItem("chohan-admin-draft");
    if (!raw) return;
    try {
      setDraft({ ...initialDraft, ...JSON.parse(raw) });
    } catch {
      window.localStorage.removeItem("chohan-admin-draft");
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = draft.theme;
  }, [draft.theme]);

  const updateHero = (key: keyof Draft["hero"], value: string) =>
    setDraft((current) => ({ ...current, hero: { ...current.hero, [key]: value } }));

  const handleImage = (event: ChangeEvent<HTMLInputElement>, target: "hero" | "gallery") => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = String(reader.result);
      if (target === "hero") updateHero("image", image);
      else setDraft((current) => ({ ...current, gallery: [...current.gallery, { title: file.name, image }] }));
    };
    reader.readAsDataURL(file);
  };

  const saveDraft = (event: FormEvent) => {
    event.preventDefault();
    window.localStorage.setItem("chohan-admin-draft", JSON.stringify(draft));
    setSaved(true);
    setMessage("Draft saved on this device. Connect the publish action to the authenticated ToplineShop API before production use.");
  };

  const resetDraft = () => {
    window.localStorage.removeItem("chohan-admin-draft");
    setDraft(initialDraft);
    setSaved(false);
    setMessage("Draft reset to the approved starter content.");
  };

  return (
    <main className="min-h-screen bg-[var(--app-canvas)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border-default)] bg-[var(--surface-primary)] px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-primary)]">Chohan Industries</p><h1 className="text-2xl font-semibold">Master content control</h1></div>
          <a className="rounded-full bg-[var(--app-shell)] px-4 py-2 text-sm font-semibold text-[var(--text-inverse)]" href="/chohan-industries">Preview site</a>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[250px_1fr]">
        <aside className="h-fit rounded-xl bg-[var(--app-shell)] p-4 text-[var(--sidebar-text)]">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-accent)]">Control areas</p>
          <nav className="grid gap-2 text-sm"><a className="rounded-lg bg-[var(--sidebar-active)] px-3 py-2 font-semibold text-[var(--text-inverse)]" href="#brand">Brand and theme</a><a className="rounded-lg px-3 py-2 hover:bg-[var(--app-shell-raised)]" href="#content">Page content</a><a className="rounded-lg px-3 py-2 hover:bg-[var(--app-shell-raised)]" href="#media">Media library</a><a className="rounded-lg px-3 py-2 hover:bg-[var(--app-shell-raised)]" href="#events">Events</a><a className="rounded-lg px-3 py-2 hover:bg-[var(--app-shell-raised)]" href="#governance">Publishing governance</a></nav>
        </aside>
        <form className="grid gap-6" onSubmit={saveDraft}>
          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-6" id="brand"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-primary)]">1 · Brand system</p><h2 className="text-xl font-semibold">Change the visual language without coding.</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Presets are safer for day-to-day publishing. Custom tokens are available for an approved brand refresh.</p></div><div className="grid gap-3 md:grid-cols-3">{themes.map((theme) => <button type="button" key={theme.id} onClick={() => setDraft((current) => ({ ...current, theme: theme.id }))} className={`rounded-lg border p-4 text-left ${draft.theme === theme.id ? "border-[var(--brand-primary)] ring-2 ring-[var(--interactive-selected)]" : "border-[var(--border-default)]"}`}><span className="mb-3 block h-8 rounded-md" style={{ background: theme.id === "emerald-night" ? "#122620" : theme.id === "mint-executive" ? "#EDF8F2" : "#10221D" }} /><strong className="block text-sm">{theme.label}</strong><span className="mt-1 block text-xs text-[var(--text-secondary)]">{theme.detail}</span></button>)}</div><div className="mt-5 grid gap-4 sm:grid-cols-3"><label className="grid gap-2 text-sm font-semibold">Primary color<input type="color" value={draft.colors.primary} onChange={(event) => setDraft((current) => ({ ...current, colors: { ...current.colors, primary: event.target.value } }))} /></label><label className="grid gap-2 text-sm font-semibold">Accent color<input type="color" value={draft.colors.accent} onChange={(event) => setDraft((current) => ({ ...current, colors: { ...current.colors, accent: event.target.value } }))} /></label><label className="grid gap-2 text-sm font-semibold">Canvas color<input type="color" value={draft.colors.canvas} onChange={(event) => setDraft((current) => ({ ...current, colors: { ...current.colors, canvas: event.target.value } }))} /></label></div></section>
          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-6" id="content"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-primary)]">2 · Content fields</p><h2 className="text-xl font-semibold">Edit approved page copy.</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">The production model will add field-level validation, roles, preview, version history and approval before publish.</p></div><div className="grid gap-4"><label className="grid gap-2 text-sm font-semibold">Hero eyebrow<input className="rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-3 font-normal" value={draft.hero.eyebrow} onChange={(event) => updateHero("eyebrow", event.target.value)} /></label><label className="grid gap-2 text-sm font-semibold">Hero heading<input className="rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-3 font-normal" value={draft.hero.heading} onChange={(event) => updateHero("heading", event.target.value)} /></label><label className="grid gap-2 text-sm font-semibold">Hero copy<textarea className="min-h-28 rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-3 font-normal" value={draft.hero.copy} onChange={(event) => updateHero("copy", event.target.value)} /></label></div></section>
          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-6" id="media"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-primary)]">3 · Media library</p><h2 className="text-xl font-semibold">Replace images and build the gallery.</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Image uploads are local draft previews here. Production storage will use object storage with size, type, alt-text and rights checks.</p></div><div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 rounded-lg border border-dashed border-[var(--border-strong)] p-4 text-sm font-semibold">Replace hero image<input type="file" accept="image/*" onChange={(event) => handleImage(event, "hero")} /></label><label className="grid gap-2 rounded-lg border border-dashed border-[var(--border-strong)] p-4 text-sm font-semibold">Add gallery image<input type="file" accept="image/*" onChange={(event) => handleImage(event, "gallery")} /></label></div>{draft.hero.image && <img className="mt-4 h-40 w-full rounded-lg object-cover" src={draft.hero.image} alt="Hero draft preview" />} {draft.gallery.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">{draft.gallery.map((item) => <figure key={item.image} className="overflow-hidden rounded-lg border border-[var(--border-default)]"><img className="aspect-square w-full object-cover" src={item.image} alt={item.title} /><figcaption className="truncate p-2 text-xs">{item.title}</figcaption></figure>)}</div>}</section>
          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-6" id="events"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-primary)]">4 · Events model</p><h2 className="text-xl font-semibold">Company events belong beside stories and news.</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Next production step: event records with date, location, summary, hero image, registration link and publish status.</p></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg bg-[var(--surface-secondary)] p-4"><strong className="block">Leadership</strong><span className="text-sm text-[var(--text-secondary)]">Town halls and partner briefings</span></div><div className="rounded-lg bg-[var(--surface-secondary)] p-4"><strong className="block">Trade events</strong><span className="text-sm text-[var(--text-secondary)]">Exhibitions and market visits</span></div><div className="rounded-lg bg-[var(--surface-secondary)] p-4"><strong className="block">Community</strong><span className="text-sm text-[var(--text-secondary)]">Responsibility and local impact</span></div></div></section>
          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-6" id="governance"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-primary)]">5 · Governance</p><h2 className="text-xl font-semibold">A master link page needs controlled publishing.</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Recommended production flow: draft → preview → reviewer approval → publish → audit log → rollback. Admin access must use ToplineShop authentication and role permissions.</p></div><div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary)] p-4 text-sm text-[var(--text-secondary)]">{message}</div><div className="mt-5 flex flex-wrap gap-3"><button className="rounded-full bg-[var(--brand-primary)] px-5 py-3 font-semibold text-white" type="submit">Save local draft</button><button className="rounded-full border border-[var(--border-default)] px-5 py-3 font-semibold" type="button" onClick={resetDraft}>Reset draft</button>{saved && <span className="self-center text-sm font-semibold text-[var(--state-success)]">Saved</span>}</div></section>
        </form>
      </div>
    </main>
  );
}
