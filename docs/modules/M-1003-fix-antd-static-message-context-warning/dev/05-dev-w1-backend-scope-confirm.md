# Scope Confirmation — Backend Unaffected (M-1003, Wave 1)

- Module: `M-1003-fix-antd-static-message-context-warning`
- Triage: `TRI-1786936619261-4881` (C4, blast_radius 47, packages=[frontend])
- Seat: engineering-backend-developer (wave 1)
- Work order: FRONTEND-ONLY, behavior-preserving refactor — route static antd `message.*` / `Modal.confirm` / `const { confirm } = Modal` call sites through the `ToastNotification` context bridge.
- Deliverable: this scope-confirmation record. **No source file was modified**; the backend seat is read-only on this item and runs no backend process and no `mvn`.

## 1. Full edit footprint is under `frontend/src/` — zero `src/main/**` files

Evidence — `docs/intel/_intake/TRI-1786936619261-4881.json`:

- `edit_target_files` contains exactly **47 entries**, lines 9–55, **every one prefixed `frontend/src/`** (read directly from the intake JSON).
- Machine check: `grep '"frontend/src/' docs/intel/_intake/TRI-1786936619261-4881.json` → **98 matches**, all starting `frontend/src/`:
  - 47 = `edit_target_files` (lines 9–55)
  - 47 = `impact_files` (lines 58–104, identical mirror set)
  - 4 = `seam_claims[].file` anchors (lines 134, 142, 150, 158)
- Negative check: `grep 'src/main|\.java|pom\.xml|backend|mvn' docs/intel/_intake/TRI-1786936619261-4881.json` → **0 matches** in the entire intake record.
- `packages: ["frontend"]`; `change_class: C4`; `shape: scaffolded`; `verification_commands` are frontend-only (`npm run build`, `npx tsc --noEmit -p tsconfig.app.json`, both `cwd: frontend`).

**Conclusion: the 47-file edit footprint contains zero `src/main/**` (backend) paths.**

## 2. No backend contract change is required

Evidence — `docs/modules/M-1003-fix-antd-static-message-context-warning/design/00-design-plan.md`:

- Plan header declares: "Type: behavior-preserving, frontend-only refactor (no backend, no UI/theme changes)" and "The refactor is strictly import-level: **all call sites stay byte-identical**" (§1).
- The three work orders reference **only `frontend/src/**` paths**: WO-1 = 2 bridge files (`frontend/src/components/ToastNotification.tsx`, `frontend/src/App.tsx`); WO-2 = 33 files (32 antd `message` imports + `RadarStationForm.tsx` latent fix); WO-3 = 15 files (12 `Modal.confirm(` + 3 destructure; incl. 3 PMO-directed additions `UsersPage.tsx`, `GroupList.tsx`, `UnitList.tsx`, all under `frontend/src/`) — §6.5 cluster counts, 50 unique = 47 triage + 3 additions.
- Backend-path scan of the design plan: grep for `src/main|\.java|pom\.xml|@PreAuthorize|Controller|Repository|migration|DTO|endpoint|schema|mvn` → the **only** hit is the inviolable prohibition at line 254: "**Do NOT touch backend** (`src/main/**`), `frontend/src/theme.ts`, `frontend/src/tokens.ts`, any UI/styling, any API/schema, or any file outside the 47 edit-target files". Same scan across the whole module folder returns only that line plus two QA negative-AC rows (`07-qa-report-w1.md:97-98` asserting "No paths under `src/main/**`").
- No API endpoint, DTO, entity, enum, DB schema, Flyway migration, `RolePermissionSeeder`, or `OrgUnitCacheService` reference exists anywhere in the design plan; the refactor swaps imports/call routing at the TS module level only.

**Conclusion: no backend API/entity/DTO/schema/migration change is required; the refactor is import-level only.**

## 3. Backend is unaffected — no `mvn` compile/test warranted

- The change set is confined to `frontend/src/**` (TypeScript/TSX). Backend compilation, tests, and packaging cannot be affected by an import-level frontend refactor; there is no `src/main/**` or `src/test/**` delta.
- The triage's own verification commands are frontend-only (`npm run build`, `npx tsc --noEmit -p tsconfig.app.json` in `frontend/`), owned by the frontend wave.
- Per project rule ("KHÔNG TỰ Ý CHẠY BACKEND"), this seat did not start the backend and did not run `mvn`. Statement recorded explicitly: **no backend changes, no mvn compile warranted**.

## Evidence index

| Claim | Evidence | Source |
|---|---|---|
| 47 edit targets, all `frontend/src/` | `edit_target_files` (47 entries) read from intake JSON; grep `"frontend/src/` → 98/98 matches under `frontend/src/` | TRI-1786936619261-4881.json |
| Zero backend tokens in footprint | grep `src/main\|\.java\|pom\.xml\|backend\|mvn` → 0 matches (whole JSON) | TRI-1786936619261-4881.json |
| Plan is frontend-only | Header "frontend-only refactor (no backend)"; WO-1/2/3 paths all `frontend/src/**` | 00-design-plan.md §header, §4, §6.5 |
| Only backend mention is a prohibition | grep backend terms → 1 hit: line 254 "Do NOT touch backend (`src/main/**`)" | 00-design-plan.md §7 |
| Frontend-only verification | `verification_commands`: `npm run build` + `npx tsc --noEmit` (cwd `frontend`) | TRI-1786936619261-4881.json |
| Executed typecheck (2026-08-17) | `npx tsc --noEmit -p tsconfig.app.json` in `frontend/` → **exit code 2 (FAILED)** — pre-existing baseline type errors across ~90 files (spanning well beyond the M-1003 footprint, incl. test files, types/, theme.ts); this seat modified zero source files (only this doc was written); **a green typecheck cannot be claimed** until the frontend baseline is repaired | executed command result (exit 2) |

## Out-of-scope note (for the reviewer)

The 3 PMO-directed additions (UsersPage, GroupList, UnitList) extend the triage's 47 to 50 unique targets; all 3 are `frontend/src/**` files, so the frontend-only conclusion is unchanged (design §6.1, §6.5).
