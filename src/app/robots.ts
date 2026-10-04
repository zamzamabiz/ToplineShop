import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3100";
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/chohan-industries/admin", "/api/", "/tdr/"] }], sitemap: `${baseUrl}/sitemap.xml` };
}
