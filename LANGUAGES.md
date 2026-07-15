# LANGUAGES.md — Internationalization plan for chimps.gg

Goal: serve the public site in Portuguese to visitors from Brazil and other
Portuguese-speaking countries, English to everyone else, with an architecture that
scales to more languages later. Studio (`/studio`) stays English-only and outside
the localized public route group.

## The constraint that shapes everything: ISR

The `(public)` route group is served through Vercel ISR (300 s / 180 s). ISR caches
one response per URL, so **the same URL can never render in two languages** — a
`pt` response cached for `/strategies` would be served to English visitors for up
to 5 minutes, and vice versa. `Accept-Language` / geo sniffing inside `+page.server.ts`
or `hooks.server.ts` is therefore off the table for rendering decisions.

Consequences:

1. **Locale lives in the URL path.** English (default) stays unprefixed
   (`/strategies/42`), Portuguese gets a prefix (`/pt/strategies/42`). Each locale
   path is a distinct ISR cache entry — no cache poisoning, no `Vary` tricks.
2. **Detection/redirect must happen before the ISR cache**, or on the client.
   Anything inside the SvelteKit function runs *after* the cache and its redirect
   would itself get cached.

This is also the SEO-correct shape: Google explicitly recommends one URL per
language with `hreflang` alternates, and unprefixed-URLs-stay-English means
existing links, bookmarks, and already-indexed pages don't change meaning.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| URL scheme | `/` = en (default, unprefixed), `/pt/...` = Portuguese | Cache-safe, SEO-correct, zero churn for existing URLs. New languages add prefixes (`/es/...`). |
| Path segments | Keep English segments (`/pt/strategies`, not `/pt/estrategias`) | Localized slugs are a rename layer we can add later; not worth the routing complexity now. |
| Locale id | `pt` (written in Brazilian Portuguese) | One catalog serves BR + PT + PALOP countries. If pt-PT ever diverges, split into `pt-BR`/`pt-PT` then — the architecture doesn't care. |
| Message library | **Paraglide JS 2 (inlang)** — messages only, not its routing | Compile-time, fully typed message functions, tree-shaken per locale, no runtime dictionary lookups, standard choice for SvelteKit. We deliberately do *not* use Paraglide's URL strategy/middleware (see routing below). |
| Routing mechanism | SvelteKit **optional route param** `[[lang=lang]]` wrapping `(public)` | A real route param keeps adapter-vercel's route manifest honest: the ISR config's route pattern matches both `/strategies` and `/pt/strategies`, so both get ISR. A `reroute`-hook approach risks `/pt/*` silently falling outside the ISR route match. |
| Detection | Vercel Routing Middleware (`x-vercel-ip-country`), cookie-overridable | Runs *before* the CDN/ISR cache, so per-visitor redirects never get cached. |
| DB content | Not translated in v1 | Strategy titles/notes/steps are authored content; see "Content translation" below for the future path. |

### Alternative considered: hand-rolled message dictionaries

Plain TS modules (`Record<MessageKey, string>` per locale) would avoid the inlang
toolchain entirely and are viable for 2 locales. Rejected for the stated goal of
"scale to most languages": Paraglide gives typed message parameters, per-locale
tree-shaking (English visitors never download Portuguese strings), pluralization,
and a message format translators/tools understand. If the toolchain ever annoys
us, the message-call sites (`m.some_key()`) are trivially portable.

## Locale resolution rules

Rendering: **the URL is the only source of truth.** `/pt/...` renders Portuguese,
everything else renders English. No exceptions — this is what keeps ISR safe.

Redirecting (middleware, unprefixed public page GETs only), in priority order:

1. `chimps-locale` cookie present → honor it. `pt` → 302 to `/pt` + path; `en` → pass through. (Set by the language switcher and by rule 2.)
2. No cookie, `x-vercel-ip-country` ∈ **{ BR, PT, AO, MZ, CV, GW, ST, TL, GQ, MO }** → 302 to `/pt` + path + query, `Set-Cookie: chimps-locale=pt`.
3. No cookie, no country header (local dev), `Accept-Language` prefers `pt` → same redirect.
4. Otherwise → pass through (English).

On `/pt/...` requests with cookie `en` (user explicitly switched to English
earlier but followed a `/pt` link): do **not** redirect — explicit URLs win.
Redirects are always **302** (never 301) — the decision is per-visitor.

Known crawlers (user-agent contains `bot`, `crawler`, `spider`, etc.) are never
redirected; they discover `/pt/*` through `hreflang` and the sitemap. This avoids
Google's "avoid locale-based auto-redirects for crawlers" penalty while keeping
the auto behavior for humans.

The middleware skips: `/studio*`, `/auth*`, `/robots.txt`, `/sitemap.xml`,
`/_app/*` and other assets, non-GET, and `__data.json` requests (client-side
navigations already carry the prefix).

## Implementation steps

### 1. Paraglide setup

- `pnpm add -D @inlang/paraglide-js` and add the paraglide Vite plugin to
  [vite.config.ts](vite.config.ts) (compiles messages into `src/lib/paraglide/`
  — gitignored, generated by `pnpm run prepare`/dev/build).
- `project.inlang/settings.json`: `baseLocale: "en"`, `locales: ["en", "pt"]`,
  message files at `messages/{locale}.json`.
- Configure Paraglide with `strategy: []` (no built-in detection) — we set the
  locale explicitly per request (step 3).

### 2. Route restructure

- New matcher `src/params/lang.ts`: `export const match = (v) => v === 'pt';`
  driven by a `SUPPORTED_URL_LANGS` const in `src/lib/i18n.ts` (everything that
  must list locales — matcher, middleware country map, hreflang, sitemap — reads
  from this one module).
