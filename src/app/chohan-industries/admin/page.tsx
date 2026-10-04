"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { authLogin } from "@/lib/tdr-api";
import { ChohanCompanyEvent, ChohanContentRevision, ChohanGalleryItem, ChohanProgressPhase, createChohanEvent, createChohanGalleryItem, getChohanDraft, listChohanEvents, listChohanGallery, listChohanRevisions, publishChohanDraft, publishChohanEvent, publishChohanGalleryItem, rollbackChohanRevision, saveChohanDraft, submitChohanDraftForReview, registerChohanMedia, uploadChohanMedia } from "@/lib/chohan-content-api";

type ThemeName = "midnight-shell" | "emerald-night" | "mint-executive";
type Draft = {
  theme: ThemeName;
  colors: { primary: string; accent: string; canvas: string };
  hero: { eyebrow: string; heading: string; copy: string; image: string };
  sections: { aboutHeading: string; aboutCopy: string; servicesHeading: string; servicesCopy: string; responsibilityHeading: string; responsibilityCopy: string; contactHeading: string; contactCopy: string };
  seo: { title: string; description: string; keywords: string; ogImage: string; noIndex: boolean };
  progress: ChohanProgressPhase[];
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
  sections: {
    aboutHeading: "About Chohan Industries",
    aboutCopy: "Chohan Industries partners with founders, operators and communities to build enduring businesses with commercial discipline and long-term stewardship.",
    servicesHeading: "Services",
    servicesCopy: "We provide strategic management, capital allocation, operational governance and long-horizon advisory across our operating companies.",
    responsibilityHeading: "Responsibility",
    responsibilityCopy: "We embed environmental stewardship, ethical governance and community partnership into the businesses we steward.",
    contactHeading: "Contact",
    contactCopy: "Chohan Industries welcomes enquiries from partners, investors and the communities we serve.",
  },
  seo: {
    title: "Chohan Industries | Trade that moves possibility",
    description: "Chohan Industries connects trusted products, practical expertise and responsible logistics for businesses and communities.",
    keywords: "Chohan Industries, agriculture, logistics, industrial materials, renewable energy, Pakistan",
    ogImage: "",
    noIndex: false,
  },
  progress: [
    { id: "discovery", title: "Discovery and governance", percent: 100, status: "complete", topics: ["Stakeholder charter: cadence set.", "Risk register: owners assigned.", "Decision log: key choices recorded."] },
    { id: "foundation", title: "Architecture and foundation", percent: 90, status: "active", topics: ["Repo scaffolding: integration branch ready.", "Routing and layouts: core routes created.", "Content governance: tenant-scoped draft and revision model implemented."] },
    { id: "content", title: "Corporate content", percent: 70, status: "active", topics: ["Brand copy: company voice drafted.", "Products, gallery and event structures: implemented.", "Business facts and approved media: confirmation pending."] },
    { id: "experience", title: "Responsive experience", percent: 60, status: "active", topics: ["Mobile layouts: responsive classes added.", "Tablet layouts: responsive grid implemented.", "Cross-browser and accessibility checks: final pass pending."] },
    { id: "quality", title: "Quality verification", percent: 70, status: "active", topics: ["Frontend typecheck: passing.", "Backend governance tests: passing.", "Production-like browser audit: final pass pending."] },
    { id: "release", title: "Release readiness", percent: 25, status: "planned", topics: ["Local release artifact: prepared.", "Database migration and object storage: prepared.", "Production cutover: gated behind explicit authorization."] },
  ],
  gallery: [],
  events: [],
};

const themes: { id: ThemeName; label: string; detail: string }[] = [
  { id: "midnight-shell", label: "Midnight shell", detail: "Deep green, mint and clear contrast" },
  { id: "emerald-night", label: "Emerald night", detail: "Dark executive surfaces with bright accents" },
  { id: "mint-executive", label: "Mint executive", detail: "Light, calm and boardroom-ready" },
];

