# Home Table Column Titles Update — Frontend Implementation Summary

**feature-id:** M-022  
**stage:** frontend-implementation  
**agent:** engineering-frontend-developer  
**wave:** 1  
**task:** home-table-column-titles  
**verdict:** Pass  
**last-updated:** 2026-07-13

---

## Designer Spec Coverage

| Requirement | Status | Notes |
|---|---|---|
| Column 1 (Loại KCHT) → empty title | Implemented | Changed `title: 'Loại KCHT'` → `title: ''` |
| Column 2 (Tổng SL) → full text | Implemented | Changed `title: 'Tổng SL'` → `title: 'Tổng số lượng'` |
| Column 3 (Chưa) → full text, no dot | Implemented | Changed dot+label JSX → plain `<span>Chưa khai thác/<br/>vận hành</span>` |
| Column 4 (Đang) → full text, no dot | Implemented | Changed dot+label JSX → plain `<span>Đang khai thác/<br/>vận hành</span>` |
| Column 5 (Dừng) → full text, no dot | Implemented | Changed dot+label JSX → plain `<span>Dừng khai thác/<br/>vận hành</span>` |
| Column 6 (eye icon) → unchanged | Verified | Action column untouched |
| No hard-coded colors in titles | Pass | Dot indicators removed entirely; no color references in titles |
| WCAG accessibility | Pass | Plain text with `<br/>` is more readable than colored dots; screen readers will announce the full text |

## Component / Token Mapping

| UI Requirement | Existing Component/Token | Gap | Justification |
|---|---|---|---|
| Empty column title (col 1) | Native AntD Table `title: ''` | None | Built-in |
| Full-text column titles (cols 2-5) | Native JSX `<span>` with `<br/>` | None | React supports `<br/>` in JSX spans |
| Colored dot indicators removed | `sea0`, `sea2`, `sea3` tokens | No longer needed | Dots removed — no token reuse required |
| Action column icon (col 6) | `EyeOutlined` from `@ant-design/icons` | None | Unchanged |

## Files Changed

| File | Purpose |
|---|---|
| `frontend/src/pages/Home.tsx` | Updated 6 column definitions in `infraColumns` array |

## Components Created or Modified

| Component | New/Modified | States Covered | Tests Added |
|---|---|---|---|
| `infraColumns` (const array in Home.tsx) | Modified | N/A (static column definitions) | N/A |

## Accessibility Compliance

| Requirement | Implementation | Verification |
|---|---|---|
| Full text labels for status columns | Columns 3-5 now show "Chưa khai thác/vận hành", "Đang khai thác/vận hành", "Dừng khai thác/vận hành" | Verified via grep |
| No reliance on color-only indicators | Dot indicators (colored spans) removed entirely | Verified — no `background:sea[0-3],marginRight` patterns remain |
| `<br/>` in JSX | Valid React JSX — native line break | Compiles clean under `tsc --noEmit` |

## Tests Added or Updated

N/A — this is a static label change to column definitions. No component logic, props, or state was modified.

## Verification Evidence

| Command | Exit Code | Scope |
|---|---|---|
| `npx --package typescript tsc --noEmit -p frontend/tsconfig.json` | 0 | Full frontend project type-check |
| `grep` for column titles in Home.tsx | 6 matches confirmed | Lines 165, 167, 177, 186, 195, 204 |
| `grep` for old dot patterns (`background:sea[0-3],marginRight`) | 0 matches | All dot indicators removed |

## Known Limitations / Mismatches

| Issue | Impact | QA Note |
|---|---|---|
| Column 1 now has empty title — the "Loại KCHT" column header is blank | Low | Data column still displays `loai` values (Bến cảng, Bến phao, etc.) — users can infer from context |
| No snapshot tests for Home.tsx table columns | Low | Existing tests (if any) cover chart rendering, not static column titles |
| `<br/>` in table header may cause visual overflow in narrow viewports | Medium | QA should test column width behavior under responsive breakpoints — the `<br/>` forces a line break |
