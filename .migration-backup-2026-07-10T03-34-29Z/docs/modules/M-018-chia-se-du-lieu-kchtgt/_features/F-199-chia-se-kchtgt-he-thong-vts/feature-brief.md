---
id: F-199
name: Chia se KCHTGT He thong VTS
slug: chia-se-kchtgt-he-thong-vts
module-id: M-018
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---

# Feature: Chia se KCHTGT He thong VTS

## Description

Chia sẻ thông tin hạ tầng giao thông vận tải đường thủy về hệ thống VTS (hệ thống giám sát và điều hành giao thông đường thủy - địa điểm, phạm vi bao phủ, công nghệ sử dụng, khả năng giám sát) qua Trục liên thông dữ liệu quốc gia LGSP.

## Business Intent

Cho phép các cơ quan quản lý nhà nước về hàng hải, đơn vị khai thác cảng và tổ chức liên quan tiếp cận nhanh chóng thông tin về hệ thống VTS phục vụ công tác giám sát giao thông đường thủy, điều hành vận hành và ứng phó sự cố. Dữ liệu được chuẩn hóa để đảm bảo tính nhất quán và khả năng trao đổi liên ngành giữa Cục Hàng hải, Chi cục Hàng hải, cảng vụ và các trung tâm VTS vùng biển. Thông tin hệ thống VTS giúp các bên liên quan theo dõi tình trạng hoạt động, phạm vi phủ sóng và năng lực giám sát của từng trung tâm VTS trên toàn quốc.

## Flow Summary

Dữ liệu hệ thống VTS được trích xuất từ hệ thống quản lý hạ tầng giao thông vận tải đường thủy của đơn vị chủ quản, sau đó chuyển đổi sang định dạng chuẩn theo schema quy định của Trục LGSP. Hệ thống dịch vụ API sẽ publish dữ liệu lên cổng chia sẻ, trong đó bao gồm thông tin mã hệ thống VTS, tên trung tâm VTS, tọa độ địa lý, phạm vi bao phủ (bán kính hoặc khu vực), công nghệ sử dụng (radar, AIS, camera, hợp giác tín hiệu), khả năng giám sát (số lượng tàu theo dõi đồng thời), đơn vị quản lý, thời gian hoạt động và tình trạng hoạt động. Các đơn vị tiêu thụ (cục hàng hải, chi cục hàng hải, cảng vụ, trung tâm VTS vùng) có thể gọi API hoặc subscribe qua cơ chế publish/subscribe của LGSP để nhận dữ liệu theo chu kỳ định kỳ hoặc theo yêu cầu. Toàn bộ luồng dữ liệu được bảo mật bằng HTTPS, xác thực JWT và kiểm soát truy cập theo danh sách IP whitelist.

## Acceptance Criteria

- Hệ thống API publish dữ liệu hệ thống VTS lên Trục LGSP thành công, phản hồi HTTP 200 với payload JSON đúng schema
- Dữ liệu hiển thị chính xác các trường: mã hệ thống, tên trung tâm, tọa độ, phạm vi bao phủ, công nghệ, khả năng giám sát, đơn vị quản lý, tình trạng hoạt động
- Đơn vị tiêu thụ xác nhận nhận được dữ liệu đầy đủ, không mất mát sau 24 giờ chia sẻ liên tục
- Xác thực JWT và kiểm soát IP whitelist hoạt động đúng — các yêu cầu từ IP không nằm trong danh sách bị từ chối (HTTP 403)

## In Scope

- API endpoint publish dữ liệu hệ thống VTS lên Trục LGSP
- Đồng bộ dữ liệu từ hệ thống nguồn sang LGSP theo chu kỳ định kỳ (real-time hoặc batch)
- Cung cấp API endpoint cho đơn vị tiêu thụ truy vấn và nhận dữ liệu
- Bảo mật: xác thực JWT, kiểm soát IP whitelist, logging truy cập

## Out of Scope

- Transform dữ liệu phức tạp vượt ngoài schema chuẩn của LGSP
- Lưu trữ dữ liệu lâu dài tại hệ thống đích (data chỉ được publish qua LGSP)
- Quản lý chính sách bảo mật cấp độ tổ chức (thuộc phạm vi của LGSP)
- Tích hợp trực tiếp với hệ thống điều khiển VTS từ xa

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Khách truy cập (Public) | Xem thông tin hệ thống VTS công khai |
| Nhân viên quản lý hạ tầng | Tạo, cập nhật, xóa thông tin hệ thống VTS |
| Quản trị viên hệ thống | Quản lý API key, IP whitelist, xem logs |
| Đơn vị tiêu thụ | Nhận và xử lý dữ liệu qua API LGSP |
| Trung tâm VTS vùng | Cập nhật thông tin hoạt động của trung tâm |

## Architecture Notes

- Dữ liệu được publish dưới định dạng JSON qua RESTful API
- Giao tiếp với Trục LGSP tuân thủ chuẩn OGC API - Features hoặc API riêng của LGSP
- Hệ thống sử dụng HTTPS cho toàn bộ kết nối, JWT cho xác thực
- Dành riêng danh sách IP whitelist cho các đơn vị tiêu thụ hợp lệ
- Log toàn bộ hoạt động publish và consume để phục vụ audit
- Dữ liệu tọa độ và phạm vi bao phủ của VTS cần được kiểm tra tính chính xác trước khi publish

## Entities

- **HeThongVTS**: id, maHeThong, tenHeThong, tinhThanh, quanHuyen, toaDo, phamViBaoQuy, congNgheSuDung, khaNangGiamSat, donViQuanLy, thoiGianHoatDong, tinhTrangHoatDong, createdAt, updatedAt

## Business Rules

1. Dữ liệu hệ thống VTS chỉ được chia sẻ sau khi đã được kiểm tra tính hợp lệ (validation) về định dạng và nội dung
2. Mọi yêu cầu truy cập API phải thông qua xác thực JWT và địa chỉ IP phải nằm trong danh sách whitelist
3. Chu kỳ đồng bộ dữ liệu không được vượt quá 1 giờ đối với dữ liệu tình trạng hoạt động
4. Phạm vi bao phủ và công nghệ sử dụng phải được cập nhật khi có thay đổi về năng lực trung tâm VTS

## Testing Strategy

- Unit test: kiểm tra các hàm chuyển đổi dữ liệu hệ thống VTS sang schema LGSP
- Integration test: xác nhận publish và consume dữ liệu qua Trục LGSP hoạt động đúng
- Security test: xác nhận JWT authentication và IP whitelist từ chối truy cập không hợp lệ
- Performance test: xác nhận API trả về kết quả trong vòng dưới 500ms với dataset mẫu
