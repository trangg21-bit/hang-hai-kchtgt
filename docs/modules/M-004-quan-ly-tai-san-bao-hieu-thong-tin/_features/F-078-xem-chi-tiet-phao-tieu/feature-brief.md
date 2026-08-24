---
id: F-078
name: "Xem chi tiết Phao tiêu"
slug: xem-chi-tiet-phao-tieu
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07"
last-updated: "2026-08-24"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Xem chi tiết Phao tiêu

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-078
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Loại:** chức năng thường (không có bước phê duyệt)
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (TKCT) + Excel `HH_Tính năng & danh sách các trường thông tin.xlsx` sheet "QL Phao tiêu"

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):**
> Trong bảng **"Điểm khác biệt so với mẫu chung"** (mục 5, dòng 3 — *"Lọc cha-con / theo đơn vị"*), BA **PHẢI khai báo đầy đủ** (có/không, trường đơn vị nào, cơ chế, ngoại lệ) và **SA chốt cơ chế** khi duyệt — không được để trống hoặc ghi chung chung.
> Nếu chức năng quản lý dữ liệu nghiệp vụ thuộc đơn vị, brief PHẢI khai báo: (1) trường đơn vị bắt buộc/không, (2) nguồn gán đơn vị khi tạo (request hay đơn vị user), (3) chiều ghi có validate phạm vi không.
> Quy tắc chi tiết xem `AGENTS.md` mục **Data Scope Convention**; danh sách lỗ hổng đã gặp xem `docs/intel/data-scope-gap-report.md`.

---

## 1. Mô tả ngắn

Cho phép người dùng xem toàn bộ thông tin chi tiết của một phao tiêu dựa trên mã định danh (UUID). Thông tin hiển thị bao gồm: mã code, tên, loại phao, tọa độ GIS, hình dáng, kết cấu, thông số kỹ thuật đèn biển, đặc tính ánh sáng, đơn vị quản lý (kèm tên đơn vị), trạng thái phê duyệt, thông tin phê duyệt (ai phê duyệt, khi nào, lý do), thông tin vận hành/bảo trì/sự cố, file đính kèm và thông tin kiểm toán (createdAt, updatedAt). Mọi vai trò (kể cả viewer) đều có thể xem chi tiết.

## 2. Trường dữ liệu

