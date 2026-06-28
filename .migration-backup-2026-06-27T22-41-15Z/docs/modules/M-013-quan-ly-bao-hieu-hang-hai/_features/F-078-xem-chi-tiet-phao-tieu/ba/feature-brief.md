---
id: F-078
name: Xem chi tiet Phao tieu
slug: xem-chi-tiet-phao-tieu
module: M-013
status: proposed
---

# Xem chi tiet Phao tieu

## Description

Tất cả các vai trò người dùng có thể xem chi tiết thông tin phao tiêu (Buoy) trong hệ thống. Người dùng có quyền đọc xem thông tin cơ bản. Chỉ admin/chuyên viên mới xem được các trường kỹ thuật đầy đủ. Chỉ lãnh đạo mới xem được lịch sử phê duyệt. Doanh nghiệp cảng chỉ xem được phao tiêu đã PUBLISHED.

## Business Intent

Cung cấp giao diện tra cứu, xem chi tiết thông tin phao tiêu phục vụ công tác quản lý, tham khảo và ra quyết định. Đảm bảo người dùng chỉ thấy thông tin phù hợp với vai trò và trạng thái phao tiêu.

## Flow Summary

1. Người dùng truy cập trang chi tiết phao tiêu qua danh sách hoặc tra cứu
2. Hệ thống load thông tin từ database
3. Hệ thống kiểm tra quyền xem
4. Hiển thị thông tin phù hợp với vai trò
5. Nếu chưa PUBLISHED và user là doanh nghiệp cảng → ẩn thông tin

## In Scope

- Hiển thị chi tiết: mã, tên, loại, tọa độ, color, shape, lightCharacteristic, range, description, unitId, inspection dates, isActive
- Hiển thị trạng thái hiện tại và phê duyệt
- Hiển thị thông tin phê duyệt (L1, L2)
- Hiển thị created/updated
- Hiển thị trên bản đồ GIS (nhúng M-007)
- Permission-based field visibility

## Out of Scope

- Chỉnh sửa — thuộc F-075
- Xóa — thuộc F-076
- Xem lịch sử đầy đủ — thuộc F-079
- Xuất thông tin ra file
- Sao chép sang đơn vị khác

## Data Model — Display Fields

| Trường (VN) | Hiển thị cho | Ghi chú |
|---|---|---|
| Mã phao tiêu | Tất cả | |
| Tên phao tiêu | Tất cả | |
| Loại phao | Tất cả | |
| Trạng thái | Tất cả | Badge màu |
| Tọa độ | admin/chuyên viên/leader | |
| Màu sắc | admin/chuyên viên/leader | |
| Hình dạng | admin/chuyên viên/leader | |
| Đặc tính ánh sáng | admin/chuyên viên/leader | |
| Phạm vi quan sát | admin/chuyên viên/leader | |
| Mô tả | Tất cả | |
| Đơn vị quản lý | Tất cả | |
| Ngày kiểm tra gần nhất | admin/chuyên viên/leader | |
| Ngày kiểm tra kế tiếp | admin/chuyên viên/leader | |
| Trạng thái hoạt động | admin/chuyên viên/leader | |
| Người tạo | admin/chuyên viên/leader | |
| Ngày tạo | Tất cả | |
| Người cập nhật | admin/chuyên viên/leader | |
| Ngày cập nhật | Tất cả | |
| Thông tin phê duyệt L1 | admin/chuyên viên/leader | |
| Thông tin phê duyệt L2 | admin/chuyên viên/leader | |
| Lý do từ chối | admin/chuyên viên/leader | |

## Business Rules

| ID | Rule | Áp dụng cho | Nguồn |
|---|---|---|---|
| BR-078-01 | Chỉ phao tiêu DRAFT/PENDING/APPROVED_L1/APPROVED_L2/PUBLISHED mới hiển thị | Hiển thị | Logic |
| BR-078-02 | Doanh nghiệp cảng chỉ xem PUBLISHED | Xem | Phân quyền |
| BR-078-03 | Phao tiêu DELETED không hiển thị cho ai | Hiển thị | Logic |
| BR-078-04 | Chỉ admin/chuyên viên xem trường kỹ thuật đầy đủ | Xem | Phân quyền |
| BR-078-05 | Leader chỉ xem đơn vị mình + toàn bộ PUBLISHED | Xem | Phân quyền |
| BR-078-06 | Tọa độ hiển thị trên bản đồ GIS nhúng (M-007) | GIS | Integration |
| BR-078-07 | Lịch sử phê duyệt chỉ hiển thị cho admin/chuyên viên/leader | Xem | Phân quyền |
| BR-078-08 | Lý do từ chối chỉ hiển thị cho admin/chuyên viên/leader | Xem | Phân quyền |
| BR-078-09 | Admin xem được bất kỳ đơn vị nào | Xem | Phân quyền |
| BR-078-10 | Nút "Gửi phê duyệt" chỉ hiện cho admin khi status = DRAFT | UI | Phân quyền |

## Permission/Role Requirements

