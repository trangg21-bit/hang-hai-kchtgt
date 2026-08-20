# FE Dev W1 — Org Unit Rank Dropdown + Enum-NAME Rename + Correction #2

- Ref: `TRI-1786936397148-3956` (M-001 / F-003 — "Cấp đơn vị" rank dropdown)
- Stage: `engineering-frontend-developer-wave-1`
- Scope: frontend ONLY (`frontend/src/**`); no backend, no git commit, no server
- Verdict of this seat: **Pass** (correction #2 applied; `npm run build` exit 0)

## Correction #2 (this dispatch — user-mandated exact spec)

`frontend/src/pages/organizations/UnitList.tsx` list-screen "Cấp đơn vị" column cell (line 410):

```diff
- <div style={{ width: 100, color: textSecondary }}>{org.level != null && org.level > 0 ? `Cấp ${org.level}` : '—'}</div>
+ <div style={{ width: 100, color: textSecondary }}>{RANK_LABELS[org.rank as OrgUnitRankName] ?? '—'}</div>
```

- Verified by grep before edit: the replaced expression was the ONLY list-column cell at line 410.
- Line 185 (parent-select label `(Cấp ${org.level})`) is **unchanged** — grep confirms it still renders `` `${org.name}${org.level ? ` (Cấp ${org.level})` : ''}` ``.
- `RANK_LABELS` / `OrgUnitRankName` are already imported at lines 4/7 — no import change needed.

## Enum-NAME rename — confirmed, NOT redone

The prior dispatch applied the rename; this session only verified it by read/grep of `frontend/src/services/organizationService.ts`:

```ts
export type OrgUnitRankName = "DEPARTMENT" | "BRANCH" | "REPRESENTATIVE";   // :72
export const RANK_LABELS: Record<OrgUnitRankName, string> = { ... };         // :74
export const RANK_OPTIONS: { value: OrgUnitRankName; label: string }[] = ... // :80
```

Keyed by NAME (`DEPARTMENT`/`BRANCH`/`REPRESENTATIVE`), display labels in Vietnamese có dấu (`Cục` / `Chi cục/ Cảng vụ/ Công ty bảo đảm` / `Đại diện`). `rank?: OrgUnitRankName` present on `Organization` (:31), `CreateOrganizationPayload` (:46), `UpdateOrganizationPayload` (:62). Rank passthrough `rank: item.rank as OrgUnitRankName | undefined` present across all mapper sites (grep: 13 lines, e.g. :140/:257/:277/:314/:402/:454/:530/:598/:684/:743/:780/:817/:851).

## Other rank UI (from prior dispatch, verified present by grep this session)

- Detail drawer row (:458): `['Cấp đơn vị', RANK_LABELS[editingOrg.rank as OrgUnitRankName] ?? '—']`.
- Required drawer Select (:498): `<Select placeholder="Chọn cấp đơn vị" ... options={RANK_OPTIONS} />`.

## Verification evidence (real, executed this session)

`npm run build` (cwd `D:\project\hang-hai-kchtgt\frontend`):

- **Exit code: 0** — `vite v8.1.5 building client environment for production... ✓ built in 729ms`; 4034 modules transformed; `dist/` emitted.
- Only warning is the pre-existing chunk-size advisory (`chunks larger than 500 kB`), non-blocking.

Not run this session (out of scope for the correction-2 work order): `tsc --noEmit` (known RED baseline), backend Maven build, git. The work order's single gate — `npm run build` exit 0 — is satisfied.

## Acceptance criteria vs definition of done

- [x] UnitList.tsx list column cell now `RANK_LABELS[org.rank as OrgUnitRankName] ?? '—'`.
- [x] Line 185 parent-select label unchanged.
- [x] `npm run build` real exit code reported: **0**.
