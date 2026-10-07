# Dedup Studio

Browser-only image duplicate finder (SHA-256). Files never leave the device.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:5173/` in Chrome/Edge/Opera.

## Build

```bash
npm run build
```

Output: `dist/`

## Deploy to Vercel (free)

### Important project settings (if build fails with `vite: command not found`)

In Vercel → Project → **Settings → General / Build & Development Settings**:

| Setting | Value |
|---|---|
| Framework Preset | **Other** (not Vite) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Root Directory | `.` (repository root) |

Do **not** set Build Command to bare `vite build`.

### Option A — Vercel website

1. Push this project to GitHub (public or private repo).
2. Go to [https://vercel.com](https://vercel.com) → Sign up / Log in.
3. **Add New Project** → Import the GitHub repo.
4. Framework: **Other** (or leave blank).
5. Build command: `npm run build`
6. Output directory: `dist`
7. Click **Deploy**.

You get a URL like `https://dedup-studio-xxx.vercel.app`.

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

For production:

```bash
vercel --prod
```

## Feedback form

Configured in `src/config.ts` via Formspree:

`https://formspree.io/f/xdeaonwn`

## Notes for testers

- Use **Chrome, Edge, or Opera**.
- Open the site **directly** (not inside an iframe).
- Exact duplicates = same file bytes (SHA-256). Visually similar images in different formats are not exact duplicates.
- Deletion needs File System Access permission (HTTPS on Vercel is fine).
