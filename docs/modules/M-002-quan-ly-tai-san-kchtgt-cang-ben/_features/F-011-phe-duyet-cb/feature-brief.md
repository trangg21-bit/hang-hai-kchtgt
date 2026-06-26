---
id: F-011
name: "Phê duyệt Cảng biển"
slug: phe-duyet-cb
module-id: M-002
status: proposed
classification: local
priority: critical
created: "2026-06-16T04:40:19Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Phê duyệt Cảng biển

## Description

Tính năng cho phép người dùng có vai trò Quản trị viên hoặc người được ủy quyền phê duyệt thông tin Cảng biển mới được tạo hoặc cập nhật, bao gồm xem chi tiết, đánh giá tính hợp lệ, chấp thuận hoặc từ chối yêu cầu cùng lý do cụ thể, nhằm đảm bảo chất lượng dữ liệu cảng biển trong hệ thống quản lý tài sản KCHTGT.

## Business Intent

Việc phê duyệt Cảng biển là bước kiểm soát chất lượng bắt buộc trước khi thông tin cảng được kích hoạt hoạt động trong hệ thống; quy trình này đảm bảo mọi Cảng biển đăng ký đều tuân thủ quy chuẩn kỹ thuật, có đủ thông tin pháp lý và kỹ thuật, đồng thời tạo cơ sở minh bạch cho công tác quản lý nhà nước về hạ tầng giao thông đường thủy.

## Flow Summary

Sau khi Cảng biển được tạo mới hoặc cập nhật, hệ thống tự động chuyển trạng thái sang "Chờ phê duyệt" và thông báo đến người dùng có vai trò phê duyệt. Người dùng đăng nhập, truy cập vào danh sách Cảng biển chờ phê duyệt, chọn một Cảng cần xem xét. Hệ thống hiển thị đầy đủ thông tin Cảng biển kèm lịch sử thay đổi nếu là cập nhật. Người dùng đánh giá tính hợp lệ, chọn "Chấp thuận" hoặc "Từ chối" cùng lý do (bắt buộc khi từ chối). Hệ thống cập nhật trạng thái Cảng biển thành "Hiện hành" (nếu chấp thuận) hoặc quay lại "Chỉnh sửa" (nếu từ chối), ghi nhật ký phê duyệt và thông báo cho người tạo.

## Acceptance Criteria

1. Chỉ người dùng có vai trò "Quản trị viên" hoặc "Người phê duyệt" mới thấy và thực hiện được danh sách Cảng biển chờ phê duyệt.
2. Hệ thống hiển thị đầy đủ thông tin Cảng biển chờ phê duyệt kèm lịch sử thay đổi (nếu là cập nhật) cho người phê duyệt xem xét.
3. Người phê duyệt phải cung cấp lý do khi chọn "Từ chối"; lý do chấp thuận là tùy chọn nhưng khuyến khích nhập.
4. Sau khi phê duyệt, trạng thái Cảng biển được cập nhật tương ứng ("Hi hiện hành" hoặc "Chỉnh sửa") và người tạo nhận được thông báo kết quả.

## In Scope

- Danh sách Cảng biển chờ phê duyệt (tạo mới và cập nhật)
- Trang chi tiết Cảng biển chờ phê duyệt với đầy đủ thông tin
- Giao diện phê duyệt: chấp thuận hoặc từ chối
- Trường nhập lý do từ chối (bắt buộc)
- Cập nhật trạng thái Cảng biển sau phê duyệt
- Ghi nhật ký phê duyệt với thông tin người phê duyệt và thời gian
- Thông báo kết quả phê duyệt đến người tạo

## Out of Scope

- Phê duyệt xóa Cảng biển
- Phê duyệt hàng loạt nhiều Cảng biển cùng lúc
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

- **CangBien**: id (UUID), maCang (string, unique), tenCang (string), tinhThanh (string), toDo (JSON: {lat, lng}), dienTich (decimal), khaNangTiepNhanTau (string), trangThai (enum: cho_phe_duyet, hien_hanh, tam_ngung, da_xoa), ghiChu (text), createdAt (timestamp), updatedAt (timestamp), pendingApproval (boolean), rejectedReason (text, nullable)
- **PheDuyetLog**: id (UUID), cangBienId (UUID), nguoiPheDuyet (UUID), quyetDinh (enum: chap_thuan, tu_choi), lyDo (text), thoiGianPheDuyet (timestamp)

## Business Rules

1. Cảng biển mới tạo có trạng thái mặc định "Chờ phê duyệt" và chỉ được chuyển thành "Hiện hành" sau khi được phê duyệt bởi người có thẩm quyền.
2. Lý do từ chối là trường bắt buộc; nếu không nhập lý do từ chối, hệ thống không cho phép hoàn tất thao tác từ chối.
3. Mỗi Cảng biển chỉ cần một lần phê duyệt duy nhất để chuyển sang trạng thái "Hiện hành"; không áp dụng phê duyệt đa cấp.
4. Nhật ký phê duyệt phải được lưu trữ vĩnh viễn, không cho phép xóa hoặc sửa sau khi đã ghi nhận.

## Testing Strategy

Kiểm thử đơn vị cho quy tắc kiểm tra quyền phê duyệt và validation lý do từ chối; kiểm thử tích hợp cho luồng phê duyệt Cảng biển với các trường hợp: chấp thuận thành công, từ chối với lý do, từ chối không lý do (bị chặn); kiểm thử giao diện cho trang danh sách chờ phê duyệt và trang phê duyệt chi tiết; kiểm thử thông báo đến người tạo sau khi phê duyệt.
