# ============================================================================
# Dockerfile - Build do frontend (src/) + PWA (pwa/) + PocketBase
# ============================================================================
# Constrói tudo num único `docker build`:
# 1. Estágio 1: builda o frontend Vite/TypeScript de /src → /build/dist
# 2. Estágio 2: builda o PWA Vue 3 de /pwa → /build/pwa
# 3. Estágio 3: imagem final com PocketBase + artefatos de 1 e 2
#
# O diretório /pwa (source) precisa estar presente no contexto do build.
# O output do build (pwa/pwa/, src/dist/) é regenerado a cada build, não
# precisa estar commitado.
# ============================================================================

# ----------------------------------------------------------------------------
# Estágio 1: BUILD FRONTEND (src/)
# ----------------------------------------------------------------------------
FROM node:22-alpine AS frontend-builder

WORKDIR /build

# Copiar apenas package.json pra cache de deps
COPY src/package.json src/package-lock.json* ./

RUN npm ci --only=production || npm install

# Copiar source do frontend
COPY src/ ./

# Build do Vite/TypeScript → /build/dist
RUN npm run build


# ----------------------------------------------------------------------------
# Estágio 2: BUILD PWA (pwa/)
# ----------------------------------------------------------------------------
FROM node:22-alpine AS pwa-builder

WORKDIR /build

# Copiar package.json do PWA
COPY pwa/package.json pwa/package-lock.json* ./

RUN npm ci --only=production || npm install

# Copiar source do PWA
COPY pwa/ ./

# Build do Vite (Vue 3 + vite-plugin-pwa) → /build/pwa
RUN npm run build


# ----------------------------------------------------------------------------
# Estágio 3: IMAGEM FINAL (PocketBase + artefatos)
# ----------------------------------------------------------------------------
FROM alpine:3.22.1

RUN apk add --no-cache ca-certificates tzdata

RUN addgroup -g 1001 pocketbase \
    && adduser -u 1001 -G pocketbase -s /bin/sh -D pocketbase

WORKDIR /app

# PocketBase pré-compilado
COPY pocketbase /app/pocketbase
RUN chmod +x /app/pocketbase

# Estrutura de diretórios
RUN mkdir -p /app/pb_public /app/pb_hooks /app/pb_migrations /app/pb_data \
    && chown -R pocketbase:pocketbase /app

# Copiar build do frontend (src/dist/) → /app/pb_public/
COPY --from=frontend-builder --chown=pocketbase:pocketbase /build/dist/ /app/pb_public/

# Copiar build do PWA (pwa/pwa/) → /app/pb_public/pwa/
COPY --from=pwa-builder --chown=pocketbase:pocketbase /build/pwa/ /app/pb_public/pwa/

# Hooks e migrations
COPY --chown=pocketbase:pocketbase pb_hooks/ /app/pb_hooks/
COPY --chown=pocketbase:pocketbase pb_migrations/ /app/pb_migrations/

# Env vars
ENV TZ=America/Sao_Paulo \
    PB_PORT=8090 \
    GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID} \
    GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET} \
    GOOGLE_REDIRECT_URI=${GOOGLE_REDIRECT_URI}

EXPOSE 8090

VOLUME ["/app/pb_data"]

USER pocketbase

CMD ["/app/pocketbase", "serve", "--http=0.0.0.0:8090"]
