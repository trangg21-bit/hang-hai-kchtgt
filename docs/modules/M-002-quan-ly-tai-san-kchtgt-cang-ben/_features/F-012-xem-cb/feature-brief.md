---
id: F-012
name: Xem danh sách & Chi tiết Cảng biển
slug: xem-cb
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:19Z
last-updated: 2026-08-23
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Xem danh sách & Chi tiết Cảng biển

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-012 — Xem danh sách & Chi tiết Cảng biển
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng thường (chỉ xem, không tạo/sửa/xóa)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG (quy ước màn danh sách/chi tiết, data scope, hiển thị orgUnitName...). File này CHỈ ghi phần RIÊNG của chức năng.

---

## 1. Mô tả ngắn

Cho phép người dùng có quyền `port:read` tra cứu, lọc, xem danh sách và chi tiết Cảng biển. Gồm 2 màn hình: **Danh sách** (tìm kiếm theo tên, lọc theo đơn vị quản lý / phân cấp / nhóm cảng / địa điểm / ngày cập nhật / trạng thái, sắp xếp, phân trang; hành động trên mỗi dòng theo phân quyền) và **Chi tiết** (dạng tab — tab "Thông tin chung" hiển thị đầy đủ trường của Cảng biển kèm tọa độ GPS, công trình KCHT, file đính kèm; các tab khác là placeholder). F-012 là **màn hình trung tâm (hub)** — các thao tác Tạo mới (F-008), Cập nhật (F-009), Xóa (F-010), Phê duyệt (F-011) đều khởi tạo từ đây và điều hướng quay về đây. Ngoài ra còn hiển thị + upload giấy tờ đính kèm (nội dung merge từ UI feature F-103).

## 2. Trường dữ liệu

Không có form nhập liệu — các trường **hiển thị** theo entity `Port` (bảng `ports`) + bảng con `PortCoordinate` (tọa độ GPS), `PortInfrastructure` (công trình KCHT), `PortAttachment` / giấy tờ (file đính kèm). Bảng dưới đây **khớp 100%** sheet `QL Cảng biển` — file `HH_Tính năng & danh sách các trường thông tin.xlsx` (nguồn sự thật đã được xác nhận): tên trường, loại điều khiển và cờ hiển thị tại 5 màn hình (Danh sách / Bộ lọc / Xem chi tiết / Tạo mới / Sửa) lấy nguyên theo Excel. Quy ước cột Bắt buộc: **Có*** = bắt buộc khi Gửi phê duyệt. Cột "Danh sách" quyết định cột hiển thị của màn Danh sách; cột "Xem chi tiết" quyết định trường hiển thị của màn Chi tiết (F-012 chỉ đọc).

