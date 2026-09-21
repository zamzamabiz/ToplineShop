'use client';

import { TdrDeletionRequestPanel } from '@/components/tdr/TdrDeletionRequestPanel';

export default function TdrDeletionRequestsPage() {
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Deletion Requests</h1>
        <p className="text-text-muted text-sm mt-1">
          Review and manage source file deletion requests.
        </p>
      </div>
      <TdrDeletionRequestPanel />
    </div>
  );
}
