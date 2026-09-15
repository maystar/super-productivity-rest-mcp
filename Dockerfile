# Runs as an MCP stdio server: `docker run -i --rm -e SP_REST_TOKEN ... <image>`.
# The container talks to Super Productivity's Local REST API on whatever host is reachable at
# SP_REST_BASE_URL (default: http://host.docker.internal:3876) — it makes no assumption about
# being run inside any particular sandbox product.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json index.js ./
COPY src ./src

USER node

ENTRYPOINT ["node", "index.js"]
