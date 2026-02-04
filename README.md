# Answer Hub Template

Deployable Vite + React Answer Engine site template for Cloudflare Pages.

## Setup

1. **Clone this repo** and connect to Cloudflare Pages
2. **Set environment variable**: `VITE_BUSINESS_ID` = your business UUID
3. **Deploy content**: Use the Publisher to deploy `hub.json` to `/businesses/{businessId}/`

## Build Settings (Cloudflare Pages)

| Setting | Value |
|---------|-------|
| Production branch | `publish` |
| Build command | `npm run build` |
| Build output directory | `dist` |

## How It Works

1. The site reads `VITE_BUSINESS_ID` from environment variables at build time
2. At runtime, it fetches `/businesses/{VITE_BUSINESS_ID}/hub.json`
3. Renders the Answer Engine UI with services, FAQs, proof, and buying help sections

## Local Development

```bash
npm install
VITE_BUSINESS_ID=your-uuid npm run dev
```