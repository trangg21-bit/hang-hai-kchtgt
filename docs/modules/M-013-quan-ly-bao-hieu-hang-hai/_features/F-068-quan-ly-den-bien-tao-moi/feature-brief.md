---
id: F-068
name: Quản lý Đèn biển - Tạo mới
slug: quan-ly-den-bien-tao-moi
module-id: M-013
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Đèn biển - Tạo mới

## Description
Chức năng cho phép Chuyên viên viên chức hàng hải tạo mới hồ sơ đăng ký Đèn biển (Đèn biển) phục vụ công tác quản lý hệ thống báo hiệu hàng hải. Giao diện cho phép nhập đầy đủ thông tin kỹ thuật, vị trí địa lý, đặc tính chiếu sáng và các thuộc tính liên quan theo quy chuẩn kỹ thuật quốc gia về hệ thống báo hiệu hàng hải.

## Business Intent
Hệ thống cần cung cấp cơ chế chuẩn hóa để Chuyên viên có thể đăng ký Đèn biển mới một cách nhanh chóng, chính xác và đầy đủ thông tin kỹ thuật, đảm bảo mọi hồ sơ tạo mới đều tuân thủ quy trình kiểm tra dữ liệu và sẽ được phê duyệt qua quy trình 2 cấp trước khi hoạt động chính thức trên hệ thống quản lý báo hiệu hàng hải.

## Flow Summary
Chuyên viên đăng nhập hệ thống, chọn chức năng tạo mới Đèn biển từ danh sách quản lý, điền đầy đủ thông tin kỹ thuật bao gồm mã định danh Đèn biển, vị trí tọa độ (kinh độ, vĩ độ), loại Đèn biển, đặc tính chiếu sáng (màu sắc, chu kỳ, tầm nhìn), công suất nguồn điện, và các thuộc tính kỹ thuật bổ sung. Hệ thống tự động kiểm tra tính hợp lệ của dữ liệu nhập vào, lưu bản nháp vào cơ sở dữ liệu với trạng thái "chờ phê duyệt" và thông báo cho người dùng về việc hồ sơ đã được gửi đến quy trình phê duyệt 2 cấp (Phòng → Cục).

## Acceptance Criteria
- Chuyên viên có thể truy cập giao diện tạo mới Đèn biển từ menu quản lý hệ thống báo hiệu hàng hải
- Tất cả trường bắt buộc (mã Đèn biển, vị trí tọa độ, loại Đèn biển, đặc tính chiếu sáng) phải được kiểm tra hợp lệ trước khi lưu
- Hệ thống hiển thị thông báo thành công khi tạo mới Đèn biển và chuyển sang trạng thái "chờ phê duyệt"
- Hồ sơ Đèn biển mới được lưu trữ chính xác với đầy đủ thông tin kỹ thuật và thời gian tạo
- Đèn biển mới tạo không xuất hiện trong danh sách đèn hoạt động cho đến khi được phê duyệt

## In Scope
- Giao diện form tạo mới Đèn biển với các trường thông tin kỹ thuật
- Kiểm tra tính hợp lệ dữ liệu đầu vào (validation)
- Lưu hồ sơ Đèn biển với trạng thái chờ phê duyệt
- Thông báo thành công hoặc lỗi cho người dùng
- Ghi nhật ký audit trail cho hành tạo mới

## Out of Scope
- Phê duyệt Đèn biển (thuộc F-071)
- Chỉnh sửa thông tin Đèn biển sau khi tạo (thuộc F-069)
- Xóa Đèn biển (thuộc F-070)
- Xem chi tiết Đèn biển (thuộc F-072)
- Quản lý lịch sử thay đổi (thuộc F-073)

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Create, View own submissions |
| Trưởng phòng | Approve |
| Lãnh đạo Cục | Approve |
| Quản trị hệ thống | View all, Override |

## Architecture Notes
Tính năng được triển khai dưới dạng endpoint REST API `POST /api/v1/beacons` phục vụ bởi Service Layer, sử dụng Repository Pattern để truy cập dữ liệu qua entity Beacon. Frontend là form Vue.js/React tích hợp trong module quản lý báo hiệu hàng hải. Validation được thực hiện cả ở client và server-side. Trạng thái workflow được quản lý qua field `status` với giá trị mặc định `pending_approval`.

## Entities
- **Beacon**: id, beaconCode, name, latitude, longitude, beaconType, lightCharacteristic, color, period, luminousRange, powerSource, status, installedDate, createdBy, createdAt, updatedAt

## Business Rules
1. Mã Đèn biển phải là duy nhất trên toàn hệ thống, không được trùng lặp với bất kỳ Đèn biển đã tồn tại
2. Tọa độ vị trí phải nằm trong phạm vi lãnh hải Việt Nam (kinh độ: 101°E - 110°E, vĩ độ: 8°N - 24°N)
3. Mọi Đèn biển mới tạo đều phải có trạng thái ban đầu là "pending_approval" và không hoạt động cho đến khi được phê duyệt
4. Đặc tính chiếu sáng phải tuân thủ quy chuẩn IALA (International Association of Marine Aids to Navigation and Lighthouse Authorities)

## Testing Strategy
- Unit test cho validation logic của từng trường trong entity Beacon
- Integration test cho API endpoint `POST /api/v1/beacons` kiểm tra các trường hợp tạo thành công và các trường hợp lỗi validation
- End-to-end test kiểm tra toàn bộ quy trình tạo mới từ giao diện người dùng đến khi dữ liệu được lưu vào cơ sở dữ liệu
- Test kiểm tra workflow trạng thái: Đèn biển mới tạo luôn có status = "pending_approval"
