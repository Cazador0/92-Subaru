# Container image for running the '92 Subaru Deno server on Fly.io / any host.
# Pin to a specific Deno version for reproducible builds (see hub.docker.com/r/denoland/deno/tags).
FROM denoland/deno:alpine

WORKDIR /app

# Cache dependencies first for faster rebuilds.
COPY deno.json .
COPY server/ server/
RUN deno cache --unstable-kv server/main.ts

# App source.
COPY public/ public/

# Booking store (Deno KV) persists here; mount a volume at /data in production.
ENV KV_PATH=/data/kv.sqlite
ENV PORT=8000
EXPOSE 8000

# deno user is unprivileged; ensure it can write the KV volume mount point.
USER deno

CMD ["deno", "run", "--unstable-kv", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "server/main.ts"]
