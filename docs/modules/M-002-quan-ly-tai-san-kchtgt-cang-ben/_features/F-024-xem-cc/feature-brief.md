---
id: F-024
name: Xem danh sách & Chi tiết Cầu cảng
slug: xem-cc
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16
last-updated: 2026-08-21
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Xem danh sách & Chi tiết Cầu cảng

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-024 — Xem danh sách & Chi tiết Cầu cảng
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng thường (chỉ xem, không tạo/sửa/xóa)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG (quy ước màn danh sách/chi tiết, data scope, hiển thị orgUnitName...). File này CHỈ ghi phần RIÊNG của chức năng.

---

## 1. Mô tả ngắn

Cho phép người dùng có quyền `pier:read` tra cứu và xem thông tin Cầu cảng. Màn hình **danh sách** (nội dung merge từ UI feature F-078) hiển thị bảng Cầu cảng với tìm kiếm, lọc (theo cảng biển, bến cảng, địa điểm, trạng thái hoạt động, trạng thái phê duyệt), sắp xếp, phân trang và hành động theo phân quyền. Màn hình **chi tiết** hiển thị toàn bộ thông tin kỹ thuật của một Cầu cảng (JOIN Bến cảng, giấy tờ), badge trạng thái theo vòng đời, breadcrumb, và các hành động theo vai trò (phê duyệt/từ chối khi chờ duyệt, chỉnh sửa, xem lịch sử). Trang chi tiết read-only — mọi chỉnh sửa qua F-021. Ngoài ra còn hiển thị + upload giấy tờ đính kèm (merge từ F-105).

## 2. Trường dữ liệu