Bảng mô tả các trường hiển thị trên màn hình chi tiết phao tiêu (theo Excel sheet "QL Phao tiêu"):

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Đơn vị quản lý | Không | Text (read-only) | Trả kèm orgUnitName — Excel row 3 |
| 2 | Thuộc nhà trạm QLVH phao, tiêu | Không | Text (read-only) | Hiển thị tên nhà trạm — Excel row 4 |
| 3 | Phân loại | Không | Text (read-only) | Phân loại phao/tiêu — Excel row 5-7 |
| 4 | Mã phao, tiêu | Không | Text (read-only) | Tự sinh {mã nhà trạm}-PT-{seq} — Excel row 8 |
| 5 | Tên phao, tiêu | Không | Text (read-only) | — Excel row 9 |
| 6 | Địa điểm (Tỉnh/TP) | Không | Text (read-only) | — Excel row 10 |
| 7 | Địa điểm chi tiết | Không | Text (read-only) | — Excel row 11 |
| 8 | Tình trạng | Không | Badge (read-only) | — Excel row 12 |
| 9 | Hình dáng | Không | Text (read-only) | — Excel row 14 |
| 10 | Kết cấu | Không | Text (read-only) | — Excel row 15 |
| 11 | Diện tích (m²) | Không | Decimal (read-only) | — Excel row 16 |
| 12 | Chiều cao thân phao (m) | Không | Decimal (read-only) | — Excel row 17 |
| 13 | Đường kính phao (m) | Không | Decimal (read-only) | — Excel row 18 |
| 14 | Đèn biển | Không | Text (read-only) | SelectAppParams — Excel row 19 |
| 15 | Chiều cao tháp đèn | Không | Decimal (read-only) | — Excel row 20 |
| 16 | Chiều cao tâm sáng (hải đồ) | Không | Decimal (read-only) | Bắt buộc — Excel row 21 |
| 17 | Chủng loại đèn | Không | Text (read-only) | — Excel row 22 |
| 18 | Màu sắc bên ngoài của tháp đèn | Không | Text (read-only) | — Excel row 23 |
| 19 | Nguồn cung cấp năng lượng cho đèn | Không | Text (read-only) | — Excel row 24 |
| 20 | Phạm vi chiếu sáng | Không | Text (read-only) | — Excel row 25 |
| 21 | Thời điểm đưa vào sử dụng | Không | Text (read-only) | DatePicker — Excel row 27 |
| 22 | Thời điểm sửa chữa gần nhất | Không | Text (read-only) | DatePicker — Excel row 28 |
| 23 | Đặc tính ánh sáng | Không | Text (read-only) | — Excel row 29 |
| 24 | Màu sắc | Không | Text (read-only) | — Excel row 30 |
| 25 | Kiểu chớp | Không | Text (read-only) | — Excel row 31 |
| 26 | Chu kỳ | Không | Text (read-only) | — Excel row 32 |
| 27 | Vị trí (GIS) | Không | Text (read-only) | Hiển thị trên bản đồ — Excel row 33 |
| 28 | Tọa độ GIS | Không | Text (read-only) | WGS84 — Excel row 34 |
| 29 | Loại đối tượng | Không | Text (read-only) | Point/LineString/Polygon — Excel row 35 |
| 30 | Biểu tượng | Không | Text (read-only) | — Excel row 36 |
| 31 | Hệ quy chiếu | Không | Text (read-only) | — Excel row 37 |
| 32 | Quy tắc hiển thị | Không | Text (read-only) | — Excel row 38 |
| 33 | File đính kèm | Không | UploadFileTable (read-only) | — Excel row 39-40 |
| 34 | Trạng thái | Không | Badge (read-only) | DRAFT/PENDING_APPROVAL/APPROVED_L1/APPROVED_L2/PUBLISHED/REJECTED — Excel row 42 |
| 35 | Ngày cập nhật | Không | Text (read-only) | — Excel row 43 |
| 36 | Cán bộ cập nhật | Không | Text (read-only) | — Excel row 44 |
| 37 | Ngày gửi phê duyệt | Không | Text (read-only) | — Excel row 45 |
| 38 | Cán bộ gửi phê duyệt | Không | Text (read-only) | — Excel row 46 |
| 39 | Ngày phê duyệt cấp Cảng vụ/Chi cục | Không | Text (read-only) | — Excel row 47 |
| 40 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | Không | Text (read-only) | — Excel row 48 |
| 41 | Nội dung phê duyệt L1 | Không | Text (read-only) | — Excel row 49 |
| 42 | Ngày phê duyệt cấp Cục | Không | Text (read-only) | — Excel row 50 |
| 43 | Cán bộ phê duyệt cấp Cục | Không | Text (read-only) | — Excel row 51 |
| 44 | Nội dung phê duyệt L2 | Không | Text (read-only) | — Excel row 52 |
| 45 | Mã kế hoạch vận hành | Không | Text (read-only) | — Excel row 54 |
| 46 | Tên kế hoạch vận hành | Không | Text (read-only) | — Excel row 55 |
| 47 | Ngày bắt đầu vận hành | Không | Text (read-only) | — Excel row 56 |
| 48 | Ngày kết thúc vận hành | Không | Text (read-only) | — Excel row 57 |
| 49 | Mã kế hoạch bảo trì | Không | Text (read-only) | — Excel row 59 |
| 50 | Tên kế hoạch bảo trì | Không | Text (read-only) | — Excel row 60 |
| 51 | Thời gian bắt đầu bảo trì | Không | Text (read-only) | — Excel row 61 |
| 52 | Thời gian kết thúc bảo trì | Không | Text (read-only) | — Excel row 62 |
| 53 | Mã sự cố | Không | Text (read-only) | — Excel row 64 |
| 54 | Loại sự cố | Không | Text (read-only) | — Excel row 65 |
| 55 | Địa điểm sự cố | Không | Text (read-only) | — Excel row 66 |
| 56 | Thời gian sự cố | Không | Text (read-only) | — Excel row 67 |

## 3. Trạng thái và phê duyệt

