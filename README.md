# Admin Dashboard

Modern admin dashboard built with Next.js, React, TypeScript, Tailwind CSS, `@adanft/ui`, and Biome.

## Stack

- [Next.js](https://nextjs.org/) 16
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/) 5
- [Tailwind CSS](https://tailwindcss.com/) 4
- [`@adanft/ui`](https://www.npmjs.com/package/@adanft/ui) as the shared React UI component and design-system contract
- [Biome](https://biomejs.dev/) for formatting, linting, and import organization
- [pnpm](https://pnpm.io/) as the package manager

## Requirements

- Node.js 22 or newer
- pnpm 10.33.0

This project pins the package manager through `packageManager` in `package.json`.

## Getting started

Install dependencies:

```bash
pnpm install
```

Configure the external admin API base URL:

```bash
ADMIN_API_BASE_URL="http://localhost:8080"
```

`ADMIN_API_BASE_URL` must be an absolute `http` or `https` URL. A trailing slash is accepted.

Configure session signing secret material for production:

```bash
ADMIN_SESSION_SECRET="replace-with-a-long-random-secret"
```

`ADMIN_SESSION_SECRET` signs the HttpOnly `admin_session` cookie so it is tamper-evident.
Development and test environments can derive fallback signing material from local runtime settings to
avoid blocking setup, but production requires an explicit secret. Without it, sessions fail closed and
the app will not set or accept `admin_session` cookies.

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Current capabilities

- Session-backed admin authentication with HttpOnly cookie storage and logout support.
- Dashboard shell with sidebar navigation, top navbar, profile action, and contextual breadcrumbs.
- Users management with list, search, pagination, create, detail, edit, delete, and role assignment flows.
- Roles management with list, search, pagination, create, detail, edit, delete, and permission assignment flows.
- Permission assignment uses bulk API contracts for role and user updates.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the Next.js development server. |
| `pnpm build` | Build the production application. |
| `pnpm start` | Start the production server after building. |
| `pnpm test` | Run the Vitest behavioral test suite. |
| `pnpm lint` | Run Biome checks locally. |
| `pnpm lint:fix` | Run Biome and write safe fixes, formatting, and import organization. |
| `pnpm lint:ci` | Run Biome in CI mode without writing files. |
| `pnpm format` | Format files with Biome. |
| `pnpm format:check` | Check formatting without writing files. |
| `pnpm typecheck` | Run TypeScript without emitting files. |
| `pnpm check` | Run Biome CI checks and TypeScript checks. |
| `pnpm ci` | Run all CI validation locally, including the production build. |

## Code quality

The project uses Biome as the main quality gate:

- formatting with 2 spaces and 100-character line width
- single quotes in JavaScript/TypeScript
- double quotes in JSX/TSX attributes
- recommended Biome rules
- React and Next.js recommended domains
- unused imports and variables as errors
- import organization through Biome assist

TypeScript is checked separately with `tsc --noEmit`. Biome and TypeScript solve different problems: Biome handles style and linting; TypeScript validates type contracts.

## UI and styling conventions

This project uses `@adanft/ui` as the source of truth for reusable UI components and visual language.

- Prefer existing `@adanft/ui` components before creating local reusable components.
- Do not introduce custom colors, backgrounds, text colors, or component variants that duplicate the design system.
- Use Tailwind CSS as a utility layer, not as a replacement for the design-system contract.
- Avoid unnecessary Tailwind classes that do not add layout, behavior, accessibility, or clear design value.
- Do not add animations or transitions unless explicitly requested.
- Keep accessibility practical and essential: semantic HTML first, labels for forms, `alt` text for meaningful images, button types, and keyboard support where interaction requires it.

## Continuous Integration

GitHub Actions runs on pushes and pull requests targeting `main`:

1. install dependencies with pnpm and the frozen lockfile
2. run Biome in CI mode
3. run TypeScript checks
4. build the application

## License

This project is licensed under the [MIT License](./LICENSE).
