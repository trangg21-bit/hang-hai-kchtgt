# FE Wave 1 — Field Visibility Demo Frontend

## Summary
Implemented the ONE demo screen wiring per accepted design WO-FE-1 / WO-FE-2: a new
`useFieldVisibility` hook (react-query, fail-open, memoized `isHidden`/`isReadonly`) and the
"Ngày cập nhật" (`updatedDate`) column on the VTS list screen, filtered out client-side when
`isHidden('updatedDate')` is true. Backend Jackson strip remains the authoritative security
boundary; this hook is UX-only.

## Changed paths
- `frontend/src/hooks/useFieldVisibility.ts` (NEW)
- `frontend/src/pages/vtssystem/VtsSystemList.tsx` (3 edits: import + hook call + column/filter)

## Implementation details

### `useFieldVisibility.ts` (new)
- `useFieldVisibility(resource)` -> `{ visibility, isLoading, isHidden(field), isReadonly(field) }`.
- Backed by `useQuery` from `@tanstack/react-query` with `queryKey ['field-visibility', resource]`
  and `staleTime: 5 * 60 * 1000`.
- `queryFn` calls `api.get('/field-visibility', { params: { resource } })` through the shared
  axios instance (`frontend/src/services/api.ts`, baseURL `/api`), unwrapping the envelope
  `res.data?.data`.
- FAIL-OPEN: `visibility = apiQuery.data ?? {}`; on any error nothing is hidden client-side.
- `isHidden`/`isReadonly` memoized via `useCallback` on `visibility` so consumer `useMemo` deps
  stay stable. Wildcard `'*'` effect respected.
- Exports `type FieldEffect = 'HIDE' | 'READONLY' | 'ALLOW'` and
  `type FieldVisibilityMap = Record<string, FieldEffect>`.

### `VtsSystemList.tsx`
- Added `import { useFieldVisibility } from '../../hooks/useFieldVisibility';`
- Called `const { isHidden } = useFieldVisibility('vts');` directly under the existing
  `hasPerm` selector (`VtsSystemList.tsx:270` region).
- Appended column after `approvalStatus`:
  `{ key: 'updatedDate', label: 'Ngày cập nhật', dataIndex: 'updatedDate', width: 170, sortable: true, render: (val: string) => formatDate(val) }`
  (`formatDate` already exists at `VtsSystemList.tsx:38`).
- Wrapped the columns array with
  `.filter((c) => !(c.key === 'updatedDate' && isHidden('updatedDate')))` and added `isHidden`
  to the `useMemo` deps (`[page, pageSize, isHidden]`).
- No existing column removed; the form/history drawer and all shared list-view components
  (`ScreenHeader`/`FilterBar`/`StatusTabs`/`DataTable`/`Pagination`) are untouched.
- No hardcoded hex/spacing/font-size added — the column is a plain data column; label is
  Vietnamese with diacritics ("Ngày cập nhật").

## Acceptance criteria satisfied
- `useFieldVisibility.ts` created: react-query, fail-open, memoized `isHidden`/`isReadonly`. ✅
- VTS list adds "Ngày cập nhật" column (`dataIndex updatedDate`, `render formatDate`) and
  filters it out when `isHidden('updatedDate')`, with `isHidden` in `useMemo` deps. ✅
- No existing column removed. ✅
- No hardcoded hex/spacing/font-size. ✅
- `npm run build` (frontend) exits 0. ✅

## Verification
Command: `npm run build` from `D:\project\hang-hai-kchtgt\frontend`
- `vite v8.1.5 building client environment for production...`
- `✓ 4034 modules transformed.`
- `✓ built in 674ms`
- **Command exited with code 0.**
- Only warning: chunk-size advisory (pre-existing `Home` chunk ~1.18 MB minified) — not a
  build failure.

No server started; no git.

## Risks / untested
- Runtime visual behavior (admin sees column, regular user does not) is the QA wave runtime
  done_oracle and was NOT exercised here — only the production build was verified. A component
  render was not performed (no dev server started, per constraints).
- The `.filter` uses `c.key`; TypeScript union narrowing was not type-checked by `vite build`
  (esbuild strips types without type-checking). `pnpm exec tsc --noEmit` was not run because the
  frontend typecheck baseline is known RED (~90 pre-existing error files, unrelated to this delta).
- Fail-open path returns `{}`; the global axios response interceptor may still surface an error
  toast on a non-2xx from `/field-visibility` — pre-existing interceptor behavior, not modified.
