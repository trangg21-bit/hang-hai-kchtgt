---
id: F-009
name: Quản lý Cảng biển - Cập nhật
slug: ql-cb-cap-nhat
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:19Z
last-updated: 2026-07-28
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Cảng biển - Cập nhật

## Description

Tính năng cho phép người dùng có thẩm quyền cập nhật thông tin của một Cảng biển đã tồn tại trong hệ thống, bao gồm thay đổi tên cảng, vị trí địa lý, diện tích, khả năng tiếp nhận tàu và các thuộc tính kỹ thuật khác, với cơ chế kiểm tra trùng lặp và ghi nhật ký thay đổi đầy đủ. Giao diện CangBienEditPage cung cấp form pre-fill từ API với React Hook Form + Zod validation inline, maCang readonly, tự động reset trạng thái phê duyệt về CHỜ_PHÊ_DUYỆT và tạo LichSuThayDoi sau mỗi lần cập nhật.

## Business Intent

Thông tin Cảng biển thay đổi theo thời gian do quá trình mở rộng, cải tạo hoặc tái cấu trúc hạ tầng; việc cho phép cập nhật thông tin chính xác giúp đảm bảo cơ sở dữ liệu cảng luôn phản ánh đúng tình trạng thực tế, hỗ trợ hiệu quả cho công tác quy hoạch, điều phối hoạt động cảng và báo cáo. Mọi cập nhật yêu cầu phê duyệt lại để đảm bảo tính toàn vẹn dữ liệu.

## Flow Summary

### BE Flow
Người dùng chọn Cảng biển cần cập nhật từ danh sách. Hệ thống hiển thị biểu mẫu với thông tin hiện tại được điền sẵn. Người dùng chỉnh sửa các trường cần thay đổi, hệ thống kiểm tra tính hợp lệ. Sau khi lưu, hệ thống ghi nhận nhật ký thay đổi.

### UI Flow
Người dùng nhấp "Chỉnh sửa" từ danh sách (F-068) hoặc trang chi tiết (F-069), hệ thống gọi GET /api/v1/cang-bien/:id để lấy dữ liệu hiện tại và pre-fill form. Form hiển thị 7 trường với maCang readonly. GPS fields (viDo/kinhDo) phải được cung cấp cùng nhau (BE validates @AssertTrue isGpsPaired()). Submit gọi PUT /api/v1/cang-bien/:id, server trả về bản ghi đã cập nhật với trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT và tạo LichSuThayDoi. Toast "Cập nhật thành công — chờ phê duyệt lại", điều hướng về danh sách.

## Acceptance Criteria

1. Người dùng có vai trò Admin hoặc Quản lý cảng có thể truy cập chức năng cập nhật.
2. Các trường không thể thay đổi: mã cảng; tất cả các trường khác đều có thể chỉnh sửa.
3. Hệ thống hiển thị cảnh báo khi Cảng biển đang trong quá trình phê duyệt hoặc đã bị xóa mềm.
4. Mỗi lần cập nhật thành công, hệ thống tự động ghi nhận nhật ký thay đổi.
5. [UI] Form pre-fill từ GET /api/v1/cang-bien/:id, maCang readonly, validation React Hook Form + Zod.
6. [UI] Submit PUT /api/v1/cang-bien/:id → reset trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT → tạo LichSuThayDoi → toast → về danh sách.
7. [UI] Nếu maCang trùng, API trả HTTP 409 → toast lỗi.

## In Scope

- Biểu mẫu cập nhật với dữ liệu hiện tại điền sẵn
- Validation cho các trường có thể thay đổi
- Kiểm tra xung đột dữ liệu trước khi lưu
- Ghi nhật ký thay đổi
- Form cập nhật với pre-fill (React Hook Form + Zod)
- maCang readonly
- Reset trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT sau update
- Tự động tạo LichSuThayDoi record

## Out of Scope

