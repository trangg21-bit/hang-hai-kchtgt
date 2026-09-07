# F-300 «Tàu biển ra vào cảng biển» — Frontend implementation (Wave 1)

- **Module / Feature**: M-025 `quan-ly-tau-bien` / F-300 `tau-bien-ra-vao-cang-bien` (ShipPortCall register)
- **Work order**: `docs/modules/M-025-quan-ly-tau-bien/design/00-design-plan.md` §8 (WO-2) — implemented per Passed design + QA oracle `qa/07-qa-report-w1.md`.
- **Verdict**: Pass — `npm run build` (frontend) exit 0.

## 1. What was produced

| File | Purpose |
|---|---|
| `frontend/src/types/shipPortCall.ts` | `ShipPortCallResponse`, `CreateShipPortCallRequest` (đúng 45 field Tạo mới), `ShipPortCallListParams`, `ShipPortCallPage` — field name tiếng Anh camelCase khớp design §4/§5 |
| `frontend/src/services/shipPortCallService.ts` | `shipPortCallCRUD = { list(params), create(data) }` — mirror `shipRepairFacilityService.ts`: `GET /v1/ship-port-call` + `POST /v1/ship-port-call`, envelope unwrap qua `resilient.ts` (`toArray`/`toSingle`/`toTotalCount`) |
| `frontend/src/pages/shipportcall/ShipPortCallPage.tsx` | Routed page `/ship-port-call`: danh sách + popup Tạo mới (Modal), KHÔNG StatusTabs, KHÔNG detail drawer |
| `frontend/src/config/navigation.tsx` | Thêm leaf `{ key/route: '/ship-port-call', label: 'Tàu biển ra vào cảng biển' }` vào NAV_GROUP `plan` «Quản lý quy hoạch & vận hành» (sau `/documents/maintenance`) |
| `frontend/src/components/AppLayout.tsx` | `MENU_PERMISSION_MAP['/ship-port-call'] = 'shipportcall:read'` + menu child nhóm 4 có `canAccessMenu('/ship-port-call')` — mirror `/documents/operation` |
| `frontend/src/App.tsx` | `lazy(() => import('./pages/shipportcall/ShipPortCallPage'))` + `<Route path="/ship-port-call" element={<PermissionGuard permission="shipportcall:read"><ShipPortCallPage /></PermissionGuard>} />` |

## 2. Design decisions implemented (anchored in WO-2 / feature-brief / lean-spec)

