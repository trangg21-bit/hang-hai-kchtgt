---
id: F-252
name: Tích hợp KCHTGT Cảng cạn
slug: tich-hop-kchtgt-cang-can
module-id: M-019
status: proposed
classification: local
priority: critical
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Tích hợp KCHTGT Cảng cạn

## Description

Tích hợp dữ liệu Cơ sở hạ tầng và Thiết bị KCHTGT liên quan đến Cảng cạn (Inland Port — khu vực cảng nội địa phục vụ vận tải đa phương thức) từ các nguồn dữ liệu bên ngoài vào hệ thống trung tâm, đảm bảo tính nhất quán, đầy đủ và kịp thời của thông tin cảng cạn phục vụ quản lý và vận hành hệ thống logistics cảng biển.

## Business Intent

Hệ thống cần tập hợp và chuẩn hóa toàn bộ dữ liệu cảng cạn từ nhiều nguồn khác nhau nhằm cung cấp một kho dữ liệu thống nhất, hỗ trợ ra quyết định trong quản lý hạ tầng logistics cảng nội địa, nâng cao hiệu quả vận tải đa phương thức và giảm tải cho các cảng biển chính.

## Flow Summary

Dữ liệu cảng cạn được lấy từ nguồn bên ngoài thông qua API hoặc trực tiếp từ LGSP, sau đó được xác thực qua cơ chế JWT và kiểm tra whitelist IP. Dữ liệu được chuẩn hóa, tích hợp vào cơ sở dữ liệu trung tâm và cập nhật theo chu kỳ định kỳ. Người dùng có thể truy vấn, xem và quản lý thông tin cảng cạn thông qua giao diện hệ thống.

## Acceptance Criteria

- Dữ liệu cảng cạn được tích hợp thành công qua API hoặc phương thức trực tiếp từ nguồn LGSP.
- Cơ chế xác thực JWT và kiểm tra whitelist IP được kích hoạt và hoạt động chính xác khi tiếp nhận dữ liệu.
- Thông tin cảng cạn hiển thị đúng và đầy đủ trên giao diện quản lý hệ thống sau khi tích hợp.
- Dữ liệu được cập nhật tự động theo chu kỳ định kỳ hoặc theo yêu cầu.

## In Scope

- Tích hợp dữ liệu cảng cạn từ nguồn LGSP vào hệ thống trung tâm.
- Xác thực kết nối qua JWT và whitelist IP.
- Chuẩn hóa và lưu trữ dữ liệu cảng cạn trong cơ sở dữ liệu.
- Cung cấp giao diện quản lý và tra cứu thông tin cảng cạn.

## Out of Scope

- Tích hợp các tài nguyên hạ tầng không phải cảng cạn (bến cảng, cầu cảng).
- Phát triển ứng dụng di động truy cập dữ liệu cảng cạn.

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem thông tin cảng cạn |
| Admin | Tạo, Cập nhật, Xóa dữ liệu cảng cạn |
| Operator | Cập nhật trạng thái cảng cạn |

## Architecture Notes

- Tích hợp qua API hoặc trực tiếp từ LGSP theo kiến trúc microservice.
- Sử dụng JWT token cho xác thực và IP whitelist cho bảo mật kết nối.
- Dữ liệu được lưu trữ trong cơ sở dữ liệu quan hệ, hỗ trợ truy vấn theo thời gian thực.

## Entities

- **CangCan**: id, tenCangCan, toDo, dienTich, trangThai, createdAt, updatedAt

## Business Rules

1. Tích hợp qua API hoặc trực tiếp từ LGSP.
2. Kiểm tra JWT và IP whitelist trước khi tiếp nhận dữ liệu.

## Testing Strategy

- Test tích hợp API với các trường hợp dữ liệu hợp lệ và không hợp lệ.
- Test xác thực JWT và whitelist IP.
- Test đồng bộ dữ liệu theo chu kỳ định kỳ.
- Test giao diện quản lý và tra cứu thông tin cảng cạn.
