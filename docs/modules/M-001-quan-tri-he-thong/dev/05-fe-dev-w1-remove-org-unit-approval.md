# Frontend — Remove Org-Unit Approval Flow (F-003 scope shrink)

- **Change request:** TRI-1786950754582-5a51 (scope_shrink, C3)
- **Module / Feature:** M-001 (Quản trị hệ thống) / F-003 (Quản lý đơn vị)
- **Stage:** engineering-frontend-developer, wave 1
- **Work order:** `docs/modules/M-001-quan-tri-he-thong/design/00-design-plan.md` §7 (FE-01..FE-06)

## Summary

Removed every frontend trace of the org-unit approval flow so a unit's only state is the
**operational status (Sử dụng / Không sử dụng)** carried by `operationalStatus`. Approval
status (`draft`/`pending`/`approved`/`rejected`), `submit/approve/reject` API calls,
`orgunit:approve` permission, approval badges/actions/filters were deleted. CRUD, tree, rank,
and `operationalStatus` plumbing are preserved.

## Changed files

### Primary removal (6 files per design plan §7)
1. `frontend/src/constants/permissions.ts` — removed `ORGUNIT.APPROVE` + the `Duyệt Đơn vị` tree entry.
2. `frontend/src/services/organizationService.ts` — removed `status` type/payload/filter members, all 12 normalizer mappings, status filters, create/update status body, and the `submit()/approve()/reject()` methods. Kept `toApiOperationalStatus`, `RANK_OPTIONS`/`RANK_LABELS`, `mapOrgUnit`, CRUD/tree.
3. `frontend/src/pages/organizations/UnitList.tsx` — removed approval icons/token imports, `STATUS_COLORS/LABELS` rekeyed to `{active,inactive}`, removed `status:` writes + handlers + approval menu items, `getStatusKey` and status folds now operational-only, tabs rekeyed `approved`→`active`.
4. `frontend/src/pages/organizations/UnitForm.tsx` — removed `status: data.status` (×2).
5. `frontend/src/pages/organizations/UnitTree.tsx` — deleted `STATUS_MAP` + approval badge + unused token imports.
6. `frontend/src/services/mockData.ts` — removed the `orgunit:approve` mock permission entry; replaced `status:` with `operationalStatus: 'active' as const` in all 17 entries.

### Rework — verifier mandate (2 residual traces, this wave)
> **SCOPE NOTE:** `frontend/src/store/permissionStore.ts` (and its test) were declared
> out-of-footprint in design plan §11 ("permissionStore legacy `org.approve` mapping — out of
> footprint; stays"). The independent verifier's mandate **overrides** that: the dead
> `org.approve → orgunit:approve` alias was flagged as a residual trace of the removed
> permission and is now removed. This seat acted on the verifier's instruction, not the design
> plan's out-of-footprint note.

- `frontend/src/store/permissionStore.ts:24` — removed the dead `.replace('org.approve', 'orgunit:approve')`
  alias from the `org.` normalization chain. Kept `org.view → orgunit:read` and the generic
  `org. → orgunit:` fallback. The literal `orgunit:approve` no longer appears in this file.
- `frontend/src/store/permissionStore.test.ts` — removed `orgunit:approve` from the
  "normalize legacy dot notation" fixture and dropped the now-invalid
  `expect(hasPermission('org.approve')).toBe(true)` assertion; the rest of the test file is intact.
- `docs/modules/M-001-quan-tri-he-thong/_features/F-003-quan-ly-don-vi/code-review/01-review-report.md:53` —
  the historical BR-015 / `orgunit:approve` row annotated **SUPERSEDED by TRI-1786950754582-5a51**
  (approval flow removed). Historical row content preserved, not deleted or rewritten.
  Outcome: **edit succeeded (write access granted, not refused).**

## Verification evidence

| Gate | Result |
|---|---|
| `npm run build` (cwd `frontend`) | **exit 0** — 4034 modules transformed, "✓ built in 811ms" |
| `orgunit:approve` / `org.approve` literal in `frontend/src` | **0 matches** (grep "No files found") — gone from permissionStore.ts, its test, permissions.ts, mockData.ts, and the org pages |
| Residual approval terms in the 6 primary files | 0 matches for org `submit/approve/reject`, `orgunit:approve`, `status:'draft'/'pending'/'approved'/'rejected'`, and Vietnamese approval strings |
| `operationalStatus` (Sử dụng/Không sử dụng) + `RANK_OPTIONS`/`RANK_LABELS` + `toApiOperationalStatus` + `mapOrgUnit` | intact |
| tsc (`npx tsc --noEmit -p tsconfig.app.json`) | red baseline (~90 pre-existing files). 6-file delta vs pre-edit baseline: permissions.ts 2→0, organizationService.ts 7→3, UnitForm 2→2, UnitList 1→1, UnitTree 2→2, mockData 0→0 — **zero NEW errors, net −6** |
| unit test (`permissionStore.test.ts`) | **not runnable** — `vitest` is not installed and `package.json` has no `test` script (pre-existing toolchain gap); the test edit was minimal and manually traced |

### Pre-existing tsc errors (not introduced by this change)
`UnitForm.tsx:2` (unused `Input`/`Select`), `UnitTree.tsx:39` (`navigate` unused + `React.ReactNode`
namespace), `organizationService.ts:108` (unused `mapOrgUnit` — KEEP-list item; `getChildren`/`search`
omit `operationalStatus`), `UnitList.tsx:41` (`usePermissionStore` selector) — all on lines this seat
did not touch.

## Untested / limitations
- No browser render (removal delta; `npm run build` is the acceptance gate).
- Unit test could not be executed (vitest not wired into the package).

## Risks
- Backend removal (entity/columns/enum/endpoints/seeder) is owned by the backend-dev seat and not yet merged; the frontend no longer calls any of it.
- Orphan `orgunit:approve` rows in a live DB are harmless (seeder is insert-only; no endpoint references the permission after removal).
