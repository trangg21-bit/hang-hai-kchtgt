---
id: F-018
name: Xem danh sách & Chi tiết Bến cảng
slug: xem-bc
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:42Z
last-updated: 2026-08-23
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Xem danh sách & Chi tiết Bến cảng

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-018 — Xem danh sách & Chi tiết Bến cảng
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng thường (chỉ xem, không tạo/sửa/xóa)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG (quy ước màn danh sách/chi tiết, data scope, hiển thị orgUnitName...). File này CHỈ ghi phần RIÊNG của chức năng.

---

## 1. Mô tả ngắn

Cho phép người dùng có quyền `berth:read` tra cứu, lọc và xem thông tin Bến cảng. Màn hình **danh sách** hiển thị các cột theo sheet `QL Bến cảng` (cột cơ bản + cột log cập nhật/phê duyệt chỉ cho Admin Cục / admin-operation), bộ lọc 2 cấp (cơ bản + nâng cao), phân trang, và các thao tác nhanh: Xem chi tiết, Sửa, Xem vị trí (bản đồ). Màn hình **chi tiết** hiển thị đầy đủ trường của Bến cảng theo 4 nhóm: Thông tin chung, Thông tin công bố, Thông tin vị trí (GIS + tọa độ), File đính kèm — kèm lịch sử phê duyệt 2 cấp. Ngoài ra còn hiển thị + upload giấy tờ đính kèm (nội dung merge từ UI feature F-104).

## 2. Trường dữ liệu

Không có form nhập liệu — các trường **hiển thị** theo entity `Berth` (bảng `berths`) + bảng con tọa độ và file đính kèm. Bảng dưới đây **khớp 100%** sheet `QL Bến cảng` — file `HH_Tính năng & danh sách các trường thông tin.xlsx` (nguồn sự thật đã được xác nhận): tên trường, loại điều khiển và cờ hiển thị tại 5 màn hình (Danh sách / Bộ lọc / Xem chi tiết / Tạo mới / Sửa) lấy nguyên theo Excel. Quy ước cột Bắt buộc: **Có*** = bắt buộc khi Gửi phê duyệt. Cột "Danh sách" quyết định cột hiển thị của màn Danh sách; cột "Xem chi tiết" quyết định trường hiển thị của màn Chi tiết (F-018 chỉ đọc).

