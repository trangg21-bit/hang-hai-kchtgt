---
id: F-014
name: Quản lý Bến cảng - Tạo mới
slug: ql-bc-tao-moi
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:42Z
last-updated: 2026-08-21
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Bến cảng - Tạo mới

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-014 — Quản lý Bến cảng - Tạo mới
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng có bước phê duyệt (luồng Lưu tạm / Gửi phê duyệt 2 cấp / Lưu và phê duyệt)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

---

## 1. Mô tả ngắn

Cho phép người dùng có thẩm quyền (`berth:create`) đăng ký một Bến cảng mới, thuộc một Cảng biển (cha). Người dùng chọn **Đơn vị quản lý** → chọn **Cảng biển** (lọc theo đơn vị, trạng thái đã duyệt) → hệ thống **tự động sinh mã bến** theo quy tắc `{mã-cảng-mẹ}-B{XX}` (bất biến sau khi tạo). Form gồm 4 nhóm: Thông tin chung, Thông tin công bố, Thông tin vị trí (GIS + tọa độ GPS), File đính kèm. Ba lựa chọn lưu: **Lưu tạm** (nháp), **Gửi phê duyệt** (vào quy trình 2 cấp: Cảng vụ/Chi cục → Cục), **Lưu và phê duyệt** (chỉ admin-operation / system-admin — đạt trạng thái đã duyệt ngay).

## 2. Trường dữ liệu

