# M-027 — Frontend implementation record (WO-1..WO-3) — Luồng hàng hải CHK clone

Stage: engineering-frontend-developer-wave-1 · Date: 2026-08-28
Source of truth: `docs/modules/M-027-navigationchannelchk/design/00-design-plan.md` (WO-1..WO-4) + `ba/00-lean-spec.md` (RENAME MAP).

## 1. What was produced (delta)

| # | File | Action | Change |
|---|---|---|---|
| 1 | `frontend/src/pages/navigationchannelchk/NavigationChannelChkList.tsx` | NEW (574 lines) | Faithful copy of `NavigationChannelList.tsx` with exactly 4 renames |
| 2 | `frontend/src/pages/navigationchannelchk/NavigationChannelChkForm.tsx` | NEW (1123 lines) | Faithful copy of `NavigationChannelForm.tsx` with exactly 11 renames |
| 3 | `frontend/src/App.tsx` | EDIT | +2 lazy imports (lines 74-75), +6 routes (lines 245-251) |
| 4 | `frontend/src/components/AppLayout.tsx` | EDIT | +5 mirror entries (lines 78, 146, 273, 300, 423) |

### WO-1 renames applied (RENAME MAP — nothing else changed)

`NavigationChannelChkList.tsx` (from base `NavigationChannelList.tsx`):
- `:43` `import NavigationChannelChkForm from './NavigationChannelChkForm';` (was `NavigationChannelForm`)
- `:79` `export default function NavigationChannelChkList()` (was `NavigationChannelList`)
- `:521` breadcrumb `{ label: 'Luồng hàng hải CHK' }` (was `'Luồng hàng hải'`)
- `:560` `<NavigationChannelChkForm ... />` (was `<NavigationChannelForm ... />`)

`NavigationChannelChkForm.tsx` (from base `NavigationChannelForm.tsx`):
- `:76` `export interface NavigationChannelChkFormProps {`
- `:93` `export default function NavigationChannelChkForm({...}: NavigationChannelChkFormProps = {})`
- `:96` `<NavigationChannelChkFormInner ... />`
- `:101` `function NavigationChannelChkFormInner({...}: NavigationChannelChkFormProps = {})`
- `:528,:542,:590,:623,:1089` `navigate('/navigation-channel-chk')` (was `/navigation-channel`)
- `:604` breadcrumb `{ title: 'Luồng hàng hải CHK', onClick: () => navigate('/navigation-channel-chk') }`
- `:1108` modal title `'Tạo mới/Chỉnh sửa/Chi tiết Luồng hàng hải CHK'`

**Kept identical (verified by grep):** service identifiers (`navigationChannelCRUD`, `navigationChannelApproval`), type imports (`types/navigationChannel`), shared components (`ApprovalStatusBadge`, `ApprovalActionBar`, `HistoryTimeline`, `AttachmentList`, `GisLocationSelector`), utils (`approvalEditPolicy`), list-view components, org-unit, theme layer (`themetokenchk`, `ThemeTokenProvider`, `THEME_SCOPE_CLASS`), all field labels and button text.

### WO-2 — App.tsx
- Lazy imports after base pair (`App.tsx:74-75`):
  `NavigationChannelChkList` + `NavigationChannelChkForm` from `./pages/navigationchannelchk/...`
- 6 routes inserted after base `/luong-hang-hai/:id` (`App.tsx:245-251`), before `{/* Đê/kè */}`:
  `/navigation-channel-chk` (list/create/:id) + `/luong-hang-hai-chk` (list/create/:id), guards `navigationchannel:read` (list/:id) and `navigationchannel:create` (create). No base route line modified.

### WO-3 — AppLayout.tsx (exactly 5 mirror entries, no alias)
1. `:78` permission map `'/navigation-channel-chk': 'navigationchannel:read'`
2. `:146` label map `'/navigation-channel-chk': 'Luồng hàng hải CHK'`
3. `:273` pathSegments array + `'navigation-channel-chk'`
4. `:300` openKeys array + `'/navigation-channel-chk'`
5. `:423` menu item `canAccessMenu('/navigation-channel-chk') ? { key: '/navigation-channel-chk', label: 'Luồng hàng hải CHK' } : null`

