# Build context is ./admin (see docker-compose.yml) — unlike server/client,
# the admin app talks to the backend only via HTTP API and never imports
# anything from the sibling /shared folder, so it doesn't need the
# monorepo root as its build context.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY . .
ARG VITE_SERVER_URL=http://localhost:4000
ENV VITE_SERVER_URL=$VITE_SERVER_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# HashRouter is used in the admin app on purpose, so the default nginx
# static config works with no SPA rewrite rules needed.
EXPOSE 80
