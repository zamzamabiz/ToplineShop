import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3100";
  const routes = ["/chohan-industries", "/chohan-industries/products", "/chohan-industries/gallery", "/chohan-industries/events", "/chohan-industries/progress", "/chohan-industries/search"];
  return routes.map((path, index) => ({ url: `${baseUrl}${path}`, lastModified: new Date(), changeFrequency: index === 0 ? "weekly" : "monthly", priority: index === 0 ? 1 : 0.7 }));
}
