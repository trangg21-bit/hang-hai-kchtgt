# Implementation Summary — WO-06..07: "Cấp đơn vị" (rank) dropdown (F-003)

## Scope
Frontend work orders WO-06..07 for TRI-1786936397148-3956 — add the "Cấp đơn vị" (rank) dropdown (Cục / Chi cục–Cảng vụ–Công ty bảo đảm / Đại diện) across all three org-unit surfaces: drawer create/edit, drawer view detail, and routed `/organizations/create` + `/organizations/:id/edit` form.

Wire contract (per design D6 / AMBIGUITY-003): `rank` is serialized as the enum **NAME** (`"CUC" | "CHI_CUC_CANG_VU_CONG_TY_BAO_DAM" | "DAI_DIEN"`), so frontend keys everything by NAME and does **not** `.toLowerCase()` it (unlike `status`/`operationalStatus`).

## Changed files

| File | Change |
|---|---|
| `frontend/src/services/organizationService.ts` | Added `OrgUnitRankName` type + `RANK_LABELS` + `RANK_OPTIONS` (NAME-keyed); added `rank?: OrgUnitRankName` to `Organization`, `CreateOrganizationPayload`, `UpdateOrganizationPayload`; passthrough `rank` in every mapper (`mapOrgUnit`, `list` ×3, `getById`, `getTree`, `getChildren`, `create`, `update`, `submit`, `approve`, `reject`, `search`) and `rank: payload.rank` in create/update request bodies (built field-by-field). |
| `frontend/src/pages/organizations/UnitList.tsx` | Import `RANK_OPTIONS, RANK_LABELS` + type `OrgUnitRankName`; `rank: org.rank` in `openEditModal`/`openViewModal` `setFieldsValue`; `rank: values.rank` in both create and update `handleSubmit` payloads; required `<Form.Item name="rank">` Select in the drawer form (token-compliant `radiusPill`/`spaceFormField`/`labelProps`, no hardcoded values); detail drawer row `['Cấp đơn vị', RANK_LABELS[editingOrg.rank as OrgUnitRankName] ?? '—']`. |
| `frontend/src/pages/organizations/UnitForm.tsx` | Import `RANK_OPTIONS`; `rank` in `initialData` + `form.setFieldsValue` (load-edit); `rank: values.rank` in update + create payloads; `<FormField type="select" name="rank" label="Cấp đơn vị" required options={RANK_OPTIONS} />` placed after `parentId`, before `operationalStatus`. |

## Acceptance criteria

- **AC-003-15** (required Select on create/edit): ✅ UnitList drawer `Form.Item` rules `[{ required: true, message: 'Vui lòng chọn cấp đơn vị' }]`; UnitForm `<FormField required>`.
- **AC-003-16** (RANK_OPTIONS/RANK_LABELS + mapper + payload wiring): ✅ NAME-keyed exports; `rank` passthrough in all mappers; `rank: payload.rank` in create/update bodies (no `.toLowerCase()` on rank).
- **AC-003-17** (view detail shows label): ✅ `RANK_LABELS[editingOrg.rank as OrgUnitRankName] ?? '—'` (null/undefined → "—").
- **AC-003-18** (list column + OrgUnitType unchanged): ✅ UnitList list column still renders `Cấp {level}` (tree level, untouched); `OrgUnitType`/converter untouched.

## Verification (executed, real output)

- `npx tsc --noEmit` (cwd `frontend/`) → **exit 0**. NOTE: root `tsconfig.json` is a solution config with `"files": []` + `references`, so this run is a no-op and proves nothing.
- `npx tsc --noEmit -p tsconfig.app.json` (cwd `frontend/`) → **exit 2** — documented pre-existing RED baseline (~359 errors across ~90 files; TS6133 unused-import/var, TS1117 duplicate keys, TS1294 erasableSyntaxOnly, TS2739 PierFormProps). My 3 touched files add **no new errors**: LSP diagnostics show `UnitList.tsx` and `UnitForm.tsx` error-free (pre-existing biome WARNs only), `organizationService.ts` has 2 pre-existing biome ERRORs (`useIterableCallbackReturn` in `getTree` at 470/489 — lines untouched by this work).
- `npm run build` (cwd `frontend/`) → **exit 0** (`✓ built in 644ms`, 4033 modules transformed). Only pre-existing chunk-size warnings.

## Risks / observations

- **Concurrent edit detected** on `UnitList.tsx` (lines 12/17): `import toast from '../../components/ToastNotification'` → `import toast, { modal } from ...` and `const { confirm } = Modal` → `const { confirm } = modal` appeared between this seat's initial read and re-read; not made by this seat, unrelated to `rank`, and coexists with this work. Matches the recorded M-001/F-003 concurrent-triage warning.
- **Backend wave (WO-01..05) running concurrently**: DTOs already carry `rank` (`CreateOrgUnitRequest.rank` present) while `OrgUnit.getRank()` is not yet generated — the Java LSP errors are the backend wave's in-progress state, out of frontend scope.
- **Not visually verified**: no running app; drawer/FormField select and detail-row rendering are source-verified only (typecheck + build), not browser-inspected.
