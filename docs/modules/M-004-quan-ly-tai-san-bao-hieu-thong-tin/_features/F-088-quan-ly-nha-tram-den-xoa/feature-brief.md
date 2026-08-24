---
id: F-088
name: "Quản lý Nhà trạm đèn - Xóa"
slug: quan-ly-nha-tram-den-xoa
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:49Z"
last-updated: "2026-08-23"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Nhà trạm đèn - Xóa

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-088
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

Cho phép cán bộ có quyền xóa (operator/admin) thực hiện xóa mềm nhà trạm đèn trong hệ thống. Xóa mềm giữ lại bản ghi trong cơ sở dữ liệu nhưng đánh dấu trạng thái DELETED, đảm bảo bảo toàn lịch sử kiểm toán và không làm mất dữ liệu liên quan. Chỉ cho phép xóa các bản ghi ở trạng thái DRAFT hoặc PENDING_APPROVAL; không cho phép xóa bản ghi đã được phê duyệt (APPROVED_L1, APPROVED_L2, PUBLISHED).

## 2. Trường dữ liệu

Không có trường dữ liệu nhập liệu — đây là chức năng xóa (thao tác trên bản ghi đã tồn tại).

| # | Tên trường (theo Excel) | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Xác nhận xóa | Có | Checkbox + popup xác nhận | Người dùng phải xác nhận bằng văn bản lý do xóa |
| 2 | Lý do xóa | Không | TextArea, tối đa 500 ký tự | Lý do xóa nhà trạm đèn (tùy chọn nhưng khuyến nghị điền) |

> **Ghi chú:** Chức năng xóa không yêu cầu nhập các trường thông tin nhà trạm. Các trường thông tin cơ bản, nhà trạm, GIS, log, vận hành/bảo trì/sự cố đã được quản lý ở các feature F-086, F-087, F-090.

## 3. Trạng thái và phê duyệt

- Quy trình phê duyệt 2 cấp theo `ba/00-lean-spec.md` mục 3.7:
  - **DRAFT** (0) — Chỉ cho phép xóa mềm bản ghi ở trạng thái này.
  - **PENDING_APPROVAL** (2) — Chỉ cho phép xóa mềm bản ghi ở trạng thái này.
  - **APPROVED_L1** (3) — KHÔNG cho phép xóa mềm.
  - **APPROVED_L2** (4) — KHÔNG cho phép xóa mềm.
  - **PUBLISHED** (5) — KHÔNG cho phép xóa mềm.
  - **REJECTED** (6) — Cho phép xóa mềm.
  - **DELETED** (7) — Đã xóa mềm, không cho phép xóa lần nữa.
- Khi xóa, hệ thống:
  - Kiểm tra trạng thái hiện tại của bản ghi.
  - Nếu hợp lệ (DRAFT, PENDING_APPROVAL, REJECTED), chuyển sang DELETED.
  - Ghi nhật ký lịch sử hành động SOFT_DELETE với operatorId và lý do xóa.
  - Bản ghi vẫn hiển thị trong danh sách với badge trạng thái \"Đã xóa\" (màu xám).
- Trạng thái lưu dạng số trong DB (ApprovalStatus enum ordinal), không lưu chữ.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-088-01 | Chỉ được xóa mềm bản ghi có trạng thái DRAFT, PENDING_APPROVAL, hoặc REJECTED | Delete |
| BR-088-02 | Không cho phép xóa mềm bản ghi có trạng thái APPROVED_L1, APPROVED_L2, PUBLISHED | Delete |
| BR-088-03 | Không cho phép xóa mềm bản ghi đã có trạng thái DELETED | Delete |
| BR-088-04 | Bắt buộc popup xác nhận trước khi xóa, người dùng phải nhập lý do (tùy chọn nhưng khuyến nghị) | Delete |
| BR-088-05 | Sau khi xóa mềm, bản ghi vẫn hiển thị trong danh sách với badge \"Đã xóa\", không xuất hiện trong kết quả tìm kiếm mặc định | Delete |
| BR-088-06 | Ghi nhật ký lịch sử hành động SOFT_DELETE với operatorId, deletedAt, deletedByName, và lý do xóa | Delete |
| BR-088-07 | Xóa mềm không xóa bản ghi liên quan trong bảng nha_tram_den_attachment (file đính kèm) — chỉ đánh dấu isActive=false | Delete |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-088-01** — Gửi request DELETE cho bản ghi DRAFT, hệ thống chuyển trạng thái sang DELETED, trả về HTTP 200.
- **AC-088-02** — Gửi request DELETE cho bản ghi APPROVED_L1, hệ thống trả về lỗi 400 Bad Request (không thể xóa bản ghi đã phê duyệt).
- **AC-088-03** — Gửi request DELETE cho bản ghi DELETED, hệ thống trả về lỗi 400 Bad Request (đã xóa trước đó).
- **AC-088-04** — Sau khi xóa mềm, bản ghi không xuất hiện trong danh sách mặc định (phải bật filter \"Hiển thị đã xóa\" mới thấy).
- **AC-088-05** — Nhật ký lịch sử ghi nhận hành động SOFT_DELETE với đầy đủ operatorId, deletedAt, lý do xóa.

### 4.3. User Stories kế thừa (nếu có)

- **US-088-01:** Là cán bộ nghiệp vụ, tôi muốn xóa mềm nhà trạm đèn không còn sử dụng để giữ danh sách sạch sẽ mà không mất dữ liệu lịch sử.
- **US-088-02:** Là cán bộ nghiệp vụ, tôi muốn hệ thống chặn xóa bản ghi đã được phê duyệt để đảm bảo tính toàn vẹn dữ liệu.

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

**Admin Cục:** Full quyền + xem thêm metadata người tạo/người sửa/thời gian tạo/cập nhật + xem cả bản ghi đã xóa (theo tài liệu nền mục 3.8).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — NhaTramDenStatus: DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, PUBLISHED, REJECTED, DELETED (7 trạng thái) |
| 2 | Có bước phê duyệt không | Có — Phê duyệt 2 cấp (Cảng vụ/Chi cục → Cục), xóa mềm không cần phê duyệt thêm |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trường `orgUnitId` bắt buộc, filter theo subtree đơn vị người dùng, Cục xem full |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `nhatramden:create`, `nhatramden:read`, `nhatramden:update`, `nhatramden:delete`, `nhatramden:approve`, `nhatramden:detail`, `nhatramden:history` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Có — Popup xác nhận xóa với trường lý do xóa, badge \"Đã xóa\" màu xám trong danh sách |

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
