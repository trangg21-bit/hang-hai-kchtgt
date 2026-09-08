# FE Dev W5 — Chuẩn hóa UI/UX Luồng hàng hải (Navigation Channel)

## Work orders delivered
| Work item | Status |
|---|---|
| `NavigationChannelList.tsx` — AppDrawer 1080 detail + `hideFilterToggle` 280px sidebar + standalone Lịch sử drawer | implemented |
| `NavigationChannelDetailContent.tsx` — 5-tab read-only detail (NEW) | implemented |
| `NavigationChannelForm.tsx` — create/edit only (no modal detail) | implemented |
| Audit log — centralized `infrastructure_history` (existing `/history` endpoint, kept) | implemented (retained) |

## Changed paths
- `frontend/src/pages/navigationchannel/NavigationChannelList.tsx` — added `AppDrawer` 1080 detail controller + `NavigationChannelDetailContent` wiring; `openModal` narrowed to `create|edit`; new `openDetail`/`detailRecord`/`detailOpen`; `hideFilterToggle={true}` on `FilterTableLayout`; row/name-cell actions route "Xem chi tiết" to `openDetail`.
- `frontend/src/pages/navigationchannel/NavigationChannelDetailContent.tsx` — NEW. 5 tabs: Thông tin chung (4 accordion sections incl. approval toggle), Thông tin vị trí (GPS DMS table + map preview), File đính kèm (count in label), Tuyến luồng (route-segment DetailTable), Vận hành & bảo trì (3 sections). All `DRAWER_TABLE_SCROLL_Y.*`, Pill Badge, semantic tokens only.
- `frontend/src/pages/navigationchannel/NavigationChannelForm.tsx` — `mode` type narrowed to `'create' | 'edit'`; `isDetailMode = !isModalMode && !!id && !isEditMode` (standalone `/navigation-channel/:id` route detail retained — App.tsx is read-only out-of-scope).

## Acceptance mapping (evidence)
| Gate | Command | Result |
|---|---|---|
| Build | `npx vite build` (frontend/) | **exit 0** — 3507 modules, built 1.35s |
| Typecheck (in-scope) | LSP diagnostics on the 3 files | **0 TypeScript errors** (only pre-existing Biome a11y/index-key notes in untouched code) |
| Lint (new file) | `npx eslint …NavigationChannelDetailContent.tsx` | **0 errors/warnings** |
| Lint (3 files) | `npx eslint src/pages/navigationchannel/{List,DetailContent,Form}.tsx` | **116 errors — ALL pre-existing** in untouched List/Form code (`@typescript-eslint/no-explicit-any`, `no-useless-escape`, `react-hooks/preserve-manual-memoization`) |
| Typecheck (whole project) | `npx tsc --noEmit -p tsconfig.app.json` | **exit 1 — whole-project pre-existing errors** in 200+ unrelated files (GISChartView, PortListPage, …); navigationchannel files absent from the error list |

## State coverage implemented
- List: loading / error / empty / data via existing `FilterTableLayout` + `DataTable` + `tableEmptyState`; StatusTabs 6 tabs ("Tất cả" = sum of sub-tabs).
- Detail: 5 tabs, empty states per child table, approval/condition Pill Badges, map preview disabled when no coordinates.
- Form: create/edit modes only; input `.trim()`, `spaceFormField`/`radiusPill`/`height:40` conventions retained from prior CHK conversion.

## Visual evidence
**Unverified.** No browser/rendering harness in this grant; typecheck + build prove compile/bundle only, not layout/focus/contrast. Visual acceptance deferred to QA wave.

## Risks & open items
1. **tsc gate unmeetable on baseline** — `tsconfig.app.json` reports hundreds of pre-existing type errors across the repo. Owner: pmo-software-project-manager (typed project gate) — needs a scoped tsconfig or documented-residual policy.
2. **eslint baseline debt** — 116 pre-existing errors in `NavigationChannelList.tsx`/`NavigationChannelForm.tsx` untouched code. Owner: engineering-code-reviewer / orchestrator; out of this task's "do not delete working code" boundary.
3. **Standalone `/navigation-channel/:id` detail route retained** — App.tsx (read-only) still routes the form standalone; its inline detail branch was kept to avoid regressing it. Owner: orchestrator if the legacy route should be removed.
