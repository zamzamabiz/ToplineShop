"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronDown,
  Factory,
  Filter,
  PackageOpen,
  Search,
  ShieldCheck,
  Truck,
  Wheat,
  X,
  Zap,
} from "lucide-react";

type ProductCategory = {
  id: string;
  name: string;
  summary: string;
  detail: string;
  icon: typeof Wheat;
  accent: string;
  children: { id: string; name: string; description: string; focus: string; image: string; imageAlt: string }[];
};

const categories: ProductCategory[] = [
  {
    id: "agriculture",
    name: "Agriculture & food systems",
    summary: "From origin to market, dependable supply for food and farming businesses.",
    detail: "We build practical routes between producers, processors and buyers, with disciplined sourcing and long-term relationships at every step.",
    icon: Wheat,
    accent: "#B9D8A8",
    children: [
      { id: "grains", name: "Grains & staples", description: "Reliable sourcing and movement of core food commodities.", focus: "Origin, quality and fulfillment", image: "/chohan/products/agriculture-grains.jpg", imageAlt: "Golden grain field" },
      { id: "oilseeds", name: "Oilseeds & vegetable oils", description: "Market-ready inputs for processors, manufacturers and distributors.", focus: "Supply continuity", image: "/chohan/products/agriculture-oilseeds.jpg", imageAlt: "Vegetable oil in a glass bottle" },
      { id: "farmer-services", name: "Farmer services", description: "Practical support that helps producers reach stronger markets.", focus: "Partnership and access", image: "/chohan/products/agriculture-farmer-services.jpg", imageAlt: "Farmer walking through a field" },
    ],
  },
  {
    id: "industrial",
    name: "Industrial materials",
    summary: "Inputs, handling and coordination for resilient industrial operations.",
    detail: "We connect industrial buyers with the materials, partners and movement plans needed to keep operations progressing.",
    icon: Factory,
    accent: "#E1C28F",
    children: [
      { id: "raw-materials", name: "Raw materials", description: "Industrial inputs selected for consistency and practical use.", focus: "Specification and sourcing", image: "/chohan/products/industrial-raw-materials.jpg", imageAlt: "Industrial materials and machinery" },
      { id: "packaging", name: "Packaging & finished goods", description: "Materials and products that support efficient distribution.", focus: "Quality and readiness", image: "/chohan/products/industrial-packaging.jpg", imageAlt: "Organized warehouse shelves" },
      { id: "project-supply", name: "Project supply", description: "Coordinated supply for infrastructure and operating projects.", focus: "Planning and delivery", image: "/chohan/products/industrial-project-supply.jpg", imageAlt: "Construction project in progress" },
    ],
  },
  {
    id: "logistics",
    name: "Trade & logistics",
    summary: "Coordinated movement across markets, modes and destinations.",
    detail: "We make complex movement easier to navigate with clear coordination, accountable partners and visibility from source to destination.",
    icon: Truck,
    accent: "#B8D8D4",
    children: [
      { id: "freight", name: "Freight coordination", description: "A connected view of movement across road, sea and storage.", focus: "Route and partner coordination", image: "/chohan/products/logistics-freight.jpg", imageAlt: "Cargo ship at a port" },
      { id: "warehousing", name: "Warehousing & distribution", description: "Practical handling for goods that need to move with care.", focus: "Control and availability", image: "/chohan/products/logistics-warehousing.jpg", imageAlt: "Warehouse distribution aisle" },
      { id: "trade-support", name: "Trade support", description: "Commercial and operational support for cross-border business.", focus: "Clarity and execution", image: "/chohan/products/logistics-trade-support.jpg", imageAlt: "Business partners in a meeting" },
    ],
  },
  {
    id: "energy",
    name: "Energy & infrastructure",
    summary: "Long-horizon infrastructure for more capable communities and businesses.",
    detail: "We support infrastructure ideas that strengthen productivity, resilience and responsible growth over time.",
    icon: Zap,
    accent: "#D5C5E8",
    children: [
      { id: "renewable", name: "Renewable energy", description: "Practical pathways toward cleaner, more resilient power.", focus: "Resilience and stewardship", image: "/chohan/products/energy-renewable.jpg", imageAlt: "Solar panels under a clear sky" },
      { id: "utilities", name: "Utilities & services", description: "Foundational systems that help businesses operate confidently.", focus: "Reliability and reach", image: "/chohan/products/energy-utilities.jpg", imageAlt: "Power lines at sunset" },
      { id: "infrastructure", name: "Infrastructure partnerships", description: "Patient collaboration on projects with durable value.", focus: "Long-term impact", image: "/chohan/products/energy-infrastructure.jpg", imageAlt: "Modern commercial building" },
    ],
  },
];