- **Không có bước phê duyệt** — đây là chức năng xem thông tin, không thay đổi trạng thái.
- Trạng thái phao tiêu được hiển thị dưới dạng Badge màu theo giá trị trong DB:
  - DRAFT (xám nhạt)
  - PENDING_APPROVAL (vàng)
  - APPROVED_L1 (xanh dương)
  - APPROVED_L2 (xanh lá)
  - PUBLISHED (xanh đậm)
  - REJECTED (đỏ)
  - DELETED (xám đậm — ẩn do soft-delete)

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-078-01 | Mã code phải là duy nhất, không được để trống, tối đa 50 ký tự | Buoy.code — BR-001 |
| BR-078-02 | Tên không được để trống, tối đa 200 ký tự | Buoy.name — BR-002 |
| BR-078-03 | Soft-delete — bản ghi có deleted_at bị ẩn khỏi truy vấn | Buoy — BR-009 |
| BR-078-04 | Màu sắc tối đa 50 ký tự | Buoy.color — BR-016 |
| BR-078-05 | Hình dáng tối đa 50 ký tự | Buoy.shape — BR-017 |
| BR-078-06 | Latitude -90..90, Longitude -180..180 | Buoy.geometry — BR-003, BR-004 |
| BR-078-07 | Phạm vi chiếu sáng 0.01–100.0 | Buoy.lightRange — BR-006 |
| BR-078-08 | Tên đơn vị quản lý (orgUnitName) được trả kèm trong response | Buoy + OrgUnit — OrgUnitCacheService |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-078-01** — Xem chi tiết thành công phao tiêu hợp lệ: Hệ thống trả về HTTP 200 với đầy đủ thông tin (code, name, type, geometry, color, shape, lightCharacteristic, range, description, unitId, unitName, status, approvalStatus, approvalLevel, approvedBy, approvedDate, rejectionReason, createdAt, updatedAt).
- **AC-078-02** — Hệ thống trả về lỗi 404 nếu phao tiêu không tồn tại hoặc đã bị xóa (deleted_at IS NOT NULL) với thông báo "Phao tiêu không tìm thấy".
- **AC-078-03** — Mọi vai trò (kể cả viewer) đều có thể xem chi tiết phao tiêu.
- **AC-078-04** — Trường unitName được hiển thị (tra cứu từ OrgUnit qua OrgUnitCacheService) nếu unitId có giá trị.
- **AC-078-05** — Admin Cục xem thêm metadata: người tạo, người sửa cuối, thời gian tạo/cập nhật, ngày gửi phê duyệt, cán bộ gửi phê duyệt, ngày phê duyệt L1/L2, cán bộ phê duyệt L1/L2, nội dung phê duyệt.

### 4.3. User Stories kế thừa (nếu có)

- **US-078-01:** Là operator, tôi muốn xem chi tiết phao tiêu để kiểm tra thông tin trước khi gửi phê duyệt.
- **US-078-02:** Là approver_L1/L2, tôi muốn xem chi tiết phao tiêu để đánh giá chất lượng dữ liệu khi phê duyệt.
- **US-078-03:** Là viewer, tôi muốn xem thông tin kỹ thuật (màu sắc, hình dáng, đặc tính ánh sáng) của phao tiêu để phục vụ công tác hàng hải.
- **US-078-04:** Là admin, tôi muốn xem toàn bộ metadata (người tạo, người sửa, thời gian) để phục vụ thanh tra.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem chi tiết | `buoy:read` |

**Admin Cục:** Full quyền + xem thêm metadata người tạo/người sửa/thời gian (ngày gửi phê duyệt, cán bộ gửi, ngày phê duyệt L1/L2, cán bộ phê duyệt L1/L2, nội dung phê duyệt).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — hiển thị Badge trạng thái 7 giá trị (DRAFT/PENDING_APPROVAL/APPROVED_L1/APPROVED_L2/PUBLISHED/REJECTED/DELETED) |
| 2 | Có bước phê duyệt không | Không — chỉ xem thông tin phê duyệt, không thao tác |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — trả về thông tin orgUnitName từ OrgUnitCacheService, filter theo subtree đơn vị |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — thông tin vận hành/bảo trì/sự cố chỉ hiện khi có dữ liệu liên kết |
| 5 | Quyền riêng | `buoy:read` (dùng chung với các chức năng xem khác) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — File đính kèm hiển thị danh sách file đã upload — Excel row 39-40 |
| 8 | Giao diện khác mẫu chung | Không — dùng chung ScreenHeader + FilterBar + StatusTabs + DataTable + Pagination, chi tiết hiển thị trong Modal/Drawer |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/buoys/{id}` | Xem chi tiết phao tiêu (bao gồm orgUnitName, approval info, history summary) | `buoy:read` |
| GET | `/api/buoys/{id}/history` | Xem lịch sử thao tác trên phao tiêu (beacon_history WHERE beaconType='BUOY' AND entityId={id}) | `buoy:read` |
| GET | `/api/org-units/tree` | Lấy cây đơn vị (cho hiển thị tên đơn vị quản lý) | `orgunit:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `buoy` (Phao tiêu) — các trường hiển thị ở chi tiết:**