| STT | Tên trường (theo Excel) | Loại điều khiển (theo Excel) | Bắt buộc | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| | **Thông tin chung** | | | | | | | | |
| 1 | Đơn vị quản lý (bắt buộc) | Select | Có | Có | Có | Có | Có | Có | `orgUnitId + orgUnitName` — tên đơn vị ánh xạ `OrgUnitCacheService` — tài liệu nền mục 3.3 |
| 2 | Thuộc cảng biển (bắt buộc) | Select | Có | Có | Có | Có | Có | Có | `portId + tên Cảng biển` — cột "Thuộc cảng biển" |
| 3 | Mã bến cảng | Text (read-only, tự sinh {mã-cảng-mẹ}-B{XX}) | Có (hệ thống tự sinh) | Có | Có | Có | Có | Có | `berthCode` — cột danh sách + bộ lọc |
| 4 | Tên bến cảng (bắt buộc) | Text | Có | Có | Có | Có | Có | Có | `berthName` — cột danh sách + tìm kiếm |
| 5 | Thuộc luồng hàng hải | Select | Không | Có | Có | Có | Có | Có | `waterway` / `waterwayId` — cột "Thuộc luồng hàng hải" |
| 6 | Đơn vị khai thác | Text | Không | Không | Không | Có | Có | Có | `operator` |
| 7 | Địa điểm (Tỉnh/TP) (bắt buộc khi gửi duyệt) | Select | Có* | Có | Có | Có | Có | Có | `provinceId` — cột danh sách + bộ lọc |
| 8 | Địa điểm chi tiết | Text | Không | Không | Không | Có | Có | Có | `detailedLocation` |
| 9 | Loại kết cấu bến cảng | Select | Không | Có | Có | Có | Có | Có | `structureType` — cột danh sách + bộ lọc |
| 10 | Công năng khai thác | Text | Không | Có | Có | Có | Có | Có | `operationalFunction` — cột danh sách + bộ lọc |
| 11 | Tổng diện tích (ha) | Number | Không | Không | Không | Có | Có | Có | `totalArea` |
| 12 | Năng lực thông qua thiết kế | Number | Không | Không | Không | Có | Có | Có | `designThroughput` |
| 13 | Năng lực thông qua hiện trạng | Number | Không | Không | Không | Có | Có | Có | `currentThroughput` |
| 14 | Cỡ tàu tiếp nhận lớn nhất (DWT) | Number | Không | Không | Không | Có | Có | Có | `maxVesselSize` |
| 15 | Quy hoạch năng lực thông qua | Number | Không | Không | Không | Có | Có | Có | `plannedThroughput` |
| 16 | Sản lượng thực tế năm gần nhất | Number | Không | Không | Không | Có | Có | Có | `latestCargoVolume` |
| 17 | Tình trạng (bắt buộc khi gửi duyệt) | Select | Có* | Có | Có | Có | Có | Có | `operationalStatus` — badge tình trạng (màu theo token) |
| | **Thông tin công bố** | | | | | | | | |
| 18 | Thời điểm công bố | Date | Không | Không | Không | Có | Có | Có | `openingAnnouncementDate` |
| 19 | Quyết định công bố | Text | Không | Không | Không | Có | Có | Có | `openingDecision` |
| 20 | Văn bản thỏa thuận | Text | Không | Không | Không | Có | Có | Có | `investmentAgreement` |
| | **Thông tin vị trí (GIS + tọa độ)** | | | | | | | | |
| 21 | Loại đối tượng (GIS) | Select | Không | Không | Không | Có | Có | Có | Thông tin GIS (`coordinateSystem`, `displayRule`, `mapSymbolId`, `spatialId`) |
| 22 | Biểu tượng (GIS) | Select | Không | Không | Không | Có | Có | Có | (GIS) |
| 23 | Hệ quy chiếu (GIS) | Select | Không | Không | Không | Có | Có | Có | (GIS) |
| 24 | Quy tắc hiển thị (GIS) | Text | Không | Không | Không | Có | Có | Có | (GIS) |
| 25 | Tọa độ GPS (bắt buộc ≥1 khi gửi duyệt) | Bảng con (Vĩ độ, Kinh độ) | Có* | Không | Không | Có | Có | Có | `coordinates[]` — dùng tọa độ đầu tiên cho "Xem vị trí" |
| | **File đính kèm** | | | | | | | | |
| 26 | File đính kèm | Upload | Không | Không | Không | Có | Có | Có | `attachments[]` / giấy tờ — hiển thị tên, định dạng, dung lượng + Download; ≤ 20MB, ≤ 10 files |
| | **Trạng thái & Kiểm toán (chỉ ở trang Chi tiết/Danh sách)** | | | | | | | | |
| 27 | Trạng thái phê duyệt | Badge (read-only) | Không (read-only) | Có | Có | Có | Không | Không | `approvalStatus` — badge trạng thái (màu theo token) |
| | **Thông tin log cập nhật** | | | | | | | | |
| 28 | Ngày cập nhật | DatePicker | Không (read-only) | Có | Có | Có | Không | Không | Cột danh sách + chi tiết — Admin Cục / admin-operation |
| 29 | Cán bộ cập nhật | Text (read-only) | Không (read-only) | Có | Không | Có | Không | Không | Cột danh sách + chi tiết — Admin Cục / admin-operation |
| 30 | Ngày gửi phê duyệt | Textarea | Không (read-only) | Có | Không | Có | Không | Không | `submittedForApprovalAt` — cột audit |
| 31 | Cán bộ gửi phê duyệt | Textarea | Không (read-only) | Có | Không | Có | Không | Không | `submittedForApprovalBy` — cột audit |
| 32 | Ngày phê duyệt cấp Cảng vụ/Chi cục | Textarea | Không (read-only) | Có | Không | Có | Không | Không | `portAuthorityApprovedAt` — cột audit |
| 33 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | Textarea | Không (read-only) | Có | Không | Có | Không | Không | `portAuthorityApprovedBy` — cột audit |
| 34 | Nội dung phê duyệt | Textarea | Không (read-only) | Có | Không | Có | Không | Không | `portAuthorityApprovalContent` — cột audit |
| 35 | Ngày phê duyệt cấp Cục | Textarea | Không (read-only) | Có | Không | Có | Không | Không | `departmentApprovedAt` — cột audit |
| 36 | Cán bộ phê duyệt cấp Cục | Textarea | Không (read-only) | Có | Không | Có | Không | Không | `departmentApprovedBy` — cột audit |
| 37 | Nội dung phê duyệt | Textarea | Không (read-only) | Có | Không | Có | Không | Không | `departmentApprovalContent` — cột audit |
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

