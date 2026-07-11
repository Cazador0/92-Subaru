# '92 Subaru

**'92 Subaru** web application serving the Dallas–Fort Worth community as a 1990's cover band playing top hits of the 1990s and originals. The web application
working cassette tape deck with a live Web Audio "bootleg-tape" synth.

This repo turns the Claude Design scaffold (`web/*.dc.html`) into a **running Deno
web server and application**. The design prototype's tool-specific runtime
(`support.js`) is **not** shipped; the UI is recreated as a standalone
vanilla-JS app served by Deno.

## Run it

Requires [Deno](https://deno.com) 2.x (tested on 2.8).

```bash
deno task start      # -> http://localhost:8000
deno task dev        # same, with --watch auto-reload
```

Click **play** on the deck to start audio (browsers require a user gesture).

Override the design knobs via query string: `?beat=120` (100–220ms loop tempo),
`?sweep=0` (hide the photocopier scan light).

## Architecture

```
deno.json           Deno tasks (start / dev / test / deploy) + imports/fmt/lint
Dockerfile          Container image (Fly.io / any host)
fly.toml            Fly.io deploy config (persistent volume for the booking store)
.github/workflows/
  deno.yml          CI: lint + test, then deploy to Deno Deploy on push to main
server/
  main.ts           Deno.serve HTTP server — static files + JSON API
  data.ts           Content model (tracks + tour) and the Deno KV booking store
  data_test.ts      Smoke tests for the content model + booking store
public/
  index.html        App shell + inline cassette SVG (static markup)
  styles.css        Keyframes + the pseudo-states the prototype expressed via its runtime
  app.js            Ported logic: routing, tape transport, Web Audio synth, booking form
web/                Original Claude Design references (.dc.html + support.js) — reference only
research/           Firebase seed script + assets from an earlier prototype (gitignored)
```

### HTTP API

| Method | Path            | Purpose                                             |
|--------|-----------------|-----------------------------------------------------|
| GET    | `/api/content`  | `{ tracks: {A,B}, tour: {upcoming,past} }`          |
| GET    | `/api/bookings` | All submitted booking requests                      |
| POST   | `/api/bookings` | Submit a booking (`date`, `location`, `message` required) |
| GET    | `/health`       | Liveness `{ ok, uptime }`                           |

The front-end fetches `/api/content` on load (falling back to embedded data if
the server is unreachable) and POSTs the booking form to `/api/bookings`, which
validates server-side and stores the request in **Deno KV**.

### Storage (Deno KV)

Bookings live in [Deno KV](https://docs.deno.com/deploy/kv/manual/), which works
on every target with no code change:

- **Deno Deploy** — native, globally-replicated, persistent (zero config).
- **Fly / Docker / VPS** — SQLite-backed; set `KV_PATH` to a path on a persistent
  volume (the `Dockerfile`/`fly.toml` use `KV_PATH=/data/kv.sqlite`).
- **Local / tests** — unset uses Deno's default location; `:memory:` is ephemeral.

## Deploy

CI (`.github/workflows/deno.yml`) runs `deno lint` + `deno task test` on every
push/PR, then **deploys to Deno Deploy on push to `main`**. Your workflow becomes:
edit files → commit → `git push` → live.

**Deno Deploy (recommended).** One-time: create a project at
[dash.deno.com](https://dash.deno.com) linked to this repo, then set the
`project:` name in `deno.yml` to match. The deploy job authenticates via GitHub
OIDC (`id-token: write`); no token secret needed. Manual deploys:
`DENO_DEPLOY_PROJECT=<name> deno task deploy`.

**Fly.io (if you want a persistent local file store).**

```bash
fly launch --no-deploy
fly volumes create subaru_data --size 1 --region dfw
fly deploy
```

The `[mounts]` volume at `/data` keeps the KV/SQLite booking store across restarts.

### Relationship to Firebase

`server/data.ts` mirrors the Firestore data model described in `firestore.rules`
and seeded by `research/scripts/seed.js` — `presets` ≈ the mixtape tracks,
`events` ≈ the tour dates. Because no Firebase service-account credentials are
present, the app serves that same model **locally from Deno**. To move to
Firestore, point `main.ts`'s content handler at the Firestore SDK and run
`node research/scripts/seed.js` with a service-account key (see that file's header).

## Provenance

Recreated from `web/xerox_rave_site.html` and `web/Cassette.dc.html`
per the handoff in `web/README.md`. Exact tokens, copy, transport logic, and the
audio-synthesis recipe are ported from those references.
