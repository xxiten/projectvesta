FROM node:22-alpine AS base
RUN npm install -g pnpm@9.15.0
WORKDIR /app

FROM base AS build
COPY pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/worker ./apps/worker
RUN pnpm install --filter @vesta/worker... --frozen-lockfile=false
RUN pnpm --filter @vesta/worker build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app /app
WORKDIR /app/apps/worker
CMD ["node", "dist/main.js"]
