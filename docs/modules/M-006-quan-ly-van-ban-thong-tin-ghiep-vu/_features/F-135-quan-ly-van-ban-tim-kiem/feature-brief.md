---
id: F-135
name: "Quản lý văn bản - Tìm kiếm"
slug: quan-ly-van-ban-tim-kiem
module-id: M-006
status: proposed
classification: local
priority: high
created: "2026-06-16T04:41:29Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý văn bản - Tìm kiếm

## Description

Hệ thống tra cứu và tìm kiếm văn bản pháp lý liên quan đến kết cấu hạ tầng cảng biển (KCHT), cho phép người dùng tìm kiếm nhanh các văn bản đã được lưu trữ trong hệ thống theo nhiều tiêu chí kết hợp như từ khóa, cơ quan ban hành, lĩnh vực, ngày ban hành và trạng thái hiệu lực, hỗ trợ tra cứu thông minh với gợi ý tìm kiếm và kết quả được sắp xếp theo mức độ phù hợp.

## Business Intent

Tối ưu hóa thời gian và công sức tìm kiếm văn bản pháp lý của đội ngũ quản lý cảng, đảm bảo mọi người dùng đều có thể truy cập nhanh chóng vào đúng văn bản pháp lý cần thiết cho công việc, giảm thiểu rủi ro sử dụng văn bản sai hoặc lỗi thời và nâng cao hiệu quả công tác tuân thủ pháp luật trong hoạt động quản lý cảng biển.

## Flow Summary

Người dùng đăng nhập hệ thống, nhập từ khóa tìm kiếm hoặc chọn bộ lọc theo tiêu chí (cơ quan ban hành, lĩnh vực, năm ban hành, trạng thái hiệu lực). Hệ thống sử dụng tìm kiếm FTS (Full-Text Search) để tìm kiếm trên tiêu đề, nội dung và các trường metadata của văn bản. Kết quả được sắp xếp theo mức độ phù hợp với từ khóa và hiển thị có phân trang. Người dùng click vào kết quả để xem chi tiết văn bản, đọc nội dung hoặc tải file PDF về. Hệ thống lưu lịch sử tìm kiếm và gợi ý các từ khóa tìm kiếm phổ biến dựa trên lịch sử của toàn hệ thống.

## Acceptance Criteria

- Người dùng có thể tìm kiếm văn bản theo từ khóa (tìm kiếm trên tiêu đề và nội dung)
- Người dùng có thể lọc kết quả theo cơ quan ban hành, lĩnh vực, năm ban hành, trạng thái hiệu lực
- Kết quả tìm kiếm được sắp xếp theo mức độ phù hợp với từ khóa và hiển thị có phân trang (20 kết quả/trang)
- Người dùng có thể xem chi tiết văn bản và tải file PDF đính kèm (nếu có)
- Hệ thống gợi ý từ khóa tìm kiếm dựa trên lịch sử tìm kiếm phổ biến

## In Scope

- Tìm kiếm văn bản theo từ khóa (tìm kiếm full-text trên tiêu đề và nội dung)
- Lọc kết quả theo cơ quan ban hành, lĩnh vực, năm ban hành, trạng thái hiệu lực
- Hiển thị kết quả có phân trang với sắp xếp theo mức độ phù hợp
- Xem chi tiết văn bản và tải file PDF đính kèm
- Gợi ý từ khóa tìm kiếm dựa trên lịch sử tìm kiếm phổ biến
- Lưu lịch sử tìm kiếm của người dùng

## Out of Scope

- Tìm kiếm bán tự động trên nội dung file PDF (OCR)
- Tìm kiếm giọng nói hoặc nhập liệu bằng voice
- Tự động dịch văn bản pháp lý sang tiếng Anh
- Tích hợp tra cứu với cơ sở dữ liệu pháp lý quốc gia (vnpa.gov.vn)

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User | Tìm kiếm, Xem chi tiết văn bản, Tải file PDF |
| Analyst | Tìm kiếm nâng cao (tất cả bộ lọc), Xem lịch sử tìm kiếm |
| Admin | Xem tất cả văn bản, Quản lý quyền truy cập tìm kiếm |

## Entities

- **TimKiemLog**: id, nguoiTimKiem, tuKhoa, boLoc, soLuongKetQua, ngayTimKiem
- **KetQuaTimKiem**: id, vanBanId, tenVanBan, soHieu, coQuanBanHanh, ngayBanHanh, diemPhuHop, moTaTomTat
- **GoiYTimKiem**: id, tuKhoa, soLuongTim, lanCuoiTim

## Business Rules

1. Từ khóa tìm kiếm phải có độ dài tối thiểu 2 ký tự
2. Kết quả tìm kiếm chỉ hiển thị văn bản có trạng thái "còn hiệu lực" hoặc "sắp hết hiệu lực"
3. Kết quả được sắp xếp theo điểm phù hợp (relevance score) giảm dần theo mặc định
4. Gợi ý từ khóa chỉ hiển thị các từ khóa đã được tìm kiếm tối thiểu 5 lần
5. Người dùng không được phép tải file PDF nếu không có quyền xem chi tiết văn bản

## Testing Strategy

- Test tìm kiếm full-text theo từ khóa với bộ dữ liệu văn bản mẫu
- Test lọc theo từng tiêu chí riêng lẻ và kết hợp nhiều bộ lọc
- Test phân trang với bộ dữ liệu lớn (>100 văn bản)
- Test gợi ý từ khóa với từ khóa đã được tìm kiếm nhiều lần
- Test phân quyền: User không được phép tải PDF nếu không có quyền xem chi tiết
