# ============================================================================
# Dockerfile - Empacota build do frontend + PWA + PocketBase
# ============================================================================
# IMPORTANTE: este Dockerfile NÃO builda nada. Ele só empacota os artefatos
# que já estão commitados em pb_public/ (build do frontend principal feito
# via `npm run build:public`, build do PWA feito via `cd pwa && npm run build`
# e copiado pra pb_public/pwa/ na mão).
#
# Pra buildar tudo via Docker (sem build manual), precisaria commitar o
# source do PWA (pwa/src, pwa/package.json, etc) — o que muda a estrutura
# do repo. Por ora, Docker só empacota o que já existe.
# ============================================================================

# ----------------------------------------------------------------------------
# Estágio final: PocketBase + frontend + PWA pré-buildados
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

# Copiar frontend + PWA pré-buildados (raiz inteira de pb_public/)
COPY --chown=pocketbase:pocketbase pb_public/ /app/pb_public/

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
