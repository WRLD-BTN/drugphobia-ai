# Build context is the MONOREPO ROOT (see docker-compose.yml) because the
# client imports JSON directly from the sibling /shared folder at build time.
FROM node:20-alpine AS build
WORKDIR /app
COPY client/package.json client/package-lock.json* ./client/
RUN cd client && npm install --no-audit --no-fund
COPY client ./client
COPY shared ./shared
WORKDIR /app/client
ARG VITE_SERVER_URL=http://localhost:4000
ENV VITE_SERVER_URL=$VITE_SERVER_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
