/**
 * Architectural boundary enforcement for the modular monolith.
 * Run: pnpm boundaries
 *
 * Module boundary rules (see docs/adr/0001 + docs/adr/0007):
 *  - No circular dependencies between modules.
 *  - Core domain (inventory, rate-pricing, reservation) must not depend on
 *    integrations or compliance (Dependency Inversion: core defines ports,
 *    adapters implement them).
 *  - shared-kernel must not depend on any feature module.
 *  - Cross-module imports must go through a module's public surface
 *    (index.ts / *.public.ts), never deep internal files.
 */
const moduleGlob = 'apps/api/src/modules/([^/]+)';

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies break modular boundaries and incremental builds.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'core-not-depend-on-integrations',
      severity: 'error',
      comment: 'Core domain must not import the integrations module (use ports + adapters).',
      from: { path: 'apps/api/src/modules/(inventory|rate-pricing|reservation)/' },
      to: { path: 'apps/api/src/modules/integrations/' },
    },
    {
      name: 'core-not-depend-on-compliance',
      severity: 'error',
      comment: 'Core domain must not import the compliance module (jurisdiction-agnostic core).',
      from: { path: 'apps/api/src/modules/(inventory|rate-pricing|reservation)/' },
      to: { path: 'apps/api/src/modules/compliance/' },
    },
    {
      name: 'shared-kernel-is-leaf',
      severity: 'error',
      comment: 'shared-kernel holds primitives only; it must not depend on feature modules.',
      from: { path: 'apps/api/src/shared-kernel/' },
      to: { path: 'apps/api/src/modules/' },
    },
    {
      name: 'no-deep-cross-module-imports',
      severity: 'error',
      comment:
        'Import other modules only via their public surface (index.ts / *.public.ts), ' +
        'never deep internal files. ($1 = importing module; same-module imports allowed.)',
      from: { path: `${moduleGlob}/.+` },
      to: {
        path: `${moduleGlob}/.+`,
        pathNot: [
          'apps/api/src/modules/$1/.+',
          'apps/api/src/modules/[^/]+/index\\.ts$',
          'apps/api/src/modules/[^/]+/[^/]+\\.public\\.ts$',
        ],
      },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'Unreferenced modules are usually dead code.',
      from: {
        orphan: true,
        pathNot: [
          '\\.d\\.ts$',
          '(^|/)index\\.ts$',
          '\\.public\\.ts$',
          '\\.config\\.(c|m)?js$',
          '(^|/)next-env\\.d\\.ts$',
        ],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: {
      path: [
        '\\.spec\\.ts$',
        '\\.test\\.ts$',
        '\\.e2e-spec\\.ts$',
        '(^|/)(dist|\\.next|\\.turbo|coverage)/',
        '(^|/)prisma/(seed|migrations)',
        '(^|/)scripts/',
      ],
    },
    // depcruise's own TS parser detects imports (incl. `import type`), which is
    // sufficient for boundary checks. No path aliases are used in module code,
    // so a tsconfig program is unnecessary here.
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
};
