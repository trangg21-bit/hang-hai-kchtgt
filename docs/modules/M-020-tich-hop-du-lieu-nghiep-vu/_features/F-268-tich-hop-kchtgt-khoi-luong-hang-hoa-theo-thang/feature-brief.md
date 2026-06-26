---
id: F-268
name: Tích hợp KCHTGT Khối lượng hàng hóa theo tháng
slug: tich-hop-kchtgt-khoi-luong-hang-hoa-theo-thang
module-id: M-020
status: proposed
classification: local
priority: critical
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Tích hợp KCHTGT Khối lượng hàng hóa theo tháng

## Description

Tích hợp dữ liệu khối lượng hàng hóa theo tháng từ Cơ sở hạ tầng và Thiết bị KCHTGT vào hệ thống trung tâm, đảm bảo tính nhất quán, đầy đủ và kịp thời của thông tin khối lượng hàng hóa theo tháng phục vụ công tác quản lý, điều hành và báo cáo hoạt động cảng biển theo định kỳ tháng.

## Business Intent

Hệ thống cần tập hợp và chuẩn hóa toàn bộ dữ liệu khối lượng hàng hóa theo tháng từ nhiều nguồn khác nhau nhằm cung cấp một kho dữ liệu thống nhất, hỗ trợ ra quyết định trong quản lý hoạt động cảng biển theo tháng và nâng cao hiệu quả điều hành vận hành.

## Flow Summary

Dữ liệu khối lượng hàng hóa theo tháng được lấy từ nguồn bên ngoài thông qua API hoặc trực tiếp từ LGSP, sau đó được xác thực qua cơ chế JWT và kiểm tra whitelist IP. Dữ liệu được chuẩn hóa, tích hợp vào cơ sở dữ liệu trung tâm và cập nhật theo chu kỳ hàng tháng. Người dùng có thể truy vấn, xem và quản lý thông tin khối lượng hàng hóa theo tháng thông qua giao diện hệ thống.

## Acceptance Criteria

- Dữ liệu khối lượng hàng hóa theo tháng được tích hợp thành công qua API hoặc phương thức trực tiếp từ nguồn LGSP.
- Cơ chế xác thực JWT và kiểm tra whitelist IP được kích hoạt và hoạt động chính xác khi tiếp nhận dữ liệu.
- Thông tin khối lượng hàng hóa theo tháng hiển thị đúng và đầy đủ trên giao diện quản lý hệ thống sau khi tích hợp.
- Dữ liệu được cập nhật tự động theo chu kỳ hàng tháng hoặc theo yêu cầu.

## In Scope

- Tích hợp dữ liệu khối lượng hàng hóa theo tháng từ nguồn LGSP vào hệ thống trung tâm.
- Xác thực kết nối qua JWT và whitelist IP.
- Chuẩn hóa và lưu trữ dữ liệu khối lượng hàng hóa theo tháng trong cơ sở dữ liệu.
- Cung cấp giao diện quản lý và tra cứu thông tin khối lượng hàng hóa theo tháng.

## Out of Scope

- Tích hợp dữ liệu khối lượng hàng hóa theo ngày.
- Phát triển ứng dụng di động truy cập dữ liệu khối lượng hàng hóa theo tháng.

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem thông tin khối lượng hàng hóa theo tháng |
| Admin | Tạo, Cập nhật, Xóa dữ liệu khối lượng hàng hóa theo tháng |
| Operator | Cập nhật trạng thái khối lượng hàng hóa theo tháng |

## Architecture Notes

- Tích hợp qua API hoặc trực tiếp từ LGSP theo kiến trúc microservice.
- Sử dụng JWT token cho xác thực và IP whitelist cho bảo mật kết nối.
- Dữ liệu được lưu trữ trong cơ sở dữ liệu quan hệ, hỗ trợ truy vấn theo thời gian thực.

## Entities

- **KhoiLuongHangHoaTheoThang**: id, tenCang, khoiLuongHangHoa, donViTinh, thang, nam, trangThai, createdAt, updatedAt

## Business Rules

- Tích hợp qua API hoặc trực tiếp từ LGSP.
- Kiểm tra JWT và IP whitelist trước khi tiếp nhận dữ liệu.
- Dữ liệu phải đầy đủ các trường bắt buộc: cảng, khối lượng hàng hóa, tháng năm.

## Testing Strategy

- Test tích hợp API với các trường hợp dữ liệu hợp lệ và không hợp lệ.
- Test xác thực JWT và whitelist IP.
- Test đồng bộ dữ liệu theo chu kỳ hàng tháng.
- Test giao diện quản lý và tra cứu thông tin khối lượng hàng hóa theo tháng.
