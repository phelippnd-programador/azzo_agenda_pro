# Etapa 1 - Build
FROM node:22-alpine AS build
WORKDIR /app

# Habilita o pnpm via corepack, na mesma versao travada no package.json.
RUN corepack enable && corepack prepare pnpm@8.10.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Variaveis VITE_* sao embutidas no bundle em tempo de build (Vite), nao em
# runtime. Os defaults abaixo reproduzem o build de producao atual
# (.env.production, que e local/gitignored); sobrescreva via --build-arg
# para outros ambientes (staging, etc.).
ARG VITE_API_URL=https://app.azzoholding.com.br/agenda/api/v1
ARG VITE_PUBLIC_BOOKING_BASE_URL=https://app.azzoholding.com.br
ARG VITE_META_APP_ID=1910429473193881
ARG VITE_META_CONFIG_ID=1622918758755980
ARG VITE_META_EMBEDDED_REDIRECT_URI=https://app.azzoholding.com.br/agenda/api/v1/public/meta/oauth/callback
ARG VITE_ENABLE_DEMO_LOGIN=false
ENV VITE_API_URL=$VITE_API_URL \
    VITE_PUBLIC_BOOKING_BASE_URL=$VITE_PUBLIC_BOOKING_BASE_URL \
    VITE_META_APP_ID=$VITE_META_APP_ID \
    VITE_META_CONFIG_ID=$VITE_META_CONFIG_ID \
    VITE_META_EMBEDDED_REDIRECT_URI=$VITE_META_EMBEDDED_REDIRECT_URI \
    VITE_ENABLE_DEMO_LOGIN=$VITE_ENABLE_DEMO_LOGIN

RUN pnpm run build

# Etapa 2 - Runtime (Nginx servindo a SPA)
FROM nginx:1.27-alpine
ENV TZ=America/Sao_Paulo

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
