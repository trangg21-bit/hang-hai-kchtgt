---
id: F-128
name: "Quản lý văn bản pháp lý"
slug: quan-ly-van-ban-phap-ly
module-id: M-006
status: proposed
classification: local
priority: high
created: "2026-06-16T04:40:21Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý văn bản pháp lý

## Description

Hệ thống quản lý tập trung toàn bộ văn bản pháp lý liên quan đến kết cấu hạ tầng cảng biển (KCHT), bao gồm việc tiếp nhận, lưu trữ, phân loại, theo dõi hiệu lực và truy xuất các văn bản quy phạm pháp luật, nghị định, thông tư, quyết định có liên quan đến hoạt động quản lý và khai thác cảng biển.

## Business Intent

Đảm bảo toàn bộ đội ngũ quản lý cảng có thể truy cập nhanh chóng và chính xác các văn bản pháp lý hiện hành, tuân thủ đúng quy định pháp luật trong hoạt động quản lý, vận hành và phát triển kết cấu hạ tầng cảng biển, giảm thiểu rủi ro pháp lý do sử dụng văn bản cũ hoặc không chính xác.

## Flow Summary

Người dùng đăng nhập vào hệ thống, thực hiện đăng ký văn bản mới với đầy đủ thông tin cơ bản (tên văn bản, cơ quan ban hành, số hiệu, ngày ban hành, ngày có hiệu lực, lĩnh vực áp dụng). Hệ thống tự động phân loại và gán nhãn theo nhóm văn bản (luật, nghị định, thông tư, quyết định). Người dùng có thể tìm kiếm, lọc theo tiêu chí, xem chi tiết và theo dõi lịch sử sửa đổi, gia hạn hoặc hủy bỏ của từng văn bản. Khi văn bản sắp hết hiệu lực, hệ thống tự động gửi cảnh báo đến người phụ trách để cập nhật hoặc thay thế bằng văn bản mới.

## Acceptance Criteria

- Người dùng có thể tạo mới một văn bản pháp lý với đầy đủ các trường thông tin bắt buộc (tên, số hiệu, cơ quan ban hành, ngày ban hành, ngày có hiệu lực)
- Hệ thống cho phép tìm kiếm và lọc văn bản theo tên, cơ quan ban hành, lĩnh vực, trạng thái hiệu lực
- Người dùng có thể xem chi tiết, sửa đổi và theo dõi lịch sử thay đổi của từng văn bản
- Hệ thống tự động gửi cảnh báo khi văn bản sắp hết hiệu lực (trước 30 ngày)
- Chỉ người có quyền Admin mới được phép xóa hoặc vô hiệu hóa văn bản trong hệ thống

## In Scope

- Đăng ký, chỉnh sửa và lưu trữ văn bản pháp lý liên quan đến KCHT
- Phân loại tự động theo nhóm: luật, nghị định, thông tư, quyết định
- Tìm kiếm và lọc văn bản theo nhiều tiêu chí
- Theo dõi trạng thái hiệu lực và gửi cảnh báo gia hạn
- Quản lý lịch sử sửa đổi và phiên bản của từng văn bản
- Xuất bản/pdf văn bản ra file tài liệu

## Out of Scope

- Quản lý văn bản không liên quan đến lĩnh vực cảng biển và KCHT
- Tích hợp với cơ sở dữ liệu pháp lý quốc gia (vnpa.gov.vn)
- Tự động so sánh, đối chiếu nội dung giữa các văn bản với nhau
- Quản lý hồ sơ pháp lý của doanh nghiệp cảng

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Xem, Tìm kiếm, Lọc văn bản |
| Analyst | Tạo, Chỉnh sửa văn bản, Thêm tài liệu đính kèm |
| Admin | Tạo, Chỉnh sửa, Xóa, Vô hiệu hóa văn bản, Quản lý phân quyền |

## Entities

- **VanBanPhapLy**: id, tenVanBan, soHieu, coQuanBanHanh, ngayBanHanh, ngayCoHieuLuc, ngayHetHieuLuc, loaiVanBan, lVinhVucApDung, tinhTrangHieuLuc, nguoiTao, ngayTao, nguoiSuaDoi, ngaySuaDoi
- **TaiLieuDinhKem**: id, vanBanId, tenTaiLieu, duongDan, kichThuoc, ngayTaiLên

## Business Rules

1. Văn bản pháp lý phải có đầy đủ số hiệu và tên cơ quan ban hành trước khi được lưu vào hệ thống
2. Trường ngày có hiệu lực phải lớn hơn hoặc bằng ngày ban hành
3. Văn bản có trạng thái "Đã hết hiệu lực" không được phép chỉnh sửa nội dung chính
4. Chỉ Admin mới được phép xóa hoặc thay đổi trạng thái cơ bản của văn bản
5. Mọi thay đổi về ngày hết hiệu lực phải được ghi nhận trong lịch sử sửa đổi

## Testing Strategy

- Test đơn vị từng hàm tạo, sửa, xóa văn bản pháp lý
- Test tích hợp luồng đăng ký → phân loại → lưu trữ → tìm kiếm
- Test cảnh báo hết hiệu lực với dữ liệu mẫu có ngày khác nhau
- Test phân quyền: User không được phép xóa, Analyst không được phép vô hiệu hóa
- Test tìm kiếm với bộ dữ liệu lớn để đảm bảo hiệu suất
