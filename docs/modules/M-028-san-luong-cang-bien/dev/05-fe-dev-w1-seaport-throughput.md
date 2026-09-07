# FE Wave-1 Implementation — Sản lượng cảng biển (M-028 / F-301 seaport_throughput)

- **Seat:** engineering-frontend-developer (wave 1) — **Ngày:** 2026-09-06
- **Nguồn:** design-plan `00-design-plan.md` (work orders FE-1..5), feature-brief §2 (29 trường + cờ), lean-spec §8/§9, qa-report `07-qa-report-w1.md` (TC-UI-01..08 + message oracle §3), AGENTS.md UI convention.
- **Phạm vi ghi:** `frontend/src/**` + `docs/modules/M-028-san-luong-cang-bien/dev/**`. Không commit git; không chạy backend.

## 1. Files produced / changed

| File | Vai trò |
|---|---|
| `frontend/src/services/seaportThroughputService.ts` | **FE-1** API client + types cho `/api/v1/seaport-throughput` (baseURL `/api` của `services/api.ts`): list/create/update/softDelete/submit/approve-level1/approve-level2/reject-level{1,2}/files (list, upload multipart, delete)/history. Types: `SeaportThroughputRecord` = 24 số DECIMAL (EN camelCase khớp cột DB `domestic_/foreign_/route_` + `container_ton(_km)/dry_ton(_km)/liquid_ton(_km)/other_ton(_km)` theo design §2.1/§2.2) + `passengerTrips` + org/month/note + approval tail (`approvalStatus`, `submittedAt/By`, `level1ApprovedAt/By/Content`, `level2*`, `rejectionReason`, audit names) |
| `frontend/src/components/InputDecimal.tsx` | **FE-3** control `InputDecimal` (InputNumber AntD): min 0, precision 2 (integer → 0), `borderRadius: radiusPill`, `height: 40`, `controls:false`, chuẩn hóa null/âm → 0 |
| `frontend/src/pages/seaport-throughput/seaportThroughputMeta.ts` | Meta tập trung: 3 nhóm × 8 field + nhãn VI, `NUMBER_FIELD_NAMES`, `STATUS_META` (7 trạng thái → nhãn/color semantic), `TAB_DEFS` (6 tab), `HISTORY_FIELD_LABELS` (EN→VI cho history) |
| `frontend/src/pages/seaport-throughput/SeaportThroughputPage.tsx` | **FE-2/FE-5** List screen + StatusTabs 6 tab + cây đơn vị + filter sidebar + rowActions (Xem/Sửa/Gửi duyệt/Phê duyệt C1·C2/Từ chối kèm modal lý do/Xóa/Lịch sử) + `CommonHistoryDrawer` |
| `frontend/src/pages/seaport-throughput/SeaportThroughputDrawer.tsx` | **FE-3/FE-4** Drawer create/edit/view: OrgUnitTreeSelect (**disabled khi edit**), `report_month` DatePicker tháng yyyy-MM, 24 InputDecimal, passenger_trips, note, UploadFileTable-style file attach (`seaport_throughput_file`), mục "Thông tin phê duyệt" trong cùng Drawer |
| `frontend/src/App.tsx` | Lazy route `/seaport-throughput` + `PermissionGuard permission="seaportthroughput:read"` |
| `frontend/src/components/AppLayout.tsx` | `MENU_PERMISSION_MAP['/seaport-throughput'] = 'seaportthroughput:read'` + menu leaf "Sản lượng cảng biển" (nhóm vận hành, cạnh `ship-port-call`) |

## 2. Mapping FE work orders → done

