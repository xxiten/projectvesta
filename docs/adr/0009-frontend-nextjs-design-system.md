# ADR-0009: Frontend — Next.js + own design system

Status: Accepted — 2026-05-18

## Context

The product promise is a calm, fast, "Apple-like" operative UI. Off-the-shelf
enterprise UI kits would undermine that. Public/marketing pages benefit from
SSR; the operative app is highly interactive.

## Decision

Next.js App Router + React + TypeScript. A token-based design system
(`@vesta/design-system`) on Tailwind + headless primitives — not a prebuilt
admin theme. Tokens are shared as TS and as a Tailwind preset.

## Consequences

- Full control over look and interaction quality.
- Heavier operative screens are client components; SSR for public/auth.
