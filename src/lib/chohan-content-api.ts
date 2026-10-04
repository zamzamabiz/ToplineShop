const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
export const CHOHAN_TENANT_SLUG = process.env.NEXT_PUBLIC_CHOHAN_TENANT_SLUG || "chohan-industries";

export type ChohanContentDraft = {
  progress?: ChohanProgressPhase[];
  themeKey?: "midnight-shell" | "emerald-night" | "mint-executive";
  primaryColor?: string;
  accentColor?: string;
  canvasColor?: string;
  heroEyebrow?: string;
  heroHeading?: string;
  heroCopy?: string;
  heroImageUrl?: string;
  aboutHeading?: string;
  aboutCopy?: string;
  servicesHeading?: string;
  servicesCopy?: string;
  responsibilityHeading?: string;
  responsibilityCopy?: string;
  contactHeading?: string;
  contactCopy?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  ogImageUrl?: string;
  noIndex?: boolean;
};

export type ChohanProgressPhase = {
  id: string;
  title: string;
  percent: number;
  status: "complete" | "active" | "planned";
  topics: string[];
};

export type ChohanPublicContent = {
  config: {
    themeKey: string;
    primaryColor: string;
    accentColor: string;
    canvasColor: string;
    content: ChohanContentDraft | null;
  } | null;
  gallery: Array<{ id: string; title: string; imageUrl: string; altText: string; caption: string | null }>;
  events: Array<{ id: string; title: string; summary: string; location: string; startsAt: string; imageUrl: string | null }>;
};

export type ChohanGalleryItem = {
  id: string;
  title: string;
  imageUrl: string;
  altText: string;
  caption: string | null;
  status?: string;
};

export type ChohanCompanyEvent = {
  id: string;
  title: string;
  summary: string;
  location: string;
  startsAt: string;
  imageUrl: string | null;
  status?: string;
};

export type ChohanDraftResponse = {
  themeKey: string;
  primaryColor: string;
  accentColor: string;
  canvasColor: string;
  draftJson: ChohanContentDraft | null;
};

export type ChohanContentRevision = {
  id: string;
  revision: number;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
};

async function request<T>(path: string, token?: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || `Chohan content request failed (${response.status})`);
  return body as T;
}

export function getPublicChohanContent(tenantSlug: string) {
  return request<ChohanPublicContent>(`/chohan-content/public/${encodeURIComponent(tenantSlug)}`);
}

export function getChohanDraft(token: string) {
  return request<ChohanDraftResponse>(`/chohan-content/draft`, token);
}

export function saveChohanDraft(token: string, draft: ChohanContentDraft) {
  return request(`/chohan-content/draft`, token, { method: "PATCH", body: JSON.stringify(draft) });
}

export function publishChohanDraft(token: string) {
  return request(`/chohan-content/publish`, token, { method: "POST" });
}

export function submitChohanDraftForReview(token: string) {
  return request(`/chohan-content/review`, token, { method: "POST" });
}

export function listChohanRevisions(token: string) {
  return request<ChohanContentRevision[]>(`/chohan-content/revisions`, token);
}

export function rollbackChohanRevision(token: string, revision: number) {
  return request(`/chohan-content/rollback/${revision}`, token, { method: "POST" });
}

export function listChohanMedia(token: string) {
  return request(`/chohan-content/media`, token);
}

export function registerChohanMedia(token: string, media: { url: string; storageKey?: string; mimeType: string; altText: string; caption?: string; rightsNote?: string; expiresAt?: string }) {
  return request(`/chohan-content/media`, token, { method: "POST", body: JSON.stringify(media) });
}

export function uploadChohanMedia(token: string, file: File, metadata: { altText: string; caption?: string; rightsNote?: string; expiresAt?: string }) {
  const form = new FormData();
  form.append("file", file);
  Object.entries(metadata).forEach(([key, value]) => { if (value) form.append(key, value); });
  return request(`/chohan-content/media/upload`, token, { method: "POST", body: form, headers: { Authorization: `Bearer ${token}` } });
}

export function listChohanGallery(token: string) {
  return request<ChohanGalleryItem[]>(`/chohan-content/gallery`, token);
}

export function createChohanGalleryItem(token: string, item: { title: string; imageUrl: string; altText: string; caption?: string; sortOrder?: number }) {
  return request<ChohanGalleryItem>(`/chohan-content/gallery`, token, { method: "POST", body: JSON.stringify(item) });
}

export function publishChohanGalleryItem(token: string, id: string) {
  return request<ChohanGalleryItem>(`/chohan-content/gallery/${encodeURIComponent(id)}/publish`, token, { method: "POST" });
}

export function listChohanEvents(token: string) {
  return request<ChohanCompanyEvent[]>(`/chohan-content/events`, token);
}

export function createChohanEvent(token: string, event: { title: string; summary: string; location: string; startsAt: string; imageUrl?: string }) {
  return request<ChohanCompanyEvent>(`/chohan-content/events`, token, { method: "POST", body: JSON.stringify(event) });
}

export function publishChohanEvent(token: string, id: string) {
  return request<ChohanCompanyEvent>(`/chohan-content/events/${encodeURIComponent(id)}/publish`, token, { method: "POST" });
}
