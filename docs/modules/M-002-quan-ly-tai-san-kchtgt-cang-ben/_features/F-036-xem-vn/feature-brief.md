---
id: F-036
name: Xem danh sách & Chi tiết Vùng nước
slug: xem-vn
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-21
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Xem danh sách & Chi tiết Vùng nước

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-036 — Xem danh sách & Chi tiết Vùng nước
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng thường (chỉ xem + hành động khởi tạo từ danh sách)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG (quy ước màn danh sách/chi tiết, data scope, hiển thị orgUnitName...). File này CHỈ ghi phần RIÊNG của chức năng. (Nội dung merge từ F-036 BE + F-088 UI + F-089 UI.)

---

## 1. Mô tả ngắn

Cho phép người dùng có quyền `waterzone:read` tra cứu và xem thông tin Vùng nước. Màn hình **danh sách** (VungNuocListPage): tìm kiếm theo mã/tên, lọc theo trạng thái hoạt động, trạng thái phê duyệt, cảng mẹ; sắp xếp, phân trang; hành động theo phân quyền. Màn hình **chi tiết** (VungNuocDetailPage): 5-card layout (Info, Stats, Status, Audit, Documents) + ActionFooter theo phân quyền. F-036 là **hub trung tâm** của nhóm Vùng nước — Tạo mới (F-032), Cập nhật (F-033), Xóa (F-034), Phê duyệt (F-035), Lịch sử (F-037) đều khởi tạo từ đây và quay về đây. Ngoài ra còn hiển thị + upload giấy tờ đính kèm (merge từ F-107).

## 2. Trường dữ liệu

Không có form nhập liệu — các trường **hiển thị** theo entity `WaterZone` (bảng `water_zones`):

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | waterZoneCode, waterZoneName | Có (hiển thị) | Text | Cột danh sách + chi tiết |
| 2 | orgUnitId + orgUnitName | Có (hiển thị) | UUID / Text | Tên đơn vị ánh xạ `OrgUnitCacheService` — tài liệu nền mục 3.3 |
| 3 | portId + tên Cảng biển | Có (hiển thị) | UUID / Text | Cột + lọc "Cảng biển chủ"; tên cảng là link chi tiết |
| 4 | area, maxDepth, avgDepth | Không | Number (DECIMAL) | Đúng precision/scale |
| 5 | waterZoneType | Không | Enum `WaterZoneType` | Loại vùng nước |
| 6 | operationalStatus, approvalStatus | Có (hiển thị) | Enum | Badge màu (HIỆN_HÀNH xanh lá, TẠM_NGƯNG đỏ, chờ duyệt vàng, đã duyệt xanh dương, từ chối đỏ) |
| 7 | attachments[] / giấy tờ | Không | File | Danh sách + Tải xuống/In; upload (F-107) |
| 8 | createdBy, createdAt, updatedBy, updatedAt | Không | UUID / TIMESTAMP | Metadata — chỉ Admin Cục thấy (tài liệu nền mục 3.2) |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.5 (7 trạng thái → enum `ApprovalStatus`; quy trình 2 cấp theo `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`).
- Danh sách/chi tiết hiển thị badge trạng thái hoạt động + trạng thái phê duyệt; trạng thái "Đã xóa (lịch sử)" không hiển thị trong danh sách mặc định.
- Hành động theo trạng thái + quyền: Phê duyệt/Từ chối chỉ khi chờ duyệt và có `waterzone:approve`; Xóa theo điều kiện SA chốt (F-034); Chỉnh sửa khi có `waterzone:update`.
- Chức năng chỉ xem — không thay đổi trạng thái.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-036-01 | `waterZoneCode` duy nhất toàn hệ thống | View |
| BR-036-02 | `portId` phải là cảng đang hoạt động (parent guard) | View |
| BR-036-03 | area (15,2), maxDepth (10,2), avgDepth (10,2) hiển thị đúng precision/scale | View |
| BR-036-04 | Hồ sơ mới mặc định trạng thái chờ duyệt (theo file chuẩn) | View |
| BR-036-05 | Xóa: soft delete, không child guard (leaf entity) — theo F-034 | View |
| BR-036-06 | Badge màu nhất quán toàn hệ thống (token trạng thái) | View |
| BR-036-07 | Metadata createdBy/createdAt/updatedBy/updatedAt chỉ hiển thị với Admin Cục | View |
| BR-036-08 | Tìm kiếm/lọc danh sách: trim, không phân biệt hoa/thường; dữ liệu giới hạn theo phạm vi đơn vị user | List |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem danh sách, chi tiết Vùng nước | `waterzone:read` |
| Upload / xóa giấy tờ đính kèm | `giayto:upload` / `giayto:delete` (đề xuất — SA chốt) |
| Xem lịch sử (F-037) | `waterzone:history` (đề xuất — SA chốt) |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Toàn quyền + audit fields |
| Lãnh đạo (LeDuan) | List/Detail/Delete/Approve/Reject/History |
| Chuyên viên Cục / Cảng vụ | List/Detail/History |
| Doanh nghiệp cảng | List/Detail/History |
| Nhân viên vận hành | List/Detail |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — xem full dữ liệu + metadata người tạo/người sửa/thời gian.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — hiển thị 7 trạng thái chung (badge) |
| 2 | Có bước phê duyệt không | Không trực tiếp — nút duyệt điều hướng sang F-035 |
| 3 | Lọc cha-con / theo đơn vị | Có — theo đơn vị (orgUnitId) + theo Cảng biển mẹ (portId) |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — metadata chỉ hiện với Admin Cục; nút hành động theo trạng thái + quyền |
| 5 | Quyền riêng | `waterzone:read` (xem); `waterzone:history` (lịch sử — đề xuất) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — upload giấy tờ đính kèm (merge từ F-107) |
| 8 | Giao diện khác mẫu chung | Không (dùng 5 component dùng chung: ScreenHeader, FilterBar, StatusTabs, DataTable, Pagination) |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/water-zones` | Danh sách Vùng nước phân trang: page, size, sortBy, sortDir, search, operationalStatus, approvalStatus, portId, orgUnitId | `waterzone:read` |
| GET | `/api/v1/water-zones/{id}` | Chi tiết Vùng nước | `waterzone:read` |
| GET | `/api/v1/ports?operationalStatus=OPERATIONAL` | Dropdown cảng mẹ (lọc) | `waterzone:read` |
| POST | `/api/v1/giay-to` | Upload giấy tờ (FormData: file + entityType=`water-zone` + entityId) | `giayto:upload` |
| GET | `/api/v1/giay-to?entityType=water-zone&entityId={id}` | Danh sách giấy tờ của Vùng nước | `waterzone:read` |
| GET | `/api/v1/giay-to/{id}/download` | Tải xuống giấy tờ | `waterzone:read` |
| DELETE | `/api/v1/giay-to/{id}` | Xóa giấy tờ (có xác nhận) | `giayto:delete` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `water_zones` + bảng con (tọa độ GIS, file đính kèm):** cấu trúc theo entity `WaterZone` — giống F-032 (mục 7); F-036 chỉ đọc, JOIN `ports` (tên cảng mẹ), `org_units` (tên đơn vị), giấy tờ — không thêm trường.

**Giấy tờ đính kèm (merge từ F-107):** entity `GiayTo` — 🔴 id, fileName, mimeType, fileSize, entityType, entityId, minioKey, uploadedBy, createdAt (SA chốt cách lưu: bảng riêng hoặc tái sử dụng bảng attachment của vùng nước).