1. **List columns = ma trận Danh sách rows 1-5** (lean-spec §4.2): `orgUnitName` (Đơn vị quản lý), `reportDate` (Ngày báo cáo, DD/MM/YYYY), `reportCode`, `reportName`, `reportPeriod`. Không cột thao tác (không Sửa/Xóa).
2. **Create popup = đúng 45 field** rows 1-2 + 7-34 + 37-51; **loại trừ** `passengersArrival/passengersDeparture` (35-36) và `status` (52) — design §10 U-1..U-6; `reportCode/reportName/reportPeriod` không gửi lên (list-only, BE tự sinh). Nhóm theo section Excel: Thông tin chung → Thông tin tàu → 7 nhóm Hàng hóa → Phân loại hàng → Cảng đi/đến → Ngày tháng → Thông tin khác.
3. **Required (U-6 / §10.1)**: `orgUnitId`, `reportDate`, `shipName` — mỗi field có rule + message tiếng Việt.
4. **Chuyển tải & Quá cảnh chỉ có 2 field (Tấn + Teus)**, không có Teus rỗng (NG-06 parity); 4 nhóm Xuất/Nhập/Nội địa đến/Nội địa rời có đủ 3 (Tấn/Teus/Teus rỗng).
5. **`islandRoute` / `dangerousGoods`** = Select Có/Không gửi giá trị enum tiếng Anh `'YES' | 'NO'` (design §4: `IslandRoute { NO, YES }` / `DangerousGoods { NO, YES }`, ordinal). ⚠️ NEEDS-BE-PARITY: chờ DTO backend wave-1 accept đúng tên enum.
6. **Trim mọi text input trước submit** (`trimText` module-scope) — kể cả `imoNumber` giữ số 0 đầu (text, không Number); số qua `toNumber` (bỏ `''/null`); ngày `toDayString` → chuỗi `YYYY-MM-DD`.
7. **Bộ lọc sidebar** (FilterTableLayout `hideFilterToggle`): `FilterOrgUnitTreeSelect` (value = `orgUnitId`, cây parentId), ô từ khóa «Tên tàu, hô hiệu, số IMO» (Enter = tìm), 3 `RangePicker` «Ngày báo cáo / Ngày đến cảng / Ngày rời cảng» (popup chuẩn `getRangePickerProps`). Footer Reload + Tìm kiếm do `FilterTableLayout` cung cấp (onFilterApply/onFilterReset).
8. **Permission gating**: button Thêm mới chỉ hiện khi `shipportcall:create` (`usePermissionStore.hasPermission`); route bọc `PermissionGuard permission="shipportcall:read"`; menu bị `canAccessMenu` filter theo `shipportcall:read`.
9. **UI convention**: chỉ dùng shared `ScreenHeader/FilterTableLayout/DataTable/Pagination` + `FormOrgUnitTreeSelect`; token từ `tokens.ts` (`inputStyle`, `selectStyle`, `primaryButtonStyle`, `spaceFormField`, `spaceSm`, `radiusPill`, `textPrimary`, `fontSizeMd`, `fontWeightMedium`) — không hardcode hex/spacing/font-size; DatePicker dùng `getDatePickerProps` từ `themetokenchk`; Input/Select height 40 + pill theo preset; Form.Item marginBottom `spaceFormField`.
10. **Pagination**: server-driven `page/size` (`page-1` 0-based), `Pagination` 1-based; refetch khi đổi trang; thành công create → `toast.success` tiếng Việt + đóng modal + refresh.

## 3. Verification evidence

- `npm run build` in `frontend/` → **exit 0** (vite v8.2.2, 3529 modules transformed, built in 548ms) — chạy nhiều lần sau mỗi batch sửa (540ms/397ms/612ms/548ms), luôn xanh.
- `frontend/src/services/shipPortCallService.test.ts` — **5/5 tests passed** (`npx vitest run src/services/shipPortCallService.test.ts` trong `frontend/`, vitest v4.1.11, exit code 0, 98ms). Test vi.mock HTTP layer (`./api`) và CALL production `shipPortCallService.ts`: (1) map mọi filter list → đúng query param (`orgUnitId/keyword/reportDateFrom-To/arrivalDateFrom-To/departureDateFrom-To/page/size`); (2) omit filter rỗng/undefined + default page 0/size 20; (3) fallback total 0 khi envelope không có total; (4) create POST đúng payload 45-field đã trim, unwrap bản ghi; (5) create trả null khi data rỗng.
- Lần chạy đầu phát hiện 1 lỗi thật của service (mất default `page 0/size 20` khi refactor param-mapping) → đã sửa service, chạy lại xanh. Không bóp assertion để qua.
- TS/LSP diagnostics trên các file mới: sạch. 3 lỗi biome còn lại ở `AppLayout.tsx:482/777/201` — pre-existing, không thuộc diff.
- Không chạy backend (cấm), không chạy dev-server/browser → visual claim KHÔNG thực hiện (source-verified only).

## 4. Risks / parity handoffs

- **BE contract (WO-1)**: endpoint `/v1/ship-port-call`, envelope `{success,message,data,timestamp}`, page shape `content/totalElements` (hoặc total) — đúng mirror shipRepairFacility; params lọc `orgUnitId, keyword, reportDateFrom/To, arrivalDateFrom/To, departureDateFrom/To` (tên chuẩn hoá — QA cần chốt với backend wave-1).
- **Enum request value**: `'YES'/'NO'` string; nếu backend DTO dùng Boolean hoặc enum khác tên → cần align (QA parity).
- Menu leaf đăng ký ở **3 nơi** (navigation tree + AppLayout permission map & nhóm-4 children + App.tsx route) — module sau mirror đủ 3, không chỉ 1.
