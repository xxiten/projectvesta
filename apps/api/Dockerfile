# Multi-stage build for the API (pnpm workspace).
FROM node:22-alpine AS base
RUN npm install -g pnpm@9.15.0
WORKDIR /app

FROM base AS build
COPY pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm install --filter @vesta/api... --frozen-lockfile=false
RUN pnpm --filter @vesta/api prisma:generate && pnpm --filter @vesta/api build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app /app
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "dist/main.js"]
