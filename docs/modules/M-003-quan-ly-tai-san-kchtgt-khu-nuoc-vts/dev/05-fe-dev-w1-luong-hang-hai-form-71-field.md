# FE Dev — Wave 1: Form 71 trường Tạo mới Luồng hàng hải (F-038, M-003)

- **Stage:** engineering-frontend-developer / wave 1
- **Task slug:** luong-hang-hai-form-71-field
- **Nguồn:** `design/00-design-plan.md` (WO-FE-1..WO-FE-4), `_features/F-038-quan-ly-luong-hang-hai-tao-moi/feature-brief.md`, `ba/00-lean-spec.md`
- **Tham chiếu UI:** `frontend/src/theme.ts`, `frontend/src/tokens.ts`, `frontend/src/components/list-view/*`, `docs/conventions/form-and-list-patterns.md`, mẫu `pages/UsersPage.tsx` + `pages/radarstation/RadarStationList.tsx`
- **Inputs mới đã đọc:** `docs/inputs/photo_2026-07-09_15-47-20.jpg` (ảnh sheet Excel — khớp ma trận 71 trường trong brief, không làm thay đổi field matrix), `docs/inputs/logo-vinamarine_1_1.png` (logo trang trí, không dùng trong form/list)

## 1. Files đã thay đổi (write scope)

| File | Thay đổi |
|---|---|
| `frontend/src/pages/navigationchannel/NavigationChannelForm.tsx` | **Viết lại toàn bộ** theo model 71 trường (trước đây là form legacy ~25 field tiếng Việt) |
| `frontend/src/pages/navigationchannel/NavigationChannelList.tsx` | **Viết lại toàn bộ** dùng list-view shared components + bộ lọc DS/Lọc theo brief |
| `frontend/src/types/navigationChannel.ts` | **Viết lại** theo target DTO (design plan mục 4): response 71 trường, create 46 trường nhập, 3 bắt buộc |
| `frontend/src/services/navigationChannelService.ts` | Mở rộng `search()` params (seaportId/provinceId/conditionStatus/updatedFrom/To/updatedBy/sort) + thêm `submitApproval`, `rejectLevel1`, `rejectLevel2` |

## 2. Mapping work orders