| WO | Nội dung | Trạng thái |
|---|---|---|
| FE-1 | API + types (orgUnitName, approval metadata, 24 + passenger) | ✅ service file; tên field theo design §2.1 (không bịa `createdAt`) |
| FE-2 | List: ScreenHeader + FilterTableLayout(`hideFilterToggle`) + StatusTabs 6 tab (Tất cả = tổng 5 tab con; Từ chối gộp 2 cấp — count qua 2 query + merge) + DataTable (cột Đơn vị/Tháng/Cán bộ cập nhật/Ngày cập nhật/Trạng thái, Pill Badge, action cột cuối tự sinh, scroll x) + Pagination; 4 trạng thái loading/error(+Thử lại)/empty(DataTable EmptyState)/data | ✅ |
| FE-3 | Drawer create/edit: org disabled khi edit, tháng MM/YYYY, 3 nhóm × 8 InputDecimal + passenger + note; token/preset `themetokenchk`; `spaceFormField`, `radiusPill`, height 40; trim note; client rules message oracle §3 | ✅ |
| FE-4 | View + phê duyệt + file: mục "Thông tin phê duyệt" (trong Tab Thông tin chung — không tab riêng); rowActions theo status; modal từ chối bắt buộc lý do (`Vui lòng nhập lý do từ chối`); UploadFileTable add/delete trên endpoint file riêng module | ✅ (module-scoped file attach — shared `components/UploadFileTable.tsx` gắn cứng `/cctv` nên không dùng được; viết tương đương trong scope module) |
| FE-5 | Lịch sử từ rowActions (`/{id}/history` qua `CommonHistoryDrawer` serverFiltered + `HISTORY_FIELD_LABELS`) + route/menu EN slug | ✅ |

## 3. Constraints adherence