Không có form nhập liệu — các trường **hiển thị** theo entity `Pier` (bảng `piers`):

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | pierCode, pierName | Có (hiển thị) | Text | Cột danh sách + chi tiết |
| 2 | orgUnitId + orgUnitName | Có (hiển thị) | UUID / Text | Tên đơn vị ánh xạ `OrgUnitCacheService` — tài liệu nền mục 3.3 |
| 3 | berthId + tên Bến cảng | Có (hiển thị) | UUID / Text | Hyperlink đến chi tiết Bến cảng; không khả dụng → cảnh báo |
| 4 | portId + tên Cảng biển | Có (hiển thị) | UUID / Text | Bộ lọc danh sách |
| 5 | length, width, structureType, pierType, operationalFunction | Không | Number / Enum / Text | Thông tin kỹ thuật |
| 6 | operationalStatus, approvalStatus | Có (hiển thị) | Enum | Badge màu theo vòng đời |
| 7 | coordinates[] | Không | Danh sách (latitude/longitude) | Bảng tọa độ GIS |
| 8 | attachments[] / giấy tờ | Không | File | Tên, kích thước, loại file + Tải xuống/In; upload (F-105) |
| 9 | createdBy, createdAt, updatedBy, updatedAt | Không | UUID / TIMESTAMP | Metadata — chỉ Admin Cục thấy (tài liệu nền mục 3.2) |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.5 (7 trạng thái → enum `ApprovalStatus`; quy trình 2 cấp theo `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`).
- Hiển thị badge trạng thái hoạt động + trạng thái phê duyệt theo vòng đời; trạng thái "Đã xóa (lịch sử)" không hiển thị trên danh sách.
- Có thể xem chi tiết ở mọi trạng thái; nút "Phê duyệt"/"Từ chối" chỉ hiển thị khi trạng thái chờ duyệt và người dùng có `pier:approve` (chuyển F-023); nút "Chỉnh sửa" khi có `pier:update` (chuyển F-021).
- Cầu cảng chưa duyệt: cảnh báo "chưa khả dụng trong các module khác"; nếu Bến cảng/Cảng biển cha không còn hoạt động → trạng thái hoạt động của cầu cảng chuyển tạm ngừng.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-024-01 | Xem được ở mọi trạng thái; luôn hiển thị trạng thái hiện tại | View |
| BR-024-02 | Trang chi tiết read-only — không trường nào nhập liệu trực tiếp | View |
| BR-024-03 | Nút hành động theo trạng thái + quyền: chờ duyệt → Phê duyệt/Từ chối (có `pier:approve`); đã duyệt/từ chối → Chỉnh sửa (có `pier:update`) | View |
| BR-024-04 | Link Bến cảng cha; nếu cha đã xóa/không hoạt động → cảnh báo nhưng vẫn xem được | View |
| BR-024-05 | Dữ liệu làm mới mỗi lần truy cập — không cache chi tiết | View |
| BR-024-06 | Cầu cảng chưa duyệt không khả dụng ở module khác (cảnh báo trên chi tiết) | View |
| BR-024-07 | Cha không hoạt động → cầu cảng chuyển tạm ngừng (cảnh báo) | View |
| BR-024-08 | Danh sách: tìm kiếm trim, không phân biệt hoa/thường; lọc theo đơn vị + cha-con; dữ liệu giới hạn theo phạm vi đơn vị user | List |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem danh sách, chi tiết Cầu cảng | `pier:read` |
| Upload giấy tờ đính kèm | `giayto:upload` (đề xuất — SA chốt) |
| Xóa giấy tờ đính kèm | `giayto:delete` (đề xuất — SA chốt) |
| Xóa mềm từ danh sách | `pier:delete` |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Toàn quyền |
| Admin, Lãnh đạo | Xem toàn bộ + phê duyệt + xóa |
| Quản lý tài sản | Xem (phạm vi đơn vị) + chỉnh sửa |
| Nhân viên vận hành | Xem (phạm vi đơn vị) |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — xem full dữ liệu + metadata người tạo/người sửa/thời gian.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — hiển thị 7 trạng thái chung (badge theo vòng đời) |
| 2 | Có bước phê duyệt không | Không — chỉ xem; nút duyệt điều hướng sang F-023 |
| 3 | Lọc cha-con / theo đơn vị | Có — theo đơn vị (orgUnitId) + theo Cảng biển → Bến cảng (cha-con 2 cấp) |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — metadata createdBy/createdAt/updatedBy/updatedAt chỉ hiện với Admin Cục; nút hành động theo trạng thái + quyền |
| 5 | Quyền riêng | `pier:read` (xem); `giayto:upload` / `giayto:delete` (giấy tờ) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — upload giấy tờ đính kèm (merge từ F-105) |
| 8 | Giao diện khác mẫu chung | Không (dùng 5 component dùng chung: ScreenHeader, FilterBar, StatusTabs, DataTable, Pagination) |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/pier` | Danh sách Cầu cảng phân trang: page, pageSize, sortBy, sortOrder, search, portId, berthId, province, operationalStatus, approvalStatus, orgUnitId | `pier:read` |
| GET | `/api/v1/pier/{id}` | Chi tiết Cầu cảng (JOIN berth, attachments) | `pier:read` |
| GET | `/api/v1/ports?status=APPROVED` | Dropdown Cảng biển (bộ lọc) | `pier:read` |
| GET | `/api/v1/berths?portId={id}&status=APPROVED` | Dropdown Bến cảng theo cảng biển (bộ lọc) | `pier:read` |
| POST | `/api/v1/giay-to` | Upload giấy tờ (FormData: file + entityType=`pier` + entityId) | `giayto:upload` |
| GET | `/api/v1/giay-to?entityType=pier&entityId={id}` | Danh sách giấy tờ của Cầu cảng | `pier:read` |
| GET | `/api/v1/giay-to/{id}/download` | Tải xuống giấy tờ | `pier:read` |
| DELETE | `/api/v1/giay-to/{id}` | Xóa giấy tờ (có xác nhận) | `giayto:delete` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `piers` + bảng con (tọa độ GIS, file đính kèm):** cấu trúc theo entity `Pier` — giống F-020 (mục 7); F-024 chỉ đọc, JOIN `berths` (tên bến), `ports` (tên cảng biển), `org_units` (tên đơn vị), `giay_to` (giấy tờ) — không thêm trường.

**Giấy tờ đính kèm (merge từ F-105):** entity `GiayTo` — 🔴 id, fileName, mimeType, fileSize, entityType, entityId, minioKey, uploadedBy, createdAt (SA chốt cách lưu: bảng riêng hoặc tái sử dụng bảng attachment của cầu cảng).