- Theo tài liệu nền mục 3.5 (7 trạng thái → enum `ApprovalStatus`; quy trình 2 cấp theo `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`).
- Danh sách hiển thị badge trạng thái (màu theo token) và badge tình trạng hoạt động; trạng thái "Đã xóa (lịch sử)" không hiển thị.
- Chức năng chỉ xem — không thay đổi trạng thái; nút "Sửa" chỉ hiển thị khi có `berth:update` (chuyển F-015).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-018-01 | Danh sách mặc định: sắp xếp theo ngày cập nhật giảm dần, 20 dòng/trang, chỉ hiển thị bản ghi chưa xóa | List |
| BR-018-02 | Phạm vi dữ liệu theo đơn vị người dùng; Admin Cục / admin-operation thấy toàn bộ | List |
| BR-018-03 | Các cột log cập nhật/phê duyệt (mục 28–37) chỉ hiển thị cho Admin Cục và admin-operation | List |
| BR-018-04 | Tìm kiếm/lọc: tên bến (trim, không phân biệt hoa/thường), lọc theo đơn vị, cảng biển, luồng HH, mã bến, loại kết cấu, công năng, trạng thái, tình trạng, tỉnh/TP, ngày cập nhật | Filter |
| BR-018-05 | "Xem vị trí" dùng tọa độ GPS đầu tiên; không có tọa độ → ẩn nút | Detail |
| BR-018-06 | Popup chi tiết read-only; nếu có quyền sửa → thêm nút "Chỉnh sửa" | Detail |
| BR-018-07 | File đính kèm: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF; ≤ 20MB; ≤ 10 files | Attachments |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem danh sách, chi tiết Bến cảng | `berth:read` |
| Upload giấy tờ đính kèm | `giayto:upload` (đề xuất — SA chốt) |
| Xóa giấy tờ đính kèm | `giayto:delete` (đề xuất — SA chốt) |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin (Admin Cục) | Xem toàn bộ + cột log |
| admin-operation | Xem toàn bộ + cột log |
| admin / Chuyên viên / Lãnh đạo đơn vị | Xem trong đơn vị (cột cơ bản) |
| Lãnh đạo (cấp Cục) | Xem toàn bộ + duyệt (F-017) |
| Cá nhân | Không |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — xem full dữ liệu + các cột log cập nhật/phê duyệt (mục 28–37).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — hiển thị 7 trạng thái chung (badge) |
| 2 | Có bước phê duyệt không | Không — chỉ xem; nút duyệt điều hướng sang F-017 |
| 3 | Lọc cha-con / theo đơn vị | Có — theo đơn vị (orgUnitId) + lọc theo Cảng biển mẹ (portId), luồng hàng hải |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — cột log cập nhật/phê duyệt chỉ hiển thị với Admin Cục / admin-operation |
| 5 | Quyền riêng | `berth:read` (xem); `giayto:upload` / `giayto:delete` (giấy tờ) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — upload giấy tờ đính kèm (merge từ F-104) |
| 8 | Giao diện khác mẫu chung | Không (dùng 5 component dùng chung: ScreenHeader, FilterBar, StatusTabs, DataTable, Pagination) |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/berths` | Danh sách Bến cảng phân trang: page, pageSize, sortBy, sortOrder, orgUnitId, portId, waterwayId, berthCode, berthName, structureType, operationalFunction, operationalStatus, approvalStatus, provinceId, updatedFrom/To | `berth:read` |
| GET | `/api/v1/berths/{id}` | Chi tiết Bến cảng: đầy đủ trường + tọa độ + file đính kèm + lịch sử phê duyệt 2 cấp | `berth:read` |
| POST | `/api/v1/giay-to` | Upload giấy tờ (FormData: file + entityType=`berth` + entityId) | `giayto:upload` |
| GET | `/api/v1/giay-to?entityType=berth&entityId={id}` | Danh sách giấy tờ của Bến cảng | `berth:read` |
| GET | `/api/v1/giay-to/{id}/download` | Tải xuống giấy tờ | `berth:read` |
| DELETE | `/api/v1/giay-to/{id}` | Xóa giấy tờ (có xác nhận) | `giayto:delete` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `berths` + bảng con (tọa độ, file đính kèm):** cấu trúc theo entity `Berth` — giống F-014 (mục 7); F-018 chỉ đọc, JOIN `org_units` (tên đơn vị), `ports` (tên cảng biển), `approval_log` (lịch sử phê duyệt 2 cấp) — không thêm trường.

**Giấy tờ đính kèm (merge từ F-104):** entity `GiayTo` — 🔴 id, fileName, mimeType, fileSize, entityType, entityId, minioKey, uploadedBy, createdAt (SA chốt cách lưu: bảng riêng hoặc tái sử dụng bảng attachment của bến).
