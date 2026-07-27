# Container image for running the '92 Subaru Deno server on Fly.io / any host.
# Pin to a specific Deno version for reproducible builds (see hub.docker.com/r/denoland/deno/tags).
FROM denoland/deno:alpine

WORKDIR /app

# Cache dependencies first for faster rebuilds.
COPY deno.json .
COPY server/ server/
RUN deno cache server/main.ts

# App source.
COPY public/ public/

# Bookings are delivered by email (see server/email.ts) — no datastore.
ENV PORT=8000
EXPOSE 8000

USER deno

CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-env", "server/main.ts"]
