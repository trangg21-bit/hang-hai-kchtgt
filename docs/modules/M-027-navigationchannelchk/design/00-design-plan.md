---
module: M-027
document: design-plan
last-updated: 2026-08-28
depends-on: docs/modules/M-027-navigationchannelchk/ba/00-lean-spec.md
---

# M-027 — Luồng hàng hải CHK (navigationchannelchk) — Solution Design Plan

## 1. Tóm tắt & mục tiêu (delta)

Module **frontend-only** nhân bản trung thực module Luồng hàng hải (`navigationchannel`) trên CHK theme. Không có thay đổi backend/DB/permission. Toàn bộ logic nghiệp vụ (danh sách + lọc, tạo/sửa/xóa mềm, phê duyệt C1/C2, chi tiết, lịch sử, đính kèm, GIS) được **kế thừa nguyên vẹn** qua việc tái sử dụng service `navigationChannelCRUD`/`navigationChannelApproval` và type `navigationChannel.ts` — không viết lại, không đổi identifier.

Delta so với base:
1. 2 file page mới dưới `frontend/src/pages/navigationchannelchk/` (copy-trung-thành + đổi tên theo RENAME MAP mục 4).
2. `App.tsx`: +2 lazy import, +6 route (2 tiền tố × 3 route list/create/:id), permission `navigationchannel:read`/`navigationchannel:create`.
3. `AppLayout.tsx`: +5 mục mirror nhãn "Luồng hàng hải CHK".
4. Label breadcrumb/title: "Luồng hàng hải" → "Luồng hàng hải CHK".

## 2. Hiện trạng seam (verified anchors — đã mở trong phiên này)

| Hạng mục | Anchor | Nội dung đã xác minh |
|---|---|---|
| List base | `frontend/src/pages/navigationchannel/NavigationChannelList.tsx:40-41,518,572` | Đã import `* as themeTokenChk` + `ThemeTokenProvider`, bọc toàn bộ JSX — đang chạy trên CHK theme sẵn |
| List base | `:43` | `import NavigationChannelForm from './NavigationChannelForm';` (chỉ import default, không named export) |
| List base | `:79` | `export default function NavigationChannelList()` |
| List base | `:521` | Breadcrumb `[{ label: 'KCHT hàng hải' }, { label: 'Luồng hàng hải' }]` |
| List base | `:560` | `<NavigationChannelForm ... />` (mode modal, truyền `open`) |
| Form base | `NavigationChannelForm.tsx:74,95-97,1105` | Đã import `ThemeTokenProvider, THEME_SCOPE_CLASS`; Modal `rootClassName={THEME_SCOPE_CLASS}` |
| Form base | `:76,:93,:96,:101` | `NavigationChannelFormProps` / `NavigationChannelForm` / `<NavigationChannelFormInner />` / `NavigationChannelFormInner` |
| Form base | `:528,:542,:590,:623,:1089` | `navigate('/navigation-channel')` (sau lưu/submit — F10 routed mode) |
| Form base | `:603-604` | Breadcrumb `'Trang chủ'` + `{ title: 'Luồng hàng hải', onClick: () => navigate('/navigation-channel') }` |
| Form base | `:1108` | Title `'Tạo mới Luồng hàng hải' / 'Chỉnh sửa Luồng hàng hải' / 'Chi tiết Luồng hàng hải'` |
| Service (không đổi) | `navigationChannelService.ts:12-44,:46-73` | `navigationChannelCRUD` + `navigationChannelApproval`, endpoint `/v1/navigation-channel/*` |
| App.tsx | `:72-73` | 2 lazy import base: `./pages/navigationchannel/NavigationChannelList|Form` |
| App.tsx | `:82` | Precedent CHK clone: `VtsSystemChkList = lazy(() => import('./pages/vtssystemchk/VtsSystemChkList'))` |
| App.tsx | `:234-241` | 6 route base: `/navigation-channel` + `/luong-hang-hai`, mỗi tiền tố list/create/:id, guard `navigationchannel:read`/`create` |
| App.tsx | `:263` | Precedent CHK route: `/vts-system-chk` guard `vts:read` → `VtsSystemChkList` |
| AppLayout.tsx | `:77` | Permission map `'/navigation-channel': 'navigationchannel:read'` (CHK precedent `:82` `/vts-system-chk`) |
| AppLayout.tsx | `:144` | Label map `'/navigation-channel': 'Luồng hàng hải'` (CHK precedent `:149`) |
| AppLayout.tsx | `:271` | `pathSegments[0]` array chứa `'navigation-channel'`…`'vts-system-chk'` → selectedKey |
| AppLayout.tsx | `:298` | openKeys array chứa `'/navigation-channel'`…`'/vts-system-chk'` → `setOpenKeys(['khu-nuoc-vts'])` |
| AppLayout.tsx | `:420,:425` | Menu item `{ key: '/navigation-channel', label: 'Luồng hàng hải' }` + CHK precedent `{ key: '/vts-system-chk', label: 'Hệ thống VTS CHK' }` |
| Chuẩn CHK | `docs/conventions/chk-theme-standard-architecture.md` mục 2-4 | Bắt buộc import `themetokenchk` + `ThemeTokenProvider`; cấm import chéo `tokens.ts`/`theme.ts`; màn tham chiếu `vtssystemchk` |

