# ─── Build Stage ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY . .
ARG VITE_API_URL=http://localhost:8080/api
ARG VITE_SOCKET_URL=http://localhost:9092
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
RUN npm run build

# ─── Runtime Stage (Nginx) ──────────────────────────────────────────────────
FROM nginx:1.25-alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
