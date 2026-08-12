---
feature-id: H-003
document: design-plan
output-mode: lean
last-updated: 2026-08-10
verdict: Pass
waves: 1
---

# 00-design-plan — FilterBar UI Conventions

## Summary

Apply three fully-specified UI refinements to the shared `FilterBar` component: render `Radio.Group` (button-style) when a select-type field has ≤3 options, force action buttons (Search + Reset) to wrap onto a new row when the field count exceeds 3, and extend the `FilterField` type union to accept an explicit `'radio'` type. This is a pure frontend, single-file change with zero consumer-page edits; the 5 consuming pages inherit the behavior automatically through the shared component.

**Key trade-off:** Radio.Group buttons replace Select for narrow-choice filters, which improves discoverability but adds a mild AntD idiom (`optionType="button" buttonStyle="solid"`) the implementer must handle correctly.

## System Boundaries

| Service/Module | Responsibility | Owns | Calls | Exposes |
|---|---|---|---|---|
| `frontend` | Shared list-view UI components | `FilterBar.tsx` | AntD `Radio`, `Select`, tokens from `tokens.ts` | `FilterBar` component (re-exported via `list-view/index.ts`) |

This is a **leaf UI component change** — no backend, no API, no schema, no new integration.

## Integration Model

No integration changes. `FilterBar` remains a pure React component consuming only AntD primitives and workspace tokens. All 6 consumer pages (listed in §Implementation Risks) inherit the new behavior through their existing import — zero consumer edits.

## Data Architecture

No data changes. `FilterField.type` union gains one member (`'radio'`) — no persistence, no migration.

## Security

No security impact. UI-only presentation change with no auth/authz, no PII, no trust boundary.

## Deployment

No env vars, no migration, no feature flag. Standard `npx tsc --noEmit` + Vite build. Rollback is a single-file revert.

## NFR Architecture

| NFR-ref | Solution | Target | Trade-off |
|---|---|---|---|
| UX — filter discoverability | Radio.Group buttons for ≤3 options | Instant recognition of available choices | Select dropdown hides options; Radio shows them all inline |
| Layout — button placement | Full-width spacer + `marginLeft: auto` when fields > 3 | Buttons always visible on their own row | No compact single-row button placement for wide field sets |

## Key Decisions

| Decision | Chosen | Rejected | Rationale |
|---|---|---|---|
| Radio vs Select for ≤3 options | Radio.Group `optionType="button" buttonStyle="solid" size="middle"` | Keep Select always | ≤3 options benefit from inline visibility; Radio button-group is the AntD idiom for this |
| New type vs overloading `select` | Reuse `select` type + automatic detection of options.length ≤3; also accept explicit `'radio'` type | Separate type requiring consumer migration | Backward-compatible — existing consumers get the upgrade without code changes |
| Button row wrapping | Full-width spacer `<div>` before button div when `itemList.length > 3` | CSS flex-basis breakpoint | Explicit spacer is simpler, deterministic, and works with the existing flex-wrap container |

---

## Requirement-to-Execution Mapping

This is a hotfix (C2 reduced pipeline): one wave, one task, one file. The change is fully specified by the triage record — the design confirms seam claims and seals the implementation contract.

## Task Breakdown

| Task | Description | Dependency | Owner type | Wave | Parallelizable | Risk |
|---|---|---|---|---|---|---|
| WO-filterbar-ui-conventions | Apply 3 changes to FilterBar.tsx | None | engineering-frontend-developer | 1 | N/A | Low |

## Work Orders

### WO-filterbar-ui-conventions

- **goal:** FilterBar renders Radio.Group for ≤3 option selects, wraps action buttons to a new row when fields > 3, and accepts explicit `radio` field type — all verified by `npx tsc --noEmit`.
- **assignee-role:** engineering-frontend-developer
- **complexity:** mechanical — fully specified rote transcription of 3 changes; **note:** `Radio.Group` with `Radio.Button` children and `optionType` typing is a mild AntD idiom — ensure `tsc` passes before marking done.
- **files:**
  - `frontend/src/components/list-view/FilterBar.tsx` — apply all 3 changes below