function ChohanAdminPageContent() {
  const { accessToken, setAuth, user } = useAuth();
  const canReview = Boolean(user?.roles?.some((role) => ["SUPER_ADMIN", "TENANT_ADMIN", "SITE_ADMIN", "REVIEWER"].includes(role)));
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("Local preview mode. Sign in to connect this studio to ToplineShop.");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaAltText, setMediaAltText] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaMessage, setMediaMessage] = useState("");
  const [galleryItems, setGalleryItems] = useState<ChohanGalleryItem[]>([]);
  const [galleryTitle, setGalleryTitle] = useState("");
  const [galleryImageUrl, setGalleryImageUrl] = useState("");
  const [galleryAltText, setGalleryAltText] = useState("");
  const [galleryCaption, setGalleryCaption] = useState("");
  const [galleryMessage, setGalleryMessage] = useState("");
  const [events, setEvents] = useState<ChohanCompanyEvent[]>([]);
  const [eventTitle, setEventTitle] = useState("");
  const [eventSummary, setEventSummary] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventStartsAt, setEventStartsAt] = useState("");
  const [eventImageUrl, setEventImageUrl] = useState("");
  const [eventMessage, setEventMessage] = useState("");
  const [revisions, setRevisions] = useState<ChohanContentRevision[]>([]);

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
    document.documentElement.style.setProperty("--brand-primary", draft.colors.primary);
    document.documentElement.style.setProperty("--brand-accent", draft.colors.accent);
    document.documentElement.style.setProperty("--app-canvas", draft.colors.canvas);
  }, [draft.theme, draft.colors.primary, draft.colors.accent, draft.colors.canvas]);

  const refreshGovernedContent = async (token: string) => {
    try {
      const [gallery, eventRecords, revisionRecords] = await Promise.all([listChohanGallery(token), listChohanEvents(token), listChohanRevisions(token)]);
      setGalleryItems(gallery);
      setEvents(eventRecords);
      setRevisions(revisionRecords);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load governed content.");
    }
  };

  useEffect(() => {
    if (accessToken) void refreshGovernedContent(accessToken);
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    void getChohanDraft(accessToken).then((record) => {
      const content = record.draftJson;
      if (!content) return;
      setDraft((current) => ({
        ...current,
        theme: (record.themeKey as ThemeName) || current.theme,
        colors: { primary: record.primaryColor, accent: record.accentColor, canvas: record.canvasColor },
        hero: { eyebrow: content.heroEyebrow ?? current.hero.eyebrow, heading: content.heroHeading ?? current.hero.heading, copy: content.heroCopy ?? current.hero.copy, image: content.heroImageUrl ?? current.hero.image },
        sections: { ...current.sections, ...content },
        seo: { title: content.seoTitle ?? current.seo.title, description: content.seoDescription ?? current.seo.description, keywords: content.seoKeywords ?? current.seo.keywords, ogImage: content.ogImageUrl ?? current.seo.ogImage, noIndex: content.noIndex ?? current.seo.noIndex },
        progress: content.progress ?? current.progress,
      }));
      setMessage("Tenant draft loaded from the authenticated workspace.");
    }).catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load tenant draft."));
  }, [accessToken]);

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

  const saveDraft = async (event: FormEvent) => {
    event.preventDefault();
    window.localStorage.setItem("chohan-admin-draft", JSON.stringify(draft));
    setSaved(true);
    if (!accessToken) {
      setMessage("Draft saved on this device. Sign in below to save it to the tenant workspace.");
      return;
    }
    await saveChohanDraft(accessToken, {
      themeKey: draft.theme,
      primaryColor: draft.colors.primary,
      accentColor: draft.colors.accent,
      canvasColor: draft.colors.canvas,
      heroEyebrow: draft.hero.eyebrow,
      heroHeading: draft.hero.heading,
      heroCopy: draft.hero.copy,
      heroImageUrl: draft.hero.image || undefined,
      seoTitle: draft.seo.title,
      seoDescription: draft.seo.description,
      seoKeywords: draft.seo.keywords,
      ogImageUrl: draft.seo.ogImage || undefined,
      noIndex: draft.seo.noIndex,
      progress: draft.progress,
      ...draft.sections,
    });
    setMessage("Draft saved to the authenticated ToplineShop tenant workspace.");
  };

  const connectBackend = async (event: FormEvent) => {
    event.preventDefault();
    setLoginError("");
    try {
      setAuth(await authLogin({ email, password }));
      setMessage("Connected. Save draft now writes to the authenticated tenant workspace.");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to sign in.");
    }
  };

  const publishDraft = async () => {
    if (!accessToken) return;
    await publishChohanDraft(accessToken);
    setMessage("Draft published through ToplineShop. The release remains auditable by tenant.");
  };

  const submitDraftForReview = async () => {
    if (!accessToken) return;
    await submitChohanDraftForReview(accessToken);
    setMessage("Draft submitted for tenant review. A reviewer can now publish the approved revision.");
  };

  const saveMediaAsset = async () => {
    if (!accessToken || !mediaAltText.trim()) {
      setMediaMessage("Connect a workspace and provide alt text first.");
      return;
    }
    try {
      if (mediaFile) {
        await uploadChohanMedia(accessToken, mediaFile, { altText: mediaAltText });
      } else if (mediaUrl.trim()) {
        await registerChohanMedia(accessToken, { url: mediaUrl.trim(), mimeType: "image/*", altText: mediaAltText });
      } else {
        setMediaMessage("Choose an image file or provide an image URL.");
        return;
      }
      setMediaMessage("Media asset saved to the tenant library.");
      setMediaUrl("");
      setMediaAltText("");
      setMediaFile(null);
    } catch (error) {
      setMediaMessage(error instanceof Error ? error.message : "Media save failed.");
    }
  };

  const saveGalleryItem = async () => {
    if (!accessToken) return setGalleryMessage("Connect a workspace first.");
    if (!galleryTitle.trim() || !galleryImageUrl.trim() || !galleryAltText.trim()) return setGalleryMessage("Title, image URL and alt text are required.");
    try {
      await createChohanGalleryItem(accessToken, { title: galleryTitle.trim(), imageUrl: galleryImageUrl.trim(), altText: galleryAltText.trim(), caption: galleryCaption.trim() || undefined });
      setGalleryTitle(""); setGalleryImageUrl(""); setGalleryAltText(""); setGalleryCaption("");
      setGalleryMessage("Gallery item saved as a draft.");
      await refreshGovernedContent(accessToken);
    } catch (error) {
      setGalleryMessage(error instanceof Error ? error.message : "Gallery item could not be saved.");
    }
  };

  const publishGalleryItem = async (id: string) => {
    if (!accessToken) return;
    try { await publishChohanGalleryItem(accessToken, id); setGalleryMessage("Gallery item published."); await refreshGovernedContent(accessToken); }
    catch (error) { setGalleryMessage(error instanceof Error ? error.message : "Gallery item could not be published."); }
  };

  const saveEvent = async () => {
    if (!accessToken) return setEventMessage("Connect a workspace first.");
    if (!eventTitle.trim() || !eventSummary.trim() || !eventLocation.trim() || !eventStartsAt) return setEventMessage("Title, summary, location and date are required.");
    try {
      await createChohanEvent(accessToken, { title: eventTitle.trim(), summary: eventSummary.trim(), location: eventLocation.trim(), startsAt: new Date(eventStartsAt).toISOString(), imageUrl: eventImageUrl.trim() || undefined });
      setEventTitle(""); setEventSummary(""); setEventLocation(""); setEventStartsAt(""); setEventImageUrl("");
      setEventMessage("Event saved as a draft.");
      await refreshGovernedContent(accessToken);
    } catch (error) {
      setEventMessage(error instanceof Error ? error.message : "Event could not be saved.");
    }
  };

  const publishEvent = async (id: string) => {
    if (!accessToken) return;
    try { await publishChohanEvent(accessToken, id); setEventMessage("Event published."); await refreshGovernedContent(accessToken); }
    catch (error) { setEventMessage(error instanceof Error ? error.message : "Event could not be published."); }
  };

  const rollbackRevision = async (revision: number) => {
    if (!accessToken || !canReview) return;
    try { await rollbackChohanRevision(accessToken, revision); setMessage(`Revision ${revision} restored as a new draft.`); await refreshGovernedContent(accessToken); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Revision rollback failed."); }
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
          <nav className="grid gap-2 text-sm"><a className="rounded-lg bg-[var(--sidebar-active)] px-3 py-2 font-semibold text-[var(--text-inverse)]" href="#brand">Brand and theme</a><a className="rounded-lg px-3 py-2 hover:bg-[var(--app-shell-raised)]" href="#content">Page content</a><a className="rounded-lg px-3 py-2 hover:bg-[var(--app-shell-raised)]" href="#media-library">Media library</a><a className="rounded-lg px-3 py-2 hover:bg-[var(--app-shell-raised)]" href="#events">Events</a><a className="rounded-lg px-3 py-2 hover:bg-[var(--app-shell-raised)]" href="#governance">Publishing governance</a></nav>
        </aside>
        <form className="grid gap-6" onSubmit={saveDraft}>
          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-6" id="progress"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-primary)]">Delivery progress</p><h2 className="text-xl font-semibold">Keep the public progress dashboard current.</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Update the governed phase data as JSON. Each item needs an id, title, percent, status and topics list.</p></div><textarea aria-label="Project progress JSON" className="min-h-52 w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-3 font-mono text-xs" value={JSON.stringify(draft.progress, null, 2)} onChange={(event) => { try { const next = JSON.parse(event.target.value) as ChohanProgressPhase[]; if (Array.isArray(next)) setDraft((current) => ({ ...current, progress: next })); } catch { /* Keep the last valid draft while editing. */ } }} /></section>
          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-6" id="seo"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-primary)]">Search visibility</p><h2 className="text-xl font-semibold">SEO and social preview controls.</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">These values travel with the draft and are applied when the approved content is published.</p></div><div className="grid gap-4"><label className="grid gap-2 text-sm font-semibold">SEO title<input maxLength={60} className="rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-3 font-normal" value={draft.seo.title} onChange={(event) => setDraft((current) => ({ ...current, seo: { ...current.seo, title: event.target.value } }))} /></label><label className="grid gap-2 text-sm font-semibold">Meta description<textarea maxLength={160} className="min-h-24 rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-3 font-normal" value={draft.seo.description} onChange={(event) => setDraft((current) => ({ ...current, seo: { ...current.seo, description: event.target.value } }))} /></label><label className="grid gap-2 text-sm font-semibold">Keywords<input className="rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-3 font-normal" value={draft.seo.keywords} onChange={(event) => setDraft((current) => ({ ...current, seo: { ...current.seo, keywords: event.target.value } }))} placeholder="Comma-separated phrases" /></label><label className="grid gap-2 text-sm font-semibold">Social preview image URL<input className="rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-3 font-normal" value={draft.seo.ogImage} onChange={(event) => setDraft((current) => ({ ...current, seo: { ...current.seo, ogImage: event.target.value } }))} placeholder="Optional approved media URL" /></label><label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={draft.seo.noIndex} onChange={(event) => setDraft((current) => ({ ...current, seo: { ...current.seo, noIndex: event.target.checked } }))} /> Keep this tenant page out of search results</label></div></section>
          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-6" id="brand"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-primary)]">1 · Brand system</p><h2 className="text-xl font-semibold">Change the visual language without coding.</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Presets are safer for day-to-day publishing. Custom tokens are available for an approved brand refresh.</p></div><div className="grid gap-3 md:grid-cols-3">{themes.map((theme) => <button type="button" key={theme.id} onClick={() => setDraft((current) => ({ ...current, theme: theme.id }))} className={`rounded-lg border p-4 text-left ${draft.theme === theme.id ? "border-[var(--brand-primary)] ring-2 ring-[var(--interactive-selected)]" : "border-[var(--border-default)]"}`}><span className="mb-3 block h-8 rounded-md" style={{ background: theme.id === "emerald-night" ? "#122620" : theme.id === "mint-executive" ? "#EDF8F2" : "#10221D" }} /><strong className="block text-sm">{theme.label}</strong><span className="mt-1 block text-xs text-[var(--text-secondary)]">{theme.detail}</span></button>)}</div><div className="mt-5 grid gap-4 sm:grid-cols-3"><label className="grid gap-2 text-sm font-semibold">Primary color<input type="color" value={draft.colors.primary} onChange={(event) => setDraft((current) => ({ ...current, colors: { ...current.colors, primary: event.target.value } }))} /></label><label className="grid gap-2 text-sm font-semibold">Accent color<input type="color" value={draft.colors.accent} onChange={(event) => setDraft((current) => ({ ...current, colors: { ...current.colors, accent: event.target.value } }))} /></label><label className="grid gap-2 text-sm font-semibold">Canvas color<input type="color" value={draft.colors.canvas} onChange={(event) => setDraft((current) => ({ ...current, colors: { ...current.colors, canvas: event.target.value } }))} /></label></div></section>
          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-6" id="content"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-primary)]">2 · Content fields</p><h2 className="text-xl font-semibold">Edit approved page copy.</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Every field is length-limited, tenant-scoped and included in the draft-review-publish history.</p></div><div className="grid gap-4"><label className="grid gap-2 text-sm font-semibold">Hero eyebrow<input className="rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-3 font-normal" value={draft.hero.eyebrow} onChange={(event) => updateHero("eyebrow", event.target.value)} /></label><label className="grid gap-2 text-sm font-semibold">Hero heading<input className="rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-3 font-normal" value={draft.hero.heading} onChange={(event) => updateHero("heading", event.target.value)} /></label><label className="grid gap-2 text-sm font-semibold">Hero copy<textarea className="min-h-28 rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-3 font-normal" value={draft.hero.copy} onChange={(event) => updateHero("copy", event.target.value)} /></label>{(["aboutHeading", "aboutCopy", "servicesHeading", "servicesCopy", "responsibilityHeading", "responsibilityCopy", "contactHeading", "contactCopy"] as const).map((key) => <label className="grid gap-2 text-sm font-semibold" key={key}>{key.replace(/([A-Z])/g, " $1")} {key.endsWith("Copy") ? <textarea className="min-h-24 rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-3 font-normal" value={draft.sections[key]} onChange={(event) => setDraft((current) => ({ ...current, sections: { ...current.sections, [key]: event.target.value } }))} /> : <input className="rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-3 font-normal" value={draft.sections[key]} onChange={(event) => setDraft((current) => ({ ...current, sections: { ...current.sections, [key]: event.target.value } }))} />}</label>)}</div></section>
          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-6" id="media"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-primary)]">3 · Media library</p><h2 className="text-xl font-semibold">Replace images and build the gallery.</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Image uploads are local draft previews here. Production storage will use object storage with size, type, alt-text and rights checks.</p></div><div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 rounded-lg border border-dashed border-[var(--border-strong)] p-4 text-sm font-semibold">Replace hero image<input type="file" accept="image/*" onChange={(event) => handleImage(event, "hero")} /></label><label className="grid gap-2 rounded-lg border border-dashed border-[var(--border-strong)] p-4 text-sm font-semibold">Add gallery image<input type="file" accept="image/*" onChange={(event) => handleImage(event, "gallery")} /></label></div>{draft.hero.image && <img className="mt-4 h-40 w-full rounded-lg object-cover" src={draft.hero.image} alt="Hero draft preview" />} {draft.gallery.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">{draft.gallery.map((item) => <figure key={item.image} className="overflow-hidden rounded-lg border border-[var(--border-default)]"><img className="aspect-square w-full object-cover" src={item.image} alt={item.title} /><figcaption className="truncate p-2 text-xs">{item.title}</figcaption></figure>)}</div>}</section>
          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-6" id="events"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-primary)]">4 · Gallery and events</p><h2 className="text-xl font-semibold">Manage public stories without editing code.</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Editors create drafts. Reviewers publish them after checking facts, rights and accessibility.</p></div><div className="grid gap-6 lg:grid-cols-2"><div className="rounded-lg border border-[var(--border-default)] p-4"><h3 className="font-semibold">Add gallery item</h3><div className="mt-3 grid gap-3"><input className="rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-3" placeholder="Title" value={galleryTitle} onChange={(event) => setGalleryTitle(event.target.value)} /><input className="rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-3" placeholder="Image URL" value={galleryImageUrl} onChange={(event) => setGalleryImageUrl(event.target.value)} /><input className="rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-3" placeholder="Alt text" value={galleryAltText} onChange={(event) => setGalleryAltText(event.target.value)} /><input className="rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-3" placeholder="Caption (optional)" value={galleryCaption} onChange={(event) => setGalleryCaption(event.target.value)} /><button className="w-fit rounded-full bg-[var(--brand-primary)] px-4 py-2 font-semibold text-white" type="button" onClick={saveGalleryItem}>Save gallery draft</button>{galleryMessage && <p className="text-sm text-[var(--text-secondary)]">{galleryMessage}</p>}</div><div className="mt-5 grid gap-3">{galleryItems.map((item) => <div className="flex items-center gap-3 border-t border-[var(--border-default)] pt-3" key={item.id}><img className="h-12 w-12 rounded-md object-cover" src={item.imageUrl} alt={item.altText} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.title}</p><p className="text-xs text-[var(--text-secondary)]">{item.status ?? "DRAFT"}</p></div>{canReview && item.status !== "PUBLISHED" && <button className="rounded-full border border-[var(--border-default)] px-3 py-1 text-xs font-semibold" type="button" onClick={() => publishGalleryItem(item.id)}>Publish</button>}</div>)}</div></div><div className="rounded-lg border border-[var(--border-default)] p-4"><h3 className="font-semibold">Add company event</h3><div className="mt-3 grid gap-3"><input className="rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-3" placeholder="Event title" value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} /><textarea className="min-h-24 rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-3" placeholder="Short summary" value={eventSummary} onChange={(event) => setEventSummary(event.target.value)} /><input className="rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-3" placeholder="Location" value={eventLocation} onChange={(event) => setEventLocation(event.target.value)} /><input className="rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-3" type="datetime-local" value={eventStartsAt} onChange={(event) => setEventStartsAt(event.target.value)} /><input className="rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-3" placeholder="Image URL (optional)" value={eventImageUrl} onChange={(event) => setEventImageUrl(event.target.value)} /><button className="w-fit rounded-full bg-[var(--brand-primary)] px-4 py-2 font-semibold text-white" type="button" onClick={saveEvent}>Save event draft</button>{eventMessage && <p className="text-sm text-[var(--text-secondary)]">{eventMessage}</p>}</div><div className="mt-5 grid gap-3">{events.map((event) => <div className="flex items-center gap-3 border-t border-[var(--border-default)] pt-3" key={event.id}><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{event.title}</p><p className="text-xs text-[var(--text-secondary)]">{event.startsAt.slice(0, 10)} · {event.location} · {event.status ?? "DRAFT"}</p></div>{canReview && event.status !== "PUBLISHED" && <button className="rounded-full border border-[var(--border-default)] px-3 py-1 text-xs font-semibold" type="button" onClick={() => publishEvent(event.id)}>Publish</button>}</div>)}</div></div></div></section>
          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-6" id="governance"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-primary)]">5 · Governance</p><h2 className="text-xl font-semibold">A master link page needs controlled publishing.</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Flow: draft → preview → reviewer approval → publish → audit log → rollback. Write actions use ToplineShop authentication and tenant roles.</p></div><div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary)] p-4 text-sm text-[var(--text-secondary)]">{message}</div>{accessToken && !canReview && <p className="mt-4 text-sm text-[var(--text-secondary)]">Your role can edit and submit drafts. A reviewer must approve publication.</p>}{accessToken && revisions.length > 0 && <div className="mt-5 rounded-lg border border-[var(--border-default)] p-4"><h3 className="font-semibold">Revision history</h3><div className="mt-3 grid gap-2">{revisions.slice(0, 8).map((revision) => <div className="flex items-center gap-3 border-t border-[var(--border-default)] pt-2 text-sm" key={revision.id}><span className="font-semibold">Revision {revision.revision}</span><span className="text-[var(--text-secondary)]">{revision.status} · {revision.createdAt.slice(0, 10)}</span>{canReview && revision.status === "PUBLISHED" && <button className="ml-auto rounded-full border border-[var(--border-default)] px-3 py-1 text-xs font-semibold" type="button" onClick={() => rollbackRevision(revision.revision)}>Restore as draft</button>}</div>)}</div></div>}{!accessToken && <div className="mt-5 grid gap-3 rounded-lg border border-[var(--border-default)] p-4"><p className="text-sm font-semibold">Connect ToplineShop workspace</p><input className="rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-3" type="email" placeholder="Admin email" value={email} onChange={(event) => setEmail(event.target.value)} /><input className="rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-3" type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} /><button className="w-fit rounded-full border border-[var(--border-default)] px-5 py-3 font-semibold" type="button" onClick={connectBackend}>Connect securely</button>{loginError && <p className="text-sm text-red-600">{loginError}</p>}</div>}<div className="mt-5 flex flex-wrap gap-3"><button className="rounded-full bg-[var(--brand-primary)] px-5 py-3 font-semibold text-white" type="submit">{accessToken ? "Save tenant draft" : "Save local draft"}</button>{accessToken && <><button className="rounded-full border border-[var(--border-default)] px-5 py-3 font-semibold" type="button" onClick={submitDraftForReview}>Submit for review</button>{canReview && <button className="rounded-full bg-[var(--brand-accent)] px-5 py-3 font-semibold text-white" type="button" onClick={publishDraft}>Approve and publish</button>}</>}<button className="rounded-full border border-[var(--border-default)] px-5 py-3 font-semibold" type="button" onClick={resetDraft}>Reset draft</button>{saved && <span className="self-center text-sm font-semibold text-[var(--state-success)]">Saved</span>}</div></section>
          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-6" id="media-library"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-primary)]">6 · Production media</p><h2 className="text-xl font-semibold">Manage approved images without code.</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Authenticated uploads use the configured ToplineShop storage adapter. Every asset requires alt text and is tenant-scoped.</p></div><div className="grid gap-3 md:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Image URL<input className="rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-3 font-normal" value={mediaUrl} onChange={(event) => { setMediaUrl(event.target.value); setMediaFile(null); }} placeholder="https://cdn.example.com/image.webp" /></label><label className="grid gap-2 text-sm font-semibold">Upload image<input className="rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-3 font-normal" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => { setMediaFile(event.target.files?.[0] ?? null); setMediaUrl(""); }} /></label></div><label className="mt-3 grid gap-2 text-sm font-semibold">Alt text<input className="rounded-lg border border-[var(--input-border)] bg-[var(--input-background)] p-3 font-normal" value={mediaAltText} onChange={(event) => setMediaAltText(event.target.value)} placeholder="Describe the image for accessibility" /></label><div className="mt-4 flex flex-wrap items-center gap-3"><button className="rounded-full bg-[var(--brand-primary)] px-5 py-3 font-semibold text-white" type="button" onClick={saveMediaAsset}>Save media asset</button>{mediaMessage && <span className="text-sm text-[var(--text-secondary)]">{mediaMessage}</span>}</div></section>
        </form>
      </div>
    </main>
  );
}

export default function ChohanAdminPage() {
  return <AuthProvider><ChohanAdminPageContent /></AuthProvider>;
}