function CategoryIcon({ category }: { category: ProductCategory }) {
  const Icon = category.icon;
  return <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: category.accent, color: "#123C38" }}><Icon size={19} strokeWidth={1.8} /></span>;
}

export default function ChohanProductsPage() {
  const [activeCategory, setActiveCategory] = useState("agriculture");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  const active = categories.find((category) => category.id === activeCategory) ?? categories[0];
  const visibleChildren = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return active.children;
    return active.children.filter((child) => `${child.name} ${child.description} ${child.focus}`.toLowerCase().includes(normalized));
  }, [active, query]);

  return (
    <main className="min-h-screen bg-[#F5F0E6] text-[#143A36]">
      <header className="border-b border-[#D9D1C1] bg-[#FBF9F3]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/chohan-industries" className="flex items-center gap-3 font-semibold tracking-tight"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0D625D] text-sm font-bold text-white">CI</span><span><span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B817A]">Trade with purpose</span><span>Chohan Industries</span></span></Link>
          <nav aria-label="Chohan Industries navigation" className="hidden items-center gap-6 text-sm font-semibold text-[#52706A] md:flex"><Link href="/chohan-industries">Home</Link><Link className="text-[#0D625D]" href="/chohan-industries/products">Products</Link><Link href="/chohan-industries/gallery">Stories</Link><Link href="/chohan-industries/events">Events</Link><Link href="/chohan-industries/admin">Admin</Link></nav>
          <Link href="/chohan-industries#contact" className="hidden rounded-full bg-[#0D625D] px-5 py-3 text-sm font-bold text-white md:block">Talk to us</Link>
        </div>
      </header>

      <section className="border-b border-[#D9D1C1] bg-[#0D625D] px-6 py-16 text-[#F8F4EA] md:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[1.15fr_0.85fr] md:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B9D8A8]">Products & services</p><h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[0.96] tracking-tight md:text-7xl">Practical capability, from source to destination.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-[#D8E7DE]">Explore the categories and operating capabilities that help our partners build, move and grow with confidence.</p></div>
          <div className="border-l border-[#6D9A8A] pl-6 text-sm leading-7 text-[#D8E7DE]"><ShieldCheck className="mb-5 text-[#B9D8A8]" size={28} strokeWidth={1.5} /><p>Our portfolio is organized around the work businesses need done well: dependable supply, coordinated movement and responsible growth.</p></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0D625D]">Browse the network</p><h2 className="mt-3 font-serif text-4xl tracking-tight md:text-5xl">Products and industries</h2></div><div className="flex gap-3"><label className="flex min-w-64 items-center gap-3 rounded-lg border border-[#CFC6B5] bg-[#FBF9F3] px-4 py-3 text-sm"><Search size={17} className="text-[#6B817A]" /><span className="sr-only">Search products</span><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent outline-none placeholder:text-[#81928B]" placeholder="Search capability" /></label><button type="button" onClick={() => setShowFilters((current) => !current)} aria-expanded={showFilters} className="flex items-center gap-2 rounded-lg border border-[#CFC6B5] bg-[#FBF9F3] px-4 py-3 text-sm font-bold"><Filter size={17} /> <span className="hidden sm:inline">Categories</span></button></div></div>

        {showFilters && <div className="mb-8 grid gap-3 border-y border-[#D9D1C1] py-5 sm:grid-cols-2 lg:grid-cols-4">{categories.map((category) => <button key={category.id} type="button" onClick={() => { setActiveCategory(category.id); setSelectedChild(null); setShowFilters(false); }} className={`flex items-center gap-3 p-2 text-left text-sm font-bold ${activeCategory === category.id ? "text-[#0D625D]" : "text-[#52706A]"}`}><CategoryIcon category={category} />{category.name}</button>)}</div>}

        <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block"><p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#6B817A]">Parent categories</p><div className="border-t border-[#D9D1C1]">{categories.map((category) => <button key={category.id} type="button" onClick={() => { setActiveCategory(category.id); setSelectedChild(null); }} className={`flex w-full items-center justify-between border-b border-[#D9D1C1] py-5 text-left text-sm font-bold ${activeCategory === category.id ? "text-[#0D625D]" : "text-[#52706A]"}`}><span className="flex items-center gap-3"><CategoryIcon category={category} />{category.name}</span><ChevronDown size={16} className={activeCategory === category.id ? "rotate-[-90deg]" : ""} /></button>)}</div></aside>
          <div><div className="mb-8 flex items-start justify-between gap-6 border-b border-[#D9D1C1] pb-8"><div><div className="flex items-center gap-3"><CategoryIcon category={active} /><p className="text-sm font-bold uppercase tracking-[0.14em] text-[#0D625D]">{active.name}</p></div><p className="mt-5 max-w-2xl text-xl leading-8 text-[#355950]">{active.detail}</p></div><PackageOpen className="hidden text-[#7D958C] sm:block" size={38} strokeWidth={1.2} /></div>
            {visibleChildren.length ? <div className="grid gap-4 md:grid-cols-3">{visibleChildren.map((child) => <button key={child.id} type="button" onClick={() => setSelectedChild(selectedChild === child.id ? null : child.id)} className={`group overflow-hidden border text-left transition ${selectedChild === child.id ? "border-[#0D625D] bg-[#E6F0E7]" : "border-[#D9D1C1] bg-[#FBF9F3] hover:border-[#0D625D]"}`}><img src={child.image} alt={child.imageAlt} loading="lazy" decoding="async" className="h-40 w-full object-cover" /><div className="p-5"><div className="flex items-start justify-between gap-3"><h3 className="font-serif text-2xl leading-tight">{child.name}</h3><ArrowUpRight size={18} className="shrink-0 text-[#0D625D] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></div><p className="mt-4 text-sm leading-6 text-[#61776F]">{child.description}</p><p className="mt-6 border-t border-[#D9D1C1] pt-3 text-xs font-bold uppercase tracking-[0.12em] text-[#0D625D]">{child.focus}</p></div></button>)}</div> : <div className="border border-dashed border-[#CFC6B5] p-10 text-center"><p className="font-semibold">No capability matches “{query}”.</p><button type="button" className="mt-3 text-sm font-bold text-[#0D625D]" onClick={() => setQuery("")}>Clear search</button></div>}
            {selectedChild && <div className="mt-8 flex items-center justify-between border-l-4 border-[#E37B61] bg-[#FBF9F3] p-5 text-sm text-[#526F64]"><p>Capability detail selected. This interaction is ready to connect to the admin-managed product record and inquiry workflow.</p><button type="button" onClick={() => setSelectedChild(null)} aria-label="Close selected capability"><X size={18} /></button></div>}
          </div>
        </div>
      </section>

      <section className="border-t border-[#D9D1C1] bg-[#FBF9F3] px-6 py-14"><div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0D625D]">Build the right route</p><h2 className="mt-3 font-serif text-3xl tracking-tight md:text-4xl">Looking for a specific capability?</h2></div><Link href="/chohan-industries#contact" className="inline-flex items-center gap-2 self-start rounded-full bg-[#0D625D] px-6 py-3 text-sm font-bold text-white">Start a conversation <ArrowUpRight size={17} /></Link></div></section>
      <footer className="bg-[#143A36] px-6 py-7 text-sm text-[#D8E7DE]"><div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><span>Chohan Industries</span><span>© {new Date().getFullYear()} Chohan Industries. All rights reserved.</span></div></footer>
    </main>
  );
}