## 3. Quyết định thiết kế (decisions + rationale)

| # | Quyết định | Lý do | Phương án bị loại |
|---|---|---|---|
| D1 | Clone = **copy-trung-thành + đổi tên**, không tái cấu trúc | Base đã nằm trên CHK theme (`List:40-41,518,572`; `Form:74,95-97,1105`) nên không cần đổi theme layer; copy giữ nguyên hành vi 100%, đáp ứng AC-1 "chức năng base trên CHK theme". | Không: viết lại component theo chuẩn mới — vi phạm "functionally-identical-to-base", tạo drift hành vi. |
| D2 | File mới đặt `frontend/src/pages/navigationchannelchk/` (`NavigationChannelChkList.tsx` + `NavigationChannelChkForm.tsx`) | Đúng pattern `vtssystemchk/` (thư mục riêng theo module clone, depth tương đương → import `../../themetokenchk` giữ nguyên hợp lệ). | Không: đặt cùng thư mục base — trộn 2 module, phá ranh giới READ-ONLY của `pages/navigationchannel/`. |
| D3 | Không đổi service/type/field/endpoint/permission | RENAME MAP cấm; backend dùng chung; `navigationchannel:*` đã tồn tại. | Không: tạo `navigationChannelChkService` — thêm surface trùng lặp, không có nhu cầu. |
| D4 | Route mới dùng đúng guard base: list/:id → `navigationchannel:read`, create → `navigationchannel:create` | Giống base `App.tsx:234-241` và precedent CHK `:263`; không cần đăng ký permission mới (không đụng `PermissionSeeder`). | Không: guard thấp hơn — lộ dữ liệu; guard mới — vi phạm "không permission mới". |
| D5 | Chỉ thêm **primary path** `/navigation-channel-chk` vào AppLayout (không thêm alias `/luong-hang-hai-chk`) | Đúng precedent: base chỉ có `/navigation-channel` trong map/label/menu (`:77,:144,:420`), alias `/luong-hang-hai` chỉ là route E2E; CHK precedent `/vts-system-chk` cũng chỉ 1 entry. Hành vi alias (không highlight menu khi vào thẳng alias) giữ nguyên như base — faithful clone, không phải defect. | Không: thêm cả alias — menu/label trùng nội dung, khác precedent. |
| D6 | Chèn 6 route **ngay sau block base** (`App.tsx:241`) và 2 lazy import **ngay sau cặp base** (`:73-74`) | Giữ cụm Luồng hàng hải liền mạch, dễ review diff. | Không: chèn cạnh `/vts-system-chk` (`:263`) — tách cụm, diff khó đọc. |
| D7 | Menu item riêng "Luồng hàng hải CHK" (key `/navigation-channel-chk`) | AC-3 bắt buộc 5 mục mirror nhãn "Luồng hàng hải CHK"; theo precedent `:425`. | Không: gộp vào item base — không có AC tương ứng, mất khả năng điều hướng riêng. |

