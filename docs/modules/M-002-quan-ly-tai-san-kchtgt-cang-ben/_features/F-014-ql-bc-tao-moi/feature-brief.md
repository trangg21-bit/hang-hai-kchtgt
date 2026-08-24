---
id: F-014
name: Quản lý Bến cảng - Tạo mới
slug: ql-bc-tao-moi
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:42Z
last-updated: 2026-08-23
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

Bảng dưới đây **khớp 100%** sheet `QL Bến cảng` — file `HH_Tính năng & danh sách các trường thông tin.xlsx` (nguồn sự thật đã được xác nhận): tên trường, loại điều khiển và cờ hiển thị tại 5 màn hình (Danh sách / Bộ lọc / Xem chi tiết / Tạo mới / Sửa) lấy nguyên theo Excel. Quy ước cột Bắt buộc: **Có*** = bắt buộc khi Gửi phê duyệt. Các trường ~~length, width, berthType, channelDepth~~ (Chiều dài, Chiều rộng, Loại bến, Độ sâu kênh) **đã loại bỏ** — theo Excel đây là trường của **Cầu cảng** (sheet `QL Cầu cảng`), không thuộc Bến cảng.

| STT | Tên trường (theo Excel) | Loại điều khiển (theo Excel) | Bắt buộc | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| | **Thông tin chung** | | | | | | | | |
| 1 | Đơn vị quản lý (bắt buộc) | Select | Có | Có | Có | Có | Có | Có | `orgUnitId` — TreeSelect (UUID); cascade với Cảng biển; Admin Cục chọn mọi đơn vị, còn lại auto-fill |
| 2 | Thuộc cảng biển (bắt buộc) | Select | Có | Có | Có | Có | Có | Có | `portId` — TreeSelect (UUID); lọc theo đơn vị + trạng thái đã duyệt; đổi cảng → sinh lại mã |
| 3 | Mã bến cảng | Text (read-only, tự sinh {mã-cảng-mẹ}-B{XX}) | Có (hệ thống tự sinh) | Có | Có | Có | Có | Có | `berthCode` — tự sinh `{mã-cảng-mẹ}-B{XX}`, bất biến |
| 4 | Tên bến cảng (bắt buộc) | Text | Có | Có | Có | Có | Có | Có | `berthName` — bắt buộc ngay cả khi Lưu tạm |
| 5 | Thuộc luồng hàng hải | Select | Không | Có | Có | Có | Có | Có | `waterway` / `waterwayId` |
| 6 | Đơn vị khai thác | Text | Không | Không | Không | Có | Có | Có | `operator` |
| 7 | Địa điểm (Tỉnh/TP) (bắt buộc khi gửi duyệt) | Select | Có* | Có | Có | Có | Có | Có | `provinceId` |
| 8 | Địa điểm chi tiết | Text | Không | Không | Không | Có | Có | Có | `detailedLocation` |
| 9 | Loại kết cấu bến cảng | Select | Không | Có | Có | Có | Có | Có | `structureType` — 4 giá trị danh mục |
| 10 | Công năng khai thác | Text | Không | Có | Có | Có | Có | Có | `operationalFunction` |
| 11 | Tổng diện tích (ha) | Number | Không | Không | Không | Có | Có | Có | `totalArea` — DECIMAL ≥ 0 |
| 12 | Năng lực thông qua thiết kế | Number | Không | Không | Không | Có | Có | Có | `designThroughput` — DECIMAL ≥ 0 |
| 13 | Năng lực thông qua hiện trạng | Number | Không | Không | Không | Có | Có | Có | `currentThroughput` — DECIMAL ≥ 0 |
| 14 | Cỡ tàu tiếp nhận lớn nhất (DWT) | Number | Không | Không | Không | Có | Có | Có | `maxVesselSize` — DECIMAL ≥ 0 |
| 15 | Quy hoạch năng lực thông qua | Number | Không | Không | Không | Có | Có | Có | `plannedThroughput` — DECIMAL ≥ 0 |
| 16 | Sản lượng thực tế năm gần nhất | Number | Không | Không | Không | Có | Có | Có | `latestCargoVolume` — DECIMAL ≥ 0 |
| 17 | Tình trạng (bắt buộc khi gửi duyệt) | Select | Có* | Có | Có | Có | Có | Có | `operationalStatus` — enum NOT_YET_OPERATIONAL / OPERATIONAL / SUSPENDED |
| | **Thông tin công bố** | | | | | | | | |
| 18 | Thời điểm công bố | Date | Không | Không | Không | Có | Có | Có | `openingAnnouncementDate` |
| 19 | Quyết định công bố | Text | Không | Không | Không | Có | Có | Có | `openingDecision` (VARCHAR 500) |
| 20 | Văn bản thỏa thuận | Text | Không | Không | Không | Có | Có | Có | `investmentAgreement` (VARCHAR 2000) |
| | **Thông tin vị trí (GIS + tọa độ)** | | | | | | | | |
| 21 | Loại đối tượng (GIS) | Select | Không | Không | Không | Có | Có | Có | `coordinateSystem`/`displayRule`/`mapSymbolId`/`spatialId` |
| 22 | Biểu tượng (GIS) | Select | Không | Không | Không | Có | Có | Có | (GIS) |
| 23 | Hệ quy chiếu (GIS) | Select | Không | Không | Không | Có | Có | Có | (GIS) |
| 24 | Quy tắc hiển thị (GIS) | Text | Không | Không | Không | Có | Có | Có | (GIS) |
| 25 | Tọa độ GPS (bắt buộc ≥1 khi gửi duyệt) | Bảng con (Vĩ độ, Kinh độ) | Có* | Không | Không | Có | Có | Có | `coordinates[]` — latitude [-90,90], longitude [-180,180]; lưu bảng `berth_coordinate` |
| | **File đính kèm** | | | | | | | | |
| 26 | File đính kèm | Upload | Không | Không | Không | Có | Có | Có | `attachments[]` — PDF/DOC/DOCX/XLS/XLSX/JPG/PNG/TIFF; ≤ 20MB; ≤ 10 files; upload sau khi tạo |
| | **Trạng thái & Kiểm toán (chỉ ở trang Chi tiết/Danh sách)** | | | | | | | | |
| 27 | Trạng thái phê duyệt | Badge (read-only) | Không (read-only) | Có | Có | Có | Không | Không | `approvalStatus` — 7 trạng thái (tài liệu nền mục 3.5) |
| | **Thông tin log cập nhật** | | | | | | | | |
| 28 | Ngày cập nhật | DatePicker | Không (read-only) | Có | Có | Có | Không | Không | Chỉ Danh sách/Chi tiết — Admin Cục / admin-operation |
| 29 | Cán bộ cập nhật | Text (read-only) | Không (read-only) | Có | Không | Có | Không | Không | Chỉ Danh sách/Chi tiết — Admin Cục / admin-operation |
| 30 | Ngày gửi phê duyệt | Textarea | Không (read-only) | Có | Không | Có | Không | Không | `submittedForApprovalAt` |
| 31 | Cán bộ gửi phê duyệt | Textarea | Không (read-only) | Có | Không | Có | Không | Không | `submittedForApprovalBy` |
| 32 | Ngày phê duyệt cấp Cảng vụ/Chi cục | Textarea | Không (read-only) | Có | Không | Có | Không | Không | `portAuthorityApprovedAt` |
| 33 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | Textarea | Không (read-only) | Có | Không | Có | Không | Không | `portAuthorityApprovedBy` |
| 34 | Nội dung phê duyệt | Textarea | Không (read-only) | Có | Không | Có | Không | Không | `portAuthorityApprovalContent` |
| 35 | Ngày phê duyệt cấp Cục | Textarea | Không (read-only) | Có | Không | Có | Không | Không | `departmentApprovedAt` |
| 36 | Cán bộ phê duyệt cấp Cục | Textarea | Không (read-only) | Có | Không | Có | Không | Không | `departmentApprovedBy` |
| 37 | Nội dung phê duyệt | Textarea | Không (read-only) | Có | Không | Có | Không | Không | `departmentApprovalContent` |
| | **Kết cấu hạ tầng thuộc cầu cảng** | | | | | | | | |
| 38 | Tên kết cấu hạ tầng | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 39 | Loại kết cấu hạ tầng | Dropdown (bộ lọc) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| | **Thông tin vận hành khai thác** | | | | | | | | |
| 40 | Mã kế hoạch | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 41 | Tên kế hoạch | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 42 | Ngày bắt đầu | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 43 | Ngày kết thúc | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| | **Thông tin bảo trì** | | | | | | | | |
| 44 | Mã kế hoạch | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 45 | Tên kế hoạch | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 46 | Thời gian bắt đầu | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 47 | Thời gian kết thúc | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| | **Thông tin sự cố** | | | | | | | | |
| 48 | Mã sự cố | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 49 | Loại sự cố | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 50 | Địa điểm | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 51 | Thời gian | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.5 (7 trạng thái → enum `ApprovalStatus`) và quy trình 2 cấp tại `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`.
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
| 1 | Trạng thái riêng | Không — dùng 7 trạng thái chung (tài liệu nền mục 3.5) |
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

