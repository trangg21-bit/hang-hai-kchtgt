---
id: F-081
name: Cập nhật Nhà trạm phao
slug: quan-ly-nha-tram-phao-cap-nhat
module-id: M-014
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Cập nhật Nhà trạm phao

## Description
Tính năng cho phép Chuyên viên chỉnh sửa thông tin của nhà trạm phao đã tồn tại trong hệ thống, bao gồm cập nhật tên, tọa độ, loại phao, tình trạng hoạt động, mô tả và tài liệu đính kèm. Mọi thay đổi đều được ghi nhận và chuyển trạng thái về "chờ duyệt lại".

## Business Intent
Khi thông tin nhà trạm phao thay đổi (cập nhật tọa độ, đổi loại phao, sửa mô tả), hệ thống cho phép chỉnh sửa có kiểm soát. Mọi thay đổi đều yêu cầu phê duyệt lại để đảm bảo dữ liệu luôn chính xác và có đầy đủ lịch sử biến động.

## Flow Summary
Chuyên viên truy cập danh sách nhà trạm phao, chọn một bản ghi cụ thể, nhấn nút "Cập nhật" để mở form chỉnh sửa. Form tự động điền dữ liệu hiện tại của nhà trạm phao, người dùng thay đổi các trường cần cập nhật. Hệ thống so sánh dữ liệu cũ và mới, nếu có thay đổi ghi nhận trong log, sau khi lưu bản ghi chuyển sang trạng thái "chờ duyệt lại". Người dùng nhận được thông báo kết quả cập nhật.

## Acceptance Criteria
- Chuyên viên có thể mở form cập nhật từ danh sách nhà trạm phao bằng cách chọn bản ghi và nhấn nút "Cập nhật".
- Form cập nhật tự động điền dữ liệu hiện tại, cho phép chỉnh sửa các trường: tên, tọa độ, loại phao, tình trạng, mô tả, tài liệu đính kèm.
- Hệ thống ghi nhận mọi thay đổi vào lịch sử biến động của bản ghi.
- Sau khi lưu, bản ghi chuyển sang trạng thái "chờ duyệt lại" (pending re-approval).
- Người dùng nhận được thông báo kết quả cập nhật và có thể theo dõi trạng thái phê duyệt.

## In Scope
- Form chỉnh sửa thông tin nhà trạm phao đã tồn tại
- So sánh dữ liệu cũ/mới và ghi nhận thay đổi vào lịch sử
- Tự động chuyển trạng thái sang "chờ duyệt lại" sau khi cập nhật
- Upload tài liệu đính kèm mới hoặc xóa tài liệu cũ
- Thông báo kết quả cập nhật

## Out of Scope
- Tạo mới nhà trạm phao (thuộc F-080)
- Phê duyệt nhà trạm phao (thuộc F-083)
- Xem toàn bộ lịch sử thay đổi (thuộc F-085)
- Xóa nhà trạm phao (thuộc F-082)
- Xuất dữ liệu hàng loạt

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Cập nhật, Xem chi tiết |
| Trưởng phòng | Xem, Phê duyệt cập nhật |
| Lãnh đạo Cục | Xem, Phê duyệt cập nhật |
| Admin hệ thống | Cập nhật, Xem toàn bộ |

## Architecture Notes
- Frontend: Form React tương tự tạo mới nhưng mở ở chế độ edit, hiển thị badge "có thay đổi" khi dữ liệu khác bản gốc.
- Backend: Endpoint PUT `/api/v1/buoys/{id}`, service layer tính diff giữa bản ghi cũ và mới, ghi vào bảng `buoy_station_changes`.
- Versioning: Mỗi lần cập nhật tạo một phiên bản mới, bản ghi gốc được giữ nguyên để phục vụ audit.
- Audit log: Ghi lại user nào, lúc nào, thay đổi trường nào (old value → new value).

## Entities
- **BuoyStation**: id, name, code, longitude, latitude, buoyType, status, description, updatedBy, updatedAt, approvalStatus
- **BuoyStationChange**: id, buoyStationId, changedBy, changedAt, fieldChanges (JSON), newApprovalStatus

## Business Rules
1. Chỉ những nhà trạm phao ở trạng thái "đã duyệt" hoặc "chờ duyệt" mới cho phép cập nhật.
2. Mã định danh không được phép thay đổi khi cập nhật (immutable field).
3. Mọi thay đổi phải được ghi nhận vào lịch sử biến động với thông tin user và thời gian.
4. Sau khi cập nhật, bản ghi tự động chuyển sang trạng thái "chờ duyệt lại" và người phê duyệt cũ phải phê duyệt lại.

## Testing Strategy
- Unit test: Kiểm tra service layer tính diff, ghi log thay đổi, và chuyển trạng thái đúng.
- Integration test: Gọi API PUT, kiểm tra bản ghi được cập nhật, trạng thái chuyển thành "chờ duyệt lại", log thay đổi được ghi đúng.
- E2E test: Tạo nhà trạm phao, cập nhật 1-2 trường, xác nhận log thay đổi xuất hiện, trạng thái chuyển thành chờ duyệt lại.
