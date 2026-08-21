---
id: F-030
name: Xem danh sách & Chi tiết Cảng cạn
slug: xem-cct
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-21
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Xem danh sách & Chi tiết Cảng cạn

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-030 — Xem danh sách & Chi tiết Cảng cạn
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng thường (chỉ xem + hành động khởi tạo từ danh sách)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG (quy ước màn danh sách/chi tiết, data scope, hiển thị orgUnitName...). File này CHỈ ghi phần RIÊNG của chức năng.

---

## 1. Mô tả ngắn

Cho phép người dùng có quyền `dryport:read` tra cứu và xem thông tin Cảng cạn. Màn hình **danh sách** (nội dung merge từ UI feature F-083) hiển thị bảng Cảng cạn với tìm kiếm, lọc (Tỉnh/TP, trạng thái phê duyệt), sắp xếp, phân trang và các hành động theo phân quyền (Tạo mới → F-026, Gửi phê duyệt, Xem chi tiết, Chỉnh sửa, Xóa, Phê duyệt/Từ chối). Màn hình **chi tiết** hiển thị toàn bộ 25 trường của Cảng cạn dạng read-only, 4 tab (Thông tin chung | Công bố | Vị trí | File đính kèm), badge trạng thái, breadcrumb và nút hành động theo phân quyền. Ngoài ra còn hiển thị + upload file đính kèm (merge từ F-106). Các cụm thông tin bổ sung (quy hoạch, vận hành khai thác, bảo trì, sự cố) là deferred — feature riêng sau.

## 2. Trường dữ liệu

