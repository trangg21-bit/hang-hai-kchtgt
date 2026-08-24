---
id: F-086
name: "Quản lý Nhà trạm đèn - Tạo mới"
slug: quan-ly-nha-tram-den-tao-moi
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:49Z"
last-updated: "2026-08-23"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Nhà trạm đèn - Tạo mới

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-086
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng có bước phê duyệt
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (Excel `HH_Tính năng & danh sách các trường thông tin.xlsx`, sheet `QL Đèn biển và nhà trạm`)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **\"Điểm khác biệt so với mẫu chung\"** (mục 5, dòng 3 — *\"Lọc cha-con / theo đơn vị\"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Mô tả ngắn

Cho phép cán bộ nghiệp vụ (operator) tạo mới một nhà trạm đèn trong hệ thống quản lý tài sản báo hiệu hàng hải. Nhà trạm đèn là công trình phục vụ việc lắp đặt, bảo trì và vận hành các đèn báo hiệu hàng hải. Tính năng thu thập thông tin về địa điểm đặt trạm, kết cấu, diện tích, diện tích sử dụng, số lượng nhân sự bố trí và ghi chú. Khi tạo, người dùng có thể lưu nháp (DRAFT) hoặc gửi phê duyệt ngay (PENDING_APPROVAL).

## 2. Trường dữ liệu

Bảng mô tả các trường trên form tạo mới/chỉnh sửa:

| # | Tên trường (theo Excel) | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Địa điểm đặt trạm đèn | Không | TextArea, tối đa 500 ký tự | Mô tả vị trí cụ thể của nhà trạm |
| 2 | Kết cấu | Không | TextArea, tối đa 500 ký tự | Mô tả kết cấu xây dựng (bê tông, thép, gỗ…) |
| 3 | Diện tích (m²) | Không | Decimal, ≥ 0 | Tổng diện tích nhà trạm |
| 4 | Diện tích sử dụng trạm đèn (m²) | Không | Decimal, ≥ 0 | Diện tích thực tế sử dụng cho vận hành đèn |
| 5 | Số lượng nhân sự bố trí | Không | TextArea, tối đa 100 ký tự | Số người làm việc tại nhà trạm |
| 6 | Ghi chú | Không | TextArea, tối đa 1000 ký tự | Ghi chú bổ sung |
| 7 | Loại đối tượng (GIS) | Không | SelectAppParams | Phân loại đối tượng GIS |
| 8 | Biểu tượng (GIS) | Không | SelectIcon | Biểu tượng hiển thị trên bản đồ |
| 9 | Hệ quy chiếu (GIS) | Không | SelectAppParams | Hệ quy chiếu tọa độ (VD: WGS84) |
| 10 | Quy tắc hiển thị (GIS) | Không | SelectAppParams | Quy tắc style hiển thị GIS |
| 11 | Tọa độ (GIS) | Không | LongLatTable | Bảng nhập tọa độ kinh độ/vĩ độ |
| 12 | Danh sách file đính kèm | Không | UploadFileTable | Tải lên tệp tài liệu liên quan |

> **Ghi chú:** Các trường \"Thông tin cơ bản\" (mã đèn, tên đèn, đơn vị quản lý, thuộc cảng biển, đơn vị vận hành, địa điểm tỉnh/TP, địa điểm chi tiết, tình trạng, thông tin kỹ thuật đèn biển) đã được kế thừa từ feature F-068 (Quản lý Đèn biển - Tạo mới) và không lặp lại trong brief này. Các trường \"Thông tin log cập nhật\", \"Thông tin vận hành khai thác\", \"Thông tin bảo trì\", \"Thông tin sự cố\", \"Trạng thái\" là read-only, không xuất hiện trong form tạo mới.

## 3. Trạng thái và phê duyệt

- Quy trình phê duyệt 2 cấp theo `ba/00-lean-spec.md` mục 3.7:
  - **DRAFT** (0) — Trạng thái mặc định khi tạo mới, lưu nháp.
  - **PENDING_APPROVAL** (2) — Khi người dùng nhấn \"Gửi phê duyệt\", chuyển từ DRAFT sang trạng thái chờ duyệt cấp Cảng vụ/Chi cục.
  - **APPROVED_L1** (3) — Cấp Cảng vụ/Chi cục phê duyệt.
  - **APPROVED_L2** (4) — Cấp Cục phê duyệt.
  - **PUBLISHED** (5) — Đã đưa vào sử dụng.
  - **REJECTED** (6) — Bị từ chối ở bất kỳ cấp nào.
  - **DELETED** (7) — Đã xóa mềm.
