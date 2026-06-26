---
id: F-072
name: Xem chi tiet Den bien
slug: xem-chi-tiet-den-bien
module: M-013
status: implemented
---

# Xem chi tiet Den bien

## Description

Tất cả các vai trò người dùng có thể xem chi tiết thông tin đèn biển (BeaconLight) trong hệ thống. Người dùng có quyền đọc (admin, chuyên viên, lãnh đạo, doanh nghiệp cảng) xem được thông tin cơ bản của đèn biển. Chỉ admin/chuyên viên mới xem được các trường kỹ thuật đầy đủ. Chỉ lãnh đạo mới xem được lịch sử phê duyệt. Doanh nghiệp cảng chỉ xem được đèn biển đã PUBLISHED.

## Business Intent

Cung cấp giao diện tra cứu, xem chi tiết thông tin đèn biển phục vụ công tác quản lý, tham khảo và ra quyết định. Đảm bảo người dùng chỉ thấy thông tin phù hợp với vai trò và trạng thái đèn biển.

## Flow Summary

1. Người dùng truy cập trang chi tiết đèn biển qua danh sách hoặc tra cứu
2. Hệ thống load thông tin đèn biển từ database
3. Hệ thống kiểm tra quyền xem của người dùng
4. Hệ thống hiển thị thông tin đèn biển phù hợp với vai trò
5. Nếu đèn biển chưa PUBLISHED và người dùng là doanh nghiệp cảng → ẩn thông tin

## In Scope

- Hiển thị thông tin chi tiết đèn biển: mã, tên, loại, tọa độ, lightRange, lightColor, lightCharacteristic, range, description, unitId, maintenance dates, isActive
- Hiển thị trạng thái hiện tại và trạng thái phê duyệt
- Hiển thị thông tin phê duyệt (L1, L2) nếu đã duyệt
- Hiển thị thông tin created/updated bởi ai, khi nào
- Hiển thị trên bản đồ GIS (nhúng từ M-007)
- Hiển thị lịch sử thay đổi cơ bản (created, updated timestamps)
- Permission-based field visibility

## Out of Scope

- Chỉnh sửa đèn biển — thuộc F-069
- Xóa đèn biển — thuộc F-070
- Xem lịch sử đầy đủ — thuộc F-073
- Xuất thông tin ra file — thuộc tính năng riêng
- Sao chép đèn biển sang đơn vị khác

## Data Model — Display Fields

| Trường (VN) | Hiển thị cho | Ghi chú |
|---|---|---|
| Mã đèn biển | Tất cả | |
| Tên đèn biển | Tất cả | |
| Loại đèn | Tất cả | |
| Trạng thái | Tất cả | Hiển thị badge màu |
| Tọa độ | admin/chuyên viên/leader | |
| Phạm vi chiếu sáng | admin/chuyên viên/leader | |
| Màu ánh sáng | admin/chuyên viên/leader | |
| Đặc tính ánh sáng | admin/chuyên viên/leader | |
| Phạm vi quan sát | admin/chuyên viên/leader | |
| Mô tả | Tất cả | |
| Đơn vị quản lý | Tất cả | |
| Ngày bảo trì gần nhất | admin/chuyên viên/leader | |
| Ngày bảo trì kế tiếp | admin/chuyên viên/leader | |
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
| BR-072-01 | Chỉ đèn biển có status = DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, PUBLISHED mới hiển thị | Hiển thị | Logic nghiệp vụ |
| BR-072-02 | Doanh nghiệp cảng chỉ xem được đèn biển có status = PUBLISHED | Xem | Phân quyền |
| BR-072-03 | Đèn biển có status = DELETED không hiển thị cho bất kỳ ai | Hiển thị | Logic nghiệp vụ |
| BR-072-04 | Chỉ admin/chuyên viên mới xem được các trường kỹ thuật đầy đủ | Xem | Phân quyền |
| BR-072-05 | Leader chỉ xem được đèn biển thuộc đơn vị mình quản lý + toàn bộ PUBLISHED | Xem | Phân quyền |
| BR-072-06 | Tọa độ hiển thị trên bản đồ GIS nhúng (M-007) | GIS | Integration |
| BR-072-07 | Lịch sử phê duyệt chỉ hiển thị cho admin/chuyên viên/leader | Xem | Phân quyền |
| BR-072-08 | Lý do từ chối chỉ hiển thị cho admin/chuyên viên/leader | Xem | Phân quyền |
| BR-072-09 | Người dùng có quyền admin có thể xem đèn biển thuộc bất kỳ đơn vị nào | Xem | Phân quyền |
| BR-072-10 | Nút "Gửi phê duyệt" chỉ hiển thị cho admin/chuyên viên khi status = DRAFT | UI | Phân quyền |

## Permission/Role Requirements

| Role | Level | Quyền Xem |
|---|---|---|
| system-admin | Full | Xem tất cả thông tin, tất cả đèn biển |
| admin (Cục chuyên viên) | CRUD | Xem tất cả thông tin, đèn biển Cục quản lý |
| admin (Chi cục/Cảng vụ chuyên viên) | CRUD | Xem tất cả thông tin, đèn biển đơn vị mình |
| user (Doanh nghiệp cảng) | Read-only | Chỉ xem đèn biển PUBLISHED, thông tin cơ bản |
| leader (Lãnh đạo phòng) | L1 | Xem đèn biển đơn vị mình + đã duyệt |
| leader (Lãnh đạo cục) | L2 | Xem tất cả đèn biển đã duyệt |

## Error Handling