Không có form nhập liệu — các trường **hiển thị** theo entity `DryPort` (bảng `dry_ports`):

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | dryPortCode, dryPortName | Có (hiển thị) | Text | Cột danh sách + chi tiết |
| 2 | orgUnitId + orgUnitName | Có (hiển thị) | UUID / Text | Tên đơn vị ánh xạ `OrgUnitCacheService` — tài liệu nền mục 3.3 |
| 3 | provinceId, detailedLocation | Không | Number / Text | Bộ lọc + hiển thị |
| 4 | teuCapacity, area, warehouseArea, yardArea | Không | Number (DECIMAL) | Thông tin năng lực |
| 5 | portStatus, operationalStatus, approvalStatus | Có (hiển thị) | Number / Enum | Badge trạng thái (tình trạng + phê duyệt) |
| 6 | coordinates[] | Không | Danh sách (kinh độ/vĩ độ) | Tab Vị trí |
| 7 | attachments[] | Không | File ≤ 20MB, ≤ 10 files | Tab File đính kèm + upload (F-106) |
| 8 | createdBy, createdAt, updatedBy, updatedAt | Không | UUID / TIMESTAMP | Metadata — chỉ Admin Cục thấy (tài liệu nền mục 3.2) |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.5 (7 trạng thái → enum `ApprovalStatus`; quy trình 2 cấp theo `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`).
- Danh sách hiển thị badge trạng thái phê duyệt + tình trạng; trạng thái "Đã xóa (lịch sử)" hiển thị badge "Lịch sử" và chỉ xem.
- **Gửi phê duyệt** (từ danh sách): bản ghi nháp → kiểm tra đủ trường bắt buộc → vào quy trình phê duyệt (duyệt tại F-029).
- Nút hành động theo trạng thái + quyền: Phê duyệt/Từ chối chỉ khi chờ duyệt và có `dryport:approve`; Xóa chỉ khi nháp; Chỉnh sửa khi có `dryport:update` (+ `dryport:approve` nếu bản ghi đã duyệt).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-030-01 | Hiển thị đầy đủ 25 trường cho người có `dryport:read` — không ẩn trường nào | View |
| BR-030-02 | Badge màu nhất quán toàn hệ thống (token trạng thái) | View |
| BR-030-03 | Metadata createdBy/createdAt/updatedBy/updatedAt chỉ hiển thị với Admin Cục | View |
| BR-030-04 | Bản ghi ở trạng thái lịch sử → chỉ xem, badge "Lịch sử", không nút hành động | View |
| BR-030-05 | Trang chi tiết read-only — mọi chỉnh sửa qua F-027 | View |
| BR-030-06 | Tìm kiếm/lọc danh sách: trim, không phân biệt hoa/thường; dữ liệu giới hạn theo phạm vi đơn vị user | List |
| BR-030-07 | File đính kèm: ≤ 20MB, ≤ 10 files; tải xuống được | Attachments |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem danh sách, chi tiết Cảng cạn | `dryport:read` |
| Gửi phê duyệt từ danh sách | `dryport:update` |
| Phê duyệt / Từ chối | `dryport:approve` |
| Xóa | `dryport:delete` |
| Upload / xóa file đính kèm | `dryport:create` / `dryport:update` |
| Xem lịch sử (F-031) | `dryport:history` (đề xuất — SA chốt) |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Toàn quyền + audit fields |
| Lãnh đạo | Xem + `dryport:approve` (thường được gán) |
| admin / admin-operation / Cán bộ | Xem + thao tác theo permission được gán |
| Cá nhân | Không truy cập |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — xem full dữ liệu + metadata người tạo/người sửa/thời gian.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — hiển thị 7 trạng thái chung (badge) |
| 2 | Có bước phê duyệt không | Không trực tiếp — danh sách khởi tạo Gửi phê duyệt; duyệt tại F-029 |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị (orgUnitId — tài liệu nền mục 3.3); Cảng cạn độc lập, không có cha |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — metadata chỉ hiện với Admin Cục; nút hành động theo trạng thái + quyền |
| 5 | Quyền riêng | `dryport:read` (xem); `dryport:history` (lịch sử — đề xuất) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — file đính kèm (merge từ F-106): ≤ 20MB, ≤ 10 files |
| 8 | Giao diện khác mẫu chung | Không (dùng 5 component dùng chung: ScreenHeader, FilterBar, StatusTabs, DataTable, Pagination) |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/dry-ports` | Danh sách Cảng cạn phân trang: page, size, search, provinceId, approvalStatus, sortBy, sortOrder, orgUnitId | `dryport:read` |
| GET | `/api/v1/dry-ports/{id}` | Chi tiết Cảng cạn (25 trường + tọa độ + file đính kèm) | `dryport:read` |
| PUT | `/api/v1/dry-ports/{id}?action=submit` | Gửi phê duyệt (nháp → chờ duyệt) | `dryport:update` |
| POST | `/api/v1/dry-ports/{id}/approve` | Phê duyệt | `dryport:approve` |
| POST | `/api/v1/dry-ports/{id}/reject?reason=` | Từ chối | `dryport:approve` |
| POST | `/api/v1/dry-ports/{id}/attachments` | Upload file đính kèm | `dryport:create` / `dryport:update` |
| GET | `/api/v1/dry-ports/{id}/attachments` | Danh sách file đính kèm | `dryport:read` |
| GET | `/api/v1/dry-ports/{id}/attachments/{attId}/download` | Tải xuống file đính kèm | `dryport:read` |
| DELETE | `/api/v1/dry-ports/{id}/attachments/{attId}` | Xóa file đính kèm | `dryport:update` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `dry_ports` + bảng con (tọa độ GIS, `dry_port_attachments`):** cấu trúc theo entity `DryPort` — giống F-026 (mục 7); F-030 chỉ đọc, JOIN `org_units` (tên đơn vị) — không thêm trường.

**Giấy tờ đính kèm (merge từ F-106):** entity `GiayTo` — 🔴 id, fileName, mimeType, fileSize, entityType, entityId, minioKey, uploadedBy, createdAt (SA chốt cách lưu: bảng riêng hoặc tái sử dụng `dry_port_attachments`).
