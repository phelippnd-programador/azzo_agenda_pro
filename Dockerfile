# Etapa 1 - Build
FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable \
    && corepack prepare pnpm@9.15.0 --activate

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

# O frontend será buildado sem valores específicos de produção.
# Durante desenvolvimento local, o Vite ainda poderá usar arquivos .env.
RUN pnpm run build


# Etapa 2 - Runtime
FROM nginx:1.27-alpine

ENV TZ=America/Sao_Paulo

COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]