## 4. Bản đồ đổi tên (RENAME MAP — nguyên văn từ lean-spec)

**Components:**
- `NavigationChannelList` → `NavigationChannelChkList`
- `NavigationChannelForm` → `NavigationChannelChkForm`
- `NavigationChannelFormProps` → `NavigationChannelChkFormProps`
- `NavigationChannelFormInner` → `NavigationChannelChkFormInner`

**Routes (frontend):**
- `/navigation-channel` → `/navigation-channel-chk`
- `/luong-hang-hai` → `/luong-hang-hai-chk`

**Labels (chỉ breadcrumb/title):**
- "Luồng hàng hải" → "Luồng hàng hải CHK"

**KHÔNG đổi (cấm đổi tên):** service identifiers (`navigationChannelCRUD`, `navigationChannelApproval`), type/field identifiers (`NavigationChannelResponse`, `CreateNavigationChannelRequest`, `channelName`, `approvalStatus`, …), endpoint paths (`/v1/navigation-channel/*`), permissions (`navigationchannel:*`), import path của service/type/component/shared dùng chung (ngoài import của 2 file base đang được copy), và **mọi label trong nội dung form field/button** (chỉ đổi breadcrumb/title theo map trên).

## 5. Work Orders (mỗi order độc lập, có thể verify độc lập)

### WO-1 — 2 file page mới: `NavigationChannelChkList.tsx` + `NavigationChannelChkForm.tsx`

**Đường dẫn đích:** `frontend/src/pages/navigationchannelchk/NavigationChannelChkList.tsx`, `frontend/src/pages/navigationchannelchk/NavigationChannelChkForm.tsx`

**Thao tác:** Copy nguyên vẹn nội dung từng file base sang file đích, rồi áp **chỉ** các thay đổi sau (không thêm/bớt gì khác):

*File `NavigationChannelChkList.tsx` (từ `NavigationChannelList.tsx`):*

| Anchor base | Thay đổi |
|---|---|
| `:43` `import NavigationChannelForm from './NavigationChannelForm';` | → `import NavigationChannelChkForm from './NavigationChannelChkForm';` |
| `:79` `export default function NavigationChannelList()` | → `export default function NavigationChannelChkList()` |
| `:521` breadcrumb `{ label: 'Luồng hàng hải' }` | → `{ label: 'Luồng hàng hải CHK' }` |
| `:560` `<NavigationChannelForm ... />` | → `<NavigationChannelChkForm ... />` (props giữ nguyên) |

*File `NavigationChannelChkForm.tsx` (từ `NavigationChannelForm.tsx`):*

| Anchor base | Thay đổi |
|---|---|
| `:76` `export interface NavigationChannelFormProps {` | → `export interface NavigationChannelChkFormProps {` |
| `:93` `export default function NavigationChannelForm({...}: NavigationChannelFormProps = {})` | → `export default function NavigationChannelChkForm({...}: NavigationChannelChkFormProps = {})` |
| `:96` `<NavigationChannelFormInner ... />` | → `<NavigationChannelChkFormInner ... />` |
| `:101` `function NavigationChannelFormInner({...}: NavigationChannelFormProps = {})` | → `function NavigationChannelChkFormInner({...}: NavigationChannelChkFormProps = {})` |
| `:528,:542,:590,:623,:1089` `navigate('/navigation-channel')` | → `navigate('/navigation-channel-chk')` |
| `:604` `{ title: 'Luồng hàng hải', onClick: () => navigate('/navigation-channel') }` | → `{ title: 'Luồng hàng hải CHK', onClick: () => navigate('/navigation-channel-chk') }` |
| `:1108` `'Tạo mới Luồng hàng hải' / 'Chỉnh sửa Luồng hàng hải' / 'Chi tiết Luồng hàng hải'` | → `'Tạo mới Luồng hàng hải CHK' / 'Chỉnh sửa Luồng hàng hải CHK' / 'Chi tiết Luồng hàng hải CHK'` |

