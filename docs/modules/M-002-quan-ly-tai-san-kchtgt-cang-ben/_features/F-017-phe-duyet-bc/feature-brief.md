---
id: F-017
name: "Phê duyệt Bến cảng"
slug: phe-duyet-bc
module-id: M-002
status: proposed
classification: local
priority: critical
created: "2026-06-16T04:40:42Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Phê duyệt Bến cảng

## Description

Tính năng cho phép người dùng có vai trò Quản trị viên hoặc người được ủy quyền phê duyệt thông tin Bến cảng mới được tạo hoặc cập nhật, bao gồm xem chi tiết, đánh giá tính hợp lệ về kỹ thuật (kích thước, độ sâu luồng, loại bến), chấp thuận hoặc từ chối yêu cầu cùng lý do cụ thể, nhằm đảm bảo chất lượng dữ liệu bến cảng trong hệ thống.

## Business Intent

Việc phê duyệt Bến cảng là bước kiểm soát chất lượng bắt buộc trước khi bến được đưa vào hoạt động trong hệ thống; quy trình này đảm bảo mọi Bến cảng đăng ký đều có đầy đủ thông tin kỹ thuật chính xác (kích thước, độ sâu luồng, loại bến), phù hợp với quy chuẩn an toàn hàng hải và được liên kết đúng với Cảng mẹ tương ứng, tạo cơ sở tin cậy cho công tác điều phối tàu bè và báo cáo quản lý nhà nước.

## Flow Summary

Sau khi Bến cảng được tạo mới hoặc cập nhật, hệ thống tự động chuyển trạng thái sang "Chờ phê duyệt" và thông báo đến người dùng có vai trò phê duyệt. Người dùng đăng nhập, truy cập vào danh sách Bến cảng chờ phê duyệt, chọn một Bến cần xem xét. Hệ thống hiển thị đầy đủ thông tin kỹ thuật của Bến cảng kèm bản đồ vị trí và lịch sử thay đổi. Người dùng đánh giá tính hợp lệ của các thông tin kỹ thuật (kích thước bến, độ sâu luồng, loại bến, Cảng mẹ), chọn "Chấp thuận" hoặc "Từ chối" cùng lý do. Hệ thống cập nhật trạng thái và ghi nhật ký phê duyệt.

## Acceptance Criteria

1. Chỉ người dùng có vai trò "Quản trị viên" hoặc "Người phê duyệt" mới thấy và thực hiện được danh sách Bến cảng chờ phê duyệt.
2. Hệ thống hiển thị đầy đủ thông tin kỹ thuật của Bến cảng chờ phê duyệt: mã bến, tên, Cảng mẹ, kích thước, loại bến, độ sâu luồng, tọa độ GPS trên bản đồ.
3. Người phê duyệt phải cung cấp lý do khi chọn "Từ chối"; lý do chấp thuận là tùy chọn nhưng khuyến khích nhập chi tiết.
4. Sau khi phê duyệt, trạng thái Bến cảng được cập nhật tương ứng ("Hi hiện hành" hoặc "Chỉnh sửa") và người tạo nhận được thông báo kết quả.

## In Scope

- Danh sách Bến cảng chờ phê duyệt (tạo mới và cập nhật)
- Trang chi tiết Bến cảng chờ phê duyệt với đầy đủ thông tin kỹ thuật và bản đồ
- Giao diện phê duyệt: chấp thuận hoặc từ chối
- Trường nhập lý do từ chối (bắt buộc)
- Cập nhật trạng thái Bến cảng sau phê duyệt
- Ghi nhật ký phê duyệt với thông tin người phê duyệt và thời gian
- Thông báo kết quả phê duyệt đến người tạo

## Out of Scope

- Phê duyệt xóa Bến cảng
- Phê duyệt hàng loạt nhiều Bến cảng cùng lúc
- Tự động phê duyệt dựa trên quy tắc (không cần con người)
- Phê duyệt bởi nhiều cấp (multi-level approval)
- Xuất báo cáo phê duyệt ra file Excel/PDF

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Quản trị viên | Phê duyệt (chấp thuận/từ chối), Xem |
| Người phê duyệt | Phê duyệt (chấp thuận/từ chối), Xem |
| Người tạo | Xem trạng thái, không phê duyệt |
| Nhân viên vận hành | Xem |
| KháchExternal | Không có quyền truy cập |

## Entities

- **BenCang**: id (UUID), maBen (string, unique), tenBen (string), cangMeId (UUID, FK → CangBien), tuyensDuongThuy (string), toDo (JSON: {lat, lng}), chieuDaiBen (decimal, m), chieuRongBen (decimal, m), loaiBen (enum: hang_containers, hang_kho, dau_khi, dich_vu), doSauLuongTruocBen (decimal, m), trangThai (enum: cho_phe_duyet, hien_hanh, tam_ngung, da_xoa), ghiChu (text), createdAt (timestamp), updatedAt (timestamp), pendingApproval (boolean), rejectedReason (text, nullable)
- **PheDuyetLog**: id (UUID), benCangId (UUID), nguoiPheDuyet (UUID), quyetDinh (enum: chap_thuan, tu_choi), lyDo (text), thoiGianPheDuyet (timestamp)

## Business Rules

1. Bến cảng mới tạo có trạng thái mặc định "Chờ phê duyệt" và chỉ được chuyển thành "Hi hiện hành" sau khi được phê duyệt bởi người có thẩm quyền.
2. Lý do từ chối là trường bắt buộc; nếu không nhập lý do từ chối, hệ thống không cho phép hoàn tất thao tác từ chối.
3. Mỗi Bến cảng chỉ cần một lần phê duyệt duy nhất để chuyển sang trạng thái "Hi hiện hành"; không áp dụng phê duyệt đa cấp.
4. Nhật ký phê duyệt phải được lưu trữ vĩnh viễn, không cho phép xóa hoặc sửa sau khi đã ghi nhận.
5. Người phê duyệt được khuyến khích đánh giá tính hợp lệ kỹ thuật (kích thước, độ sâu luồng) trước khi chấp thuận.

## Testing Strategy

Kiểm thử đơn vị cho quy tắc kiểm tra quyền phê duyệt và validation lý do từ chối; kiểm thử tích hợp cho luồng phê duyệt Bến cảng với các trường hợp: chấp thuận thành công, từ chối với lý do, từ chối không lý do (bị chặn); kiểm thử giao diện cho trang danh sách chờ phê duyệt và trang phê duyệt chi tiết với bản đồ; kiểm thử thông báo đến người tạo sau khi phê duyệt.
