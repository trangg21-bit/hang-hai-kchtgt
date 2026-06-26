---
id: F-079
name: Quản lý Phao tiêu - Lịch sử
slug: quan-ly-phao-tieu-lich-su
module-id: M-013
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Phao tiêu - Lịch sử

## Description
Chức năng cho phép Chuyên viên viên chức hàng hải xem và quản lý lịch sử thay đổi của Phao tiêu qua từng phiên bản. Tính năng hiển thị bảng chronological các lần cập nhật với thông tin chi tiết về người thực hiện, thời gian, trường đã thay đổi, giá trị cũ và giá trị mới, hỗ trợ so sánh side-by-side giữa các phiên bản và khôi phục về phiên bản trước đó khi cần thiết, tương tự quy trình của Đèn biển.

## Business Intent
Hệ thống cần cung cấp cơ chế theo dõi và kiểm soát thay đổi đầy đủ cho mỗi Phao tiêu, cho phép回溯 mọi lần sửa đổi về thông tin kỹ thuật, đảm bảo tính minh bạch, trách nhiệm giải trình và khả năng khôi phục dữ liệu khi có sai sót, phục vụ công tác thanh tra, kiểm toán và phân tích diễn biến thông tin Phao tiêu theo thời gian tại các vùng biển mà Phao tiêu đang hoạt động.

## Flow Summary
Chuyên viên truy cập trang chi tiết Phao tiêu, chuyển sang tab "Lịch sử thay đổi". Hệ thống hiển thị bảng chronological liệt kê tất cả các lần cập nhật từ khi tạo đến hiện tại, mỗi dòng hiển thị: số thứ tự phiên bản, ngày giờ thay đổi, tên người thực hiện, danh sách các trường đã thay đổi (badge màu). Người dùng có thể click vào từng phiên bản để xem chi tiết side-by-side (trước/sau) các giá trị đã thay đổi. Tính năng tìm kiếm và lọc theo ngày, người thực hiện, hoặc trường thay đổi cũng được cung cấp.

## Acceptance Criteria
- Bảng lịch sử thay đổi hiển thị đầy đủ các lần cập nhật theo thứ tự thời gian giảm dần
- Mỗi dòng lịch sử hiển thị đúng thông tin: phiên bản, ngày giờ, người thực hiện, trường thay đổi
- Người dùng có thể click vào từng phiên bản để xem chi tiết so sánh giá trị trước và sau thay đổi
- Chức năng tìm kiếm và lọc lịch sử theo ngày, người thực hiện, hoặc trường thay đổi hoạt động chính xác
- Không có thay đổi nào bị mất hoặc bỏ sót trong lịch sử (tính toàn vẹn audit trail)
- Người dùng có quyền khôi phục về phiên bản trước đó khi được cấp quyền

## In Scope
- Bảng lịch sử thay đổi chronological của Phao tiêu
- Chi tiết side-by-side so sánh giá trị trước và sau cho từng phiên bản
- Tìm kiếm và lọc lịch sử theo ngày, người thực hiện, trường thay đổi
- Hiển thị badge màu cho các trường đã thay đổi
- Chức năng khôi phục về phiên bản trước đó (restricted role)
- Phân trang khi lịch sử vượt quá 50 bản ghi

## Out of Scope
- Tạo mới Phao tiêu (thuộc F-074)
- Cập nhật thông tin Phao tiêu (thuộc F-075)
- Xóa Phao tiêu (thuộc F-076)
- Phê duyệt Phao tiêu (thuộc F-077)
- Xem chi tiết Phao tiêu (thuộc F-078)

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | View history, View own changes |
| Trưởng phòng | View all history, View all changes |
| Lãnh đạo Cục | View all history, View all changes |
| Quản trị hệ thống | View all history, Recover any version |

## Architecture Notes
Lịch sử thay đổi được lưu trữ trong bảng `BuoyChangeLog` với trigger sau mỗi lần UPDATE trên bảng `buoys`. Endpoint REST API `GET /api/v1/buoys/{buoyId}/changelog` trả về danh sách chronological. Tính năng so sánh side-by-side sử dụng endpoint `GET /api/v1/buoys/{buoyId}/changelog/{changeId}/diff`. Frontend hiển thị timeline component với khả năng click để expand chi tiết.

## Entities
- **BuoyChangeLog**: id, buoyId, versionNumber, changedBy, changedAt, fieldName, oldValue, newValue, reason, diffJson
- **BuoyVersion**: id, buoyId, versionNumber, snapshotData, createdAt, createdBy

## Business Rules
1. Mọi lần cập nhật Phao tiêu đều tự động tạo bản ghi trong bảng BuoyChangeLog (không thể bỏ qua)
2. Version number tăng dần từ 1, không có số trùng lặp cho cùng một Phao tiêu
3. Giá trị cũ và mới được lưu dưới dạng text để dễ dàng so sánh và traceability
4. Lịch sử chỉ lưu các trường thực sự thay đổi, không lưu các bản ghi với dữ liệu không đổi
5. Dữ liệu lịch sử không được phép xóa hoặc sửa đổi bởi bất kỳ vai trò nào ngoài Quản trị hệ thống
6. Tính năng khôi phục phiên bản tạo ra một bản ghi mới trong lịch sử (không xóa bản ghi gốc)

## Testing Strategy
- Unit test cho hàm tự động tạo bản ghi change log mỗi khi update entity Buoy
- Integration test cho API endpoint `GET /api/v1/buoys/{buoyId}/changelog` kiểm tra chronological order, filtering, pagination
- Integration test cho API endpoint diff kiểm tra hiển thị đúng giá trị trước/sau
- End-to-end test kiểm tra toàn bộ quy trình: tạo Phao tiêu → cập nhật → xem lịch sử → click vào phiên bản để xem chi tiết so sánh
- Test kiểm tra tính toàn vẹn: mỗi lần update tạo đúng 1 bản ghi change log
- Test kiểm tra chức năng lọc và tìm kiếm lịch sử theo ngày, người thực hiện, trường thay đổi
- Test kiểm tra tính năng khôi phục phiên bản tạo thêm bản ghi mới trong lịch sử