- Khi tạo mới, người dùng chọn hành động:
  - **Lưu nháp** → trạng thái `DRAFT`.
  - **Gửi phê duyệt** → trạng thái `PENDING_APPROVAL`, ghi nhật ký lịch sử hành động CREATE.
- Trạng thái lưu dạng số trong DB (ApprovalStatus enum ordinal), không lưu chữ.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-086-01 | Diện tích (m²) và diện tích sử dụng phải ≥ 0 | Create |
| BR-086-02 | Số lượng nhân sự bố trí phải là số nguyên ≥ 0 (nếu nhập số) | Create |
| BR-086-03 | Tọa độ GIS phải tuân thủ WGS84 (latitude: -90→90, longitude: -180→180) | Create |
| BR-086-04 | Khi action=\"draft\", lưu với trạng thái DRAFT; khi action=\"submit\", lưu với trạng thái PENDING_APPROVAL và ghi lịch sử CREATE | Create |
| BR-086-05 | Mã nhà trạm đèn (nếu có) phải là duy nhất | Create |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-086-01** — Gửi request hợp lệ với đầy đủ trường bắt buộc và action=\"draft\", hệ thống tạo thành công nhà trạm đèn mới với trạng thái DRAFT, trả về HTTP 201.
- **AC-086-02** — Gửi request hợp lệ với action=\"submit\", hệ thống tạo thành công với trạng thái PENDING_APPROVAL, đồng thời ghi lại bản ghi lịch sử với actionType=CREATE.
- **AC-086-03** — Gửi request thiếu trường bắt buộc (nếu có), hệ thống trả về lỗi validation HTTP 400.
- **AC-086-04** — Gửi request với mã đã tồn tại, hệ thống trả về lỗi vi phạm ràng buộc unique (HTTP 400/409).

### 4.3. User Stories kế thừa (nếu có)

- **US-086-01:** Là cán bộ nghiệp vụ, tôi muốn tạo mới nhà trạm đèn với đầy đủ thông tin (địa điểm, kết cấu, diện tích, nhân sự) để phục vụ công tác quản lý tài sản báo hiệu hàng hải.
- **US-086-02:** Là cán bộ nghiệp vụ, tôi muốn lưu nháp hoặc gửi phê duyệt ngay khi tạo mới để linh hoạt trong quy trình làm việc.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Tạo mới nhà trạm đèn | `nhatramden:create` |
| Xem danh sách nhà trạm đèn | `nhatramden:read` |
| Xem chi tiết nhà trạm đèn | `nhatramden:detail` |
| Cập nhật nhà trạm đèn | `nhatramden:update` |
| Xóa nhà trạm đèn | `nhatramden:delete` |
| Phê duyệt nhà trạm đèn | `nhatramden:approve` |
| Xem lịch sử nhà trạm đèn | `nhatramden:history` |

**Admin Cục:** Full quyền + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — NhaTramDenStatus: DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, PUBLISHED, REJECTED, DELETED (7 trạng thái) |
| 2 | Có bước phê duyệt không | Có — Phê duyệt 2 cấp (Cảng vụ/Chi cục → Cục) |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` bắt buộc, filter theo subtree đơn vị người dùng, Cục xem full |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `nhatramden:create`, `nhatramden:read`, `nhatramden:update`, `nhatramden:delete`, `nhatramden:approve`, `nhatramden:detail`, `nhatramden:history` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — trường \"Danh sách file đính kèm\" (UploadFileTable) cho phép upload tài liệu liên quan |
| 8 | Giao diện khác mẫu chung | Có — Form tạo mới bao gồm 6 trường riêng nhà trạm (địa điểm, kết cấu, diện tích, diện tích sử dụng, nhân sự, ghi chú) + 5 trường GIS + file upload |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/v1/nhatram-den` | Tạo mới nhà trạm đèn (draft hoặc submit) | `nhatramden:create` |
| GET | `/api/v1/nhatram-den` | Danh sách nhà trạm đèn (phân trang) | `nhatramden:read` |
| GET | `/api/v1/nhatram-den/{id}` | Xem chi tiết nhà trạm đèn | `nhatramden:detail` |
| PUT | `/api/v1/nhatram-den/{id}` | Cập nhật nhà trạm đèn | `nhatramden:update` |
| DELETE | `/api/v1/nhatram-den/{id}` | Xóa mềm nhà trạm đèn | `nhatramden:delete` |
| POST | `/api/v1/nhatram-den/{id}/approve` | Phê duyệt (C1/C2) | `nhatramden:approve` |
| POST | `/api/v1/nhatram-den/{id}/reject` | Từ chối phê duyệt | `nhatramden:approve` |
| GET | `/api/v1/nhatram-den/{id}/history` | Lịch sử thay đổi | `nhatramden:history` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `nha_tram_den` (Nhà trạm đèn):**