**Giữ nguyên (cấm sửa):** mọi import service (`../../services/navigationChannelService`), type (`../../types/navigationChannel`), shared component (`ApprovalStatusBadge`, `ApprovalActionBar`, `HistoryTimeline`, `AttachmentList`, `GisLocationSelector`, `ApprovalModal`…), utility (`approvalEditPolicy`), org-unit/list-view, theme layer (`../../themetokenchk`, `../../context/ThemeTokenContext`, `THEME_SCOPE_CLASS`), toàn bộ logic/handler/columns/tabs. Chỉ thay đúng 4 (List) + 11 (Form) điểm trong bảng trên.

**Self-check:** `grep -c "NavigationChannelChk" NavigationChannelChkList.tsx` ≥ 3 (import, function, JSX); `grep -c "navigationChannel" NavigationChannelChkForm.tsx` chỉ còn các occurrence của `navigationChannelCRUD`/`navigationChannelApproval`/`navigationChannel.ts` import — không còn `navigate('/navigation-channel')` hay `NavigationChannelForm` (không hậu tố Chk). Không tồn tại chuỗi `Luồng hàng hải'` không kèm `CHK` trong 2 file mới.

### WO-2 — `App.tsx`: +2 lazy import, +6 route

**Đường dẫn:** `frontend/src/App.tsx`

1. **2 lazy import** — chèn ngay sau cặp base `:73-74` (trong khối M-003):
```tsx
const NavigationChannelChkList = lazy(() => import('./pages/navigationchannelchk/NavigationChannelChkList'));
const NavigationChannelChkForm = lazy(() => import('./pages/navigationchannelchk/NavigationChannelChkForm'));
```
2. **6 route** — chèn ngay sau route base `/luong-hang-hai/:id` (`:241`), trước comment `{/* Đê/kè */}` (`:242`), trong block protected `<Route element={<AppLayout />}>`:
```tsx
{/* Luồng hàng hải CHK (M-027) */}
<Route path="/navigation-channel-chk" element={<PermissionGuard permission="navigationchannel:read"><NavigationChannelChkList /></PermissionGuard>} />
<Route path="/navigation-channel-chk/create" element={<PermissionGuard permission="navigationchannel:create"><NavigationChannelChkForm /></PermissionGuard>} />
<Route path="/navigation-channel-chk/:id" element={<PermissionGuard permission="navigationchannel:read"><NavigationChannelChkForm /></PermissionGuard>} />
{/* Alias tiếng Việt — E2E */}
<Route path="/luong-hang-hai-chk" element={<PermissionGuard permission="navigationchannel:read"><NavigationChannelChkList /></PermissionGuard>} />
<Route path="/luong-hang-hai-chk/create" element={<PermissionGuard permission="navigationchannel:create"><NavigationChannelChkForm /></PermissionGuard>} />
<Route path="/luong-hang-hai-chk/:id" element={<PermissionGuard permission="navigationchannel:read"><NavigationChannelChkForm /></PermissionGuard>} />
```
**Self-check:** grep `App.tsx` có đúng 2 `lazy(() => import('./pages/navigationchannelchk/...'))` và đúng 6 `<Route path="/navigation-channel-chk|/luong-hang-hai-chk"`. Không sửa dòng base nào.

### WO-3 — `AppLayout.tsx`: đúng 5 mục mirror

**Đường dẫn:** `frontend/src/components/AppLayout.tsx` — 5 vị trí, thêm entry mới ngay sát entry base tương ứng (không sửa dòng base):

