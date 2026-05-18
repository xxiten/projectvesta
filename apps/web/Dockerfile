FROM node:22-alpine AS base
RUN npm install -g pnpm@9.15.0
WORKDIR /app

FROM base AS build
# No build-time API URL: the browser calls /api same-origin and Next proxies
# to API_PROXY_TARGET at runtime (see next.config.mjs). Image is portable.
COPY pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/web ./apps/web
RUN pnpm install --filter @vesta/web... --frozen-lockfile=false
RUN pnpm --filter @vesta/web build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app /app
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
