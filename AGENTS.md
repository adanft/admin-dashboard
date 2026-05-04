# Agent Rules

These rules are project-specific. Global agent rules still apply. Do not duplicate broad personal/team behavior here; keep this file focused on this repository.

## Project Context

- Public repository: `adanft/admin-dashboard`.
- Stack: Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, `@adanft/ui`, Biome 2.2, pnpm 10.33.
- Package manager is pinned in `package.json`; use `pnpm`, not npm/yarn/bun.
- Main branch is protected. Use short-lived branches and pull requests.

## Git Workflow

- Follow GitHub Flow:
  1. start from updated `main`
  2. create a typed branch
  3. commit with Conventional Commits
  4. push branch
  5. open PR into `main`
  6. merge only after `Quality checks` passes
- Branch naming format: `<type>/<short-description>`.
- Allowed branch types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `revert`.
- Examples:
  - `feat/dashboard-shell`
  - `fix/sidebar-overflow`
  - `chore/configure-biome`
  - `docs/update-readme`
- Do not introduce a `develop` branch unless the project later adopts a formal release/staging workflow.
- Never force push or bypass branch protection unless the user explicitly asks and understands the tradeoff.

## Next.js Rules

<!-- BEGIN:nextjs-agent-rules -->
### This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data.

Before writing or changing Next.js-specific code, read the relevant guide in `node_modules/next/dist/docs/`. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

- Prefer App Router conventions.
- Keep Server Components as the default; add Client Components only when interactivity, browser APIs, or client state require them.
- Do not add `"use client"` casually. Explain why it is needed.
- Do not assume older Next.js APIs or file conventions without verifying local docs first.

## TypeScript Rules

- Keep `strict` TypeScript behavior intact.
- Prefer explicit domain types at boundaries: API responses, component props, actions, and data mappers.
- Avoid `any`. If unavoidable, document why and keep it contained.
- Non-null assertions (`!`) are warnings in Biome; prefer narrowing and explicit fallback behavior.
- Use type-only imports where appropriate; Biome warns with `useImportType`.

## React Rules

- Use React 19 patterns.
- Do not add premature `useMemo`/`useCallback`; only use them when there is a measured or clear referential-stability need.
- Keep components small and purpose-driven.
- For UI architecture, prefer clear separation between data orchestration and presentational components when complexity grows.
- Accessibility is not optional, but keep it practical and necessary:
  - buttons need explicit `type`
  - meaningful images need `alt`; decorative images should be hidden appropriately
  - forms need labels or accessible names
  - clickable non-interactive elements must be replaced with semantic controls or get keyboard support only when a semantic element is impossible
- Do not add excessive ARIA. Prefer semantic HTML first; ARIA is a repair tool, not a styling API.

## Design System Rules

- Use `@adanft/ui` as the default UI component and design-system source.
- Before creating a new reusable component, check whether `@adanft/ui` already provides it.
- Do not invent new components that duplicate existing `@adanft/ui` components.
- Prefer `@adanft/ui` component contracts and styles first, including Button/icon-button/text-button
  patterns. If a `Link` must look like a button, style it to preserve the same visual contract as
  the corresponding `@adanft/ui` Button variant instead of inventing unrelated button styles.
- Do not invent new colors, backgrounds, text colors, shadows, radii, or visual language outside the `@adanft/ui` design contract unless the user explicitly asks.
- Respect the predefined background and text color patterns from `@adanft/ui`.
- Prefer composition of existing design-system primitives over custom one-off markup.
- If a needed component or token is missing from `@adanft/ui`, stop and explain the gap with options:
  - compose from existing primitives
  - add a local one-off component
  - request/add the component to `@adanft/ui`

## Styling Rules

- Use Tailwind CSS 4.
- Keep class names readable; extract components before class strings become unreadable.
- Tailwind is a utility layer, not a design system replacement. Prefer `@adanft/ui` tokens/components before adding custom utility combinations.
- Do not add animations or transitions unless the user explicitly requests them.
- Avoid decorative Tailwind classes that add no functional, layout, accessibility, or design-system value.
- Avoid redundant classes already provided by `@adanft/ui` components.
- Keep spacing, typography, backgrounds, borders, and text colors aligned with existing `@adanft/ui` defaults.
- Prefer named Tailwind spacing utilities for layout offsets, including project-defined fractional
  spacing such as `pl-16.25`, instead of arbitrary values like `pl-[65px]` when the value is part
  of the design/layout convention.
- Do not create local color scales or arbitrary color values unless explicitly approved.
- Do not enable experimental Tailwind class sorting rules unless explicitly requested.
- Do not add local Tailwind-specific agent skills for this project unless explicitly requested; project styling rules belong in this file for now.
- Biome 2.2 cannot safely allowlist Tailwind 4 at-rules, so `suspicious.noUnknownAtRules` remains off for now. Revisit after Biome upgrades.

## Biome and Formatting

- Biome is the source of truth for formatting, linting, and import organization.
- Current formatting conventions:
  - 2-space indentation
  - 100-character line width
  - single quotes in JavaScript/TypeScript
  - double quotes in JSX/TSX attributes
- Use these scripts:
  - `pnpm lint` — local Biome check
  - `pnpm lint:fix` — apply Biome safe fixes, formatting, and import organization
  - `pnpm lint:ci` — CI-safe Biome check
  - `pnpm typecheck` — TypeScript validation
  - `pnpm check` — Biome CI + TypeScript
  - `pnpm ci` — full local CI including build
- Do not hand-format against Biome. If formatting changes are needed, use Biome.

## Verification Rules

- After code or config changes, run the smallest meaningful verification:
  - formatting/lint changes: `pnpm lint`
  - TypeScript/API/component contract changes: `pnpm typecheck` or `pnpm check`
  - CI workflow changes: reason through the workflow and run relevant local scripts
- Do not run `pnpm build` by default. Run it only when:
  - the user explicitly asks
  - release/deployment work requires it
  - the change can only be validated by a production build
- GitHub Actions runs the full build through the `Quality checks` job.

## Documentation Rules

- Keep `README.md` aligned with real scripts and tooling.
- If setup, commands, CI, license, or package manager behavior changes, update README in the same PR.
- Public-facing documentation should be concise, accurate, and reproducible.

## Dependency Rules

- Do not add dependencies casually. Explain:
  - why the dependency is needed
  - what problem it solves
  - why existing tools are insufficient
  - maintenance/security tradeoffs
- Use `pnpm add` / `pnpm add -D` so the lockfile stays consistent.
- Prefer project-local binaries through package scripts or `pnpm exec`.

## Pull Request Expectations

- PRs should include:
  - concise summary
  - validation performed
  - relevant tradeoffs or follow-ups
- Prefer squash merge for single logical changes.
- Delete merged branches.
