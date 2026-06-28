---
id: F-085
name: Quản lý lịch sử Nhà trạm phao
slug: quan-ly-nha-tram-phao-lich-su
module-id: M-014
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý lịch sử Nhà trạm phao

## Description
Tính năng cho phép Chuyên viên xem lại toàn bộ lịch sử thay đổi của một nhà trạm phao, bao gồm các lần tạo mới, cập nhật, phê duyệt, từ chối và xóa. Mỗi thay đổi được ghi nhận với thông tin người thực hiện, thời gian, trường bị thay đổi và giá trị cũ/mới, tạo thành một timeline biến động đầy đủ của bản ghi.

## Business Intent
Theo dõi và ghi nhận đầy đủ mọi thay đổi đối với nhà trạm phao nhằm đảm bảo tính minh bạch, trách nhiệm giải trình và khả năng truy vết (audit trail). Khi có sai sót hoặc tranh chấp, lịch sử thay đổi giúp xác định nguyên nhân và người chịu trách nhiệm.

## Flow Summary
Chuyên viên truy cập danh sách nhà trạm phao, chọn một bản ghi cụ thể và nhấn nút "Lịch sử". Hệ thống hiển thị một timeline dọc (vertical timeline) liệt kê từng sự kiện thay đổi theo thứ tự thời gian giảm dần, bao gồm: tạo mới, cập nhật (với diff chi tiết từng trường), phê duyệt/từ chối cấp 1 và cấp 2, và xóa (nếu có). Mỗi sự kiện hiển thị: loại hành động, người thực hiện, thời gian, và chi tiết thay đổi (nếu là update).

## Acceptance Criteria
- Chuyên viên có thể truy cập lịch sử thay đổi của một nhà trạm phao từ màn hình chi tiết.
- Lịch sử hiển thị theo dạng timeline dọc, sắp xếp theo thời gian giảm dần.
- Mỗi sự kiện ghi nhận: loại hành động, người thực hiện, thời gian, chi tiết thay đổi (trường cũ → mới).
- Lịch sử bao gồm tất cả hành động: tạo, cập nhật, phê duyệt, từ chối, xóa.
- Không cho phép chỉnh sửa hoặc xóa bất kỳ mục nào trong lịch sử.

## In Scope
- Giao diện timeline hiển thị lịch sử thay đổi của nhà trạm phao
- Hiển thị chi tiết diff (trường cũ → mới) cho mỗi lần cập nhật
- Hiển thị thông tin người thực hiện và thời gian cho mỗi sự kiện
- Bao gồm tất cả loại sự kiện: create, update, approve, reject, delete
- Sắp xếp theo thời gian giảm dần

## Out of Scope
- Xuất lịch sử ra file PDF/Excel
- So sánh lịch sử giữa 2 nhà trạm phao khác nhau
- Tìm kiếm lịch sử theo từ khóa trong nội dung thay đổi
- Cấu hình retention policy cho lịch sử
- Khôi phục bản ghi từ lịch sử (restore)

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Xem lịch sử |
| Trưởng phòng | Xem lịch sử |
| Lãnh đạo Cục | Xem lịch sử |
| Admin hệ thống | Xem lịch sử toàn bộ |

## Architecture Notes
- Frontend: Timeline component React (react-timeline hoặc custom), mỗi node là một Card với icon phân biệt loại sự kiện.
- Backend: GET `/api/v1/buoys/{id}/history` trả về array sorted by `changed_at DESC`, mỗi item là một version entry.
- Data source: Dữ liệu lấy từ bảng `buoy_station_changes` (update history) và `approval_audit_log` (approval/reject history), kết hợp qua query JOIN.
- Performance: Pagination áp dụng (20 items/page) cho nhà trạm có lịch sử dài.

## Entities
- **ChangeHistoryEntry**: id, buoyStationId, actionType (create/update/approve/reject/delete), actorId, actorName, timestamp, fieldChanges (JSON: old→new), previousValue, newValue

## Business Rules
1. Mọi thay đổi đối với nhà trạm phao đều được ghi nhận tự động vào lịch sử, không cho phép bỏ sót.
2. Lịch sử không cho phép chỉnh sửa hoặc xóa — dữ liệu lịch sử là immutable (bất biến).
3. Chi tiết thay đổi cho mỗi lần cập nhật bao gồm: tên trường, giá trị cũ, giá trị mới.
4. Lịch sử được sắp xếp theo thời gian giảm dần (mới nhất lên đầu).

## Testing Strategy
- Unit test: Kiểm tra service layer query kết hợp change history và approval audit, sắp xếp đúng thứ tự thời gian.
- Integration test: Gọi API history, xác nhận trả về đúng số lượng events, định dạng response chứa diff chi tiết.
- E2E test: Tạo nhà trạm → cập nhật vài lần → phê duyệt → từ chối → xác nhận timeline hiển thị đúng tất cả sự kiện với diff chính xác.
