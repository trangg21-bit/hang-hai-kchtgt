---
id: F-250
name: Tích hợp KCHTGT Tin đài LRIT
slug: tich-hop-kchtgt-tt-dai-lrit
module-id: M-019
status: proposed
classification: local
priority: critical
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Tích hợp KCHTGT Tin đài LRIT

## Description

Tích hợp dữ liệu Cơ sở hạ tầng và Thiết bị KCHTGT liên quan đến Tin đài LRIT (Long Range Identification and Tracking — hệ thống nhận dạng và theo dõi tầm xa qua vệ tinh) từ các nguồn dữ liệu bên ngoài vào hệ thống trung tâm, đảm bảo tính nhất quán, đầy đủ và kịp thời của thông tin tin đài theo dõi tàu thuyền phục vụ quản lý và vận hành hệ thống giám sát hàng hải tầm xa.

## Business Intent

Hệ thống cần tập hợp và chuẩn hóa toàn bộ thông tin tin đài LRIT từ nhiều nguồn khác nhau nhằm cung cấp một kho dữ liệu thống nhất, hỗ trợ ra quyết định trong quản lý theo dõi tàu thuyền tầm xa, nâng cao hiệu quả giám sát hoạt động hàng hải và đảm bảo an toàn an ninh biển theo quy định quốc tế.

## Flow Summary

Dữ liệu tin đài LRIT được lấy từ nguồn bên ngoài thông qua API hoặc trực tiếp từ LGSP, sau đó được xác thực qua cơ chế JWT và kiểm tra whitelist IP. Dữ liệu được chuẩn hóa, tích hợp vào cơ sở dữ liệu trung tâm và cập nhật theo chu kỳ định kỳ. Người dùng có thể truy vấn, xem và quản lý thông tin tin đài LRIT thông qua giao diện hệ thống.

## Acceptance Criteria

- Dữ liệu tin đài LRIT được tích hợp thành công qua API hoặc phương thức trực tiếp từ nguồn LGSP.
- Cơ chế xác thực JWT và kiểm tra whitelist IP được kích hoạt và hoạt động chính xác khi tiếp nhận dữ liệu.
- Thông tin tin đài LRIT hiển thị đúng và đầy đủ trên giao diện quản lý hệ thống sau khi tích hợp.
- Dữ liệu được cập nhật tự động theo chu kỳ định kỳ hoặc theo yêu cầu.

## In Scope

- Tích hợp dữ liệu tin đài LRIT từ nguồn LGSP vào hệ thống trung tâm.
- Xác thực kết nối qua JWT và whitelist IP.
- Chuẩn hóa và lưu trữ dữ liệu tin đài LRIT trong cơ sở dữ liệu.
- Cung cấp giao diện quản lý và tra cứu thông tin tin đài LRIT.

## Out of Scope

- Tích hợp các tài nguyên hạ tầng không phải tin đài LRIT (bến cảng, cầu cảng).
- Phát triển ứng dụng di động truy cập dữ liệu tin đài LRIT.

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem thông tin tin đài LRIT |
| Admin | Tạo, Cập nhật, Xóa dữ liệu tin đài LRIT |
| Operator | Cập nhật trạng thái tin đài LRIT |

## Architecture Notes

- Tích hợp qua API hoặc trực tiếp từ LGSP theo kiến trúc microservice.
- Sử dụng JWT token cho xác thực và IP whitelist cho bảo mật kết nối.
- Dữ liệu được lưu trữ trong cơ sở dữ liệu quan hệ, hỗ trợ truy vấn theo thời gian thực.

## Entities

- **TinDaiLRIT**: id, tenTin, noiDung, viDo, kinhDo, thoiGian, trangThai, createdAt, updatedAt

## Business Rules

1. Tích hợp qua API hoặc trực tiếp từ LGSP.
2. Kiểm tra JWT và IP whitelist trước khi tiếp nhận dữ liệu.

## Testing Strategy

- Test tích hợp API với các trường hợp dữ liệu hợp lệ và không hợp lệ.
- Test xác thực JWT và whitelist IP.
- Test đồng bộ dữ liệu theo chu kỳ định kỳ.
- Test giao diện quản lý và tra cứu thông tin tin đài LRIT.
