# ============================================================================
# Dockerfile - Build e Deploy para EasyPanel VPS (frontend + PWA)
# ============================================================================
# Este Dockerfile:
# 1. Builda o frontend Vite/TypeScript da pasta /src
# 2. Builda o PWA (Vue + Vite + vite-plugin-pwa) da pasta /pwa
# 3. Copia os builds pra pb_public (frontend na raiz, PWA em pb_public/pwa/)
# 4. Usa PocketBase pré-compilado (sem download)
# ============================================================================

# ----------------------------------------------------------------------------
# Estágio 1: BUILD FRONTEND PRINCIPAL (Node.js)
# ----------------------------------------------------------------------------
FROM node:22-alpine AS frontend-builder

WORKDIR /build

# Copiar apenas arquivos de dependências primeiro (cache layer)
COPY src/package.json src/package-lock.json* ./

# Instalar dependências (incluindo devDeps: vite, @vitejs/plugin-vue, etc)
RUN npm ci || npm install

# Copiar código fonte do frontend
COPY src/ ./

# Buildar o frontend Vite/TypeScript
RUN npm run build

# O resultado estará em /build/dist/

# ----------------------------------------------------------------------------
# Estágio 2: BUILD PWA (Node.js)
# ----------------------------------------------------------------------------
FROM node:22-alpine AS pwa-builder

WORKDIR /pwa

# Copiar apenas arquivos de dependências primeiro (cache layer)
COPY pwa/package.json pwa/package-lock.json* ./

# Instalar dependências (incluindo devDeps: vite, @vitejs/plugin-vue, etc)
RUN npm ci || npm install

# Copiar código fonte do PWA (src, public, vite.config.js, etc)
COPY pwa/ ./

# Buildar o PWA (output vai pra /pwa/pwa/ por causa do vite.config outDir: 'pwa')
RUN npm run build

# ----------------------------------------------------------------------------
# Estágio 3: IMAGEM FINAL COM PocketBase PRÉ-COMPILADO
# ----------------------------------------------------------------------------
FROM alpine:3.22.1

# Instalar dependências runtime
RUN apk add --no-cache ca-certificates tzdata

# Criar usuário não-root
RUN addgroup -g 1001 pocketbase \
    && adduser -u 1001 -G pocketbase -s /bin/sh -D pocketbase

# Diretório de trabalho
WORKDIR /app

# Copiar executável do PocketBase pré-compilado do projeto
COPY pocketbase /app/pocketbase
RUN chmod +x /app/pocketbase

# Criar estrutura de diretórios
RUN mkdir -p /app/pb_public /app/pb_hooks /app/pb_migrations /app/pb_data \
    && chown -R pocketbase:pocketbase /app

# Copiar frontend principal buildado para pb_public/ (raiz)
COPY --from=frontend-builder --chown=pocketbase:pocketbase /build/dist/ /app/pb_public/

# Copiar PWA buildado para pb_public/pwa/
COPY --from=pwa-builder --chown=pocketbase:pocketbase /pwa/pwa/ /app/pb_public/pwa/

# Copiar hooks e migrations do projeto
COPY --chown=pocketbase:pocketbase pb_hooks/ /app/pb_hooks/
COPY --chown=pocketbase:pocketbase pb_migrations/ /app/pb_migrations/

# Variáveis de ambiente
ENV TZ=America/Sao_Paulo \
    PB_PORT=8090 \
    GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID} \
    GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET} \
    GOOGLE_REDIRECT_URI=${GOOGLE_REDIRECT_URI} \
    SHEET_TEMPLATE_ID=${SHEET_TEMPLATE_ID}

# Expor porta
EXPOSE 8090

# Volume para dados persistentes
VOLUME ["/app/pb_data"]

# Usar usuário não-root
USER pocketbase

# Comando de inicialização
CMD ["/app/pocketbase", "serve", "--http=0.0.0.0:8090"]
