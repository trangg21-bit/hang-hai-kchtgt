---
id: F-032
name: Quản lý Vùng nước - Tạo mới
slug: ql-vn-tao-moi
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-21
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Vùng nước - Tạo mới

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-032 — Quản lý Vùng nước - Tạo mới
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng có bước phê duyệt (hồ sơ tạo mới vào quy trình phê duyệt)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung. (Nội dung merge từ F-032 BE + F-090 UI.)

---

## 1. Mô tả ngắn

Cho phép người dùng có thẩm quyền (`waterzone:create`) tạo mới một Vùng nước thuộc Cảng biển (mẹ) qua modal form với Zod validation và kiểm tra unique mã real-time. Form gồm 3 nhóm: **Thông tin chung** (4 trường), **Thống kê** (3 trường), **Trạng thái** (1 trường). Có thể để trống `waterZoneCode` — hệ thống tự sinh mã (quy tắc VN-XXXXXX, unique). Sau khi tạo, hồ sơ vào trạng thái chờ phê duyệt (theo tài liệu nền mục 3.5) và chờ xử lý tại F-035.

## 2. Trường dữ liệu

Cấu trúc theo entity `WaterZone` (`src/main/java/com/hanghai/kchtg/port/entity/WaterZone.java`, bảng `water_zones`) + bảng con tọa độ GIS và file đính kèm. Các trường từ `BaseEntity` không liệt kê lại.

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | waterZoneCode | Không* | Text (VARCHAR 50), UNIQUE | *Tự sinh VN-XXXXXX nếu để trống; unique case-insensitive |
| 2 | waterZoneName | Có | Text (VARCHAR 255) | Tên vùng nước; không trùng tên vùng nước đã tồn tại |
| 3 | portId | Có | Select (UUID) | Cảng biển mẹ — chỉ hiển thị cảng đang hoạt động (operationalStatus = OPERATIONAL) |
| 4 | orgUnitId | Có | TreeSelect (UUID) | Đơn vị quản lý — theo tài liệu nền mục 3.3; Admin Cục chọn mọi đơn vị, còn lại phạm vi đơn vị mình |
| 5 | area | Không | Number (DECIMAL 15,2) ≥ 0 | Diện tích (m²) |
| 6 | maxDepth | Không | Number (DECIMAL 10,2) ≥ 0 | Độ sâu tối đa (m) |
| 7 | avgDepth | Không | Number (DECIMAL 10,2) ≥ 0 | Độ sâu trung bình (m) |
| 8 | waterZoneType | Không | Select (enum `WaterZoneType`: ANCHORAGE / PILOT_BOARDING / TURNING_BASIN / MOORING_BUOY / TRANSSHIPMENT / STORM_SHELTER) | Loại vùng nước |
| 9 | operationalStatus | Không | Select (enum `OperationalStatus`), default OPERATIONAL | Trạng thái hoạt động |
| 10 | provinceId | Không | Number (Integer) | Tỉnh/TP |
| 11 | mapSymbolId, spatialId | Không | UUID | Thông tin GIS |
| 12 | coordinates[] | Không | Danh sách (latitude/longitude) | Tọa độ GIS |
| 13 | attachments[] | Không | File (giấy tờ) | File đính kèm |
| 14 | approvalStatus | Có (hệ thống) | Enum `ApprovalStatus` (7 trạng thái, lưu số theo tài liệu nền mục 3.5) | Hồ sơ mới → trạng thái chờ duyệt (theo tài liệu nền mục 3.5) |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.5 (7 trạng thái → enum `ApprovalStatus`) và quy trình 2 cấp tại `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`.
- Hồ sơ tạo mới có trạng thái mặc định **chờ duyệt** (theo file chuẩn — hồ sơ mới phải qua phê duyệt trước khi có hiệu lực); quy trình duyệt thuộc F-035.
- Mã vùng nước (nhập hoặc tự sinh) duy nhất toàn hệ thống, bất biến sau khi tạo.
- Không được gửi hồ sơ khi thiếu trường bắt buộc (tên, cảng mẹ).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-032-01 | `waterZoneCode` duy nhất toàn hệ thống (case-insensitive); kiểm tra real-time khi blur | Create |
| BR-032-02 | `waterZoneName` không trùng với vùng nước đã tồn tại | Create |
| BR-032-03 | Hồ sơ mới có trạng thái mặc định chờ duyệt (theo file chuẩn) | Create |
| BR-032-04 | Trường bắt buộc: tên, cảng mẹ; mã tự sinh nếu để trống | Create |
| BR-032-05 | `portId` phải là cảng đang hoạt động (operationalStatus = OPERATIONAL) | Create |
| BR-032-06 | Mã tự sinh theo quy tắc VN-XXXXXX, unique | Create |
| BR-032-07 | Chuyên viên chỉ tạo trong phạm vi đơn vị của mình (data scope — tài liệu nền mục 3.3); Admin Cục tạo mọi đơn vị | Create |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Tạo mới Vùng nước | `waterzone:create` |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Tạo không giới hạn đơn vị |
| Lãnh đạo (LeDuan) | Tạo mới |
| Chuyên viên Cục / Cảng vụ | Tạo trong phạm vi đơn vị |
| Doanh nghiệp cảng | Tạo trong phạm vi đơn vị |
| Nhân viên vận hành | Không tạo |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — tạo không giới hạn đơn vị + xem metadata người tạo/người sửa/thời gian.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — dùng 7 trạng thái chung (tài liệu nền mục 3.5); hồ sơ mới mặc định chờ duyệt |
| 2 | Có bước phê duyệt không | Có — hồ sơ tạo mới vào quy trình phê duyệt (duyệt tại F-035) |
| 3 | Lọc cha-con / theo đơn vị | Có — theo đơn vị (orgUnitId) + theo Cảng biển mẹ (portId) |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `waterzone:create` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — file/giấy tờ đính kèm |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/ports?operationalStatus=OPERATIONAL` | Dropdown cảng mẹ | `waterzone:create` |
| GET | `/api/v1/water-zones?waterZoneCode={value}` | Kiểm tra unique mã | `waterzone:create` |
| POST | `/api/v1/water-zones` | Tạo mới (backend tự sinh mã nếu waterZoneCode trống) | `waterzone:create` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `water_zones`** (Vùng nước — cấu trúc theo entity `WaterZone`): id (UUID PK), waterZoneCode (VARCHAR 50, UNIQUE, NOT NULL), waterZoneName (VARCHAR 255, NOT NULL), portId (UUID, NOT NULL FK → ports), provinceId (INT), area (DECIMAL 15,2), maxDepth (DECIMAL 10,2), avgDepth (DECIMAL 10,2), waterZoneType (SMALLINT — enum `WaterZoneType`), operationalStatus (SMALLINT — enum `OperationalStatus`), approvalStatus (SMALLINT, NOT NULL), orgUnitId (UUID), securityLevel (SMALLINT, default NORMAL), mapSymbolId (UUID), spatialId (UUID) + audit từ `BaseEntity`; filter `orgUnitFilter` + `recordSecurityLevelFilter`.

**Bảng con:** bảng tọa độ GIS (waterZoneId, latitude, longitude) + bảng file đính kèm / giấy tờ (waterZoneId, fileName, fileSize, contentType, uploadedBy, uploadedAt).