- Semantic token: mọi màu/spacing/font từ `themetokenchk.ts` (statusDraft/statusAttention/statusInfo/statusOperational/statusCritical/actionPrimary + thang radius/space/font) — không hardcode hex/spacing (file-upload hint & layout width là ngoại lệ hợp lệ).
- Accent budget: 1 nút actionPrimary "Thêm mới" + nút lưu drawer + nút tải lên — ≤ 3/màn.
- Form.Item `marginBottom: spaceFormField`; Input/Select/Button `radiusPill` + `height: 40`.
- DatePicker/RangePicker qua `getDatePickerProps`/`getSidebarDatePickerProps`/`getSidebarRangePickerProps` (tháng dùng `picker="month"`, payload `YYYY-MM`).
- Pill Badge = `statusBadgeStyle(color)` chuẩn (`radiusPill`, `2px 10px`, `fontSizeMd`, `fontWeightMedium`, bg `${color}15`, border `1px solid ${color}40`) — KHÔNG AntD `<Tag>`.
- Org filter dạng cây (`FilterOrgUnitTreeSelect`, value = `orgUnitId`); `FormOrgUnitTreeSelect` trong form.
- 6 tab màu semantic theo design §2.3; DRAFT→Lưu tạm (#93A3B3), PENDING_APPROVAL→Chờ Cảng vụ duyệt (#EDA100), APPROVED_LEVEL1→Chờ Cục duyệt (#0284C7), APPROVED→Ban hành (#1BAF7A), REJECTED_*→Từ chối (#E34948), ARCHIVED→Đã xóa.
- `DRAWER_TABLE_SCROLL_Y`: drawer này không chứa bảng con phân trang (file list không phân trang) nên hằng số không áp dụng; scroll của Drawer là body tự nhiên.
- EN identifiers / VI labels & messages (kể cả message oracle §3 dùng nguyên văn cho client rule: org/month required, ≥ 0, lý do từ chối).
- Vite re-export bug: không re-export token trong file mới (meta import trực tiếp).

## 4. Verification evidence

- `npm run build` (frontend/) → **exit 0** (`✓ built in 508ms`, 3534 modules) — chạy sau mọi edit cuối.
- `npx tsc --noEmit -p tsconfig.app.json` scoped `seaport-throughput|seaportThroughputService|InputDecimal` → **0 errors** (baseline TS errors tồn tại sẵn ở `src/app/document`, `src/app/waterzone` — ngoài phạm vi).
- `npx eslint` scoped 3 file mới: còn 2 `react-hooks/set-state-in-effect` — **đúng pattern sẵn có của mọi page cùng loại** (kiểm chứng: `TransferAreaListPage.tsx:780`, `ShipPortCallPage.tsx` cùng lỗi; repo-wide lint đang fail baseline nên không phải gate của wave này). IDE biome warning `InputDecimal` ban đầu là stale — eslint thực tế sạch.
- Không chạy backend (đúng constraint); không commit.

## 5. State coverage (mô hình trạng thái)

loading (FilterTableLayout spin) / error (+ nút Thử lại → onRetry) / empty (EmptyState của DataTable) / data — đủ trên list. Drawer: detailLoading spin, saving, uploading; form lock khi APPROVED (xem-only), org disabled khi edit; file: empty/list/uploading; approval section chỉ khi record tồn tại.

## 6. Risks / cần wave-2 xác nhận

1. **DTO BE chưa tồn tại** (BE wave chưa chạy): tên field FE theo design §2.1 + §2.3; nếu BE DTO lệch (vd `reportMonth` dạng `yyyy-MM-dd`) phải sync (TC-STR).
2. Tab "Từ chối" gộp 2 cấp bằng 2 query + merge client-side (param đơn `approvalStatus`); nếu BE hỗ trợ multi-status filter thì thay bằng 1 query (đã đánh dấu trong code).
3. `CommonHistoryDrawer` nhận `records` từ `/{id}/history` (shape `{changeHistory}` của BE infrastructure_history — chưa chạy thực tế; formatValue/fieldLabelMap đã nối).
4. File attach: `components/UploadFileTable.tsx` shared gắn cứng endpoint `/cctv` → không dùng được; triển khai module-scoped theo đúng design FE-4 (endpoint `/v1/seaport-throughput/{id}/files`). Nếu shared component được tổng quát hóa sau này, thay thế.
5. Visual chưa kiểm browser (không chạy dev server theo constraint) — cần QA wave-2 visual cho TC-UI; token chk màu primary (#204e9c) theo fleet hiện tại.

## 7. Test coverage

- **Test file mới:** `frontend/src/services/seaportThroughputService.test.ts` (13 tests, vitest) — mô hình theo `frontend/src/services/shipPortCallService.test.ts` (mock HTTP layer `services/api.ts`, chạy service thật).
- **Phạm vi:** `list` (ánh xạ query param + unwrap paged envelope / raw-array / empty), `create` (POST full 25-number payload), `update` (PUT `/{id}`), lifecycle (`softDelete`, `submit`, `approveLevel1`, `approveLevel2`, `reject` trim reason), files (`listFiles`, `uploadFile` multipart FormData + `Content-Type`, `deleteFile`), `getById`, `history`.
- **Kết quả:** `npx vitest run src/services/seaportThroughputService.test.ts` → **1 file passed, 13/13 tests passed, exit 0** (vitest 4.1.11).

## 8. Rework F-01/F-02 (QA wave-2 — khớp design-plan §3, L92-98)

- **F-01 (contract service):** `approveLevel1` → `POST /v1/seaport-throughput/{id}/approve/c1`; `approveLevel2` → `POST /{id}/approve/c2` (body `ApprovalRequest`: `content` trim, optional); `reject(id, reason)` → **một** endpoint `POST /{id}/reject` body `{ reason: reason.trim() }` (bỏ tham số `level` — backend suy cấp từ trạng thái bản ghi); `uploadFile` append **`files`** (không còn `file`); **xóa `listFiles`** — không tồn tại `GET /{id}/files`; danh sách file lấy từ response `GET /{id}` → `files[]`.
- **Caller drawer/page:** drawer đọc `data.files` trong `loadDetail` và làm mới file qua `refreshFiles` (re-GET detail sau upload/xóa — không đè form đang sửa); page gọi `reject(id, reason)` cho cả 2 cấp, `approveLevel1/2(id, content)`; phân quyền hành động tách theo 9-action taxonomy: `approve` (C1), `approve_level2` (C2), `reject`.
- **F-02 (import):** thêm `importExcel(file)` → `POST /v1/seaport-throughput/import` (multipart `file`) trả báo cáo lỗi theo dòng `SeaportThroughputImportReport`. Design §3/§5 **không** đặc tả nút Import trên màn danh sách (không có trong FE work orders) → chỉ thêm API client, **không** wire nút UI (tránh scope creep).
- **Tests:** `seaportThroughputService.test.ts` cập nhật theo contract mới (approve/c1-c2 body content, reject chung, upload field `files`, xóa test `listFiles`, thêm test `importExcel`) → **13/13 passed, exit 0** (vitest 4.1.11).
- **Verify:** `npm run build` (frontend/) → **exit 0** (`✓ built in 569ms`).
