// src/app/sitemap.ts
import type { MetadataRoute } from "next"

const BASE = "https://cascade-projects-lvq1.vercel.app"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: BASE,                        lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/sc-module`,         lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE}/aws-module`,        lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE}/common/exam`,       lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/synergy`,           lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/pricing`,           lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/common/calendar`,   lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/dashboard`,         lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/login`,             lastModified: now, changeFrequency: "yearly",  priority: 0.4 },
    { url: `${BASE}/signup`,            lastModified: now, changeFrequency: "yearly",  priority: 0.4 },
  ]
}
