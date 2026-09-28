# DRISHTI-OPTIK

**AI-Based Virtual Camera Tracking for Mobile FSOC Terminal Coarse Alignment**

> Computer-vision-assisted coarse alignment for mobile free-space optical
> communication terminals.

A prototype **software concept** exploring AI-based virtual camera tracking for
coarse alignment of mobile FSOC terminals — a simulation environment for research
and demonstration.

> **Not an official ISRO product.** Drishti-Optik is not developed, endorsed,
> certified or deployed by ISRO. It connects to no optical terminal, ground
> station or spacecraft, and every numeric reading it displays is produced by its
> own simulation — never by hardware.

---

## Version 1 scope

Version 1 focuses on the **simulated virtual camera tracking console** for
technical reviewers. Everything else exists to support that
screen: accounts so a session can be saved, a monitoring dashboard, technical and
architecture documentation, and the credibility and legal surfaces.

## What the console demonstrates

```
Camera input → scene / terminal detection → target identification → visual tracking
→ relative position estimation → coarse alignment recommendation
→ alignment confirmation → ready for fine acquisition
```

Controls: **Start tracking**, **Pause**, **Reset**, **Re-centre**,
**Simulate movement**, **Auto align**, and a Manual / Assisted / Auto mode
selector. Every stage reports its own status live, and the 3D terminal model is
driven by the same azimuth/elevation values shown in the numeric readouts.

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | Vite, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Lucide |
| Motion | Framer Motion (2D) + React Three Fiber / Three.js / drei (3D) |
| Charts | Recharts |
| Backend & DB | Convex (typed queries, mutations, actions) |
| Auth | Convex Auth — one-time email codes + anonymous demo sessions |
| Validation | Zod (client) and Convex argument validators (server) |
| Forms | react-hook-form + `@hookform/resolvers` |

> The original brief suggested Next.js + Prisma + PostgreSQL. This project is a
> Freebuff Web project, whose backend and database are **Convex**, so the data
> layer is implemented as Convex functions and a typed schema instead. All of the
> requested behaviour — accounts, persistence, server-side validation, rate
> limiting and a server-side AI path — is present.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page with an animated 3D acquisition scene |
| `/auth` | Sign in / create account (one-time code) and demo access |
| `/console` | **Simulated virtual camera tracking console** (protected) |
| `/dashboard` | Monitoring dashboard — 8 status cards (protected) |
| `/profile` | Display name, history and cookie preferences (protected) |
| `/technology` | Technical overview, parameter set and references |
| `/architecture` | Interactive, clickable architecture diagram |
| `/documentation` | Quick start, walkthrough, data model, API, FAQ |
| `/about` | Project scope, ISRO context and disclaimers |
| `/contact` | Validated contact form + official ISRO public contact info |
| `/thank-you` | Post-submission confirmation |
| `/privacy`, `/terms` | Privacy policy and terms |
| `*` | Custom aerospace-themed 404 ("Signal lost") |

## Credibility model

Every technical statement carries one of four labels, defined in
`src/lib/site.ts`:

| Label | Meaning |
| --- | --- |
| `VERIFIED` | Supported by a source in the references list |
| `SIMULATED` | Produced by the demonstration environment |
| `ASSUMPTION` | A prototype design choice, not a measurement |
| `PROPOSED` | A future implementation idea, not built |

The simulation's constants (field of view, pixel mapping, slew rate, tolerance,
range, cadence) are documented on `/technology#simulation-parameters` and are
labelled **demonstration values — not measured hardware results**.

Sources used for factual background: peer-reviewed PAT/ATP surveys, a public
optical communications terminal standard, and ISRO's own public pages for
organisational context. Full list: `REFERENCES` in `src/lib/site.ts` and
`/technology#references`.

## Project layout

```
src/
  components/
    analytics/     Cookie consent, consent status, analytics bridge
    assistant/     Drishti AI provider, panel and launcher
    common/        Clay surfaces, tags, reveals, section headers
    layout/        Site shell, navbar, footer, mobile CTA
    three/         3D terminal assembly and scenes
    tracking/      Console panels (viewport, controls, pipeline, history)
    ui/            shadcn/ui primitives
  convex/          Schema and backend functions
  hooks/           useTracker, useAuth, useIsMobile
  lib/             Simulation engine, SEO, analytics, site config
  pages/           Route components
  shared/          Knowledge base shared by the browser and Convex
```

## Key modules

- **`src/lib/tracking-engine.ts`** — deterministic, pure reducer for the whole
  coarse alignment simulation. Same seed → same run, which is what makes the
  demo reviewable.
- **`src/hooks/use-tracker.ts`** — owns the tick interval and reports completed
  sessions; the reducer itself stays clock-free and testable.
- **`src/shared/knowledge.ts`** — curated Drishti AI knowledge base, used as the
  guaranteed fallback and as grounding for the model call.
- **`src/convex/ai.ts`** — server-side assistant action. Reads the model key from
  the environment; if it is missing or the call fails, it returns the curated
  answer instead. The key never reaches the browser.

## Configuration

| Variable | Effect |
| --- | --- |
| `VITE_CONVEX_URL` | Convex deployment URL (set by the platform) |
| `VITE_ANALYTICS_ENABLED` | Set to `false` to disable optional analytics entirely |
| `VLY_INTEGRATION_KEY` | Server-side only. When absent, Drishti AI uses the curated knowledge base |

Never edit `.env` files directly; secrets are managed through the project's
Keys / API keys tab.

## Deploying to Vercel

`vercel.json` builds the site with
`bunx convex deploy --cmd 'bun run build' --cmd-url-env-var-name VITE_CONVEX_URL`,
which deploys the Convex functions first and then builds the Vite app with the
production deployment URL injected as `VITE_CONVEX_URL`.

Because that command talks to Convex, the Vercel project needs one secret before
the first deploy will succeed:

| Variable | Where to set it | Purpose |
| --- | --- | --- |
| `CONVEX_DEPLOY_KEY` | Vercel project → Settings → Environment Variables (Production) | Production deploy key from the Convex dashboard. Without it the build step cannot authenticate and the deploy fails. |

Set the project's **Install Command** to `bun install` and **Output Directory**
to `dist` if Vercel does not pick them up from `vercel.json` automatically.

## Analytics and consent

Analytics is **off until the visitor accepts it**. Optional events are limited to
a fixed allow-list (`page_view`, `login`, `sign_up`, `demo_launch`,
`tracking_started`, `simulation_started`, `auto_align_engaged`,
`assistant_opened`, `documentation_viewed`, `contact_submitted`) and the server
rejects anything outside it. Declining changes nothing about the application, and
every analytics failure path is swallowed.

## Local checks

```bash
bunx convex dev --once    # regenerate Convex types (required after convex/ edits)
bunx tsc -b --noEmit      # typecheck
bunx eslint .             # lint
```

## License & attribution

Prototype code and copy belong to the Drishti-Optik development team.
ISRO's name is used descriptively to identify the organisation named against the
originating problem statement; no ISRO emblem or mark is used and no endorsement
is implied.
