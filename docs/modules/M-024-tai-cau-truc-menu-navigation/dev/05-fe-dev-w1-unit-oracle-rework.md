# Implementation Summary — F-292 Wave-1 Rework: Unit Oracle Materialization + AppLayout Token Fix

- **Module:** M-024-tai-cau-truc-menu-navigation / F-292 (v2 dashboard-first menu restructure)
- **Seat:** engineering-frontend-developer (wave-1 rework of the wave-1 unit-oracle gap)
- **Date:** 2026-09-04
- **Prior context:** QA wave-2 (07-qa-report-w2.md) flagged (QA-2) the planned unit oracle
  `frontend/src/config/navigation.test.ts` was never created and vitest was absent
  (`node_modules/vitest` missing, `.bin/vitest` dangling), leaving AC-024-03 (`count === 28`),
  AC-024-05 (accessibleTree) and AC-024-06/09 (locateRoute/groupOfPath) without an executable
  oracle; and (QA-1, advisory) the v2 delta hardcoded 3 new `rgba(255,255,255,…)` literals at
  AppLayout.tsx:636/646/686 instead of theme tokens.

## Scope executed (no re-implementation of the v2 model — code already correct)

1. **Materialized the unit oracle** — new `frontend/src/config/navigation.test.ts` (vitest).
2. **Fixed the vitest discovery config** — `frontend/vitest.config.ts`: `include` gained
   `'src/config/**/*.test.ts'` (the runner's discovery pool previously did NOT cover
   `src/config/`, so the oracle could never be collected — a suite the runner cannot collect
   is not a test).
3. **Token fix (QA-1)** — `frontend/src/components/AppLayout.tsx`: the 3 new v2 literals routed
   through theme semantic tokens. The 14+ pre-existing literals at HEAD were left untouched
   (baseline debt, out of scope).
4. **Toolchain install** — vitest installed into `node_modules` only; `package.json` and
   `pnpm-lock.yaml` unchanged (stale lockfile is pre-existing and untouched).

Files touched by THIS seat (git-verified): `frontend/src/config/navigation.test.ts` (new),
`frontend/src/components/AppLayout.tsx` (4 lines), `frontend/vitest.config.ts` (1 line).
No other files modified; `package.json`/`pnpm-lock.yaml` byte-identical (git diff --stat empty).

## Unit oracle coverage (mapped to acceptance-map.json semantics)

All expected values derive from EXTERNAL sources, not from the tree under test (non-tautology
guard): matrix `SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md` §2 (28 rows, repo root) for AC-024-03; QA w2
evidence for the extra-screen inventory.

| AC | Oracle case(s) in navigation.test.ts | Passed |
|----|--------------------------------------|--------|
| AC-024-03 | `count === 28`: kcht group tree covers exactly the 28 canonical type keys (1 per matrix row); inventory locked as 28 canonical + 4 documented extra screens (`/ship-repair-facility` = 2nd screen of row 9, `/navigation-channel-chk` = CHK screen of row 5, `/water-zone`, `/station/coastal`) + 2 route-less grouping roots (`kcht-vts`, `kcht-vienthong`) and nothing else (34 total, 31 route-bearing); no duplicate keys; VHF present as the single disabled node (`vhf-disabled`, no route, under `kcht-vienthong`); multi-layer chains ≥ depth 3 (Cảng biển→Bến cảng→Cầu cảng; Luồng HH→Nhà trạm phao tiêu→Phao tiêu; Hệ thống VTS→TTĐH VTS→Trạm Radar) | ✓ |
| AC-024-05 | accessibleTree: prune denied leaves; drop route-less parents with zero surviving children; retain route-denied parent when a child survives (kept as group); disabled nodes NOT permission-gated (VHF survives a deny-all on the real tree); output key-set ⊆ input key-set; allow-all returns the tree unchanged; deep-frozen input survives every call without mutation | ✓ |
| AC-024-06 | locateRoute: deepest node wins on longest match (`/a/b/c` beats `/a`, `/a/b`); openKeys = ancestor chain; a parent node's openKeys include itself; `/:id`/`/create` suffix matching; undefined on no match; disabled nodes never located; real kcht routes (`/pier`, `/buoys`, `/station/hanoi`) resolve with their sidebar chains; segment-boundary guard (`/navigation-channel-chk/7` does NOT cross-match `/navigation-channel`) | ✓ |
| AC-024-09/02 | groupOfPath: `/` → undefined (no block menu on landing); `/port` → `kcht`; `/dai-ttdh` → `kcht` (Đài viễn thông branch); `/users` → `admin`, `/asset/increase` → `asset`; unknown → undefined | ✓ |
| AC-024-04 (bonus) | firstAccessibleRoute: undefined when nothing allowed; `/port` first in tree order; descends to first allowed descendant (`/pier`); never returns a disabled node | ✓ |

