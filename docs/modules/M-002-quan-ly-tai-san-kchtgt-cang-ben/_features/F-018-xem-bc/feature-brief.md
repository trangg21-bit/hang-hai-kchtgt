---
id: F-018
name: Xem danh sách & Chi tiết Bến cảng
slug: xem-bc
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:42Z
last-updated: 2026-08-21
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

Cho phép người dùng có quyền `berth:read` tra cứu, lọc và xem thông tin Bến cảng. Màn hình **danh sách** hiển thị 19 cột (11 cột cơ bản + 8 cột audit chỉ cho Admin Cục / admin-operation), bộ lọc 2 cấp (cơ bản + nâng cao), phân trang, và các thao tác nhanh: Xem chi tiết, Sửa, Xem vị trí (bản đồ). Màn hình **chi tiết** hiển thị đầy đủ trường của Bến cảng theo 4 nhóm: Thông tin chung, Thông tin công bố, Thông tin vị trí (GIS + tọa độ), File đính kèm — kèm lịch sử phê duyệt 2 cấp. Ngoài ra còn hiển thị + upload giấy tờ đính kèm (nội dung merge từ UI feature F-104).

## 2. Trường dữ liệu

Không có form nhập liệu — các trường **hiển thị** theo entity `Berth` (bảng `berths`) + bảng con tọa độ và file đính kèm:

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | berthCode, berthName | Có (hiển thị) | Text | Cột danh sách + chi tiết |
| 2 | orgUnitId + orgUnitName | Có (hiển thị) | UUID / Text | Tên đơn vị ánh xạ `OrgUnitCacheService` — tài liệu nền mục 3.3 |
| 3 | portId + tên Cảng biển | Có (hiển thị) | UUID / Text | Cột "Thuộc cảng biển" |
| 4 | waterway / waterwayId | Không | Text / UUID | Cột "Thuộc luồng hàng hải" |
| 5 | provinceId, detailedLocation | Không | Number / Text | Địa điểm |
| 6 | structureType, berthType, operationalFunction | Không | Number / Enum / Text | Loại kết cấu, Loại bến, Công năng |
| 7 | operationalStatus | Không | Enum `OperationalStatus` | Tình trạng (badge màu) |
| 8 | approvalStatus | Có (hiển thị) | Enum `ApprovalStatus` | Trạng thái (badge màu) |
| 9 | totalArea, designThroughput, currentThroughput, maxVesselSize, plannedThroughput, latestCargoVolume | Không | Number (DECIMAL) | Chi tiết |
| 10 | openingAnnouncementDate, openingDecision, investmentAgreement | Không | DateTime / Text | Thông tin công bố |
| 11 | coordinates[] | Không | Danh sách (latitude/longitude) | Dùng tọa độ đầu tiên cho "Xem vị trí" |
| 12 | attachments[] / giấy tờ | Không | File (≤ 20MB, ≤ 10 files) | Tab File đính kèm + upload (F-104) |
| 13 | Audit: submittedForApprovalAt/By, portAuthorityApprovedAt/By, departmentApprovedAt/By, updatedAt, updatedBy | Không | TIMESTAMP / UUID | 8 cột audit — chỉ hiển thị Admin Cục / admin-operation |

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
| BR-018-03 | 8 cột audit (ngày/người cập nhật, gửi PD, phê duyệt vòng 1/vòng 2) chỉ hiển thị cho Admin Cục và admin-operation | List |
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
| system-admin (Admin Cục) | Xem toàn bộ + cột audit |
| admin-operation | Xem toàn bộ + cột audit |
| admin / Chuyên viên / Lãnh đạo đơn vị | Xem trong đơn vị (11 cột cơ bản) |
| Lãnh đạo (cấp Cục) | Xem toàn bộ + duyệt (F-017) |
| Cá nhân | Không |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — xem full dữ liệu + 8 cột audit (người/ngày cập nhật, gửi PD, phê duyệt từng cấp).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — hiển thị 7 trạng thái chung (badge) |
| 2 | Có bước phê duyệt không | Không — chỉ xem; nút duyệt điều hướng sang F-017 |
| 3 | Lọc cha-con / theo đơn vị | Có — theo đơn vị (orgUnitId) + lọc theo Cảng biển mẹ (portId), luồng hàng hải |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — 8 cột audit chỉ hiển thị với Admin Cục / admin-operation |
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
