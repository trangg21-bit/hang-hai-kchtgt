---
id: F-197
name: Chia se KCHTGT Den bien
slug: chia-se-kchtgt-den-bien
module-id: M-018
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---

# Feature: Chia se KCHTGT Den bien

## Description

Chia sẻ thông tin hạ tầng giao thông vận tải đường thủy về đèn biển (địa điểm, tọa độ, bán kính chiếu sáng, đặc điểm tín hiệu, thời gian hoạt động) qua Trục liên thông dữ liệu quốc gia LGSP.

## Business Intent

Cho phép các cơ quan quản lý nhà nước về hàng hải, tàu thuyền và đơn vị liên quan tiếp cận nhanh chóng thông tin về hệ thống đèn biển phục vụ công tác dẫn đường, an toàn hàng hải và quy hoạch hạ tầng hàng hải. Dữ liệu được chuẩn hóa để đảm bảo tính nhất quán và khả năng trao đổi liên ngành giữa Cục Hàng hải, Chi cục Hàng hải, hải cảng và các đơn vị quản lý đèn biển ven biển. Thông tin đèn biển giúp tàu thuyền xác định vị trí, tránh chướng ngại vật và đảm bảo an toàn khi di chuyển trên các tuyến đường biển.

## Flow Summary

Dữ liệu đèn biển được trích xuất từ hệ thống quản lý hạ tầng giao thông vận tải đường thủy của đơn vị chủ quản, sau đó chuyển đổi sang định dạng chuẩn theo schema quy định của Trục LGSP. Hệ thống dịch vụ API sẽ publish dữ liệu lên cổng chia sẻ, trong đó bao gồm thông tin mã đèn biển, tên đèn biển, tọa độ địa lý, bán kính chiếu sáng, đặc điểm tín hiệu (màu sắc, tần suất chớp, ký hiệu Morse), thời gian hoạt động, loại nguồn năng lượng và tình trạng hoạt động. Các đơn vị tiêu thụ (cục hàng hải, tàu thuyền, cảng vụ, cơ quan kiểm tra chuyên ngành) có thể gọi API hoặc subscribe qua cơ chế publish/subscribe của LGSP để nhận dữ liệu theo chu kỳ định kỳ hoặc theo yêu cầu. Toàn bộ luồng dữ liệu được bảo mật bằng HTTPS, xác thực JWT và kiểm soát truy cập theo danh sách IP whitelist.

## Acceptance Criteria

- Hệ thống API publish dữ liệu đèn biển lên Trục LGSP thành công, phản hồi HTTP 200 với payload JSON đúng schema
- Dữ liệu hiển thị chính xác các trường: mã đèn biển, tên đèn biển, tọa độ, bán kính chiếu sáng, đặc điểm tín hiệu, thời gian hoạt động, tình trạng hoạt động
- Đơn vị tiêu thụ xác nhận nhận được dữ liệu đầy đủ, không mất mát sau 24 giờ chia sẻ liên tục
- Xác thực JWT và kiểm soát IP whitelist hoạt động đúng — các yêu cầu từ IP không nằm trong danh sách bị từ chối (HTTP 403)

## In Scope

- API endpoint publish dữ liệu đèn biển lên Trục LGSP
- Đồng bộ dữ liệu từ hệ thống nguồn sang LGSP theo chu kỳ định kỳ (real-time hoặc batch)
- Cung cấp API endpoint cho đơn vị tiêu thụ truy vấn và nhận dữ liệu
- Bảo mật: xác thực JWT, kiểm soát IP whitelist, logging truy cập

## Out of Scope

- Transform dữ liệu phức tạp vượt ngoài schema chuẩn của LGSP
- Lưu trữ dữ liệu lâu dài tại hệ thống đích (data chỉ được publish qua LGSP)
- Quản lý chính sách bảo mật cấp độ tổ chức (thuộc phạm vi của LGSP)
- Tích hợp trực tiếp với hệ thống điều khiển đèn biển từ xa

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Khách truy cập (Public) | Xem thông tin đèn biển công khai |
| Nhân viên quản lý hạ tầng | Tạo, cập nhật, xóa thông tin đèn biển |
| Quản trị viên hệ thống | Quản lý API key, IP whitelist, xem logs |
| Đơn vị tiêu thụ | Nhận và xử lý dữ liệu qua API LGSP |
| Hải quân/Cơ quan quốc phòng | Xem thông tin đèn biển phục vụ an ninh quốc phòng |

## Architecture Notes

- Dữ liệu được publish dưới định dạng JSON qua RESTful API
- Giao tiếp với Trục LGSP tuân thủ chuẩn OGC API - Features hoặc API riêng của LGSP
- Hệ thống sử dụng HTTPS cho toàn bộ kết nối, JWT cho xác thực
- Dành riêng danh sách IP whitelist cho các đơn vị tiêu thụ hợp lệ
- Log toàn bộ hoạt động publish và consume để phục vụ audit
- Dữ liệu tọa độ đèn biển cần được kiểm tra tính chính xác trước khi publish

## Entities

- **DenBien**: id, maDenBien, tenDenBien, tinhThanh, quanHuyen, toaDo, banKinhChieuSang, dacDiemTinHieu, thoiGianHoatDong, loaiNguonNangLuong, tinhTrangHoatDong, createdAt, updatedAt

## Business Rules

1. Dữ liệu đèn biển chỉ được chia sẻ sau khi đã được kiểm tra tính hợp lệ (validation) về định dạng và nội dung
2. Mọi yêu cầu truy cập API phải thông qua xác thực JWT và địa chỉ IP phải nằm trong danh sách whitelist
3. Chu kỳ đồng bộ dữ liệu không được vượt quá 1 giờ đối với dữ liệu tình trạng hoạt động
4. Thông tin đặc điểm tín hiệu (màu sắc, tần suất) phải được cập nhật ngay khi có thay đổi

## Testing Strategy

- Unit test: kiểm tra các hàm chuyển đổi dữ liệu đèn biển sang schema LGSP
- Integration test: xác nhận publish và consume dữ liệu qua Trục LGSP hoạt động đúng
- Security test: xác nhận JWT authentication và IP whitelist từ chối truy cập không hợp lệ
- Performance test: xác nhận API trả về kết quả trong vòng dưới 500ms với dataset mẫu
