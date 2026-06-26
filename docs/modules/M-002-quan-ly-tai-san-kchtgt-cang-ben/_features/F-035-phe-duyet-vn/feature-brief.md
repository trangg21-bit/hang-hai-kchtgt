---
id: F-035
name: "Phê duyệt Vùng nước"
slug: phe-duyet-vn
module-id: M-002
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Phê duyệt Vùng nước

## Description
Quy trình phê duyệt Vùng nước theo hai cấp — Cấp 1 bởi Trưởng phòng Quản lý Cảng và Cấp 2 bởi Cục Hải quan — nhằm xác nhận thông tin, điều kiện địa lý và khả năng khai thác Vùng nước trước khi đưa vào sử dụng chính thức trong hệ thống.

## Business Intent
Đảm bảo mọi Vùng nước mới hoặc cập nhật đều trải qua quy trình phê duyệt hai cấp chặt chẽ, phản ánh tầm quan trọng của tài sản vùng nước đối với quản lý nhà nước về giao thông vận tải biển. Cấp 1 (Trưởng phòng) xem xét tính phù hợp với quy hoạch cảng biển cấp phòng, Cấp 2 (Cục) xác nhận tính phù hợp với chiến lược phát triển vùng biển cấp quốc gia. Quy trình này đảm bảo tính pháp lý, an toàn và hiệu quả khai thác tài sản vùng nước, phù hợp với các văn bản quy phạm pháp luật về quản lý cảng biển và vùng nước.

## Flow Summary
Chuyên viên/Người dùng tại Cảng khởi tạo yêu cầu phê duyệt Vùng nước bằng cách điền đầy đủ thông tin địa lý, điều kiện hải văn, khả năng thông hành và các giấy tờ liên quan. Yêu cầu được lưu ở trạng thái "chờ phê duyệt cấp 1" và gửi đến Trưởng phòng Quản lý Cảng để xem xét. Cấp 1 thực hiện phê duyệt hoặc từ chối; nếu từ chối, chuyên viên Cảng có thể chỉnh sửa và gửi lại. Nếu Cấp 1 phê duyệt, yêu cầu chuyển sang "chờ phê duyệt cấp 2" và gửi đến Cục để xem xét. Cấp 2 thực hiện phê duyệt hoặc từ chối; nếu từ chối, yêu cầu quay lại Cấp 1 để xử lý. Khi cả hai cấp đều phê duyệt, trạng thái Vùng nước chuyển sang "đã kích hoạt" và có thể sử dụng khai thác.

## Acceptance Criteria
1. Yêu cầu phê duyệt Vùng nước được gửi đến Trưởng phòng Quản lý Cảng để phê duyệt Cấp 1
2. Trưởng phòng có thể phê duyệt hoặc từ chối yêu cầu ở Cấp 1
3. Khi Cấp 1 phê duyệt, yêu cầu tự động chuyển sang "chờ phê duyệt Cấp 2" và gửi đến Cục
4. Cục có thể phê duyệt hoặc từ chối yêu cầu ở Cấp 2
5. Khi cả hai cấp đều phê duyệt, Vùng nước chuyển sang "đã kích hoạt"
6. Khi bị từ chối ở bất kỳ cấp nào, hệ thống ghi nhận lý do và chuyển trạng thái phù hợp

## In Scope
- Khởi tạo yêu cầu phê duyệt Vùng nước bởi chuyên viên Cảng
- Phê duyệt hoặc từ chối Cấp 1 bởi Trưởng phòng Quản lý Cảng
- Phê duyệt hoặc từ chối Cấp 2 bởi Cục
- Cập nhật trạng thái Vùng nước qua từng cấp (chờ cấp 1 / chờ cấp 2 / đã phê duyệt / bị từ chối)
- Chuyển trạng thái tự động giữa các cấp
- Chỉnh sửa và gửi lại khi bị từ chối

## Out of Scope
- Phê duyệt tự động dựa trên quy tắc
- Tích hợp với hệ thống nghiệp vụ bên ngoài (Cục)
- Bỏ qua Cấp 1 trong trường hợp đặc biệt

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Chuyên viên Cảng | Khởi tạo, Chỉnh sửa (khi bị từ chối), Xem |
| Trưởng phòng QL Cảng | Phê duyệt Cấp 1, Từ chối Cấp 1 |
| Cục | Phê duyệt Cấp 2, Từ chối Cấp 2 |
| Quản trị viên | Xem toàn bộ, Quản lý quy trình |

## Entities
- **VungNuoc**: id, ma, ten, viTri, toDo, dienTich, doSau, dieuKienHaiVan, khaNangThongHanh, loaiVungNuoc, trangThai, createdAt, updatedAt
- **YeuCauPheDuyet**: id, vungNuocId, nguoiTao, ngayTao, trangThaiCap1, trangThaiCap2, nguoiPheDuyetCap1, nguoiPheDuyetCap2, lyDoCap1, lyDoCap2, createdAt, updatedAt

## Business Rules
1. Vùng nước mới luôn bắt đầu ở trạng thái "chờ phê duyệt Cấp 1"
2. Chỉ Cấp 1 phê duyệt mới chuyển sang "chờ phê duyệt Cấp 2"
3. Nếu Cấp 2 từ chối, trạng thái quay lại "chờ phê duyệt Cấp 1" để xử lý lại
4. Chỉ khi cả Cấp 1 và Cấp 2 đều phê duyệt, Vùng nước mới chuyển sang "đã kích hoạt"
5. Mỗi cấp phải cung cấp lý do khi từ chối yêu cầu
6. Mọi thay đổi trạng thái đều được ghi nhận vào lịch sử Vùng nước

## Testing Strategy
Kiểm thử luồng phê duyệt hai cấp đầy đủ (Cấp 1 approve → Cấp 2 approve), kiểm thử trường hợp Cấp 1 từ chối, kiểm thử trường hợp Cấp 2 từ chối (quay về Cấp 1), kiểm thử trạng thái chuyển tiếp giữa các cấp, kiểm thử gửi thông báo đến từng cấp, kiểm thử xác thực quyền phê duyệt từng cấp.
