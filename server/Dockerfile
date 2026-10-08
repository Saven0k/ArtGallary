# ── build ─────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npm", "run", "start:dev"]

FROM development AS build
RUN npm run build

# ── runtime ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
# Загрузки и логи — тома (см. deploy/docker-compose.yml)
RUN mkdir -p /data/uploads /app/logs
ENV STATIC_DIR=/data/uploads
ENV PORT=5000
EXPOSE 5000
CMD ["node", "dist/main"]