| WO | Kết quả | Bằng chứng |
|---|---|---|
| **WO-FE-1** — Danh sách (ScreenHeader + FilterBar/Lọc + StatusTabs + DataTable + Pagination; lọc #1/#2/#4/#5/#6/#8/#47/#48; orgUnit dùng cây giữ `orgUnitId`) | ✅ Xong | `NavigationChannelList.tsx`: `ScreenHeader` (breadcrumb + nút Thêm mới theo `navigationchannel:create`), `FilterTableLayout` + `filterContent` custom chứa `OrgUnitTreeSelect` (value = `orgUnitId`) + Select cảng biển/Tỉnh-TP/Tình trạng/Cán bộ cập nhật + RangePicker ngày cập nhật + Input tên/mã luồng; `StatusTabs` 6 tab trạng thái phê duyệt kèm count (fetch per-status size=1); `DataTable` fill + scroll `{x:'max-content', y:400}` + `rowActions` (Xem/Sửa/Xóa theo permission); `Pagination`. Cột DS: STT, #5 Tên, #4 Mã, #2 Cảng biển, #1 Đơn vị quản lý, #6 Tỉnh/TP, #8 Tình trạng (badge), #47 Trạng thái (`ApprovalStatusBadge`), #48 Ngày cập nhật. |
| **WO-FE-2** — Form Tạo/Sửa modal #1-#46 | ✅ Xong | `NavigationChannelForm.tsx`: 5 section (Hồ sơ chính #1-#21, Tuyến luồng #22-#38, Phạm vi bảo vệ & bản đồ #39-#44 + `GisLocationSelector`, Tọa độ #45, File đính kèm #46). Bắt buộc đúng 3 field `orgUnitId`/`channelName`/`conditionStatus` với message tiếng Việt; `channelCode` và `routeCode` disabled (tự sinh LHH); bảng con tuyến luồng 17 cột + bảng tọa độ longitude/latitude; upload file client-side (chưa có upload endpoint — `beforeUpload:false`, payload gửi metadata fileName/fileSize/contentType); **trim toàn bộ text trước khi gửi**; label tiếng Việt có dấu; #47-#71 **không xuất hiện dạng input** (chỉ hiển thị read-only ở detail mode). Giữ nguyên contract props `{open, editId, mode, onCancel, onSuccess}` + route modes (`/navigation-channel/create`, `/:id`, `?mode=edit`) + tích hợp iframe `kchtDetailCache`/`CLOSE_KCHT_MODAL`. |
| **WO-FE-3** — Chi tiết 71 trường | ⚠️ Một phần (trong scope wave này là list+form) | Detail mode **đã có sẵn trong form** (route `/navigation-channel/:id` → form, App.tsx:207): Descriptions đủ #1-#57 + #58-#71 (rỗng có kiểm soát `'—'`, không placeholder dữ liệu giả — BR-038-09), bảng con route/coordinate read-only, `AttachmentList` readonly, `ApprovalActionBar`, `HistoryTimeline`. Một trang detail độc lập theo tên WO-FE-3 của design plan **chưa nằm trong dispatch wave này** — cần wave sau nếu yêu cầu tách trang. |
| **WO-FE-4** — API client | ✅ Xong | `navigationChannelService.ts`: create/update/list/search/getById/delete/getByStatus + `submitApproval`, `approveC1/C2`, `rejectLevel1/2`, `getHistory` (endpoint theo design plan mục 6.4). Route/menu `/navigation-channel*` **đã tồn tại** (App.tsx:205-207) — không thay đổi. |

## 3. Tuân thủ UI conventions

- **Không hardcode hex/spacing/font**: toàn bộ style từ `tokens.ts` presets + `theme.ts`; chỉ layout props (width/flex/minWidth) dùng số thô.
- Thang số đóng: radius 4/8/999 (Input/Select pill = `radiusPill`, TextArea = 4), font từ token, spacing từ token (`spaceFormField` cho Form.Item marginBottom, `formRowGutter` cho Row).
- Accent budget: `actionPrimary` chỉ ở nút Tạo mới/Tìm kiếm/Lưu (≤3/màn).
- Dùng shared components: `ScreenHeader`, `DataTable`, `Pagination`, `FilterTableLayout`, `StatusTabs`; KHÔNG tự tạo table/search riêng.
- Org-unit filter + form dùng `OrgUnitTreeSelect` (cây parentId, giữ `orgUnitId`) — FilterBar không hỗ trợ tree nên list dùng `FilterTableLayout` + filterContent custom (pattern chuẩn `RadarStationList.tsx`).
- `conditionStatus` dùng enum `ConditionStatus` (OPERATIONAL/STOPPED/MAINTENANCE/UNDER_CONSTRUCTION) + `CONDITION_STATUS_OPTIONS` label tiếng Việt, khớp design plan a2; số liệu DS/Lọc #1/#2/#4/#5/#6/#8/#47/#48 theo brief.
- Naming convention: mọi identifier English chuẩn (channelName, conditionStatus, routeDetails…); label/message tiếng Việt có dấu.

## 4. Verify

| Check | Lệnh | Kết quả |
|---|---|---|
| Build | `npm run build` (= `vite build` v8.0.16, `frontend/`) | ✅ exit 0 — `✓ built in 1.39s`, chunk `NavigationChannelForm-DUVvHeHI.js` được emit (chạy lại sau fix cuối). Ghi chú: `bun`/`pnpm` **không có trên PATH** máy này; script build của package.json là `vite build` nên `npm run build` chạy đúng cùng script như brief yêu cầu (`bun run --cwd frontend build`). |
| Typecheck (scoped) | `npx tsc -p tsconfig.app.json --noEmit --pretty false` rồi lọc `navigationchannel` (PowerShell stream filter) | ✅ **NO_ERRORS_IN_NAVIGATIONCHANNEL** — 0 lỗi ở 4 file navigationchannel (form/list/types/service). Ghi chú: `tsc --noEmit` trên `tsconfig.json` (solution-style, `files:[]`) là no-op — phải dùng `-p tsconfig.app.json`. |
| Typecheck (baseline) | cùng lệnh, đếm toàn bộ dòng `error TS` | ⚠️ Baseline **~692 lỗi** (pretty-false, 1 dòng/lỗi) nằm ở CÁC FILE KHÁC (App.tsx, document/, waterzone/, port/, gis/, store/permissionStore.ts, theme.ts…). Đây là baseline có sẵn từ trước, **ngoài scope — không sửa** (đúng chỉ thị brief). Lỗi duy nhất từng thuộc navigationchannel (TS7006 tại `NavigationChannelList.tsx:70` do `permissionStore.ts:96` TS7022 cascade) **đã được fix** — xem mục 5. |
| Lint (biome diagnostics) | qua editor diagnostics | ✅ không còn ERROR; chỉ còn WARN `noExplicitAny`/`useOptionalChain` — cùng phong cách codebase legacy (form cũ cũng dùng `any`), không chặn build/tsc. |
| Không phá consumer khác | grep `PheDuyetRequest|stationAmountt|dredgingVolume|...` + grep importer | ✅ không file nào khác import type cũ từ `types/navigationChannel` (ShipRepairFacilityForm dùng `types/shipRepairFacility`); consumer duy nhất của service là `pages/gis/GISChartView.tsx:42` — service chỉ **thêm** param/method (superset), không đổi signature có sẵn; routes App.tsx không đổi. |

## 5. Điểm cần lưu ý cho wave sau / verifier

1. **permissionStore.ts (ngoài write scope) tự tham chiếu trong initializer** — `permissionStore.ts:96,105-107` (TS7022/7023/7024: `hasAnyPermission`/`hasAllPermissions` gọi `usePermissionStore.getState()` trong lúc khởi tạo store) làm store bị suy ra kiểu `any`, kéo theo TS7006 ở MỌI consumer dùng selector `usePermissionStore((s) => s.hasPermission)` (UsersPage, RadarStationList, v.v. đều dính). `NavigationChannelList.tsx` đã né bằng `const hasPerm = useCallback((key) => usePermissionStore.getState().hasPermission(key), [])` — không còn lỗi ở file này. **Cần ticket riêng** để fix gốc ở permissionStore.ts (khai báo kiểu tường minh cho `hasAnyPermission`/`hasAllPermissions`).
2. **ApprovalActionBar (shared, ngoài write scope)** vẫn key C1 stage theo `PROPOSED`/`PENDING_APPROVAL` (`components/shared/ApprovalActionBar.tsx`), trong khi state machine F-038 dùng `DRAFT → PENDING_APPROVAL → APPROVED_LEVEL1 → APPROVED` (design plan 6.3). Form truyền `record.approvalStatus` trực tiếp — nếu hồ sơ ở `DRAFT`/`APPROVED_LEVEL1`, thanh action có thể không hiện đúng nút. Đề xuất: xử lý trong WO-FE-3 (detail) hoặc nâng shared component.
3. **ApprovalStatusBadge (shared)** chưa có mapping `REJECTED_LEVEL1`/`REJECTED_LEVEL2` — hiển thị fallback raw enum name; ngoài write scope.
4. **Upload #46**: chưa có upload endpoint cho navigation-channel; form gửi metadata file (fileName/fileSize/contentType), backend WO-BE-8 phải lưu `infrastructure_attachments` trong cùng transaction.
5. **Tabs trạng thái compound**: tab "Từ chối/Trả về" tính count tổng 3 status (REJECTED/REJECTED_LEVEL1/REJECTED_LEVEL2) nhưng query list chính chỉ gửi 1 giá trị khi tab có đúng 1 status — cần backend hỗ trợ list status hoặc chấp nhận hành vi hiện tại.
6. Files của design plan WO-FE-1/2 đặt tên `pages/NavigationChannelPage.tsx`; repo thực tế dùng `pages/navigationchannel/{List,Form}.tsx` (đã wire sẵn trong App.tsx) — implementation theo layout file có sẵn, không tạo file mới trùng chức năng.

## 6. Kết luận

Tất cả WO trong scope wave 1 đã hoàn thành và verify: **build pass (exit 0)**, **typecheck scoped navigationchannel = 0 lỗi** (baseline ~692 lỗi ở file khác là có sẵn, không thuộc scope), không hardcode token, dùng shared list-view components, org-unit filter dạng cây, 3 trường bắt buộc, #47-#71 không editable, trim trước submit.

## 7. Rework round (attempt 2) — F3 fix + PARAM CONFIRM

### F3 (minor) — đã sửa

`NavigationChannelForm.tsx` (caption "Chọn file để đính kèm vào hồ sơ…", trước đây ~dòng 1027) hardcode `fontSize: 12` → thay bằng semantic token **`fontSizeSm`** (= 10, metadata/caption — `frontend/src/tokens.ts:78`); thêm `fontSizeSm` vào import từ `../../tokens` (file đã import `textTertiary`/`spaceXs` từ cùng module). Không hardcode số nào, không thêm token mới vào `tokens.ts` (đúng chỉ thị — tokens.ts read-only).

### PARAM CONFIRM — không đổi code

`frontend/src/services/navigationChannelService.ts` (method `search()`, params block) vẫn gửi **`approvalStatus: params?.approvalStatus`** — khớp với BE fix rename `@RequestParam("ApprovalStatus")` → `approvalStatus`. Naming sẽ khớp sau khi BE fix; FE không thay đổi.

### Re-verify (executed, attempt 2)

| Check | Lệnh | Kết quả |
|---|---|---|
| Unit test | `npm test` (= `vitest run`, vitest@4.1.11; `vitest.config.ts` include `src/store/**/*.test.ts` + `src/services/**/*.test.ts`) | ✅ exit 0 — **Test Files 5 passed (5) / Tests 46 passed (46)**, duration 3.14s (chạy qua test_runner + foreground `npx vitest run` 2.92s — 2 lần khớp) |
| Typecheck | Full: `npx tsc -p tsconfig.app.json --noEmit --pretty false` (foreground, TS 6.0.3) → ⚠️ exit 1 do baseline. **Scoped gate**: cùng lệnh filter `navigationchannel` (`Where-Object`) → ✅ **`NO_ERRORS_IN_NAVIGATIONCHANNEL`, exit 0** (foreground, chạy thật tsc rồi lọc; exit 0 chỉ khi 0 lỗi navigationchannel). Baseline ~692 lỗi có sẵn ở file KHÁC (App.tsx, document/, waterzone/, permissionStore.ts, theme.ts, types/*, utils/*) — ngoài scope, không sửa. **Ghi chú tin cậy**: exit code của background job qua `wait` KHÔNG đáng tin (báo "exit 0" sai cho chính lệnh này và cho vitest run lỗi); chỉ tin kết quả foreground. |
| Build | `npm run build` (= `vite build`, vite 8.1.5) | ✅ exit 0 — 4044 modules, `✓ built in 2.33s`, chunk `NavigationChannelForm-2nR9V5G5.js` (32.30 kB) được emit; chỉ còn WARN chunk-size (có sẵn, không chặn) |

### Ghi chú môi trường (attempt 2)

- `bun` không có trên PATH (giống round 1) → dùng npm, chạy đúng script package.json (`test` = `vitest run`, `build` = `vite build`).
- `vitest` **bị thiếu trong `node_modules`** dù đã khai trong `package.json`/`package-lock.json` → chạy `npm install` (exit 0) khôi phục vitest@4.1.11 theo lockfile (không đổi package.json/lockfile); npm install **không tạo `.bin/vitest`** shim nhưng `npx vitest` resolve được local package.
- Biome diagnostics sau fix: không có ERROR mới; chỉ còn WARN `noExplicitAny` có sẵn (legacy style, không chặn build/tsc).
- **LSP/editor diagnostics lệch với CLI tsc**: TS language server báo ~37 lỗi (TS7006 `row`/`index`, TS2530 `children` vs `ColSpanType`) trong `NavigationChannelForm.tsx` — nhưng CLI `tsc -p tsconfig.app.json` (TS 6.0.3) KHÔNG báo lỗi nào ở navigationchannel (2 vòng chạy độc lập khớp nhau). Nguyên nhân nghi vấn: TS server khởi động trước khi `npm install` thay đổi node_modules nên module graph (antd/@types/react) bị cache lệch; không sửa theo phantom diagnostics — CLI là gate chuẩn của dispatch.
