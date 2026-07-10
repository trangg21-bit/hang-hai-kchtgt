---
id: F-133
name: "Tra cứu quy hoạch bến cảng"
slug: tra-cuu-quy-hoach-ben-cang
module-id: M-006
status: proposed
classification: local
priority: high
created: "2026-06-16T04:41:29Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Tra cứu quy hoạch bến cảng

## Description

Hệ thống tra cứu quy hoạch bến cảng hàng hải, cho phép người dùng tìm kiếm, lọc và xem chi tiết các quy hoạch bến cảng đã được đăng ký trong hệ thống theo nhiều tiêu chí khác nhau như tên đồ án, cơ quan phê duyệt, năm phê duyệt, phạm vi áp dụng và tình trạng hiệu lực, hỗ trợ tra cứu nhanh thông tin quy hoạch phục vụ công tác quản lý và ra quyết định.

## Business Intent

Tạo điều kiện thuận lợi cho toàn bộ đội ngũ quản lý và các bên liên能够快速 tra cứu thông tin quy hoạch bến cảng hiện hành, giúp giảm thời gian tìm kiếm tài liệu quy hoạch thủ công, đảm bảo thông tin quy hoạch được cập nhật đồng bộ và nhất quán trên toàn hệ thống, hỗ trợ ra quyết định đầu tư và vận hành dựa trên quy hoạch đã được phê duyệt.

## Flow Summary

Người dùng đăng nhập hệ thống, nhập từ khóa hoặc chọn bộ lọc theo tiêu chí (tên đồ án, cơ quan phê duyệt, năm, phạm vi áp dụng). Hệ thống trả về danh sách kết quả tra cứu kèm thông tin tóm tắt. Người dùng click vào từng kết quả để xem chi tiết quy hoạch, bao gồm thông tin cơ bản, phạm vi áp dụng, các file bản đồ đính kèm và tiến độ thực hiện các hạng mục. Hệ thống hỗ trợ in ấn hoặc xuất PDF quy hoạch đang xem để phục vụ trình bày hoặc lưu trữ offline.

## Acceptance Criteria

- Người dùng có thể tra cứu quy hoạch theo từ khóa (tên đồ án, cơ quan phê duyệt)
- Người dùng có thể lọc kết quả theo năm phê duyệt, tình trạng hiệu lực và phạm vi áp dụng
- Hệ thống trả về kết quả tra cứu có phân trang với tối đa 20 kết quả/trang
- Người dùng có thể xem chi tiết quy hoạch với đầy đủ thông tin và file đính kèm
- Người dùng có thể in ấn hoặc xuất PDF quy hoạch đang xem

## In Scope

- Tra cứu quy hoạch theo từ khóa và bộ lọc đa tiêu chí
- Hiển thị danh sách kết quả tra cứu có phân trang
- Xem chi tiết quy hoạch với thông tin đầy đủ và file đính kèm
- In ấn hoặc xuất PDF quy hoạch đang xem
- Lưu lịch sử tra cứu của người dùng

## Out of Scope

- Tìm kiếm bán tự động trên nội dung file bản đồ (OCR)
- Hiển thị quy hoạch trên bản đồ GIS tương tác
- So sánh trực quan hai quy hoạch trên bản đồ chồng lớp
- Tích hợp tra cứu với cơ sở dữ liệu quy hoạch quốc gia

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Tra cứu, Xem chi tiết quy hoạch, Xuất PDF, In ấn |
| Analyst | Tra cứu nâng cao (tất cả bộ lọc), Xem lịch sử tra cứu |
| Admin | Xem tất cả quy hoạch, Quản lý quyền truy cập tra cứu |

## Entities

- **TraCuuLog**: id, nguoiTraCuu, tuKhoa, boLoc, soLuongKetQua, ngayTraCuu
- **KetQuaTraCuu**: id, quyHoachId, tenDoAn, coQuanPheDuyet, ngayPheDuyet, phamViApDung, tinhTrang
- **QuyHoachHienHanh**: id, tenDoAn, ngayPheDuyet, phamViApDung, tenFileBanDo, moTaTomTat

## Business Rules

1. Kết quả tra cứu chỉ hiển thị các quy hoạch có trạng thái "hiện hành" hoặc "đã thay thế" (không hiển thị quy hoạch lịch sử cũ)
2. Từ khóa tra cứu phải có độ dài tối thiểu 2 ký tự
3. Kết quả tra cứu được sắp xếp theo ngày phê duyệt giảm dần theo mặc định
4. Người dùng không được quyền xuất PDF nếu không có quyền xem chi tiết quy hoạch

## Testing Strategy

- Test tra cứu theo từ khóa với bộ dữ liệu quy hoạch mẫu
- Test lọc theo từng tiêu chí riêng lẻ và kết hợp nhiều bộ lọc
- Test phân trang với bộ dữ liệu lớn (>50 quy hoạch)
- Test xuất PDF và in ấn với quy hoạch có file đính kèm
- Test lịch sử tra cứu được ghi nhận chính xác cho mỗi người dùng