- Thay đổi mã Cảng biển (không cho phép)
- Quy trình phê duyệt thay đổi lớn (thuộc F-011)
- Xóa Cảng biển (thuộc F-010)
- Lịch sử tất cả phiên bản (thuộc F-013)
- Chỉnh sửa nhiều bản ghi cùng lúc (bulk edit)

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Admin | Cập nhật, Xem, Xóa, Phê duyệt |
| Lãnh đạo | Cập nhật, Xem, Xóa, Phê duyệt/Từ chối |
| Chuyên viên Cục | Cập nhật Cảng biển của Cục mình |
| Chuyên viên Cảng vụ | Cập nhật Cảng biển của Cảng vụ mình |
| Doanh nghiệp cảng | Cập nhật Cảng biển của đơn vị mình |
| Nhân viên vận hành | Xem (không cập nhật) |

## Entities

- **CangBien**: id (UUID), maCang (string, unique, read-only), tenCang (string), tinhThanhPho (string), viDo (BigDecimal, range -90..90), kinhDo (BigDecimal, range -180..180), dienTich (BigDecimal, >0), khaNangTiepNhan (BigDecimal), trangThaiHoatDong (string), trangThaiPheDuyet (string: CHỜ_PHÊ_DUYỆT/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt, updatedAt, deletedAt (nullable)
- **LichSuThayDoi**: id (UUID), cangBienId (UUID), loaiThayDoi (CẬP_NHẬT), field (string), oldValue, newValue, thayDoiBoi (UUID), changedAt

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | maCang không thể thay đổi sau khi tạo (readonly) | maCang | Entity spec, F-009, F-071 |
| BR-002 | viDo [-90, 90], kinhDo [-180, 180], dienTich [0, 5000] | GPS + Diện tích | Entity spec |
| BR-003 | trangThaiPheDuyet tự động reset về CHỜ_PHÊ_DUYỆT sau cập nhật | Cập nhật | F-009, F-071 |
| BR-004 | LichSuThayDoi được tạo tự động khi cập nhật | Lịch sử | F-009, F-071, INT-003 |

## UI Scope

- **Component:** `CangBienEditPage` — React Hook Form + Zod, pre-fill từ `GET /api/v1/cang-bien/:id`
- **API endpoint:** `PUT /api/v1/cang-bien/:id`
- **Fields:** maCang (string, readonly), tenCang (string, required), tinhThanhPho (string, required), viDo (BigDecimal [-90,90]), kinhDo (BigDecimal [-180,180]), dienTich (BigDecimal [0,5000]), khaNangTiepNhan (BigDecimal)
- **Validation inline:** React Hook Form + Zod, cùng schema như tạo mới
- **Pre-fill:** GET /api/v1/cang-bien/:id để lấy dữ liệu hiện tại
- **maCang readonly:** Trường maCang luôn ở chế độ disabled
- **Submit flow:** PUT /api/v1/cang-bien/:id → reset `trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT` → tạo `LichSuThayDoi` → toast "Cập nhật thành công — chờ phê duyệt lại" → về danh sách (F-068)
- **RBAC:** Chỉ role có `cangbien:update` (Admin, Lãnh đạo, Chuyên viên Cục/Cảng vụ, Doanh nghiệp cảng)
- **Navigation:** Từ danh sách (F-068) hoặc chi tiết (F-069) → nút "Chỉnh sửa"

## Testing Strategy

### BE Testing
Kiểm thử đơn vị cho các quy tắc validation; kiểm thử tích hợp cho luồng cập nhật qua API; kiểm thử nhật ký thay đổi.

### UI Testing
React Testing Library: pre-fill form, validation inline, xử lý lỗi 409. Cypress E2E: chi tiết → click Chỉnh sửa → pre-fill OK → thay đổi fields → submit → toast "Cập nhật thành công — chờ phê duyệt lại" → về danh sách → xác nhận LichSuThayDoi. Negative: maCang readonly; viDo = -100 → range error.

## Consolidation Note

Merged with UI feature F-071 (ui-ql-cb-cap-nhat) — 2026-07-28