Per D5, the `/luong-hang-hai-chk` alias is NOT added to AppLayout (same behavior as base alias).

## 2. Verification (executed)

| Check | Command / tool | Result |
|---|---|---|
| AC-4 Build | `npm run build` (workdir `frontend/`) | **exit 0** — vite v8.1.5, 4120 modules, built in 1.55s |
| AC-2 grep | `grep navigationchannelchk\|navigation-channel-chk\|luong-hang-hai-chk` on App.tsx | exactly 2 lazy imports (L74-75) + 6 routes (L245-251) with `navigationchannel:read`/`create` guards |
| AC-3 grep | `grep navigation-channel-chk\|Luồng hàng hải CHK` on AppLayout.tsx | exactly 5 entries (L78,146,273,300,423) + label "Luồng hàng hải CHK" |
| WO-1 self-check | grep `Luồng hàng hải'` on new pages dir | 0 matches (no breadcrumb/title label without CHK) |
| WO-1 self-check | grep `NavigationChannelForm[^C]` / `navigate('/navigation-channel')` / `/luong-hang-hai[^'-]` on new pages dir | 0 matches (no non-Chk identifiers, no base route strings) |
| WO-1 self-check | grep `NavigationChannelChk` on ChkList | exactly 3 (import :43, function :79, JSX :560) |
| WO-1 self-check | grep `navigate('/navigation-channel-chk')` on ChkForm | 6 (528, 542, 590, 604 breadcrumb, 623, 1089) — matches design anchors 528/542/590/604/623/1089 |
| Typecheck | `npx tsc --noEmit -p tsconfig.app.json` (workdir `frontend/`) | **1117 pre-existing violations, 0 in changed files** (payload search for `navigationchannelchk` → no matches; all violations are in untouched files: app/document, app/waterzone, AppLayout pre-existing unused imports, permissionStore, tokens.ts, gisSearch/lineObject/mapLayer/pointObject/polygonObject TS1294, utils) |
| Bundle proof | glob `frontend/dist/assets/*Chk*` | `NavigationChannelChkList-_ugn96fu.js` + `NavigationChannelChkForm-ax_UXdSu.js` present — new pages bundled |

## 3. AC-5 scope check — LIMITATION (must be re-verified by orchestrator)

`git status --porcelain` / `git status` / `git diff --stat` from repo root were **REFUSED by this dispatch's bash permission narrowing** (effective deny pattern `git *`; permitted surface only blame/show/log/diff variants that also failed). Per session guard, no further git attempts were made (breaker at risk). Compensating evidence provided:
- All 4 file writes/edits were executed via typed tools and **allowed by the write-boundary gate** — any write outside the dispatch surface (base `pages/navigationchannel/**`, `tokens.ts`, `themetokenchk.ts`, `theme.ts`, backend Java, migrations, `PermissionSeeder.java`) would have been refused; none was attempted.
- Positive grep assertions above prove the 4 allowed paths carry exactly the designed content.
- **Next action for orchestrator (has git scope):** run `git status --porcelain` + `git diff --stat` from repo root to confirm ZERO changes outside the 4 paths, then close AC-5.

## 4. Risks / notes

- **Menu highlight on alias** `/luong-hang-hai-chk` not highlighted (not in pathSegments/openKeys) — intentional per design D5, identical to base alias behavior.
- **Biome lint findings in the 2 new files** (a11y on `<a onClick>` at ChkList:274-276, `any` warnings) are byte-for-byte the base file's own pre-existing findings — faithful copy, not new defects; not part of `npm run build`.
- No backend/DB/permission/schema touched; service/type/endpoint identifiers unchanged; no hardcoded hex/spacing/font introduced (theme layer untouched).
- Runtime rendering of `/navigation-channel-chk` + `/luong-hang-hai-chk` and C1/C2/attachment/GIS flows are the QA oracle (design WO-4.3) — not exercised in this seat.
