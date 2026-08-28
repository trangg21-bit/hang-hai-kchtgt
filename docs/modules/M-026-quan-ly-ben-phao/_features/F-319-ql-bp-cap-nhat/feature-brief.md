---
id: F-319
name: "Quản lý Bến phao - Cập nhật"
slug: ql-bp-cap-nhat
module-id: M-026
status: proposed
classification: local
priority: medium
created: "2026-08-28"
last-updated: "2026-08-28"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Bến phao - Cập nhật

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-319
**Module:** M-026 — Quản lý Bến phao
**Loại:** chức năng thường (không có bước phê duyệt) — việc sửa hồ sơ gắn với trạng thái phê duyệt theo ma trận chỉnh sửa KCHT (tài liệu chung mục 3.9)
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (TKCT)

> **Trước khi viết:** đọc tài liệu nền của module (`ba/00-lean-spec.md`) để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):** khai báo đầy đủ ở mục 5, dòng 3 và mục 4.1 (BR-319-04/05): trường `orgUnitId` không nhập tay khi sửa (disabled, trừ Admin hệ thống), nguồn gán = `port.orgUnitId` khi đổi cảng biển, chiều ghi validate DataScope — SA chốt khi duyệt.

---

## 1. Mô tả ngắn

Cán bộ Cảng vụ/Chi cục chỉnh sửa hồ sơ bến phao qua drawer "Cập nhật hồ sơ" mở từ nút "Chỉnh sửa" trên dòng danh sách. Khả năng sửa phụ thuộc trạng thái phê duyệt: sửa thoải mái khi `DRAFT` hoặc bị trả về (`REJECTED_LEVEL1`/`REJECTED_LEVEL2` — sau khi sửa phải gửi lại duyệt); đóng băng khi đang chờ duyệt; hồ sơ `APPROVED` chỉ người có quyền phê duyệt sửa qua nút "Lưu và phê duyệt" (giữ nguyên `APPROVED`). Mã bến phao không được sửa. Mọi thay đổi ghi nhận người sửa + thời điểm (cột audit của bản ghi).

## 2. Trường dữ liệu

Ma trận đầy đủ tại `ba/00-lean-spec.md` mục 4; trường Edit=TRUE giống Create=TRUE trừ điểm sau:

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Mã bến phao | — | Input disabled | KHÔNG sửa được (BR-319-02) |
| 3 | Đơn vị quản lý | Có | OrgUnitTreeSelect disabled | Chỉ Admin hệ thống đổi được; khi đổi cảng biển → tự gán lại `port.orgUnitId` |
| 4 | Thuộc cảng biển | Có | Select | Đổi cảng → reset cascading (luồng HH, đơn vị khai thác nếu không thuộc cảng mới) |
| 2, 5–26 | Tên, luồng HH, Tỉnh/TP, địa điểm chi tiết, phân cấp, tình trạng, kỹ thuật & đăng kiểm, công bố, phạm vi khu nước | Theo ma trận | Như Create | |
| 27–32 | GIS + File đính kèm | Không | Như Create | Cập nhật tọa độ qua `geometryType/coordinates`; thêm/xóa file riêng |

## 3. Trạng thái và phê duyệt

- Trạng thái lưu dạng số, theo tài liệu nền mục 3.7.
- **Không có bước phê duyệt** độc lập — nhưng khả năng sửa tuân theo **ma trận chỉnh sửa KCHT** (tài liệu chung `approval-2-level-spec.md` mục 3.9):

| Trạng thái | Cho sửa? | Hành động | Ai được sửa | Quyền |
|---|---|---|---|---|
| `DRAFT` (0) | ✅ | Sửa tiếp, gửi duyệt | Người nhập | `buoyberth:update` |
| `APPROVED_LEVEL1` (3) / `APPROVED_LEVEL2` (4) | ❌ | Đóng băng (ẩn nút, BE từ chối 403) | — | — |
| `REJECTED_LEVEL1` (8) / `REJECTED_LEVEL2` (9) | ✅ | Sửa + gửi lại (quay `APPROVED_LEVEL1`) | Người nhập | `buoyberth:update` |
| `APPROVED` (5) | ✅ | Sửa qua "Lưu và phê duyệt" (giữ `APPROVED`) | Người có quyền phê duyệt | `buoyberth:approvec2` |
| `ARCHIVED` (7) | ❌ | — | — | — |