| STT | Tên trường (theo Excel) | Loại điều khiển (theo Excel) | Bắt buộc | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| | **Thông tin chung** | | | | | | | | |
| 1 | Mã cảng biển | Text (read-only, tự sinh CB-XXXXXX) | Có (hệ thống tự sinh) | Không | Có | Có | Có | Có | `portCode` — cột danh sách không hiển thị (theo Excel); lọc theo mã |
| 2 | Đơn vị quản lý (bắt buộc khi gửi duyệt) | Select | Có* | Có | Có | Có | Có | Có | `orgUnitId + orgUnitName` — tên đơn vị do hệ thống ánh xạ (`OrgUnitCacheService`) — tài liệu nền mục 3.3 |
| 3 | Nhóm cảng biển | Select | Không | Có | Có | Có | Có | Có | `portGroup` — cột danh sách + bộ lọc |
| 4 | Tên cảng biển (bắt buộc) | Text | Có | Có | Có | Có | Có | Có | `portName` — cột danh sách + tìm kiếm |
| 5 | Tỉnh/Thành phố (bắt buộc khi gửi duyệt) | Select | Có* | Có | Có | Có | Có | Có | `province` — cột danh sách + bộ lọc |
| 6 | Địa điểm chi tiết | Text | Không | Không | Không | Có | Có | Có | `detailedLocation` — tab Thông tin chung |
| 7 | Phân cấp cảng biển (bắt buộc khi gửi duyệt) | Select | Có* | Có | Có | Có | Có | Có | `portClass` — cột danh sách + bộ lọc |
| 8 | Phạm vi vùng nước | TextArea | Không | Không | Không | Có | Có | Có | `waterAreaScope` — tab Thông tin chung |
| | **Chỉ số tổng hợp** | | | | | | | | |
| 9 | Tổng số bến cảng | Number | Không | Không | Không | Có | Có | Có | `totalBerths` — 14 chỉ số tổng hợp, tab Thông tin chung |
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
| 23 | Loại đối tượng GIS | Select | Không | Không | Không | Có | Có | Có | Thông tin GIS (`coordinateSystem`, `displayRule`, `mapSymbolId`, `spatialId`) |
| 24 | Biểu tượng | Select | Không | Không | Không | Có | Có | Có | (GIS) |
| 25 | Hệ quy chiếu | Select | Không | Không | Không | Có | Có | Có | (GIS) |
| 26 | Quy tắc hiển thị | Text | Không | Không | Không | Có | Có | Có | (GIS) |
| | **Tọa độ GPS** | | | | | | | | |
| 27 | Tọa độ GPS (bắt buộc ≥1 khi gửi duyệt) | Bảng con (Vĩ độ, Kinh độ) | Có* | Không | Không | Có | Có | Có | `coordinates[]` — hiển thị dạng bảng, định dạng ±XX.XXXXXX |
| | **Công trình KCHT trực thuộc** | | | | | | | | |
| 28 | Công trình KCHT | Bảng con (STT, Tên, Số lượng) | Không | Không | Không | Có | Có | Có | `infrastructure[]` — hiển thị dạng bảng (stt, infraName, quantity) |
| | **File đính kèm** | | | | | | | | |
| 29 | File đính kèm | Upload | Không | Không | Không | Có | Có | Có | `attachments[]` / giấy tờ — hiển thị tên, định dạng, dung lượng + Download/Print; ≤ 20MB, ≤ 10 files |
| | **Ghi chú & Trạng thái** | | | | | | | | |
| 30 | Ghi chú | TextArea | Không | Không | Không | Có | Có | Có | `remarks` |
| 31 | Trạng thái | Select | Không (read-only) | Có | Có | Không | Không | Không | `operationalStatus` — theo Excel chỉ hiển thị ở Danh sách/Bộ lọc (badge tình trạng) |
| | **Thông tin kiểm toán (chỉ Admin Cục)** | | | | | | | | |
| 32 | Người cập nhật | Text (read-only) | Không (read-only) | Có | Không | Không | Không | Không | Kiểm toán — chỉ Admin Cục; cột "Cán bộ cập nhật" hiển thị họ tên mọi role (BR-012-06) |
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