Kế thừa từ `BaseEntity` (id, createdAt, updatedAt, createdByName, updatedByName, deletedAt, deletedByName) + các trường sau:

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| code | VARCHAR(50) | Có | Mã nhà trạm đèn, unique |
| name | VARCHAR(200) | Có | Tên nhà trạm đèn |
| orgUnitId | UUID | Có | Đơn vị quản lý (data scope) |
| portId | UUID | Không | Thuộc cảng biển |
| operatingUnitId | UUID | Không | Đơn vị vận hành |
| province | VARCHAR(100) | Không | Địa điểm (Tỉnh/TP) |
| detailedLocation | TEXT | Không | Địa điểm chi tiết |
| status | SMALLINT | Có | Trạng thái (ApprovalStatus ordinal) |
| conditionId | INTEGER | Không | Tình trạng (AppParams) |
| lightType | VARCHAR(50) | Không | Chủng loại đèn chính |
| backupLightType | VARCHAR(50) | Không | Chủng loại đèn dự phòng |
| stationLevel | VARCHAR(50) | Không | Cấp trạm đèn |
| jurisdiction | TEXT | Không | Địa bàn |
| landmark | TEXT | Not null | Đặc điểm nhận dạng |
| shape | TEXT | Không | Hình dạng |
| towerHeight | DECIMAL(6,2) | Không | Chiều cao tháp đèn (m) |
| lightCenterHeight | DECIMAL(6,2) | Không | Chiều cao tâm sáng (m) |
| geoRange | VARCHAR(50) | Không | Tầm hiệu lực địa lý |
| lightRange | DECIMAL(6,2) | Không | Tầm hiệu lực ánh sáng (hải lý) |
| towerColor | TEXT | Không | Màu sắc tháp đèn |
| energySource | TEXT | Không | Nguồn năng lượng |
| commissioningDate | DATE | Không | Thời điểm đưa vào sử dụng |
| lastRepairDate | DATE | Không | Thời điểm sửa chữa gần nhất |
| 🔴 stationLocation | TEXT | Không | Địa điểm đặt trạm đèn |
| 🔴 structure | TEXT | Không | Kết cấu |
| 🔴 area | DECIMAL(10,2) | Không | Diện tích (m²) |
| 🔴 usableArea | DECIMAL(10,2) | Không | Diện tích sử dụng trạm đèn (m²) |
| 🔴 staffCount | VARCHAR(100) | Không | Số lượng nhân sự bố trí |
| 🔴 note | TEXT | Không | Ghi chú |
| objectTypeId | INTEGER | Không | Loại đối tượng (GIS) |
| iconId | INTEGER | Không | Biểu tượng (GIS) |
| crsId | INTEGER | Không | Hệ quy chiếu (GIS) |
| displayRuleId | INTEGER | Không | Quy tắc hiển thị (GIS) |
| coordinates | JSONB | Không | Tọa độ (GIS) |
| isActive | BOOLEAN | Có | Default true |

**Bảng `nha_tram_den_attachment` (Đính kèm nhà trạm đèn):** 🔴 mới

| Trường | Kiểu | Ghi chú |
|---|---|---|
| id | UUID | Primary key |
| nhaTramDenId | UUID | FK → nha_tram_den.id |
| fileName | VARCHAR(255) | Tên file |
| filePath | VARCHAR(500) | Đường dẫn lưu trữ |
| fileSize | BIGINT | Kích thước file (bytes) |
| uploadedBy | UUID | Người upload |
| uploadedAt | TIMESTAMP | Thời gian upload |
