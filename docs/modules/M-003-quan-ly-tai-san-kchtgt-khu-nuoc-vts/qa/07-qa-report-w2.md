# QA Report — Wave 2: Pier Management Page Verification

**Task:** TRI-1786504532185-0148  
**Date:** 2026-08-12  
**Verifier:** engineering-verifier  
**Stage:** Verification wave — 4 files changed (PierList, PierForm, PierDetailContent, App.tsx)

---

## Overall Result: **Changes-requested** ❌

Token compliance (Check D) fails with 3 hardcoded-hex violations. All other checks pass.

---

## Check A: Build — PASS ✓

```bash
npx tsc --noEmit   # exit code 0, zero errors
```

**Evidence:** Command executed in `frontend/`, returned exit code 0 with no output.

---

## Check B: Pattern Compliance — PASS ✓

| Requirement | Result | Evidence |
|---|---|---|
| PierList imports `FilterTableLayout` (not `FilterBar`) | ✓ PASS | `PierList.tsx:29` — `import FilterTableLayout from '../../components/list-view/FilterTableLayout';` No `FilterBar` import found anywhere in file. |
| PierList uses `Drawer` for create/edit/detail (not `Modal`) | ✓ PASS | `PierList.tsx:4` imports `Drawer` from antd. Lines 219–221: state `createDrawerVisible`, `detailDrawerVisible`. Lines 677–694: Create/Edit `<Drawer>`. Lines 697–720: Detail `<Drawer>`. |
| PierForm uses `forwardRef`, NO Modal wrapper | ✓ PASS | `PierForm.tsx:1` imports `forwardRef`. `PierForm.tsx:83`: `const PierForm = forwardRef<any, PierFormProps>(...)`. Grep for `Modal` import: no matches. |
| PierDetailContent exists with named export | ✓ PASS | `PierDetailContent.tsx:33`: `export default function PierDetailContent({`. File exists at `frontend/src/pages/port/PierDetailContent.tsx` (191 lines). |

---

## Check C: Route Check — PASS ✓

| Requirement | Result | Evidence |
|---|---|---|
| `/pier` (lowercase) | ✓ PASS | `App.tsx:192` — `<Route path="/pier" element={<PermissionGuard permission="pier:read"><PierList /></PermissionGuard>} />` |
| `/pier/create` | ✓ PASS | `App.tsx:193` — `<Route path="/pier/create" element={...} />` |
| `/pier/:id/edit` | ✓ PASS | `App.tsx:194` — `<Route path="/pier/:id/edit" element={...} />` |
| No `/Pier` (uppercase) | ✓ PASS | Grep for `/Pier` in `App.tsx`: zero matches. |

---

## Check D: Token Compliance — FAIL ❌

### Hardcoded hex colors (BLOCKING)

The theme specification (`theme.ts:728`) states:
> "KHÔNG hard-code màu hex trực tiếp trong component (vd style={{color: '#1677ff'}})"
>
> `theme.ts:34`: primary color is `#1B84FF`, NOT `#1677ff`

`#1677ff` is **NOT** a semantic token in `tokens.ts`. Three violations found:

| # | File | Line | Violation |
|---|---|---|---|
| 1 | `PierList.tsx` | 474 | `background: '#1677ff15', color: '#1677ff'` — pierCode badge inline style |
| 2 | `PierDetailContent.tsx` | 66 | `background: '#1677ff15', color: '#1677ff'` — pierCode badge in detail grid |
| 3 | `PierDetailContent.tsx` | 104 | `style={{ color: systemOpen ? '#1677ff' : colors.sidebarBg, ... }}` — system info toggle |

**Fix:** Replace `#1677ff` with a semantic token (e.g. `actionPrimary` from `tokens.ts`, or `colors.primary` from `theme.ts` which equals `#1B84FF`). Replace `#1677ff15` with the corresponding token interpolated with transparency (e.g. `` `${actionPrimary}15` ``).

### Form spacing (PASS ✓)

`PierForm.tsx` uses `marginBottom: spaceFormField` consistently — 35 matches across all `Form.Item` elements. No hardcoded numeric spacing values (12, 14, 16, etc.) found on Form.Items.

### Border radius (PASS ✓)

`PierForm.tsx` uses `borderRadius: radiusPill` on all Input/Select controls:
- `PierForm.tsx:70` — `inputStyle: { borderRadius: radiusPill, ... }`
- `PierForm.tsx:71` — `selectStyle: { borderRadius: radiusPill, ... }`
- `PierForm.tsx:72` — `numberStyle: { borderRadius: radiusPill, ... }`
- `PierForm.tsx:355,361` — DatePicker `borderRadius: radiusPill`

Minor note: `PierForm.tsx:320,371` use `borderRadius: 8` on `Input.TextArea`. While `8` is in the allowed scale (`radiusSm`), it should use the token rather than the literal number. Not blocking.

---

## Check E: Service Usage — PASS ✓

| Requirement | Result | Evidence |
|---|---|---|
| Imports `pierCRUD` from `../../services/portService` | ✓ PASS | `PierList.tsx:15` — `import { pierCRUD, pierApproval, berthCRUD, portCRUD, } from '../../services/portService';` |
| Calls `pierCRUD` for CRUD operations | ✓ PASS | `PierList.tsx:318,319` — `pierCRUD.search()` for counts. `PierList.tsx:335` — `pierCRUD.search()` for main data. `PierList.tsx:378` — `pierCRUD.findById()`. `PierList.tsx:404` — `pierCRUD.delete()`. `PierList.tsx:431` — `pierCRUD.update()`. |

---

## Check F: No Regression — PASS ✓

| Template file | Result | Path |
|---|---|---|
| PortListPage.tsx | ✓ EXISTS | `frontend/src/services/port/PortListPage.tsx` — `export default function PortListPage()` at line 326 |
| PortFormContent.tsx | ✓ EXISTS | `frontend/src/services/port/PortFormContent.tsx` — `export default function PortFormContent({` at line 57 |
| PortDetailContent.tsx | ✓ EXISTS | `frontend/src/services/port/PortDetailContent.tsx` — `export default function PortDetailContent({` at line 23 |
| portService.ts | ✓ EXISTS | `frontend/src/services/portService.ts` — contains `pierCRUD` at line 203 |
| AppLayout.tsx | ✓ EXISTS | `frontend/src/components/AppLayout.tsx` — contains `/pier` in `isListPage` array |

All template/reference files present and unaltered. No other files in the port directory were modified.

---

## Summary

| Check | Status |
|---|---|
| A — Build | ✅ PASS |
| B — Pattern compliance | ✅ PASS |
| C — Route check | ✅ PASS |
| D — Token compliance | ❌ FAIL |
| E — Service usage | ✅ PASS |
| F — No regression | ✅ PASS |

**Blockers:** 3 hardcoded `#1677ff` hex color instances (2 files). Replace with `actionPrimary` token.
