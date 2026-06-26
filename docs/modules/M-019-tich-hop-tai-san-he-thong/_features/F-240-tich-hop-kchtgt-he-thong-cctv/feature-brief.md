---
id: F-240
name: Tích hợp KCHTGT Hệ thống CCTV
slug: tich-hop-kchtgt-he-thong-cctv
module-id: M-019
status: proposed
classification: local
priority: critical
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Tích hợp KCHTGT Hệ thống CCTV

## Description

Tích hợp dữ liệu Cơ sở hạ tầng và Thiết bị KCHTGT liên quan đến Hệ thống CCTV (Closed-Circuit Television) từ các nguồn dữ liệu bên ngoài vào hệ thống trung tâm, đảm bảo tính nhất quán, đầy đủ và kịp thời của thông tin hệ thống camera quan sát phục vụ quản lý và vận hành hệ thống giám sát an ninh hàng hải.

## Business Intent

Hệ thống cần tập hợp và chuẩn hóa toàn bộ dữ liệu hệ thống CCTV từ nhiều nguồn khác nhau nhằm cung cấp một kho dữ liệu thống nhất, hỗ trợ ra quyết định trong quản lý an ninh, giám sát hiện trường và nâng cao hiệu quả công tác phòng chống tội phạm hàng hải, đảm bảo an toàn khu vực cảng biển.

## Flow Summary

Dữ liệu hệ thống CCTV được lấy từ nguồn bên ngoài thông qua API hoặc trực tiếp từ LGSP, sau đó được xác thực qua cơ chế JWT và kiểm tra whitelist IP. Dữ liệu được chuẩn hóa, tích hợp vào cơ sở dữ liệu trung tâm và cập nhật theo chu kỳ định kỳ. Người dùng có thể truy vấn, xem và quản lý thông tin hệ thống CCTV thông qua giao diện hệ thống.

## Acceptance Criteria

- Dữ liệu hệ thống CCTV được tích hợp thành công qua API hoặc phương thức trực tiếp từ nguồn LGSP.
- Cơ chế xác thực JWT và kiểm tra whitelist IP được kích hoạt và hoạt động chính xác khi tiếp nhận dữ liệu.
- Thông tin hệ thống CCTV hiển thị đúng và đầy đủ trên giao diện quản lý hệ thống sau khi tích hợp.
- Dữ liệu được cập nhật tự động theo chu kỳ định kỳ hoặc theo yêu cầu.

## In Scope

- Tích hợp dữ liệu hệ thống CCTV từ nguồn LGSP vào hệ thống trung tâm.
- Xác thực kết nối qua JWT và whitelist IP.
- Chuẩn hóa và lưu trữ dữ liệu hệ thống CCTV trong cơ sở dữ liệu.
- Cung cấp giao diện quản lý và tra cứu thông tin hệ thống CCTV.

## Out of Scope

- Tích hợp các tài nguyên hạ tầng không phải hệ thống CCTV (bến cảng, cầu cảng).
- Phát triển ứng dụng di động truy cập dữ liệu hệ thống CCTV.

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem thông tin hệ thống CCTV |
| Admin | Tạo, Cập nhật, Xóa dữ liệu hệ thống CCTV |
| Operator | Cập nhật trạng thái hệ thống CCTV |

## Architecture Notes

- Tích hợp qua API hoặc trực tiếp từ LGSP theo kiến trúc microservice.
- Sử dụng JWT token cho xác thực và IP whitelist cho bảo mật kết nối.
- Dữ liệu được lưu trữ trong cơ sở dữ liệu quan hệ, hỗ trợ truy vấn theo thời gian thực.

## Entities

- **HeThongCCTV**: id, tenHeThong, soLuongCamera, toDo, trangThai, createdAt, updatedAt

## Business Rules

1. Tích hợp qua API hoặc trực tiếp từ LGSP.
2. Kiểm tra JWT và IP whitelist trước khi tiếp nhận dữ liệu.

## Testing Strategy

- Test tích hợp API với các trường hợp dữ liệu hợp lệ và không hợp lệ.
- Test xác thực JWT và whitelist IP.
- Test đồng bộ dữ liệu theo chu kỳ định kỳ.
- Test giao diện quản lý và tra cứu thông tin hệ thống CCTV.
