---
id: F-008
name: Quản lý Cảng biển - Tạo mới
slug: ql-cb-tao-moi
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-16T04:40:32Z
last-updated: 2026-08-23
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Cảng biển - Tạo mới

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-008 — Quản lý Cảng biển - Tạo mới
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng có bước phê duyệt (luồng Lưu tạm / Gửi phê duyệt 2 cấp — quy trình chung tại tài liệu nền mục 3.5)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung (phân quyền, data scope, lịch sử, quy ước giao diện).

---

## 1. Mô tả ngắn

Tạo mới Cảng biển cho phép người dùng có thẩm quyền (`port:create`) đăng ký một Cảng biển mới vào hệ thống. Người dùng nhập thông tin theo form phức hợp (thông tin chung + chỉ số tổng hợp + GIS + tọa độ GPS + công trình KCHT trực thuộc), hệ thống tự động sinh mã cảng và kiểm tra tính hợp lệ. Người dùng có hai lựa chọn: **Lưu tạm** (trạng thái nháp, chỉnh sửa tiếp được) hoặc **Gửi phê duyệt** (đưa hồ sơ vào quy trình phê duyệt 2 cấp, thuộc F-011). Mã cảng sau khi tạo là bất biến. File đính kèm được upload sau khi cảng đã có id.

## 2. Trường dữ liệu

Cấu trúc theo entity `Port` (`src/main/java/com/hanghai/kchtg/port/entity/Port.java`, bảng `ports`) + các bảng con `PortCoordinate` (tọa độ GPS), `PortInfrastructure` (công trình KCHT), `PortAttachment` (file đính kèm). Các trường từ `BaseEntity` (id, createdAt, updatedAt, deletedAt, createdBy, updatedBy, deletedBy) không liệt kê lại.

Bảng dưới đây **khớp 100%** sheet `QL Cảng biển` — file `HH_Tính năng & danh sách các trường thông tin.xlsx` (nguồn sự thật đã được xác nhận): tên trường, loại điều khiển và cờ hiển thị tại 5 màn hình (Danh sách / Bộ lọc / Xem chi tiết / Tạo mới / Sửa) lấy nguyên theo Excel. Quy ước cột Bắt buộc: **Có*** = bắt buộc khi Gửi phê duyệt.

