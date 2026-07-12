# Build context is the MONOREPO ROOT (see docker-compose.yml: context: .., dockerfile: server/Dockerfile)
# because this image needs both /server and the sibling /shared JSON files at runtime.
FROM node:20-alpine AS base
WORKDIR /app

# Install deps first for better layer caching
COPY server/package.json server/package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy server source + the shared/ folder it reads JSON from at runtime
COPY server/src ./src
COPY server/sql ./sql
COPY server/createAdmin.js ./
COPY shared /shared

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# SQLite data dir (mounted as a volume in docker-compose so the DB survives restarts)
RUN mkdir -p /app/data

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://localhost:'+ (process.env.PORT||4000) +'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/index.js"]