| Role | Level | Quyền Xem |
|---|---|---|
| system-admin | Full | Xem tất cả, tất cả phao tiêu |
| admin (Cục) | CRUD | Xem tất cả, phao tiêu Cục |
| admin (Chi cục/Cảng vụ) | CRUD | Xem tất cả, phao tiêu đơn vị mình |
| user (Doanh nghiệp cảng) | Read-only | Chỉ PUBLISHED, thông tin cơ bản |
| leader (Phòng) | L1 | Đơn vị mình + đã duyệt |
| leader (Cục) | L2 | Tất cả đã duyệt |

## Error Handling

| Error | HTTP Status | Message (VN) | Recovery |
|---|---|---|---|
| Không tồn tại | 404 | `Phao tiêu không tìm thấy.` | Quay lại danh sách |
| Đã bị xóa | 404 | `Phao tiêu này đã bị xóa.` | Không xem được |
| Không có quyền xem | 403 | `Bạn không có quyền xem thông tin phao tiêu này.` | Liên hệ admin |
| Chưa được phê duyệt (doanh nghiệp cảng) | 404 | `Thông tin phao tiêu này chưa được công bố.` | Không xem được |
| Lỗi server | 500 | `Hệ thống đang xảy ra sự cố.` | Báo admin |

## Integration Points

| Integration | Direction | Description |
|---|---|---|
| M-007 GIS | Inbound | Nhúng bản đồ GIS vị trí phao tiêu |
| M-001 Units | Inbound | Hiển thị tên đơn vị từ unitId |

## Acceptance Criteria

### AC-1: Admin xem đầy đủ thông tin
- **Given** admin đăng nhập, chọn phao tiêu PUBLISHED
- **When** mở trang chi tiết
- **Then** hiển thị tất cả: mã, tên, loại, tọa độ, color, shape, lightCharacteristic, range, description, unitId, inspection dates, isActive, phê duyệt L1/L2

### AC-2: Doanh nghiệp cảng chỉ xem PUBLISHED
- **Given** user/doanh nghiệp cảng đăng nhập
- **And** chọn phao tiêu PUBLISHED
- **When** mở trang chi tiết
- **Then** hiển thị thông tin cơ bản (mã, tên, loại, tọa độ, description, đơn vị)
- **And** không hiển thị: color, shape, inspection dates, phê duyệt info

### AC-3: Doanh nghiệp cảng không xem DRAFT
- **Given** user/doanh nghiệp cảng đăng nhập
- **And** cố mở phao tiêu DRAFT
- **Then** "Thông tin phao tiêu này chưa được công bố"

### AC-4: Leader xem đơn vị mình
- **Given** leader phòng đăng nhập
- **And** chọn phao tiêu đơn vị mình
- **When** mở trang chi tiết
- **Then** hiển thị đầy đủ thông tin + lịch sử phê duyệt

### AC-5: Leader không xem đơn vị khác (không PUBLISHED)
- **Given** leader phòng đăng nhập
- **And** cố mở phao tiêu đơn vị khác (status ≠ PUBLISHED)
- **Then** "Bạn không có quyền xem thông tin phao tiêu này"

### AC-6: Hiển thị trên bản đồ GIS
- **Given** admin/chuyên viên xem chi tiết
- **When** trang được load
- **Then** bản đồ GIS nhúng hiển thị vị trí phao tiêu
- **And** marker đúng tọa độ, popup hiển thị tên

### AC-7: Badge màu trạng thái
- **Given** trang chi tiết load
- **When** status = PUBLISHED → badge xanh "Đã công bố"
- **When** status = APPROVED_L1 → badge vàng "Đã phê duyệt L1"
- **When** status = PENDING_APPROVAL → badge cam "Chờ phê duyệt"
- **When** status = DRAFT → badge xám "Nháp"

### AC-8: Leader xem phê duyệt L1/L2
- **Given** leader cục đăng nhập
- **And** phao tiêu đã duyệt cả L1 và L2
- **When** mở trang chi tiết
- **Then** "Đã phê duyệt L1 bởi [tên leader phòng] vào [date]"
- **And** "Đã phê duyệt L2 bởi [tên leader cục] vào [date]"

### AC-9: Không hiển thị DELETED
- **Given** người dùng bất kỳ đăng nhập
- **And** cố mở phao tiêu DELETED
- **Then** "Phao tiêu này đã bị xóa"

### AC-10: Hiển thị rejectionReason cho admin
- **Given** phao tiêu bị từ chối L2
- **And** rejectionReason = "Tọa độ cần kiểm tra lại"
- **When** admin mở trang chi tiết
- **Then** "Phê duyệt L2: TỪ CHỐI — Lý do: Tọa độ cần kiểm tra lại"

## Testing Strategy

- **Unit Testing**: permission-based field visibility, PUBLISHED-only for user, unit-based for leader
- **Integration Testing**: full detail page load, M-007 GIS embedding, permission at API level
- **E2E Testing**: detail page rendering per role, badge colors, map embedding, permission denied pages
- **Security Testing**: RBAC, IdOR, PUBLISHED-only constraint for user role
