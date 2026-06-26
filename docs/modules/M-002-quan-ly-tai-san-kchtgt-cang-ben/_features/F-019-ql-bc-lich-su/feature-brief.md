---
id: F-019
name: "Quản lý Bến cảng - Lịch sử"
slug: ql-bc-lich-su
module-id: M-002
status: proposed
classification: local
priority: high
created: "2026-06-16T04:41:00Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Bến cảng - Lịch sử

## Description

Tính năng cho phép người dùng xem và theo dõi toàn bộ lịch sử thay đổi của một Bến cảng bao gồm các lần tạo, cập nhật, xóa và phê duyệt, hiển thị dưới dạng danh sách chronologically với thông tin chi tiết về từng trường thay đổi, giá trị cũ, giá trị mới, người thực hiện và thời gian, phục vụ công tác kiểm toán và đánh giá tiến trình hạ tầng.

## Business Intent

Theo dõi lịch sử thay đổi của Bến cảng là yêu cầu bắt buộc để đảm bảo tính minh bạch, truy xuất nguồn gốc dữ liệu và phục vụ công tác kiểm toán, đánh giá hiệu quả đầu tư sửa chữa, nạo vét và mở rộng bến theo thời gian; lịch sử này cũng là cơ sở để phân tích xu hướng phát triển hạ tầng cảng biển trong từng giai đoạn.

## Flow Summary

Người dùng đăng nhập, truy cập vào danh sách Bến cảng và chọn một Bến cần xem lịch sử. Hệ thống hiển thị trang lịch sử với danh sách chronologically các sự kiện thay đổi: tạo mới, cập nhật thông tin (với chi tiết trường nào thay đổi, giá trị cũ → giá trị mới), phê duyệt và xóa. Người dùng có thể lọc lịch sử theo loại sự kiện, theo người thực hiện, hoặc theo khoảng thời gian. Mỗi sự kiện trong lịch sử có thể click để xem chi tiết đầy đủ bao gồm thông tin người thực hiện, thời gian và giá trị trước/sau khi thay đổi.

## Acceptance Criteria

1. Người dùng có vai trò "Quản lý cảng" hoặc "Quản trị viên" có thể truy cập được trang lịch sử thay đổi của bất kỳ Bến cảng nào.
2. Lịch sử hiển thị đầy đủ các sự kiện: tạo mới, cập nhật từng trường, phê duyệt và xóa, sắp xếp theo thời gian giảm dần (mới nhất lên đầu).
3. Mỗi sự kiện cập nhật hiển thị chi tiết: trường nào thay đổi, giá trị cũ, giá trị mới, người thực hiện và thời gian thực hiện.
4. Người dùng có thể lọc lịch sử theo loại sự kiện, theo người thực hiện, hoặc theo khoảng thời gian cụ thể.

## In Scope

- Trang hiển thị lịch sử thay đổi chronologically của Bến cảng
- Chi tiết từng sự kiện: loại, trường thay đổi, giá trị cũ/mới, người thực hiện, thời gian
- Lọc lịch sử theo loại sự kiện, người thực hiện, khoảng thời gian
- Hiển thị thông tin người thực hiện (tên, vai trò)
- Tích hợp với nhật ký phê duyệt (F-017) và xóa (F-016)

## Out of Scope

- Sửa hoặc xóa lịch sử đã ghi nhận
- So sánh trực tiếp giữa hai phiên bản bất kỳ của Bến cảng
- Xuất lịch sử ra file Excel/PDF
- Thông báo khi có thay đổi mới (notification)
- Khôi phục Bến cảng về phiên bản lịch sử bất kỳ (chỉ khôi phục sau xóa)

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Quản trị viên | Xem lịch sử đầy đủ |
| Quản lý cảng | Xem lịch sử đầy đủ |
| Nhân viên vận hành | Xem lịch sử (trường kỹ thuật bị ẩn) |
| KháchExternal | Không có quyền truy cập |

## Entities

- **LichSuThayDoi**: id (UUID), benCangId (UUID), loaiSuKien (enum: tao_moi, cap_nhat, phe_duyet, xoa), truongDuocCapNhat (string, nullable), giaTriCu (text, nullable), giaTriMoi (text, nullable), nguoiThucHien (UUID), thoiGian (timestamp), ghiChu (text, nullable)

## Business Rules

1. Mọi thay đổi về Bến cảng đều phải được ghi nhận vào bảng lịch sử — không cho phép bỏ qua hoặc vô hiệu hóa tính năng này.
2. Lịch sử thay đổi chỉ được phép thêm mới, không cho phép sửa hoặc xóa sau khi đã ghi nhận — đảm bảo tính toàn vẹn cho kiểm toán.
3. Các sự kiện từ các tính năng khác (F-014, F-015, F-016, F-017) được tích hợp vào cùng một dòng thời gian thống nhất.
4. Giá trị cũ và giá trị mới được lưu trữ dưới dạng văn bản hóa để dễ đọc; giá trị JSON (tọa độ GPS) được chuyển thành định dạng text dễ đọc.

## Testing Strategy

Kiểm thử đơn vị cho các hàm tạo và truy vấn lịch sử thay đổi; kiểm thử tích hợp cho luồng ghi nhận lịch sử tự động khi tạo, cập nhật, xóa và phê duyệt Bến cảng; kiểm thử giao diện cho trang hiển thị lịch sử với các bộ lọc; kiểm thử tích hợp chéo giữa các tính năng F-014, F-015, F-016, F-017 và F-019 để xác nhận lịch sử được ghi đầy đủ.
