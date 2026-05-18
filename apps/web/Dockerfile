FROM node:22-alpine AS base
RUN npm install -g pnpm@9.15.0
WORKDIR /app

FROM base AS build
# NEXT_PUBLIC_* is inlined at build time, so it must be set before `next build`.
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
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
