---
id: F-013
name: Quản lý Cảng biển - Lịch sử
slug: ql-cb-lich-su
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-16T04:40:42Z
last-updated: 2026-06-29T11:09:59Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Cảng biển - Lịch sử

## Description

Tính năng cho phép người dùng xem và theo dõi toàn bộ lịch sử thay đổi của một Cảng biển bao gồm các lần tạo, cập nhật, xóa, và phê duyệt, hiển thị dưới dạng danh sách chronologically với thông tin chi tiết về trường thay đổi, giá trị cũ, giá trị mới, người thực hiện và thời gian.

## Business Intent

Theo dõi lịch sử thay đổi của Cảng biển là yêu cầu bắt buộc để đảm bảo tính minh bạch, truy xuất nguồn gốc dữ liệu và phục vụ công tác kiểm toán, giải quyết tranh chấp liên quan đến thông tin cảng; lịch sử này cũng là cơ sở để đánh giá tiến trình cải tạo, mở rộng cảng theo thời gian.

## Flow Summary

Người dùng đăng nhập, truy cập vào danh sách Cảng biển và chọn một Cảng cần xem lịch sử. Hệ thống hiển thị trang lịch sử với danh sách chronologically các sự kiện thay đổi: tạo mới, cập nhật thông tin (với chi tiết trường nào thay đổi, giá trị cũ → giá trị mới), phê duyệt, và xóa. Người dùng có thể lọc lịch sử theo loại sự kiện, theo người thực hiện, hoặc theo khoảng thời gian. Mỗi sự kiện trong lịch sử có thể click để xem chi tiết đầy đủ bao gồm thông tin người thực hiện, thời gian, và giá trị trước/sau khi thay đổi.

## Acceptance Criteria

1. Người dùng có vai trò "Quản lý cảng" hoặc "Quản trị viên" có thể truy cập được trang lịch sử thay đổi của bất kỳ Cảng biển nào.
2. Lịch sử hiển thị đầy đủ các sự kiện: tạo mới, cập nhật từng trường, phê duyệt, và xóa, sắp xếp theo thời gian giảm dần (mới nhất lên đầu).
3. Mỗi sự kiện cập nhật hiển thị chi tiết: trường nào thay đổi, giá trị cũ, giá trị mới, người thực hiện và thời gian thực hiện.
4. Người dùng có thể lọc lịch sử theo loại sự kiện, theo người thực hiện, hoặc theo khoảng thời gian cụ thể.

## In Scope

- Trang hiển thị lịch sử thay đổi chronologically của Cảng biển
- Chi tiết từng sự kiện: loại, trường thay đổi, giá trị cũ/mới, người thực hiện, thời gian
- Lọc lịch sử theo loại sự kiện, người thực hiện, khoảng thời gian
- Hiển thị thông tin người thực hiện (tên, vai trò)
- Tích hợp với nhật ký phê duyệt (F-011) và xóa (F-010)

## Out of Scope

- Sửa hoặc xóa lịch sử đã ghi nhận
- so sánh trực tiếp giữa hai phiên bản bất kỳ của Cảng biển
- Xuất lịch sử ra file Excel/PDF
- Thông báo khi có thay đổi mới (notification)
- Khôi phục Cảng biển về phiên bản lịch sử bất kỳ (chỉ khôi phục sau xóa)

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Quản trị viên | Xem lịch sử đầy đủ |
| Quản lý cảng | Xem lịch sử đầy đủ |
| Nhân viên vận hành | Xem lịch sử (trường kỹ thuật bị ẩn) |
| KháchExternal | Không có quyền truy cập |

## Entities

- **LichSuThayDoi**: id (UUID), cangBienId (UUID), loaiSuKien (enum: tao_moi, cap_nhat, phe_duyet, xoa), truongDuocCapNhat (string, nullable), giaTriCu (text, nullable), giaTriMoi (text, nullable), nguoiThucHien (UUID), thoiGian (timestamp), ghiChu (text, nullable)

## Business Rules

1. Mọi thay đổi về Cảng biển đều phải được ghi nhận vào bảng lịch sử — không cho phép bỏ qua hoặc vô hiệu hóa tính năng này.
2. Lịch sử thay đổi chỉ được phép thêm mới, không cho phép sửa hoặc xóa sau khi đã ghi nhận — đảm bảo tính toàn vẹn cho kiểm toán.
3. Các sự kiện từ các tính năng khác (F-008, F-009, F-010, F-011) được tích hợp vào cùng một dòng thời gian thống nhất.
4. Giá trị cũ và giá trị mới được lưu trữ dưới dạng văn bản hóa để dễ đọc; giá trị JSON (tọa độ GPS) được chuyển thành định dạng text dễ đọc.

## Testing Strategy

Kiểm thử đơn vị cho các hàm tạo và truy vấn lịch sử thay đổi; kiểm thử tích hợp cho luồng ghi nhận lịch sử tự động khi tạo, cập nhật, xóa và phê duyệt Cảng biển; kiểm thử giao diện cho trang hiển thị lịch sử với các bộ lọc; kiểm thử tích hợp chéo giữa các tính năng F-008, F-009, F-010, F-011 và F-013 để xác nhận lịch sử được ghi đầy đủ.