- **contracts:**
  1. **Line 2 — add `Radio` to antd import:**
     ```
     import { Input, Select, Button, DatePicker, Radio } from 'antd';
     ```
     Current: `import { Input, Select, Button, DatePicker } from 'antd';` (seam confirmed at `FilterBar.tsx:2`)

  2. **Line 11 — extend `FilterField.type` union:**
     Change:
     ```ts
     key: string; type: 'search' | 'select' | 'dateRange' | 'date'; label: string;
     ```
     To:
     ```ts
     key: string; type: 'search' | 'select' | 'dateRange' | 'date' | 'radio'; label: string;
     ```
     (seam confirmed at `FilterBar.tsx:11`)

  3. **Lines 96-103 — conditional Radio.Group rendering for select-type fields with ≤3 options:**
     Replace the block:
     ```tsx
               {field.type === 'select' && (
                 <Select placeholder={field.placeholder} allowClear showSearch
                   filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                   value={values[field.key] || undefined}
                   onChange={(val) => handleFieldChange(field.key, val)}
                   options={field.options}
                   style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
               )}
     ```
     With:
     ```tsx
               {(field.type === 'select' || field.type === 'radio') && (
                 field.options && field.options.length <= 3 ? (
                   <Radio.Group
                     optionType="button"
                     buttonStyle="solid"
                     size="middle"
                     value={values[field.key]}
                     onChange={(e) => handleFieldChange(field.key, e.target.value)}
                   >
                     {field.options.map((opt) => (
                       <Radio.Button key={String(opt.value)} value={opt.value}>
                         {opt.label}
                       </Radio.Button>
                     ))}
                   </Radio.Group>
                 ) : (
                   <Select placeholder={field.placeholder} allowClear showSearch
                     filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                     value={values[field.key] || undefined}
                     onChange={(val) => handleFieldChange(field.key, val)}
                     options={field.options}
                     style={{ width: '100%', borderRadius: radiusPill, height: 40 }} />
                 )
               )}
     ```
     (seam confirmed at `FilterBar.tsx:96`)

  4. **Lines 147-152 — full-width spacer before action buttons when fields > 3:**
     Before the button div:
     ```tsx
         <div style={{ display: 'flex', gap: spaceSm, justifyContent: centerActions ? 'center' : undefined, flex: centerActions ? 1 : undefined }}>
     ```
     Insert a full-width spacer div:
     ```tsx
         {(itemList.length > 3 || centerActions) && <div style={{ width: '100%' }} />}
         <div style={{ display: 'flex', gap: spaceSm, justifyContent: centerActions ? 'center' : undefined, flex: centerActions ? 1 : undefined, marginLeft: itemList.length > 3 ? 'auto' : undefined }}>
     ```
     (seam confirmed at `FilterBar.tsx:147`)

  5. **No other file changes.** The 5 consumer pages — `GroupList.tsx`, `UnitList.tsx`, `RolesPage.tsx`, `UsersPage.tsx`, `VtsSystemList.tsx` — stay untouched; they inherit the new behavior through the shared `FilterBar` component.
- **conventions:** The changes add only layout properties (`width: '100%'`, `marginLeft: 'auto'`) and AntD component props — all allowed raw values per the tokens.ts scale rules. No hardcoded hex colors or spacing values are introduced. The `spaceSm` import and `radiusPill` import on lines 2-5 are unchanged and remain the only styling tokens used.
- **verify:** `cd frontend && npx tsc --noEmit`
- **done-when:** `npx tsc --noEmit` exits 0 AND the acceptance items below demonstrably hold.

## Execution Sequence

```
Wave 1 ── [WO-filterbar-ui-conventions]  (single-task wave, no dependencies)
```

## Implementation Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AntD `Radio.Group` `optionType` prop type mismatch with installed antd version | Low | Low | `tsc --noEmit` catches type errors; developer checks installed `antd` version if types mismatch |
| Consumer page breakage from changed Select/Radio behavior | Low | Medium | Zero consumer files edited; all pages share the same `FilterBar` component; tsc confirms type compatibility |

Consumer pages (untouched, inherit behavior automatically):
- `frontend/src/pages/groups/GroupList.tsx`
- `frontend/src/pages/organizations/UnitList.tsx`
- `frontend/src/pages/RolesPage.tsx`
- `frontend/src/pages/UsersPage.tsx`
- `frontend/src/pages/vtssystem/VtsSystemList.tsx`

## Developer Guidance

1. **AntD Radio.Group `optionType` prop:** requires `antd` ≥4.x. If `tsc` reports `optionType` does not exist on `Radio.Group`, check `node_modules/antd/es/radio/index.d.ts` for the installed version's prop shape — the prop may be `optionType` (v4), or the type may be spelled differently in very old versions. The installed version in this project supports it (existing codebase uses v5-era APIs).
2. **Radio.Button value type:** `field.options[].value` is `string | number`. `Radio.Group`'s `value` and `onChange` operate in string-or-number mode. `String(opt.value)` as the `key` prop ensures React key stability.
3. **`marginLeft: 'auto'` on button div:** the spacer (`width: '100%'`) forces a line break in the flex-wrap container; `marginLeft: 'auto'` pushes the button group to the right edge of the new row.
4. **No consumer changes needed:** the `FilterField.type` union extension is backward-compatible — existing consumers passing `type: 'select'` continue to work; they gain Radio behavior automatically when options.length ≤3.
5. **tokens.ts compliance:** this change adds no new color, spacing, font-size, or radius values — only layout properties (width, marginLeft) which are explicitly permitted as raw values per the style preset system (AGENTS.md §Style Preset System, rule 3).

## Migration/Rollout/Rollback Notes

- **Rollout:** `cd frontend && npx tsc --noEmit && npm run build`
- **Rollback:** revert `FilterBar.tsx` to prior commit; no data or schema to unwind.

## Execution Readiness Verdict

All 3 seam claims verified against live `FilterBar.tsx` (lines 2, 11, 96, 147). No drift. Changes are layout-only and type-union extensions — zero token-scale violations. Ready for implementation.
