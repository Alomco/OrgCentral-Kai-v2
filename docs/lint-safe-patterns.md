# Lint-Safe Patterns (OrgCentral)

Keep changes aligned with `eslint.config.mjs` (strict TS, unicorn, import/no-cycle, boundaries).

- Prefer `import type` for contracts and DTOs; keep runtime imports minimal.
- Use `node:` specifiers for built-ins (`node:crypto`, `node:path`); avoid bare `crypto`.
- Obey boundaries: `services` may import `services|useCases|contracts|repositories|prismaRepositories|lib|types|workers`; `repositories` never import services.
- Avoid `any`; use domain unions/enums or `unknown` with narrowing; keep functions total where possible.
- Keep modules under ~250 LOC: extract helpers (ops, mappers, cache) into adjacent files before crossing the limit.
- Sort imports logically, no cycles (`import/no-cycle`); avoid self-imports; use explicit paths.
- No `console`; use structured logger/telemetry helpers.
- Handle promises with `await` (no floating promises); avoid implicit `void` returns unless intended.
