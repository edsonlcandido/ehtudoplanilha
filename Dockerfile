ARG BUILD_DIR=/tmp/pb_build # Diretório temporário para o build

# Estágio de BASE
# Define a imagem base para os outros estágios
FROM alpine:3.22 AS base

# Instala pacotes essenciais que serão necessários em estágios futuros.
# ca-certificates é para HTTPS, curl para baixar arquivos.
RUN apk add --no-cache ca-certificates curl tzdata

# Estágio de BUILD
# Este estágio é responsável por baixar e descompactar o PocketBase.
FROM base AS build

# Instala unzip, que só é necessário para descompactar o PocketBase.
# Ele NÃO estará na imagem final.
RUN apk add --no-cache unzip git

ARG PB_VERSION=0.28.4
ARG BUILD_DIR=/tmp/pb_build # Diretório temporário para o build
ARG REPO_DIR #<--- Diretório temporário para o clone GLOBAL

# Baixa o PocketBase e o descompacta no diretório temporário.
# Fixamos para linux_amd64, já que você não precisa da verificação de arquitetura.
RUN curl -fsSL -o /tmp/pocketbase.zip \
    https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip \
    && unzip /tmp/pocketbase.zip -d $BUILD_DIR/

# Estágio FINAL
# Este estágio cria a imagem final, leve e segura.
FROM base AS final

# Define argumentos para o usuário/grupo e diretórios
ARG UID=1001
ARG GID=1001
ARG USER=pocketbase
ARG GROUP=pocketbase
ARG PB_WORKDIR=/pocketbase # Diretório de trabalho para os dados do PocketBase
ARG PB_HOME=/opt/pocketbase # Onde o executável do PocketBase será copiado
ARG BUILD_DIR # Diretório temporário para o build GLOBAL
ARG REPO_DIR # <--- Diretório temporário para o clone GLOBAL

# Define variáveis de ambiente para a aplicação
ENV TZ=America/Sao_Paulo \
    PB_PORT=8090 \
    PB_WORKDIR=$PB_WORKDIR \
    PB_HOME=$PB_HOME \
    # Variáveis de ambiente para configuração do Google OAuth
    GOOGLE_CLIENT_ID=SEU_CLIENT_ID.apps.googleusercontent.com \
    GOOGLE_CLIENT_SECRET=SEU_CLIENT_SECRET \
    GOOGLE_REDIRECT_URI=http://localhost:8090/google-oauth-callback \
    SHEET_TEMPLATE_ID=SHEET_TEMPLATE_ID

EXPOSE $PB_PORT

# Cria o grupo e usuário não-root.
# Cria os diretórios necessários e ajusta permissões.
RUN addgroup -g ${GID} ${GROUP} \
    && adduser -u ${UID} -G ${GROUP} -s /bin/sh -D ${USER} \
    && mkdir -p "$PB_HOME" \
    && mkdir -p -m 777 "$PB_WORKDIR" \
    && chown ${USER}:${GROUP} "$PB_WORKDIR"

# Copia APENAS o executável do PocketBase do estágio de build para o estágio final.
COPY --from=build $BUILD_DIR/pocketbase $PB_HOME/pocketbase

# Garante que o executável tenha permissões corretas e cria um symlink
# para que possa ser executado facilmente de qualquer lugar.
RUN chmod 755 "$PB_HOME/pocketbase" \
    && ln -s "$PB_HOME/pocketbase" /usr/local/bin/pocketbase

# Define o usuário que vai executar o comando padrão.
USER ${USER}

# Define o diretório de trabalho padrão para o container.
WORKDIR "$PB_WORKDIR"

# Comando para iniciar o PocketBase.
CMD ["pocketbase", "serve", "--http=0.0.0.0:8090"]

# Opcional: Se você tiver migrations ou hooks, descomente e copie
COPY ./pb_public $PB_WORKDIR/pb_public
COPY ./pb_migrations $PB_WORKDIR/pb_migrations
COPY ./pb_hooks $PB_WORKDIR/pb_hooks