Cấu trúc theo entity `Berth` (`src/main/java/com/hanghai/kchtg/port/entity/Berth.java`, bảng `berths`) + bảng con tọa độ và file đính kèm. Các trường từ `BaseEntity` không liệt kê lại.

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | berthCode | Có | Text (VARCHAR 50), UNIQUE, read-only | Mã tự sinh `{mã-cảng-mẹ}-B{XX}`, bất biến |
| 2 | berthName | Có | Text (VARCHAR 255) | Tên bến — bắt buộc ngay cả khi Lưu tạm |
| 3 | portId | Có | TreeSelect (UUID) | Thuộc Cảng biển; lọc theo đơn vị + trạng thái đã duyệt; đổi cảng → sinh lại mã |
| 4 | orgUnitId | Có | TreeSelect (UUID) | Đơn vị quản lý (cascade với cảng); Admin Cục chọn mọi đơn vị, còn lại auto-fill |
| 5 | provinceId | Có* | Number (Integer) | Tỉnh/TP — bắt buộc khi Gửi phê duyệt |
| 6 | operationalStatus | Có* | Select (enum `OperationalStatus`: NOT_YET_OPERATIONAL / OPERATIONAL / SUSPENDED) | Tình trạng — bắt buộc khi Gửi phê duyệt |
| 7 | waterway / waterwayId | Không | Text (255) / UUID | Thuộc luồng hàng hải |
| 8 | operator | Không | Text (VARCHAR 255) | Đơn vị khai thác |
| 9 | length, width | Không | Number (DECIMAL 15,2) ≥ 0 | Chiều dài, chiều rộng |
| 10 | berthType | Không | Select (enum `BerthType`: CONTAINER / GENERAL_CARGO / SPECIALIZED / PASSENGER / MOORING_BUOY / INLAND_WATERWAY) | Loại bến |
| 11 | channelDepth | Không | Number (DECIMAL 10,2) ≥ 0 | Độ sâu kênh |
| 12 | structureType | Không | Number (Integer) | Loại kết cấu (4 giá trị danh mục) |
| 13 | operationalFunction | Không | Text (VARCHAR 255) | Công năng khai thác |
| 14 | totalArea | Không | Number (DECIMAL 19,4) ≥ 0 | Tổng diện tích (ha) |
| 15 | designThroughput / currentThroughput / plannedThroughput | Không | Number (DECIMAL 19,4) ≥ 0 | Năng lực thông qua thiết kế / hiện trạng / quy hoạch |
| 16 | maxVesselSize | Không | Number (DECIMAL 19,4) ≥ 0 | Cỡ tàu tiếp nhận lớn nhất (DWT) |
| 17 | latestCargoVolume | Không | Number (DECIMAL 19,4) ≥ 0 | Sản lượng thực tế năm gần nhất |
| 18 | openingAnnouncementDate / openingDecision / investmentAgreement | Không | DateTime / Text (500) / TextArea (2000) | Thông tin công bố |
| 19 | detailedLocation, coordinateSystem, displayRule, mapSymbolId, spatialId | Không | Text / Number / UUID | Thông tin vị trí (GIS) |
| 20 | coordinates[] | Có* | Danh sách (latitude [-90,90], longitude [-180,180]) | ≥ 1 tọa độ khi Gửi phê duyệt |
| 21 | attachments[] | Không | File: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF; ≤ 20MB; ≤ 10 files | Upload sau khi tạo |
| 22 | approvalStatus | Có (hệ thống) | Enum `ApprovalStatus` (lưu dạng số (10 giá trị có label)) | Theo tài liệu nền mục 3.5 |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.5 (các trạng thái enum `ApprovalStatus` — 10 giá trị có label) và quy trình 2 cấp tại `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`.
- **Lưu tạm:** tối thiểu đơn vị QL + Cảng biển + Tên bến → trạng thái `DRAFT` (nháp), chỉnh sửa tiếp được.
- **Gửi phê duyệt:** đầy đủ trường bắt buộc (ĐVQL, Cảng biển, Tên bến, Tỉnh/TP, Tình trạng, ≥ 1 GPS) → hồ sơ vào quy trình 2 cấp (vòng 1: Cảng vụ/Chi cục; vòng 2: Cục); ghi nhận người/ngày gửi phê duyệt (`submittedForApprovalBy`/`submittedForApprovalAt` — tương ứng entity `Berth`).
- **Lưu và phê duyệt** (chỉ admin-operation / system-admin): đạt trạng thái đã duyệt ngay, tạo PheDuyetLog cấp Cục (ngoại lệ đã chốt của quy trình — đường "lưu thẳng Đã duyệt" dùng cho dữ liệu tích hợp theo file chuẩn, BA/SA cần xác nhận phạm vi áp dụng).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-014-01 | Mã bến tự động sinh `{mã-cảng-mẹ}-B{XX}`, duy nhất, bất biến; server kiểm tra mã không bị sửa | Create |
| BR-014-02 | Cascade ĐVQL → Cảng biển: danh sách cảng lọc theo đơn vị + trạng thái đã duyệt; đổi cảng → sinh lại mã | Create |
| BR-014-03 | Lưu tạm: tối thiểu ĐVQL + Cảng biển + Tên bến, trạng thái `DRAFT` | Create (draft) |
| BR-014-04 | Gửi phê duyệt: bắt buộc ĐVQL, Cảng biển, Tên bến, Tỉnh/TP, Tình trạng, ≥ 1 GPS | Create (submit) |
| BR-014-05 | GPS hợp lệ: vĩ độ [-90, 90], kinh độ [-180, 180]; số liệu ≥ 0 | Create |
| BR-014-06 | Ghi nhận ngày/người gửi phê duyệt (`submittedForApprovalAt`/`By`) khi Gửi phê duyệt | Create (submit) |
| BR-014-07 | File đính kèm: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF; ≤ 20MB; ≤ 10 files | Upload |
| BR-014-08 | Đơn vị QL gán theo tài liệu nền mục 3.3 — không để NULL; validate phạm vi khi ghi | Create |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Tạo mới, Lưu tạm, Gửi phê duyệt | `berth:create` |
| Lưu và phê duyệt | `berth:create` + quyền phê duyệt nhanh (admin-operation / system-admin — SA chốt) |
| Upload / xóa file đính kèm | `berth:create` |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Toàn quyền (kể cả Lưu và phê duyệt) |
| admin-operation | Tạo mới, Lưu tạm, Gửi PD, Lưu và phê duyệt |
| admin | Tạo mới, Lưu tạm (không Gửi PD, không Lưu và phê duyệt) |
| Chuyên viên / Lãnh đạo đơn vị | Tạo mới, Lưu tạm (ĐVQL auto-fill) |
| Lãnh đạo (cấp Cục) | Không tạo mới — chỉ duyệt từ F-017 |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — full quyền + xem metadata người tạo/người sửa/thời gian.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — dùng các trạng thái enum `ApprovalStatus` (tài liệu nền mục 3.5) |
| 2 | Có bước phê duyệt không | Có — Gửi phê duyệt 2 cấp (duyệt tại F-017); Lưu và phê duyệt (admin-operation/system-admin) |
| 3 | Lọc cha-con / theo đơn vị | Có — theo đơn vị (orgUnitId) + theo Cảng biển cha (portId); cascade ĐVQL → Cảng biển |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — nút "Lưu và phê duyệt" chỉ hiện với admin-operation / system-admin |
| 5 | Quyền riêng | `berth:create` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — file đính kèm: PDF/DOC/DOCX/XLS/XLSX/JPG/PNG/TIFF, ≤ 20MB, ≤ 10 files |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/berths/generate-code?portId=` | Sinh mã bến `{mã-cảng-mẹ}-B{XX}` | `berth:create` |
| GET | `/api/v1/ports?orgUnitId=&status=APPROVED` | Danh sách Cảng biển để chọn (theo đơn vị, đã duyệt) | `berth:create` |
| POST | `/api/v1/berths` | Tạo mới (body: thông tin + coordinates[] + action `draft`/`submit`/`approve`), 1 transaction | `berth:create` |
| POST | `/api/v1/berths/{id}/attachments` | Upload file đính kèm | `berth:create` |
| DELETE | `/api/v1/berths/{id}/attachments/{attId}` | Xóa file đính kèm (khi nháp) | `berth:create` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `berths`** (Bến cảng — cấu trúc theo entity `Berth`): id (UUID PK), berthCode (VARCHAR 50, UNIQUE, NOT NULL), berthName (VARCHAR 255, NOT NULL), portId (UUID, NOT NULL FK → ports), waterway (VARCHAR 255), waterwayId (UUID), length (DECIMAL 15,2), width (DECIMAL 15,2), berthType (SMALLINT — enum `BerthType`), channelDepth (DECIMAL 10,2), operationalStatus (SMALLINT — enum `OperationalStatus`), approvalStatus (SMALLINT, NOT NULL), orgUnitId (UUID, NOT NULL), securityLevel (SMALLINT, default NORMAL), operationalFunction (VARCHAR 255), mapSymbolId (UUID), spatialId (UUID), provinceId (INT), detailedLocation (VARCHAR 500), coordinateSystem (INT), displayRule (INT), operator (VARCHAR 255), totalArea (DECIMAL 19,4), designThroughput (DECIMAL 19,4), currentThroughput (DECIMAL 19,4), maxVesselSize (DECIMAL 19,4), plannedThroughput (DECIMAL 19,4), latestCargoVolume (DECIMAL 19,4), openingAnnouncementDate (TIMESTAMP), openingDecision (VARCHAR 500), investmentAgreement (VARCHAR 2000), structureType (INT), activityStatus (VARCHAR 50) + các trường theo dõi phê duyệt 2 cấp (submittedForApprovalAt/By, portAuthorityApprovedAt/By, portAuthorityApprovalContent, departmentApprovedAt/By, departmentApprovalContent, rejectionReason) + audit từ `BaseEntity`; filter `orgUnitFilter` + `recordSecurityLevelFilter`.

**Bảng con:** `berth_coordinate` (id, berthId FK, latitude DECIMAL(9,6) NOT NULL, longitude DECIMAL(9,6) NOT NULL, sortOrder INT) — ≥ 1 bản ghi khi submit; `berth_attachment` (id, berthId FK, fileName, filePath, fileSize, contentType, uploadedBy, uploadedAt).