| Error | HTTP Status | Message (VN) | Recovery |
|---|---|---|---|
| Đèn biển không tồn tại | 404 Not Found | `Đèn biển không tìm thấy.` | Quay lại danh sách |
| Đèn biển đã bị xóa | 404 Not Found | `Đèn biển này đã bị xóa.` | Không xem được |
| Không có quyền xem đèn biển này | 403 Forbidden | `Bạn không có quyền xem thông tin đèn biển này.` | Liên hệ quản trị |
| Đèn biển chưa được phê duyệt (doanh nghiệp cảng) | 404 Not Found | `Thông tin đèn biển này chưa được công bố.` | Không xem được |
| Lỗi server | 500 | `Hệ thống đang xảy ra sự cố.` | Báo admin |

## Integration Points

| Integration | Direction | Description |
|---|---|---|
| M-007 GIS | Inbound | Nhúng bản đồ GIS hiển thị vị trí đèn biển |
| M-001 Units | Inbound | Hiển thị tên đơn vị quản lý từ unitId |

## Acceptance Criteria

### AC-1: Admin xem đầy đủ thông tin đèn biển
- **Given** admin/chuyên viên đã đăng nhập
- **And** chọn một đèn biển có status = `PUBLISHED`
- **When** người dùng mở trang chi tiết
- **Then** hiển thị đầy đủ: mã, tên, loại, tọa độ, lightRange, lightColor, lightCharacteristic, range, description, unitId, maintenance dates, isActive
- **And** hiển thị thông tin phê duyệt (L1, L2)
- **And** hiển thị thông tin created/updated

### AC-2: Doanh nghiệp cảng chỉ xem đèn biển PUBLISHED
- **Given** user/doanh nghiệp cảng đã đăng nhập
- **And** chọn một đèn biển có status = `PUBLISHED`
- **When** người dùng mở trang chi tiết
- **Then** hiển thị thông tin cơ bản: mã, tên, loại, tọa độ, description, đơn vị quản lý
- **And** không hiển thị các trường kỹ thuật (lightColor, lightCharacteristic, maintenance dates)
- **And** không hiển thị thông tin phê duyệt

### AC-3: Doanh nghiệp cảng không xem được đèn biển DRAFT
- **Given** user/doanh nghiệp cảng đã đăng nhập
- **And** cố gắng mở đèn biển có status = `DRAFT`
- **Then** hệ thống hiển thị "Thông tin đèn biển này chưa được công bố"
- **And** HTTP status 404

### AC-4: Leader xem đèn biển đơn vị mình
- **Given** leader phòng/chỉ huy đã đăng nhập
- **And** chọn một đèn biển thuộc đơn vị mình
- **When** người dùng mở trang chi tiết
- **Then** hiển thị đầy đủ thông tin đèn biển
- **And** hiển thị lịch sử phê duyệt

### AC-5: Leader không xem được đèn biển đơn vị khác (không PUBLISHED)
- **Given** leader phòng đã đăng nhập
- **And** cố gắng mở đèn biển thuộc đơn vị khác có status ≠ PUBLISHED
- **Then** hệ thống hiển thị "Bạn không có quyền xem thông tin đèn biển này"
- **And** HTTP status 403

### AC-6: Hiển thị trên bản đồ GIS
- **Given** admin/chuyên viên đang xem chi tiết đèn biển
- **When** trang được load
- **Then** bản đồ GIS được nhúng hiển thị vị trí đèn biển
- **And** marker hiển thị đúng tọa độ
- **And** popup marker hiển thị tên đèn biển

### AC-7: Hiển thị trạng thái badge màu
- **Given** trang chi tiết đèn biển được load
- **When** đèn biển có status = `PUBLISHED`
- **Then** badge trạng thái màu xanh lá "Đã công bố"
- **When** status = `APPROVED_L1`
- **Then** badge màu vàng "Đã phê duyệt L1"
- **When** status = `PENDING_APPROVAL`
- **Then** badge màu cam "Chờ phê duyệt"
- **When** status = `DRAFT`
- **Then** badge màu xám "Nháp"

### AC-8: Hiển thị lịch sử phê duyệt cho leader
- **Given** leader cục đã đăng nhập
- **And** đèn biển đã được phê duyệt cả L1 và L2
- **When** người dùng mở trang chi tiết
- **Then** hiển thị: "Đã phê duyệt L1 bởi [tên leader phòng] vào [date]"
- **And** hiển thị: "Đã phê duyệt L2 bởi [tên leader cục] vào [date]"
- **And** hiển thị trạng thái cuối cùng là PUBLISHED

### AC-9: Không hiển thị đèn biển DELETED
- **Given** người dùng bất kỳ đã đăng nhập
- **And** cố gắng mở đèn biển có status = `DELETED`
- **Then** hệ thống hiển thị "Đèn biển này đã bị xóa"
- **And** HTTP status 404

### AC-10: Hiển thị thông tin phê duyệt L1/L2 khi từ chối
- **Given** đèn biển bị từ chối ở cấp L2
- **And** rejectionReason = "Tọa độ cần kiểm tra lại"
- **When** admin mở trang chi tiết
- **Then** hiển thị "Phê duyệt L2: TỪ CHỐI — Lý do: Tọa độ cần kiểm tra lại"
- **And** hiển thị status = DRAFT

## Testing Strategy

- **Unit Testing**:
  - Test permission-based field visibility
  - Test PUBLISHED-only visibility for doanh nghiệp cảng
  - Test unit-based permission for leader

- **Integration Testing**:
  - Test full detail page load with all fields
  - Test M-007 GIS map embedding
  - Test permission enforcement at API level

- **E2E Testing**:
  - Test detail page rendering for each role
  - Test badge color for each status
  - Test map embedding and marker display
  - Test permission denied pages

- **Security Testing**:
  - RBAC: role-based field visibility
  - IdOR: cannot access record of another unit
  - PUBLISHED-only constraint for user role