- Move `src/routes/(public)/**` → `src/routes/[[lang=lang]]/(public)/**`
  (git mv; the ISR `config` exports move with their files unchanged, including
  `allowQuery` on `/strategies`). `robots.txt` and `sitemap.xml` move **out** to
  stay unprefixed single URLs: `src/routes/robots.txt/`, `src/routes/sitemap.xml/`.
- `/studio` and reserved `/auth` paths untouched.

### 3. Wiring locale into rendering

- In [src/hooks.server.ts](src/hooks.server.ts) `handle`: derive
  `locale = event.params.lang ?? 'en'`, call Paraglide's server-side
  `overwriteGetLocale` / ALS wrapper so `m.*()` calls resolve correctly during
  SSR, and use `resolve(event, { transformPageChunk })` to replace a `%lang%`
  placeholder in `src/app.html`'s `<html lang="%lang%">`.
- Client side: `[[lang=lang]]/(public)/+layout.ts` sets the Paraglide locale from
  `params.lang` so client-side navigation and hydration match SSR.
- Add a `localizeHref(path, locale)` helper in `src/lib/i18n.ts` used by every
  internal `<a href>` in public components, so links preserve the current locale.

### 4. Detection middleware

- Add Vercel Routing Middleware (framework-agnostic `middleware.ts`) implementing
  the resolution rules above. Country set and cookie name imported from
  `src/lib/i18n.ts`.
- **Verification gate (do first, on a preview deploy):** confirm the middleware
  runs before the ISR cache with adapter-vercel 6.x — `curl` an unprefixed page
  twice, once with a BR IP header simulation/cookie, and confirm the second
  request still gets English with `x-vercel-cache: HIT`. If root `middleware.ts`
  turns out not to be picked up alongside the SvelteKit build, **fallback plan B**:
  no server-side redirect at all; a tiny inline script in the public layout
  (runs pre-hydration, reads `navigator.languages` + cookie, `location.replace`
  to `/pt` equivalent on first visit). Slightly worse UX (one client hop), zero
  caching risk, and detection quality is arguably better (browser language beats
  IP geolocation for expat/VPN users).

### 5. Translate the UI

- Extract all user-facing strings from the public surface into `messages/en.json`,
  then translate to `messages/pt.json`:
  - `(public)` pages: home, strategies list + detail, heroes list + detail, `+error.svelte`
  - `src/lib/components/public/*` (header, footer, cards, filters, difficulty pips, page intros, empty states)
  - Page `<title>`/meta descriptions and OG tags (these are per-locale SEO surface, not an afterthought)
- Not translated (v1): Studio and NK-sourced names (maps, towers,
  heroes, game modes) — official English names double as game terminology the BR
  community already uses. A future `name_translations` lookup can localize them.
- Dates/numbers: use `Intl.DateTimeFormat`/`NumberFormat` with the active locale
  via a small `formatDate(date, locale)` helper — no library.

### 6. Language switcher

- In `PublicHeader.svelte` (and footer): a control linking to the *same page* in
  the other locale (`localizeHref(currentPath, other)`), with a click handler that
  sets `chimps-locale` (1-year, `path=/`, `SameSite=Lax`) before navigating, so
  the middleware honors the explicit choice forever after.

### 7. SEO

- `(public)/+layout.svelte` `<svelte:head>`: self-referencing canonical per locale
  variant plus `hreflang` alternates for every supported locale and
  `x-default` → unprefixed English, built from the existing `canonicalUrl` helper.
- `sitemap.xml`: emit each path once per locale with `xhtml:link` alternates
  (loop over `SUPPORTED_LOCALES`, so new languages appear automatically).
- ISR untouched semantically: cache entries simply double per locale. Runtime-cache
  keys in `src/lib/server/runtime-cache.ts` need **no** locale suffix — they cache
  DB shapes, not rendered strings. (If a cached shape ever includes translated
  text, version its key per the existing convention.)

### 8. Quality gates

- `pnpm run check` passes (Paraglide messages are typed — a missing key is a
  compile error, not a runtime blank).
- Manual pass: `curl -H 'accept-language: pt-BR' localhost` redirects; `/pt/...`
  renders fully in Portuguese including meta tags; cookie switch back to English
  sticks; `x-vercel-cache: HIT` on second hits of both `/strategies` and
  `/pt/strategies` in preview.

## Content translation (future, out of scope now)

Authored strategy content (titles, notes, step text) stays in its authored
language for v1 — a `/pt` page shows a Portuguese UI around English strategy
text, which is the honest state of the content. When we want translated content:
a `content_translations` table (`entity_type`, `entity_id`, `locale`, `field`,
`text`, unique on the tuple) keeps the base tables clean, falls back to the
authored text when a translation is missing, and slots into
`src/lib/server/public-content.ts` as one extra batched lookup. No schema change
is needed now, and nothing in this plan blocks it.

## Adding language N+1 (the scaling story)

1. Add the locale to `project.inlang/settings.json` and create `messages/xx.json`.
2. Add it to `SUPPORTED_LOCALES` in `src/lib/i18n.ts` (matcher, middleware
   country/Accept-Language mapping, hreflang, sitemap, and the switcher all read
   from it).

That's the whole procedure — routing, ISR, SEO, and detection are locale-count
agnostic by construction.

## Effort estimate

Steps 1–4 (plumbing) are mechanical; step 5 (string extraction) is the bulk of
the work — roughly 15 files on the public surface. The middleware verification
gate in step 4 is the only genuine unknown and should be spiked first on a
preview deployment before committing to the server-side redirect path.