| STT | Tên trường (theo Excel) | Loại điều khiển (theo Excel) | Bắt buộc | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| | **Thông tin chung** | | | | | | | | |
| 1 | Mã cảng biển | Text (read-only, tự sinh CB-XXXXXX) | Có (hệ thống tự sinh) | Không | Có | Có | Có | Có | `portCode` — tự sinh CB-XXXXXX, bất biến, read-only |
| 2 | Đơn vị quản lý (bắt buộc khi gửi duyệt) | Select | Có* | Có | Có | Có | Có | Có | `orgUnitId` — TreeSelect, nguồn gán theo tài liệu nền mục 3.3 |
| 3 | Nhóm cảng biển | Select | Không | Có | Có | Có | Có | Có | `portGroup` |
| 4 | Tên cảng biển (bắt buộc) | Text | Có | Có | Có | Có | Có | Có | `portName` — bắt buộc cả khi Lưu tạm |
| 5 | Tỉnh/Thành phố (bắt buộc khi gửi duyệt) | Select | Có* | Có | Có | Có | Có | Có | `province` |
| 6 | Địa điểm chi tiết | Text | Không | Không | Không | Có | Có | Có | `detailedLocation` |
| 7 | Phân cấp cảng biển (bắt buộc khi gửi duyệt) | Select | Có* | Có | Có | Có | Có | Có | `portClass` — phân cấp I/II/III |
| 8 | Phạm vi vùng nước | TextArea | Không | Không | Không | Có | Có | Có | `waterAreaScope` |
| | **Chỉ số tổng hợp** | | | | | | | | |
| 9 | Tổng số bến cảng | Number | Không | Không | Không | Có | Có | Có | `totalBerths` |
| 10 | Tổng số khu neo đậu, khu chuyển tải | Number | Không | Không | Không | Có | Có | Có | `totalAnchoragesTransshipment` |
| 11 | Tổng số tuyến luồng HH công cộng | Number | Không | Không | Không | Có | Có | Có | `totalPublicChannels` |
| 12 | Tổng số tuyến luồng HH chuyên dùng | Number | Không | Không | Không | Có | Có | Có | `totalDedicatedChannels` |
| 13 | Tổng chiều dài luồng HH công cộng (km) | Number | Không | Không | Không | Có | Có | Có | `totalPublicChannelLength` |
| 14 | Tổng chiều dài luồng HH chuyên dùng (km) | Number | Không | Không | Không | Có | Có | Có | `totalDedicatedChannelLength` |
| 15 | Tổng số phao tiêu, báo hiệu HH trên luồng | Number | Không | Không | Không | Có | Có | Có | `totalBuoysBeacons` |
| 16 | Tổng số đê, kè | Number | Không | Không | Không | Có | Có | Có | `totalDikes` |
| 17 | Tổng chiều dài hệ thống đê, kè (km) | Number | Không | Không | Không | Có | Có | Có | `totalDikeLength` |
| 18 | Tổng số đèn biển, đăng, tiêu độc lập | Number | Không | Không | Không | Có | Có | Có | `totalLighthouses` |
| 19 | Số lượng bến phao | Number | Không | Không | Không | Có | Có | Có | `buoyBerthCount` |
| 20 | Số lượng khu neo đậu | Number | Không | Không | Không | Có | Có | Có | `anchorageCount` |
| 21 | Số lượng khu chuyển tải | Number | Không | Không | Không | Có | Có | Có | `transshipmentCount` |
| 22 | Các khu nước, vùng nước khác | TextArea | Không | Không | Không | Có | Có | Có | `otherWaterAreas` |
| | **Thông tin GIS** | | | | | | | | |
| 23 | Loại đối tượng GIS | Select | Không | Không | Không | Có | Có | Có | `coordinateSystem`/`displayRule`/`mapSymbolId`/`spatialId` |
| 24 | Biểu tượng | Select | Không | Không | Không | Có | Có | Có | (GIS) |
| 25 | Hệ quy chiếu | Select | Không | Không | Không | Có | Có | Có | (GIS) |
| 26 | Quy tắc hiển thị | Text | Không | Không | Không | Có | Có | Có | (GIS) |
| | **Tọa độ GPS** | | | | | | | | |
| 27 | Tọa độ GPS (bắt buộc ≥1 khi gửi duyệt) | Bảng con (Vĩ độ, Kinh độ) | Có* | Không | Không | Có | Có | Có | `coordinates[]` — latitude [-90,90], longitude [-180,180]; lưu bảng `port_coordinate` |
| | **Công trình KCHT trực thuộc** | | | | | | | | |
| 28 | Công trình KCHT | Bảng con (STT, Tên, Số lượng) | Không | Không | Không | Có | Có | Có | `infrastructure[]` — tên bắt buộc, số lượng > 0; lưu bảng `port_infrastructure` |
| | **File đính kèm** | | | | | | | | |
| 29 | File đính kèm | Upload | Không | Không | Không | Có | Có | Có | `attachments[]` — PDF/DOC/DOCX/XLS/XLSX/JPG/PNG/TIFF, ≤ 20MB, ≤ 10 files; upload sau khi tạo |
| | **Ghi chú & Trạng thái** | | | | | | | | |
| 30 | Ghi chú | TextArea | Không | Không | Không | Có | Có | Có | `remarks` |
| 31 | Trạng thái | Select | Không (read-only) | Có | Có | Không | Không | Không | `operationalStatus` — theo Excel chỉ hiển thị ở Danh sách/Bộ lọc |
| | **Thông tin kiểm toán (chỉ Admin Cục)** | | | | | | | | |
| 32 | Người cập nhật | Text (read-only) | Không (read-only) | Có | Không | Không | Không | Không | Kiểm toán — chỉ Admin Cục |
| 33 | Ngày cập nhật | Text (read-only) | Không (read-only) | Có | Có | Không | Không | Không | Kiểm toán — chỉ Admin Cục |
| | **Kết cấu hạ tầng thuộc cầu cảng** | | | | | | | | |
| 34 | Tên kết cấu hạ tầng | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 35 | Loại kết cấu hạ tầng | Dropdown (bộ lọc) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| | **Thông tin quy hoạch** | | | | | | | | |
| 36 | Số quyết định quy hoạch | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 37 | Ngày quyết định quy hoạch | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| | **Thông tin vận hành khai thác** | | | | | | | | |
| 38 | Mã kế hoạch | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 39 | Tên kế hoạch | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 40 | Ngày bắt đầu | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 41 | Ngày kết thúc | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| | **Thông tin bảo trì** | | | | | | | | |
| 42 | Mã kế hoạch | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 43 | Tên kế hoạch | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 44 | Thời gian bắt đầu | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 45 | Thời gian kết thúc | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| | **Thông tin sự cố** | | | | | | | | |
| 46 | Mã sự cố | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 47 | Loại sự cố | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 48 | Địa điểm | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 49 | Thời gian | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.5 (7 trạng thái → enum `ApprovalStatus`, lưu dạng số) và quy trình 2 cấp tại `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`.
- **Lưu tạm:** lưu hồ sơ ở trạng thái `DRAFT` — tối thiểu mã + tên cảng; các trường khác tùy chọn; có thể mở chỉnh sửa tiếp (F-009).
- **Gửi phê duyệt:** kiểm tra đầy đủ trường bắt buộc (Đơn vị QL, Tên CB, Tỉnh/TP, Phân cấp, ≥ 1 tọa độ GPS) → hồ sơ chuyển trạng thái chờ duyệt cấp thứ nhất theo quy trình 2 cấp; quy trình duyệt thuộc F-011.
- Không được gửi duyệt khi thiếu trường bắt buộc; số liệu phải ≥ 0.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/01-base-pattern.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-008-01 | Mã cảng tự động sinh, bất biến — định dạng CB-XXXXXX, duy nhất toàn hệ thống (`GET /api/v1/ports/generate-code`); server kiểm tra mã không bị sửa (tampering detection) | Create |
| BR-008-02 | Lưu tạm: tối thiểu mã + tên cảng, các trường khác tùy chọn, trạng thái `DRAFT` | Create (draft) |
| BR-008-03 | Gửi phê duyệt: bắt buộc đủ Đơn vị QL, Tên CB, Tỉnh/TP, Phân cấp, ≥ 1 tọa độ GPS | Create (submit) |
| BR-008-04 | Tọa độ GPS hợp lệ: vĩ độ [-90, 90], kinh độ [-180, 180]; validate client + server | Create |
| BR-008-05 | Trùng tên cảng trong cùng tỉnh → cảnh báo (không chặn cứng) | Create |
| BR-008-06 | Giá trị số chỉ chấp nhận ≥ 0 | Create |
| BR-008-07 | Công trình KCHT: tên không rỗng, số lượng > 0 | Create |
| BR-008-08 | File đính kèm: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF; ≤ 20MB/file; ≤ 10 files | Upload |
| BR-008-09 | Đơn vị QL xác định phạm vi truy cập — gán đơn vị theo tài liệu nền mục 3.3, không để NULL | Create |
| BR-008-10 | Lưu tạm / Gửi phê duyệt ghi đầy đủ thông tin kiểm toán (operatorId, createdBy, createdAt) | Audit |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Mở form tạo mới, Lưu tạm, Gửi phê duyệt | `port:create` |
| Sinh mã cảng trước khi tạo | `port:create` |
| Upload / xóa file đính kèm (chỉ khi hồ sơ ở trạng thái nháp) | `port:create` |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Toàn quyền (vượt qua mọi kiểm tra — tài liệu nền mục 3.1) |
| admin-operation / admin | Tạo mới, Lưu tạm (admin-operation thêm: Gửi phê duyệt) |
| Cán bộ | Tạo mới, Lưu tạm (không Gửi phê duyệt) |
| Lãnh đạo | Không tạo mới — chỉ duyệt (F-011) |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — full quyền + xem thêm người tạo, người sửa cuối, thời gian tạo/cập nhật.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — dùng 7 trạng thái chung (tài liệu nền mục 3.5) |
| 2 | Có bước phê duyệt không | Có — luồng Gửi phê duyệt đưa hồ sơ vào quy trình 2 cấp (duyệt tại F-011) |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị (orgUnitId — tài liệu nền mục 3.3) |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `port:create` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — file đính kèm (port_attachment): PDF/DOC/DOCX/XLS/XLSX/JPG/PNG/TIFF, ≤ 20MB, ≤ 10 files |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/ports/generate-code` | Sinh mã cảng CB-XXXXXX để hiển thị trên form | `port:create` |
| POST | `/api/v1/ports` | Tạo mới Cảng biển (body: thông tin port + coordinates[] + infrastructure[] + action `draft`/`submit`), 1 transaction | `port:create` |
| POST | `/api/v1/ports/{id}/attachments` | Upload file đính kèm sau khi tạo | `port:create` |
| DELETE | `/api/v1/ports/{id}/attachments/{attId}` | Xóa file đính kèm (chỉ khi hồ sơ ở trạng thái nháp) | `port:create` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `ports`** (Cảng biển — cấu trúc theo entity `Port`): id (UUID PK), portCode (VARCHAR 50, UNIQUE, NOT NULL), portName (VARCHAR 255, NOT NULL), province (VARCHAR 100), ~~area (DECIMAL 15,2)~~, ~~maxVesselCapacity (DECIMAL 15,2)~~, operationalStatus (SMALLINT — enum `OperationalStatus`), approvalStatus (SMALLINT, NOT NULL — enum `ApprovalStatus`), orgUnitId (UUID, NOT NULL khi submit), securityLevel (SMALLINT, default NORMAL), portGroup (INT), mapSymbolId (UUID), spatialId (UUID), detailedLocation (VARCHAR 500), portClass (INT), coordinateSystem (INT), displayRule (INT), waterAreaScope (VARCHAR 2000), totalBerths (INT), totalAnchoragesTransshipment (INT), totalPublicChannels (INT), totalDedicatedChannels (INT), totalPublicChannelLength (DECIMAL 19,4), totalDedicatedChannelLength (DECIMAL 19,4), totalBuoysBeacons (INT), totalDikes (INT), totalDikeLength (DECIMAL 19,4), totalLighthouses (INT), buoyBerthCount (INT), anchorageCount (INT), transshipmentCount (INT), otherWaterAreas (VARCHAR 2000), remarks (VARCHAR 2000) + các cột audit từ `BaseEntity` (createdAt, updatedAt, deletedAt, createdBy, updatedBy, deletedBy); filter `orgUnitFilter` + `recordSecurityLevelFilter`.

**Bảng con (lưu cùng transaction khi tạo):** `port_coordinate` (id, portId FK, latitude DECIMAL(9,6) NOT NULL, longitude DECIMAL(9,6) NOT NULL, sortOrder INT) — ≥ 1 bản ghi khi submit; `port_infrastructure` (id, portId FK, stt INT NOT NULL, infraName VARCHAR 255 NOT NULL, quantity INT NOT NULL > 0); `port_attachment` (id, portId FK, fileName, filePath, fileSize ≤ 20MB, contentType, uploadedBy, uploadedAt).