- Không có quyền tương ứng → ẩn nút, không hiện rồi báo lỗi khi bấm.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-319-01 | Chỉ sửa theo ma trận mục 3: `DRAFT`/`REJECTED_*` sửa bình thường; đang chờ duyệt từ chối (ẩn nút + BE trả lỗi "Không thể sửa hồ sơ đang trong quy trình phê duyệt") | Update |
| BR-319-02 | `buoyBerthCode` không nằm trong `UpdateBuoyBerthRequest` (chỉ `id` + trường sửa) — mã bất biến | Update |
| BR-319-03 | `saveAction` quyết định trạng thái sau sửa: `DRAFT`→`DRAFT`; `SUBMIT`→`APPROVED_LEVEL1`; `SAVE_AND_APPROVE`→`APPROVED` (ghi submitted + duyệt C1+C2 bằng người thực hiện); không truyền `saveAction` trên hồ sơ `APPROVED` → hồ sơ bị hạ về `APPROVED_LEVEL1` (⚠️ drift c.6) | Update |
| BR-319-04 | Đơn vị quản lý khi sửa: disabled, không nhập tay; đổi `portId` → `orgUnitId` gán lại từ `port.orgUnitId` | Update |
| BR-319-05 | Chiều ghi validate phạm vi DataScope: không gán bến phao vào cảng ngoài phạm vi đơn vị user | Update |
| BR-319-06 | Cập nhật chỉ áp dụng trường có giá trị (`EntityUpdateUtils.copyPropertiesIfPresent`); GIS đồng bộ lại qua `GisSpatialObjectService` (giữ `spatialId`) | Update |
| BR-319-07 | Sau khi sửa hồ sơ `REJECTED_*` phải gửi lại duyệt (re-submit vào lại vòng 1), nếu không hồ sơ không đi tiếp được | Update |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-319-01 — Sửa DRAFT:** Sửa hồ sơ `DRAFT` → lưu giữ `DRAFT`; không truyền `saveAction` vẫn giữ `DRAFT` (không hạ trạng thái).
- **AC-319-02 — Đóng băng khi chờ duyệt:** Hồ sơ `APPROVED_LEVEL1`/`APPROVED_LEVEL2` không hiển thị nút "Chỉnh sửa"; gọi thẳng API update → bị từ chối.
- **AC-319-03 — Sửa sau trả về:** Sửa hồ sơ `REJECTED_LEVEL2`, bấm "Lưu và gửi phê duyệt" → quay về `APPROVED_LEVEL1` (chờ Cảng vụ), có người sửa + thời điểm mới.
- **AC-319-04 — Sửa hồ sơ Đã duyệt:** Chỉ user có `buoyberth:approvec2` thấy nút "Chỉnh sửa" trên `APPROVED`; sau "Lưu và phê duyệt" hồ sơ GIỮ `APPROVED`, ghi người thực hiện + thời điểm; không hạ về DRAFT.

### 4.3. User Stories kế thừa (nếu có)

- **US-319-01:** Là cán bộ Cảng vụ, tôi muốn sửa hồ sơ bị trả về và gửi lại ngay để hồ sơ không tắc quy trình.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Sửa hồ sơ `DRAFT`/`REJECTED_*` + gửi lại | `buoyberth:update` |
| Sửa hồ sơ `APPROVED` ("Lưu và phê duyệt") | `buoyberth:approvec2` (hoặc `buoyberth:approve`) |
| Thêm/xóa file đính kèm khi sửa | `buoyberth:update` |

**Admin Cục:** full quyền `buoyberth:*` + xem thêm metadata (người tạo, người sửa cuối, thời gian tạo/cập nhật) — theo tài liệu nền mục 3.7/3.8, không có quyền riêng ngoài seed. **10 quyền `buoyberth:*` ĐÃ SEED — không seed lại.**

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không có — 7 trạng thái chuẩn; sửa theo ma trận tài liệu chung mục 3.9 |
| 2 | Có bước phê duyệt không | Không có bước phê duyệt độc lập; sửa hồ sơ `APPROVED` qua "Lưu và phê duyệt" (giữ `APPROVED`) |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — `orgUnitId` disabled khi sửa (trừ Admin hệ thống), đổi cảng biển → gán lại từ `port.orgUnitId`; validate DataScope |
| 4 | Trường chỉ hiện trong điều kiện nào | Nút "Chỉnh sửa" chỉ hiện theo trạng thái (ma trận mục 3.9); tab Lịch sử trong drawer ẩn khi `drawerMode === 'create'` |
| 5 | Quyền riêng | `buoyberth:update` (sửa + submit), `buoyberth:approvec2` (sửa hồ sơ APPROVED) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — thêm/xóa file đính kèm ≤ 10MB trong luồng sửa |
| 8 | Giao diện khác mẫu chung | Không — theo convention chung (AppDrawer, pill radius, tokens) |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| PUT | `/api/v1/buoy-berth` | Cập nhật hồ sơ (body `UpdateBuoyBerthRequest`, `saveAction=DRAFT\|SUBMIT\|SAVE_AND_APPROVE`) | `buoyberth:update` |
| POST | `/api/v1/buoy-berth/{id}/attachments` | Thêm file đính kèm | `buoyberth:update` |
| DELETE | `/api/v1/buoy-berth/{id}/attachments/{attId}` | Xóa file đính kèm | `buoyberth:update` |
| GET | `/api/v1/buoy-berth/{id}` | Nạp hồ sơ vào form sửa | `buoyberth:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ. *(Bảng `buoy_berths` đã có migration `V20260829040000` — không đề xuất thay đổi; liệt kê đầy đủ tại `ba/00-lean-spec.md` mục 7 / brief F-318.)*

**Bảng `buoy_berths` — trường liên quan Cập nhật:** `buoy_berth_name`, `port_id`, `org_unit_id`, `waterway_id`, `classification`, `province_id`, `detailed_location`, `operational_status`, `operating_org_id`, `current_water_depth`, `bottom_elevation_design`, `max_vessel_dwt`, `planned_vessel_dwt`, `last_inspection_date`, `next_inspection_date`, `operation_expiry_date`, `design_capacity`, `active_buoy_berth_count`, `published_buoy_berth_count`, `under_investment_buoy_berth_count`, `cargo_throughput`, `opening_announcement_date`, `public_decision`, `investment_agreement`, `mooring_water_area_scope`, `map_symbol_id`, `coordinate_system`, `display_rule`, `spatial_id`, `approval_status`, `submitted_for_approval_at/by`, `port_authority_approved_at/by`, `department_approved_at/by`, `updated_by`, `updated_at`. Không sửa: ~~`buoy_berth_code`~~ (bất biến), ~~`id`~~.