| # | Vị trí | Thêm |
|---|---|---|
| 1 | Permission map, sau `:77` | `  '/navigation-channel-chk': 'navigationchannel:read',` |
| 2 | Label map (pageTitles), sau `:144` | `  '/navigation-channel-chk': 'Luồng hàng hải CHK',` |
| 3 | pathSegments array `:271` | thêm `'navigation-channel-chk'` vào mảng (cạnh `'navigation-channel'`) |
| 4 | openKeys array `:298` | thêm `'/navigation-channel-chk'` vào mảng (cạnh `'/navigation-channel'`) |
| 5 | Menu item `khu-nuoc-vts`, sau `:420` | `canAccessMenu('/navigation-channel-chk') ? { key: '/navigation-channel-chk', label: 'Luồng hàng hải CHK' } : null,` |

**Self-check:** grep `AppLayout.tsx` có đúng 5 occurrence `'/navigation-channel-chk'` (không tính alias) và 1 chuỗi label `'Luồng hàng hải CHK'`. Không thêm alias `/luong-hang-hai-chk` vào 5 vị trí này (theo D5).

### WO-4 — Verification

1. **Build:** từ `frontend/` chạy `npm run build` → **exit 0**. (Typecheck bổ sung nếu có: `pnpm exec tsc --noEmit` trong `frontend/`.)
2. **Scope git-diff:** từ repo root chạy `git status --porcelain` và `git diff --stat` → chỉ có: 2 file mới dưới `frontend/src/pages/navigationchannelchk/` + 2 file sửa `frontend/src/App.tsx`, `frontend/src/components/AppLayout.tsx`. **ZERO** thay đổi dưới `frontend/src/pages/navigationchannel/`, `frontend/src/tokens.ts`, `frontend/src/themetokenchk.ts`, `frontend/src/theme.ts`, `src/main/**` (Java), `src/main/resources/db/**` (migration), `PermissionSeeder.java`.
3. **Oracle AC-1 (runtime, QA):** mở `/navigation-channel-chk` và `/luong-hang-hai-chk` → list render trên CHK theme; tạo/sửa/chi tiết/duyệt C1/C2/đính kèm/GIS hoạt động như base; sau lưu từ form navigate về `/navigation-channel-chk`.

## 6. Mapping acceptance criteria → design element + oracle

| AC | Design element | Oracle |
|---|---|---|
| AC-1 | WO-1 | 2 file mới tồn tại, chức năng base đầy đủ trên CHK theme (runtime, so hành vi với base) |
| AC-2 | WO-2 | grep App.tsx: 2 lazy import + 6 route, guard `navigationchannel:read`/`create` |
| AC-3 | WO-3 | grep AppLayout.tsx: 5 mục mirror + nhãn "Luồng hàng hải CHK" |
| AC-4 | WO-4.1 | `npm run build` trong `frontend/` exit 0 |
| AC-5 | WO-4.2 | `git status`/`git diff --stat`: chỉ 4 file trong phạm vi, zero ngoài ranh giới |

## 7. Ranh giới (boundaries — bắt buộc, không vi phạm)

- **READ-ONLY:** `frontend/src/pages/navigationchannel/**` (base), `frontend/src/tokens.ts`, `frontend/src/themetokenchk.ts`, `frontend/src/theme.ts`, mọi file Java (`src/main/**`), mọi migration (`src/main/resources/db/**`), `PermissionSeeder.java`.
- **Cấm:** thêm service/type/endpoint/permission mới; đổi enum/field/schema; hardcode màu/spacing/font (dùng token `themetokenchk` — base đã chuẩn, copy giữ nguyên); đổi label ngoài breadcrumb/title; đụng `git add/commit/push` (giữ local unstaged).
- Chỉ được ghi: 2 file mới + 2 file sửa nêu trong WO-2/WO-3.

## 8. Rủi ro & lưu ý

- **Alias không highlight menu** khi vào thẳng `/luong-hang-hai-chk`: hành vi giống hệt base alias `/luong-hang-hai` (không nằm trong array `:271`/`:298`); không sửa — faithful clone (D5).
- **Không có blocker.** Không có schema/approval/history/data-scope thay đổi — mọi cơ chế (DataScopeAspect, 4-eyes, soft-delete) nằm backend dùng chung.
- Mọi thay đổi ngoài phạm vi trên phải báo PMO trước khi thực hiện (theo lean-spec Risks & Unknowns).
