---
id: F-026
name: Quản lý Cảng cạn - Tạo mới
slug: ql-cct-tao-moi
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-21
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Cảng cạn - Tạo mới

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-026 — Quản lý Cảng cạn - Tạo mới
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng có bước phê duyệt (luồng Lưu tạm / Gửi phê duyệt / Lưu và phê duyệt)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

---

## 1. Mô tả ngắn

Cho phép người dùng có thẩm quyền (`dryport:create`) khai báo một Cảng cạn (ICD — Inland Container Depot) mới. Khi mở form, hệ thống tự động sinh **Mã cảng cạn** dạng CC-XXXXXX (read-only, bất biến sau khi lưu). Form gồm 4 nhóm, 25 trường: Thông tin chung (15 — bắt buộc: ĐVQL, Tên, Tỉnh/TP, Địa chỉ chi tiết, Công suất, Tình trạng), Thông tin công bố (4), Vị trí GIS (5 + bảng tọa độ), File đính kèm. Hai lựa chọn trên form: **Lưu tạm** (chỉ cần tên, trạng thái nháp) và **Lưu và phê duyệt** (cần `dryport:approve`, duyệt ngay). **Gửi phê duyệt** là hành động trên màn hình Danh sách (F-030/F-083): chọn bản ghi nháp → gửi vào quy trình phê duyệt. Mặc định tình trạng = CHUA_KHAI_THAC.

## 2. Trường dữ liệu

