---
id: F-074
name: Quản lý Phao tiêu - Tạo mới
slug: quan-ly-phao-tieu-tao-moi
module-id: M-013
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Phao tiêu - Tạo mới

## Description
Chức năng cho phép Chuyên viên viên chức hàng hải tạo mới hồ sơ đăng ký Phao tiêu phục vụ công tác quản lý hệ thống báo hiệu hàng hải. Giao diện cho phép nhập đầy đủ thông tin kỹ thuật, vị trí địa lý, đặc tính thị giác/điện tử, cấu trúc vật lý và các thuộc tính liên quan theo quy chuẩn kỹ thuật quốc gia về hệ thống báo hiệu hàng hải, tương tự như mô hình Đèn biển nhưng với các trường đặc thù cho Phao tiêu.

## Business Intent
Hệ thống cần cung cấp cơ chế chuẩn hóa để Chuyên viên có thể đăng ký Phao tiêu mới một cách nhanh chóng, chính xác và đầy đủ thông tin kỹ thuật, đảm bảo mọi hồ sơ tạo mới đều tuân thủ quy trình kiểm tra dữ liệu và sẽ được phê duyệt qua quy trình 2 cấp trước khi đưa vào hoạt động chính thức trên hệ thống quản lý báo hiệu hàng hải, góp phần đảm bảo an toàn hàng hải tại các tuyến đường biển và khu vực cảng.

## Flow Summary
Chuyên viên đăng nhập hệ thống, chọn chức năng tạo mới Phao tiêu từ danh sách quản lý, điền đầy đủ thông tin kỹ thuật bao gồm mã định danh Phao tiêu, vị trí tọa độ (kinh độ, vĩ độ), loại Phao tiêu (cạnh lề, giữa lạch, nguy hiểm, đặc biệt), đặc tính (màu sắc, hình dáng, ánh sáng, radar reflector), cấu trúc vật lý (loại neo, chiều sâu nước tại vị trí), và các thuộc tính kỹ thuật bổ sung. Hệ thống tự động kiểm tra tính hợp lệ của dữ liệu nhập vào, lưu bản nháp vào cơ sở dữ liệu với trạng thái "chờ phê duyệt" và thông báo cho người dùng về việc hồ sơ đã được gửi đến quy trình phê duyệt 2 cấp (Phòng → Cục).

## Acceptance Criteria
- Chuyên viên có thể truy cập giao diện tạo mới Phao tiêu từ menu quản lý hệ thống báo hiệu hàng hải
- Tất cả trường bắt buộc (mã Phao tiêu, vị trí tọa độ, loại Phao tiêu, đặc tính) phải được kiểm tra hợp lệ trước khi lưu
- Hệ thống hiển thị thông báo thành công khi tạo mới Phao tiêu và chuyển sang trạng thái "chờ phê duyệt"
- Hồ sơ Phao tiêu mới được lưu trữ chính xác với đầy đủ thông tin kỹ thuật và thời gian tạo
- Phao tiêu mới tạo không xuất hiện trong danh sách phao hoạt động cho đến khi được phê duyệt

## In Scope
- Giao diện form tạo mới Phao tiêu với các trường thông tin kỹ thuật đặc thù
- Kiểm tra tính hợp lệ dữ liệu đầu vào (validation) cho từng loại Phao tiêu
- Lưu hồ sơ Phao tiêu với trạng thái chờ phê duyệt
- Thông báo thành công hoặc lỗi cho người dùng
- Ghi nhật ký audit trail cho hành động tạo mới

## Out of Scope
- Phê duyệt Phao tiêu (thuộc F-077)
- Chỉnh sửa thông tin Phao tiêu sau khi tạo (thuộc F-075)
- Xóa Phao tiêu (thuộc F-076)
- Xem chi tiết Phao tiêu (thuộc F-078)
- Quản lý lịch sử thay đổi (thuộc F-079)

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên | Create, View own submissions |
| Trưởng phòng | Approve |
| Lãnh đạo Cục | Approve |
| Quản trị hệ thống | View all, Override |

## Architecture Notes
Tính năng được triển khai dưới dạng endpoint REST API `POST /api/v1/buoys` phục vụ bởi Service Layer, sử dụng Repository Pattern để truy cập dữ liệu qua entity Buoy. Frontend là form Vue.js/React tích hợp trong module quản lý báo hiệu hàng hải, sử dụng dynamic form fields theo loại Phao tiêu. Validation được thực hiện cả ở client và server-side. Trạng thái workflow được quản lý qua field `status` với giá trị mặc định `pending_approval`.

## Entities
- **Buoy**: id, buoyCode, name, latitude, longitude, buoyType, shape, color, lightCharacteristic, radarReflector, mooringType, waterDepth, status, installedDate, createdBy, createdAt, updatedAt
- **BuoyType**: id, code, name, shapeCategory, colorCategory, description

## Business Rules
1. Mã Phao tiêu phải là duy nhất trên toàn hệ thống, không được trùng lặp với bất kỳ Phao tiêu đã tồn tại
2. Tọa độ vị trí phải nằm trong phạm vi lãnh hải Việt Nam (kinh độ: 101°E - 110°E, vĩ độ: 8°N - 24°N)
3. Mọi Phao tiêu mới tạo đều phải có trạng thái ban đầu là "pending_approval" và không hoạt động cho đến khi được phê duyệt
4. Loại Phao tiêu (cạnh lề, giữa lạch, nguy hiểm, đặc biệt) phải tuân thủ quy chuẩn IALA Region A áp dụng tại Việt Nam
5. Chiều sâu nước tại vị trí Phao tiêu phải được ghi nhận và nằm trong khoảng cho phép theo loại Phao tiêu

## Testing Strategy
- Unit test cho validation logic của từng trường trong entity Buoy theo loại Phao tiêu
- Integration test cho API endpoint `POST /api/v1/buoys` kiểm tra các trường hợp tạo thành công và các trường hợp lỗi validation
- End-to-end test kiểm tra toàn bộ quy trình tạo mới từ giao diện người dùng đến khi dữ liệu được lưu vào cơ sở dữ liệu
- Test kiểm tra workflow trạng thái: Phao tiêu mới tạo luôn có status = "pending_approval"
- Test kiểm tra dynamic form fields hiển thị đúng theo loại Phao tiêu được chọn