- `id` (UUID, PK) — Mã định danh
- `code` (VARCHAR(50), UNIQUE) — Mã phao, tiêu — Excel row 8
- `name` (VARCHAR(200), NOT NULL) — Tên phao, tiêu — Excel row 9
- `type` (SMALLINT, BuoyType enum) — Phân loại — Excel row 5
- `subtype` (SMALLINT) — Phân loại phao/tiêu — Excel row 6-7
- `orgUnitId` (UUID, FK) — Đơn vị quản lý — Excel row 3
- `orgUnitName` (VARCHAR, computed via OrgUnitCacheService) — Tên đơn vị quản lý
- `nhaTramId` (UUID, FK → nha_tram_phao) — Thuộc nhà trạm — Excel row 4
- `address` (VARCHAR(500)) — Địa điểm (Tỉnh/TP) — Excel row 10
- `addressDetail` (TEXT) — Địa điểm chi tiết — Excel row 11
- `status` (SMALLINT, BeaconStatus enum) — Trạng thái — Excel row 42
- `approvalStatus` (SMALLINT, ApprovalStatus enum) — Trạng thái phê duyệt
- `approvalLevel` (SMALLINT, ApprovalLevel enum) — Cấp phê duyệt
- `shape` (VARCHAR(50)) — Hình dáng — Excel row 14
- `structure` (TEXT) — Kết cấu — Excel row 15
- `area` (DECIMAL) — Diện tích (m²) — Excel row 16
- `height` (DECIMAL) — Chiều cao thân phao (m) — Excel row 17
- `diameter` (DECIMAL) — Đường kính phao (m) — Excel row 18
- `lightType` (SMALLINT) — Đèn biển — Excel row 19
- `towerHeight` (DECIMAL) — Chiều cao tháp đèn — Excel row 20
- `lightCenterHeight` (DECIMAL, NOT NULL) — Chiều cao tâm sáng (hải đồ) — Excel row 21
- `lightSpecies` (VARCHAR(100)) — Chủng loại đèn — Excel row 22
- `towerColor` (TEXT) — Màu sắc bên ngoài của tháp đèn — Excel row 23
- `lightPowerSource` (TEXT) — Nguồn cung cấp năng lượng cho đèn — Excel row 24
- `lightRange` (DECIMAL, 0.01–100.0) — Phạm vi chiếu sáng — Excel row 25
- `commissionDate` (DATE) — Thời điểm đưa vào sử dụng — Excel row 27
- `lastRepairDate` (DATE) — Thời điểm sửa chữa gần nhất — Excel row 28
- `lightCharacteristic` (TEXT) — Đặc tính ánh sáng — Excel row 29
- `color` (VARCHAR(50)) — Màu sắc — Excel row 30
- `flashType` (VARCHAR(100)) — Kiểu chớp — Excel row 31
- `flashPeriod` (VARCHAR(100)) — Chu kỳ — Excel row 32
- `geometryType` (VARCHAR(20)) — Loại đối tượng (Point/LineString/Polygon) — Excel row 35
- `geometry` (GEOMETRY, SRID=4326) — Tọa độ GIS — Excel row 34
- `symbolId` (UUID, FK) — Biểu tượng — Excel row 36
- `crs` (VARCHAR(50)) — Hệ quy chiếu — Excel row 37
- `displayRule` (TEXT) — Quy tắc hiển thị — Excel row 38
- `creatorId` (UUID, FK) — Người tạo
- `approverL1Id` (UUID, FK) — Người phê duyệt L1 — Excel row 48
- `approverL2Id` (UUID, FK) — Người phê duyệt L2 — Excel row 51
- `submittedAt` (TIMESTAMP) — Ngày gửi phê duyệt — Excel row 45
- `submittedById` (UUID, FK) — Cán bộ gửi phê duyệt — Excel row 46
- `approvedL1At` (TIMESTAMP) — Ngày phê duyệt L1 — Excel row 47
- `approvedL2At` (TIMESTAMP) — Ngày phê duyệt L2 — Excel row 50
- `rejectionReason` (TEXT) — Lý do từ chối — Excel row 49, 52
- `createdAt` (TIMESTAMP) — Thời gian tạo
- `updatedAt` (TIMESTAMP) — Thời gian cập nhật — Excel row 43
- `updatedById` (UUID, FK) — Cán bộ cập nhật — Excel row 44
- `deletedAt` (TIMESTAMP, nullable) — Soft-delete

**Bảng `buoy_attachment` (File đính kèm):**

- `id` (UUID, PK)
- `buoyId` (UUID, FK → buoy.id)
- `fileName` (VARCHAR(255))
- `fileUrl` (VARCHAR(500))
- `fileSize` (BIGINT)
- `uploadedBy` (UUID, FK)
- `uploadedAt` (TIMESTAMP)

**Bảng `beacon_history` (Lịch sử thao tác):**

- `id` (UUID, PK)
- `entityId` (UUID, FK → buoy.id)
- `beaconType` (VARCHAR(50), cố định = 'BUOY')
- `actionType` (VARCHAR(50): CREATE/UPDATE/APPROVE_L1/APPROVE_L2/REJECT/SOFT_DELETE/SUBMIT)
- `changedField` (TEXT)
- `previousValue` (JSON)
- `newValue` (JSON)
- `changedBy` (UUID, FK)
- `changedAt` (TIMESTAMP)
- `rejectionReason` (TEXT, khi actionType = REJECT)
