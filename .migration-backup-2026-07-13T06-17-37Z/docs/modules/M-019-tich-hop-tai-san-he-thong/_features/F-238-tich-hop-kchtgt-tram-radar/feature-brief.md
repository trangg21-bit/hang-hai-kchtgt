---
id: F-238
name: Tích hợp KCHTGT Trạm Radar
slug: tich-hop-kchtgt-tram-radar
module-id: M-019
status: proposed
classification: local
priority: critical
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Tích hợp KCHTGT Trạm Radar

## Description

Tích hợp dữ liệu Cơ sở hạ tầng và Thiết bị KCHTGT liên quan đến Trạm Radar từ các nguồn dữ liệu bên ngoài vào hệ thống trung tâm, đảm bảo tính nhất quán, đầy đủ và kịp thời của thông tin trạm radar phục vụ quản lý và vận hành hệ thống giám sát giao thông đường thủy.

## Business Intent

Hệ thống cần tập hợp và chuẩn hóa toàn bộ dữ liệu trạm radar từ nhiều nguồn khác nhau nhằm cung cấp một kho dữ liệu thống nhất, hỗ trợ ra quyết định trong quản lý hệ thống quan trắc, giám sát tàu thuyền và nâng cao hiệu quả công tác phòng chống thiên tai, đảm bảo an toàn hàng hải.

## Flow Summary

Dữ liệu trạm radar được lấy từ nguồn bên ngoài thông qua API hoặc trực tiếp từ LGSP, sau đó được xác thực qua cơ chế JWT và kiểm tra whitelist IP. Dữ liệu được chuẩn hóa, tích hợp vào cơ sở dữ liệu trung tâm và cập nhật theo chu kỳ định kỳ. Người dùng có thể truy vấn, xem và quản lý thông tin trạm radar thông qua giao diện hệ thống.

## Acceptance Criteria

- Dữ liệu trạm radar được tích hợp thành công qua API hoặc phương thức trực tiếp từ nguồn LGSP.
- Cơ chế xác thực JWT và kiểm tra whitelist IP được kích hoạt và hoạt động chính xác khi tiếp nhận dữ liệu.
- Thông tin trạm radar hiển thị đúng và đầy đủ trên giao diện quản lý hệ thống sau khi tích hợp.
- Dữ liệu được cập nhật tự động theo chu kỳ định kỳ hoặc theo yêu cầu.

## In Scope

- Tích hợp dữ liệu trạm radar từ nguồn LGSP vào hệ thống trung tâm.
- Xác thực kết nối qua JWT và whitelist IP.
- Chuẩn hóa và lưu trữ dữ liệu trạm radar trong cơ sở dữ liệu.
- Cung cấp giao diện quản lý và tra cứu thông tin trạm radar.

## Out of Scope

- Tích hợp các tài nguyên hạ tầng không phải trạm radar (bến cảng, cầu cảng).
- Phát triển ứng dụng di động truy cập dữ liệu trạm radar.

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem thông tin trạm radar |
| Admin | Tạo, Cập nhật, Xóa dữ liệu trạm radar |
| Operator | Cập nhật trạng thái trạm radar |

## Architecture Notes

- Tích hợp qua API hoặc trực tiếp từ LGSP theo kiến trúc microservice.
- Sử dụng JWT token cho xác thực và IP whitelist cho bảo mật kết nối.
- Dữ liệu được lưu trữ trong cơ sở dữ liệu quan hệ, hỗ trợ truy vấn theo thời gian thực.

## Entities

- **TramRadar**: id, tenTram, toDo, chieuPhai, trangThai, createdAt, updatedAt

## Business Rules

1. Tích hợp qua API hoặc trực tiếp từ LGSP.
2. Kiểm tra JWT và IP whitelist trước khi tiếp nhận dữ liệu.

## Testing Strategy

- Test tích hợp API với các trường hợp dữ liệu hợp lệ và không hợp lệ.
- Test xác thực JWT và whitelist IP.
- Test đồng bộ dữ liệu theo chu kỳ định kỳ.
- Test giao diện quản lý và tra cứu thông tin trạm radar.