- Theo tài liệu nền mục 3.5 (7 trạng thái → enum `ApprovalStatus`, lưu số theo tài liệu nền mục 3.5; quy trình 2 cấp theo `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`).
- Danh sách và chi tiết hiển thị badge trạng thái tương ứng (màu theo token trạng thái — quy ước UI chung); trạng thái "Đã xóa (lịch sử)" không hiển thị trên màn hình.
- Chức năng chỉ xem — không thay đổi trạng thái; nút "Phê duyệt"/"Từ chối" trên chi tiết chỉ hiển thị với người có `port:approve` (điều hướng sang F-011).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-012-01 | Tìm kiếm theo tên cảng không phân biệt hoa/thường, tự động trim khoảng trắng thừa, debounce 300ms | Search |
| BR-012-02 | Bộ lọc đơn vị quản lý là bắt buộc, mặc định theo đơn vị người đăng nhập; phạm vi dữ liệu do server giới hạn (data scope) | Filter |
| BR-012-03 | Tọa độ GPS hiển thị định dạng ±XX.XXXXXX, vĩ độ [-90, 90], kinh độ [-180, 180] | Detail |
| BR-012-04 | File đính kèm hỗ trợ PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF; ≤ 20MB/file; ≤ 10 files | Attachments |
| BR-012-05 | Nút hành động trên danh sách/chi tiết chỉ hiển thị khi người dùng có permission tương ứng (`port:create/update/delete/approve`) | UI |
| BR-012-06 | Các trường createdBy/createdAt/updatedBy/updatedAt chỉ hiển thị với Admin Cục; cột "Cán bộ cập nhật" hiển thị họ tên từ updatedBy cho mọi role | UI |
| BR-012-07 | Tab còn lại (Kết cấu hạ tầng khác, Quy hoạch, Vận hành khai thác, Bảo trì, Sự cố) là placeholder "Đang phát triển" | Detail |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem danh sách, chi tiết Cảng biển | `port:read` |
| Upload giấy tờ đính kèm | `giayto:upload` (đề xuất — SA chốt) |
| Xóa giấy tờ đính kèm | `giayto:delete` (đề xuất — SA chốt) |
| Tải giấy tờ đính kèm | `port:read` |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Toàn quyền |
| Cán bộ / admin-operation / admin | Xem trong phạm vi đơn vị; hành động theo quyền được gán |
| Lãnh đạo | Xem toàn bộ + duyệt (F-011) |
| Nhân viên vận hành | Xem (không xóa, không sửa) |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — xem full dữ liệu + người tạo, người sửa cuối, thời gian tạo/cập nhật (phục vụ kiểm toán).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — hiển thị 7 trạng thái chung (badge) |
| 2 | Có bước phê duyệt không | Không — chỉ xem; nút duyệt điều hướng sang F-011 |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị (orgUnitId — tài liệu nền mục 3.3); bộ lọc đơn vị bắt buộc |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — metadata createdBy/createdAt/updatedBy/updatedAt chỉ hiện với Admin Cục |
| 5 | Quyền riêng | `port:read` (xem); `giayto:upload` / `giayto:delete` (giấy tờ) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — upload giấy tờ đính kèm (merge từ F-103): PDF/DOC/DOCX/XLS/XLSX/JPG/PNG/TIFF, ≤ 20MB, ≤ 10 files |
| 8 | Giao diện khác mẫu chung | Không (dùng 5 component dùng chung: ScreenHeader, FilterBar, StatusTabs, DataTable, Pagination) |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/ports` (hoặc `/api/v1/cang-bien`) | Danh sách Cảng biển phân trang: query orgUnitId (bắt buộc), portName, portClass, portGroup, province, updatedFrom/To, status, page, size, sort | `port:read` |
| GET | `/api/v1/ports/{id}` | Chi tiết Cảng biển kèm tọa độ GPS, công trình KCHT, file đính kèm | `port:read` |
| POST | `/api/v1/giay-to` | Upload giấy tờ (FormData: file + entityType + entityId) | `giayto:upload` |
| GET | `/api/v1/giay-to?entityType=...&entityId=...` | Danh sách giấy tờ của Cảng biển | `port:read` |
| GET | `/api/v1/giay-to/{id}/download` | Tải xuống giấy tờ | `port:read` |
| DELETE | `/api/v1/giay-to/{id}` | Xóa giấy tờ (có xác nhận) | `giayto:delete` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `ports` + bảng con (`port_coordinate`, `port_infrastructure`, `port_attachment`):** cấu trúc theo entity `Port` — giống F-008 (mục 7); F-012 chỉ đọc, không thêm trường.

**Giấy tờ đính kèm (merge từ F-103):** entity `GiayTo` — 🔴 id, fileName, mimeType, fileSize, entityType, entityId, minioKey, uploadedBy, createdAt (SA chốt cách lưu: bảng riêng `giay_to` hoặc tái sử dụng `port_attachment`).
