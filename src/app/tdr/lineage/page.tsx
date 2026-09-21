'use client';

import { useState } from 'react';
import { TdrLineagePanel } from '@/components/tdr/TdrLineagePanel';

export default function TdrLineagePage() {
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) setActiveId(trimmed);
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Version Lineage</h1>
        <p className="text-text-muted text-sm mt-1">
          View the version history of a logical dataset by its logical dataset ID.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          placeholder="Logical dataset ID (UUID)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded bg-surface border border-border px-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <button
          type="submit"
          disabled={!query.trim()}
          className="px-5 py-2 rounded bg-brand text-white text-sm font-medium disabled:opacity-50"
        >
          View
        </button>
      </form>

      {activeId && (
        <TdrLineagePanel
          logicalDatasetId={activeId}
          onClose={() => setActiveId(null)}
        />
      )}
    </div>
  );
}