Cấu trúc theo entity `DryPort` (`src/main/java/com/hanghai/kchtg/port/entity/DryPort.java`, bảng `dry_ports`) + bảng con tọa độ GIS và file đính kèm. Các trường từ `BaseEntity` không liệt kê lại.

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | dryPortCode | Có | Text (VARCHAR 50), UNIQUE, read-only | Mã tự sinh CC-XXXXXX, bất biến |
| 2 | dryPortName | Có | Text (VARCHAR 255) | Tên cảng cạn — bắt buộc cả khi Lưu tạm |
| 3 | orgUnitId | Có | TreeSelect (UUID) | Đơn vị quản lý; Admin Cục chọn mọi đơn vị, còn lại auto-fill |
| 4 | provinceId | Có* | Select (Integer) | Tỉnh/TP — bắt buộc khi Lưu và phê duyệt |
| 5 | detailedLocation | Có* | Text (VARCHAR 500) | Địa chỉ chi tiết — bắt buộc khi Lưu và phê duyệt |
| 6 | teuCapacity | Có* | Number (DECIMAL 15,2) ≥ 0 | Công suất — bắt buộc khi Lưu và phê duyệt |
| 7 | portStatus | Có* | Select (Integer) | Tình trạng (1 = hoạt động...) — bắt buộc khi Lưu và phê duyệt; mặc định CHUA_KHAI_THAC |
| 8 | operatingUnit | Không | Text (VARCHAR 255) | Đơn vị khai thác |
| 9 | region | Không | Text (VARCHAR 255) | Khu vực |
| 10 | transportCorridor | Không | Text (VARCHAR 255) | Hành lang vận tải |
| 11 | area | Không | Number (DECIMAL 15,2) ≥ 0 | Diện tích |
| 12 | warehouseArea, yardArea | Không | Number (DECIMAL 15,2) ≥ 0 | Diện tích kho / bãi |
| 13 | connectionMode | Không | Text (VARCHAR 500) | Phương thức kết nối |
| 14 | remarks | Không | TextArea (VARCHAR 1000) | Ghi chú |
| 15 | announcementTime, announcementDecisionNumber, announcementDecisionDate, announcementOrg | Không | DateTime / Text (100) / Date / Text (255) | Thông tin công bố |
| 16 | coordinateSystem, displayRule, mapSymbolId, spatialId | Không | Number / UUID | Thông tin vị trí (GIS) |
| 17 | coordinates[] (GIS) | Không | Danh sách (kinh độ E [-180,180], vĩ độ N [-90,90]) | Bảng tọa độ |
| 18 | attachments[] | Không | File ≤ 20MB, ≤ 10 files | File đính kèm |
| 19 | operationalStatus | Không | Enum `OperationalStatus` | Trạng thái hoạt động |
| 20 | approvalStatus | Có (hệ thống) | Enum `ApprovalStatus` (lưu số 0..6) | Theo tài liệu nền mục 3.5 |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.5 (7 trạng thái → enum `ApprovalStatus`) và quy trình 2 cấp tại `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`.
- **Lưu tạm:** tối thiểu tên cảng cạn (mã đã tự sinh) → trạng thái nháp (`DRAFT`), form ở lại để sửa tiếp (F-027).
- **Lưu và phê duyệt** (người có `dryport:approve`): đầy đủ 6 trường bắt buộc → trạng thái đã duyệt ngay + ghi approval log (ngoại lệ "lưu thẳng Đã duyệt" theo file chuẩn).
- **Gửi phê duyệt** (từ màn hình Danh sách F-030): bản ghi nháp → kiểm tra đủ 6 trường bắt buộc → hồ sơ vào quy trình phê duyệt (duyệt tại F-029).
- Mã CC-XXXXXX sinh 1 lần khi mở form, bất biến sau khi lưu (kể cả lưu tạm).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-026-01 | Mã CC-XXXXXX tự sinh (`GET /api/v1/dry-ports/generate-code`), bất biến — kể cả lưu tạm hay lưu và phê duyệt | Create |
| BR-026-02 | Lưu tạm: tối thiểu tên cảng cạn (mã tự sinh), trạng thái nháp | Create (draft) |
| BR-026-03 | Lưu và phê duyệt: đầy đủ 6 trường (ĐVQL, Tên, Tỉnh/TP, Địa chỉ chi tiết, Công suất, Tình trạng); cần `dryport:approve` | Create (approve) |
| BR-026-04 | Gửi phê duyệt từ danh sách: bản ghi nháp + đủ 6 trường bắt buộc → vào quy trình phê duyệt | Submit |
| BR-026-05 | Diện tích / công suất < 0 → lỗi "Giá trị không được âm" | Create |
| BR-026-06 | Tọa độ GIS: kinh độ [-180, 180], vĩ độ [-90, 90] | Create |
| BR-026-07 | File đính kèm ≤ 20MB, ≤ 10 files | Upload |
| BR-026-08 | Đơn vị QL gán theo tài liệu nền mục 3.3 — không để NULL; dropdown theo đơn vị | Create |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Tạo mới, Lưu tạm | `dryport:create` |
| Lưu và phê duyệt | `dryport:create` + `dryport:approve` |
| Gửi phê duyệt (từ danh sách) | `dryport:update` |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Toàn quyền |
| Lãnh đạo | Thường được gán `dryport:approve` (duyệt + lưu và phê duyệt) |
| admin / admin-operation / Cán bộ | Tạo mới, Lưu tạm, Gửi phê duyệt theo quyền được gán |
| Cá nhân | Không truy cập |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — full quyền + xem metadata người tạo/người sửa/thời gian.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — dùng 7 trạng thái chung (tài liệu nền mục 3.5) |
| 2 | Có bước phê duyệt không | Có — Gửi phê duyệt (từ danh sách) / Lưu và phê duyệt (có `dryport:approve`) |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị (orgUnitId — tài liệu nền mục 3.3); Cảng cạn độc lập, không có cha |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — nút "Lưu và phê duyệt" chỉ hiện khi có `dryport:approve` |
| 5 | Quyền riêng | `dryport:create` (kèm `dryport:approve`, `dryport:update`) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — file đính kèm ≤ 20MB, ≤ 10 files |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/dry-ports/generate-code` | Sinh mã cảng cạn CC-XXXXXX | `dryport:create` |
| POST | `/api/v1/dry-ports` | Tạo mới (body: thông tin + coordinates[] + action `draft`/`approve`) | `dryport:create` |
| PUT | `/api/v1/dry-ports/{id}?action=submit` | Gửi phê duyệt từ danh sách (nháp → chờ duyệt) | `dryport:update` |
| POST | `/api/v1/dry-ports/{id}/attachments` | Upload file đính kèm | `dryport:create` / `dryport:update` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `dry_ports`** (Cảng cạn — cấu trúc theo entity `DryPort`): id (UUID PK), dryPortCode (VARCHAR 50, UNIQUE, NOT NULL), dryPortName (VARCHAR 255, NOT NULL), provinceId (INT), area (DECIMAL 15,2), teuCapacity (DECIMAL 15,2), operationalStatus (SMALLINT — enum `OperationalStatus`), approvalStatus (SMALLINT, NOT NULL), orgUnitId (UUID, NOT NULL), securityLevel (SMALLINT, default NORMAL), mapSymbolId (UUID), spatialId (UUID), operatingUnit (VARCHAR 255), region (VARCHAR 255), detailedLocation (VARCHAR 500), transportCorridor (VARCHAR 255), warehouseArea (DECIMAL 15,2), yardArea (DECIMAL 15,2), connectionMode (VARCHAR 500), portStatus (INT, NOT NULL), remarks (VARCHAR 1000), announcementTime (TIMESTAMP), announcementDecisionNumber (VARCHAR 100), announcementDecisionDate (DATE), announcementOrg (VARCHAR 255), coordinateSystem (INT), displayRule (INT) + audit từ `BaseEntity`; filter `orgUnitFilter` + `recordSecurityLevelFilter`.

**Bảng con:** bảng tọa độ GIS (dryPortId, latitude, longitude) + bảng `dry_port_attachments` (dryPortId FK, fileName, filePath, fileSize, contentType, uploadedBy, uploadedAt).
