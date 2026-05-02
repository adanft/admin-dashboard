# Admin Dashboard

Modern admin dashboard built with Next.js, React, TypeScript, Tailwind CSS, and Biome.

## Stack

- [Next.js](https://nextjs.org/) 16
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/) 5
- [Tailwind CSS](https://tailwindcss.com/) 4
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

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the Next.js development server. |
| `pnpm build` | Build the production application. |
| `pnpm start` | Start the production server after building. |
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

## Continuous Integration

GitHub Actions runs on pushes and pull requests targeting `main`:

1. install dependencies with pnpm and the frozen lockfile
2. run Biome in CI mode
3. run TypeScript checks
4. build the application

## License

This project is licensed under the [MIT License](./LICENSE).
