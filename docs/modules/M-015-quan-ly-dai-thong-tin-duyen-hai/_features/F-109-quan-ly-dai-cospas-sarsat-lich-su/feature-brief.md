---
id: F-109
name: Quản lý Đại Cospas-Sarsat - Lịch sử
slug: quan-ly-dai-cospas-sarsat-lich-su
module-id: M-015
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Đại Cospas-Sarsat - Lịch sử

## Description
Cho phép Chuyên viên xem và theo dõi toàn bộ lịch sử thay đổi của một Đại Cospas-Sarsat (trạm vệ tinh cứu nạn Cospas-Sarsat), bao gồm các lần tạo mới, cập nhật, phê duyệt, từ chối và xóa. Lịch sử được hiển thị dạng timeline tương tác, cho phép xem chi tiết nội dung thay đổi giữa các phiên bản.

## Business Intent
Theo dõi và kiểm soát toàn bộ lịch sử thay đổi của thông tin Đại Cospas-Sarsat để đảm bảo tính minh bạch, hỗ trợ hoạt động kiểm toán và cho phép truy xuất nguyên nhân khi có sai sót hoặc vấn đề phát sinh trong quá trình quản lý hệ thống vệ tinh cứu nạn Cospas-Sarsat phục vụ công tác tìm kiếm cứu nạn trên biển.

## Flow Summary
Chuyên viên truy cập trang chi tiết Đại Cospas-Sarsat, chọn tab "Lịch sử thay đổi", hệ thống hiển thị danh sách các sự kiện theo thứ tự thời gian (tạo → cập nhật → phê duyệt → từ chối → xóa), mỗi sự kiện hiển thị người thực hiện, thời gian, loại hành động và ghi chú. Chuyên viên có thể click vào từng sự kiện để xem chi tiết nội dung thay đổi (trước/sau).

## Acceptance Criteria
- Hiển thị đầy đủ lịch sử thay đổi của một Đại Cospas-Sarsat theo thứ tự thời gian
- Mỗi sự kiện trong lịch sử hiển thị: người thực hiện, thời gian, loại hành động, ghi chú
- Có thể xem chi tiết nội dung thay đổi (trước/sau) cho mỗi lần cập nhật
- Lịch sử được phân trang khi có nhiều hơn 50 sự kiện
- Dữ liệu lịch sử không thể bị xóa hoặc chỉnh sửa

## In Scope
- Giao diện hiển thị timeline lịch sử thay đổi
- Chi tiết từng sự kiện (người thực hiện, thời gian, loại hành động, ghi chú)
- So sánh nội dung (diff) giữa các phiên bản cho từng lần cập nhật
- Phân trang và tìm kiếm trong lịch sử
- Xuất lịch sử ra file PDF (optional)
- Lọc theo loại hành động (tạo, cập nhật, phê duyệt, từ chối, xóa)

## Out of Scope
- Xóa hoặc chỉnh sửa lịch sử đã ghi nhận
- Khôi phục bản ghi từ lịch sử (thuộc feature khác)
- Theo dõi lịch sử của nhiều bản ghi cùng lúc
- Thông báo real-time khi có thay đổi (webhook)

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Xem lịch sử Đại Cospas-Sarsat của mình |
| Trưởng phòng | Xem lịch sử toàn bộ Đại Cospas-Sarsat |
| Trưởng cục | Xem lịch sử toàn bộ Đại Cospas-Sarsat |
| Admin | Xem lịch sử toàn bộ, Xuất dữ liệu |

## Architecture Notes
Lịch sử được lưu trong bảng `coastal_station_cospas_sarsat_history` với các trường entity_id, action_type, changed_by, changed_at, old_values(JSON), new_values(JSON), comment. Query lấy tất cả sự kiện cho một entity_id, sắp xếp theo changed_at DESC. Dùng pagination để tránh tải quá nhiều dữ liệu.

## Entities
- **CoastalStationCospasSarsat**: id, device_code, station_name, beacon_type, frequency, coverage_zone, status
- **CoastalStationCospasSarsatChange**: id, station_id, action_type (CREATE/UPDATE/APPROVE/REJECT/DELETE), changed_by, changed_at, old_values(JSON), new_values(JSON), comment, version_before, version_after

## Business Rules
1. Mọi thay đổi (tạo, cập nhật, phê duyệt, từ chối, xóa) đều được ghi nhận vào lịch sử
2. Lịch sử không thể bị xóa hoặc chỉnh sửa bởi bất kỳ user nào
3. Hiển thị tối đa 50 sự kiện mỗi trang, có phân trang
4. Only bản ghi không bị xóa (is_deleted = false) có thể xem lịch sử (trừ Admin)
5. Admin có thể xem lịch sử của cả bản ghi đã xóa

## Testing Strategy
- Test unit: query lịch sử đúng theo entity_id, sắp xếp thời gian
- Test integration: API trả về đúng format, phân trang hoạt động
- Test UI: timeline hiển thị đúng, diff view hoạt động
- Test permission: xác nhận role khác nhau xem đúng phạm vi