**Bảng `berths`** (Bến cảng — cấu trúc theo entity `Berth`): id (UUID PK), berthCode (VARCHAR 50, UNIQUE, NOT NULL), berthName (VARCHAR 255, NOT NULL), portId (UUID, NOT NULL FK → ports), waterway (VARCHAR 255), waterwayId (UUID), ~~length (DECIMAL 15,2)~~, ~~width (DECIMAL 15,2)~~, ~~berthType (SMALLINT — enum `BerthType`)~~, ~~channelDepth (DECIMAL 10,2)~~, operationalStatus (SMALLINT — enum `OperationalStatus`), approvalStatus (SMALLINT, NOT NULL), orgUnitId (UUID, NOT NULL), securityLevel (SMALLINT, default NORMAL), operationalFunction (VARCHAR 255), mapSymbolId (UUID), spatialId (UUID), provinceId (INT), detailedLocation (VARCHAR 500), coordinateSystem (INT), displayRule (INT), operator (VARCHAR 255), totalArea (DECIMAL 19,4), designThroughput (DECIMAL 19,4), currentThroughput (DECIMAL 19,4), maxVesselSize (DECIMAL 19,4), plannedThroughput (DECIMAL 19,4), latestCargoVolume (DECIMAL 19,4), openingAnnouncementDate (TIMESTAMP), openingDecision (VARCHAR 500), investmentAgreement (VARCHAR 2000), structureType (INT), activityStatus (VARCHAR 50) + các trường theo dõi phê duyệt 2 cấp (submittedForApprovalAt/By, portAuthorityApprovedAt/By, portAuthorityApprovalContent, departmentApprovedAt/By, departmentApprovalContent, rejectionReason) + audit từ `BaseEntity`; filter `orgUnitFilter` + `recordSecurityLevelFilter`.

**Bảng con:** `berth_coordinate` (id, berthId FK, latitude DECIMAL(9,6) NOT NULL, longitude DECIMAL(9,6) NOT NULL, sortOrder INT) — ≥ 1 bản ghi khi submit; `berth_attachment` (id, berthId FK, fileName, filePath, fileSize, contentType, uploadedBy, uploadedAt).
