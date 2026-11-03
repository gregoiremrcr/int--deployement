# Étape de construction
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm run build:backend

# Image d'exécution légère
FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000
ENV API_HOST=0.0.0.0
ENV API_PORT=8787

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/.output ./.output
COPY --from=build /app/dist/backend ./dist/backend
COPY --from=build /app/backend ./backend

EXPOSE 3000 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "fetch('http://127.0.0.1:8787/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

# Le frontend Nuxt et l'API Hono tournent dans le même conteneur.
CMD ["sh", "-c", "./node_modules/.bin/tsx backend/index.ts & exec node .output/server/index.mjs"]