**27 tests, all green.**

## Token fix detail (AppLayout.tsx)

Convention: theme tokens only; the 13-color semantic palette is CLOSED (no new tokens without
design review), and theme.ts already carries the on-dark text tokens for this exact surface
(sidebar navy `#1a3f83` = `colors.sidebarBg`).

| Site | Before (hardcoded) | After (semantic token) | Rationale |
|------|--------------------|------------------------|-----------|
| `:636` group-header div color (active block title) | `'rgba(255,255,255,0.9)'` | `colors.textOnDark` (0.85) | Strongest on-dark text token available; palette has no 0.9 white token |
| `:646` back-button ("Về trang chủ" ←) color | `'rgba(255,255,255,0.85)'` | `colors.textOnDark` (0.85) | Exact value match |
| `:686` hint text "Chọn một khối chức năng…" | `'rgba(255,255,255,0.6)'` | `colors.textOnDarkMuted` (0.55) | Muted on-dark text token; palette has no 0.6 white token |

Import updated: `import { layout } from '../theme'` → `import { colors, layout } from '../theme'`.
Residual visual deltas (0.9→0.85 and 0.6→0.55) are deliberate: they collapse the new literals
onto the two existing semantic on-dark tokens instead of inventing 0.9/0.6 tokens in the closed
palette or modifying the shared token file (out of scope for this rework). Theme/tokens files
not modified.

## Commands executed (exact, with observed results)

1. `pnpm install --lockfile=false` in `frontend/` → **`pnpm: command not found` (exit 127)** —
   pnpm is not on PATH in this environment.
2. `corepack pnpm --version && corepack pnpm install --lockfile=false` in `frontend/` →
   pnpm v11.25.0, "Already up to date" in 344ms — did NOT install vitest (stale module state
   recorded by `.modules.yaml` believed everything linked while vitest files were absent).
3. `corepack pnpm install --force --lockfile=false` in `frontend/` → +379 packages linked
   (355 reused from store, vitest among the added); exit 0, 15.6s. `pnpm-lock.yaml` was neither
   read nor written (lockfile read/write prohibited by `--lockfile=false`; pre-existing stale
   lockfile untouched), `package.json` untouched (vitest already declared `^4.1.11`).
4. `./node_modules/.bin/vitest run src/config/navigation.test.ts` in `frontend/` →
   **27 passed (27), 1 test file passed, exit 0** (vitest v4.1.11).
5. `./node_modules/.bin/tsc --noEmit` in `frontend/` → **exit 0, no output**.

## Verification notes / edges

- **Rendered/browser evidence: not produced** — the token fix is a value-level substitution of
  three CSS colors; visual acceptance needs the browser (e2e suite deferred per project rule:
  backend never started by an agent). QA-1 recorded the advisory as non-blocking with visual
  behavior effectively unchanged; residual alpha drift 0.05 documented above.
- **LSP diagnostics on AppLayout** (a11y static-element handlers :605/:900, `validChildren`
  :151, `any` warnings, hook deps :212) are PRE-EXISTING baseline debt verified by QA w2 via
  git diff — none on the 3 edited lines; not touched (out of scope).
- **vitest.config.ts include change** is the minimal runner fix: without it the mandated
  `vitest run src/config/navigation.test.ts` finds no files (discovery pool excluded
  `src/config/`). `AppLayout.test.tsx` and other existing includes untouched.

## Artifacts
- Oracle: `frontend/src/config/navigation.test.ts` (new)
- Fix: `frontend/src/components/AppLayout.tsx` (import + :636/:646/:686)
- Runner config: `frontend/vitest.config.ts` (include +1 pattern)
- This summary: `docs/modules/M-024-tai-cau-truc-menu-navigation/dev/05-fe-dev-w1-unit-oracle-rework.md`
