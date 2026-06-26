---
id: F-256
name: Tích hợp KCHTGT Tàu biển nước ngoài
slug: tich-hop-kchtgt-tau-bien-nuoc-ngoai
module-id: M-020
status: proposed
classification: local
priority: critical
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Tích hợp KCHTGT Tàu biển nước ngoài

## Description

Tích hợp dữ liệu tàu biển nước ngoài từ Cơ sở hạ tầng và Thiết bị KCHTGT vào hệ thống trung tâm, đảm bảo tính nhất quán, đầy đủ và kịp thời của thông tin tàu biển nước ngoài phục vụ công tác quản lý, điều hành và báo cáo hoạt động cảng biển có sự tham gia của tàu nước ngoài.

## Business Intent

Hệ thống cần tập hợp và chuẩn hóa toàn bộ dữ liệu tàu biển nước ngoài từ nhiều nguồn khác nhau nhằm cung cấp một kho dữ liệu thống nhất, hỗ trợ ra quyết định trong quản lý hoạt động cảng biển có sự tham gia của tàu nước ngoài và nâng cao hiệu quả điều hành vận hành.

## Flow Summary

Dữ liệu tàu biển nước ngoài được lấy từ nguồn bên ngoài thông qua API hoặc trực tiếp từ LGSP, sau đó được xác thực qua cơ chế JWT và kiểm tra whitelist IP. Dữ liệu được chuẩn hóa, tích hợp vào cơ sở dữ liệu trung tâm và cập nhật theo chu kỳ định kỳ. Người dùng có thể truy vấn, xem và quản lý thông tin tàu biển nước ngoài thông qua giao diện hệ thống.

## Acceptance Criteria

- Dữ liệu tàu biển nước ngoài được tích hợp thành công qua API hoặc phương thức trực tiếp từ nguồn LGSP.
- Cơ chế xác thực JWT và kiểm tra whitelist IP được kích hoạt và hoạt động chính xác khi tiếp nhận dữ liệu.
- Thông tin tàu biển nước ngoài hiển thị đúng và đầy đủ trên giao diện quản lý hệ thống sau khi tích hợp.
- Dữ liệu được cập nhật tự động theo chu kỳ định kỳ hoặc theo yêu cầu.

## In Scope

- Tích hợp dữ liệu tàu biển nước ngoài từ nguồn LGSP vào hệ thống trung tâm.
- Xác thực kết nối qua JWT và whitelist IP.
- Chuẩn hóa và lưu trữ dữ liệu tàu biển nước ngoài trong cơ sở dữ liệu.
- Cung cấp giao diện quản lý và tra cứu thông tin tàu biển nước ngoài.

## Out of Scope

- Tích hợp dữ liệu tàu biển trong nước.
- Phát triển ứng dụng di động truy cập dữ liệu tàu biển nước ngoài.

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem thông tin tàu biển nước ngoài |
| Admin | Tạo, Cập nhật, Xóa dữ liệu tàu biển nước ngoài |
| Operator | Cập nhật trạng thái tàu biển nước ngoài |

## Architecture Notes

- Tích hợp qua API hoặc trực tiếp từ LGSP theo kiến trúc microservice.
- Sử dụng JWT token cho xác thực và IP whitelist cho bảo mật kết nối.
- Dữ liệu được lưu trữ trong cơ sở dữ liệu quan hệ, hỗ trợ truy vấn theo thời gian thực.

## Entities

- **TauBienNuocNgoai**: id, tenTau, bienSo, loaiTau, quocTich, donViVanTai, thoiGianVaoCang, thoiGianRaCang, trangThai, createdAt, updatedAt

## Business Rules

- Tích hợp qua API hoặc trực tiếp từ LGSP.
- Kiểm tra JWT và IP whitelist trước khi tiếp nhận dữ liệu.
- Dữ liệu phải đầy đủ các trường bắt buộc: tên tàu, biển số, quốc tịch, đơn vị vận tải.

## Testing Strategy

- Test tích hợp API với các trường hợp dữ liệu hợp lệ và không hợp lệ.
- Test xác thực JWT và whitelist IP.
- Test đồng bộ dữ liệu theo chu kỳ định kỳ.
- Test giao diện quản lý và tra cứu thông tin tàu biển nước ngoài.
