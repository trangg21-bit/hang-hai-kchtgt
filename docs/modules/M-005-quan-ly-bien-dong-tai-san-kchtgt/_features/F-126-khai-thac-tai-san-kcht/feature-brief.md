---
id: F-126
name: "Khai thác tài sản KCHT"
slug: khai-thac-tai-san-kcht
module-id: M-005
status: proposed
classification: local
priority: medium
created: "2026-06-16T04:41:00Z"
last-updated: "2026-06-26T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Feature: Khai thác tài sản KCHT

## Description
Quản lý thông tin khai thác và sử dụng tài sản kết cấu hạ tầng công nghệ giao thông (KCHTGT), bao gồm cập nhật tiến độ khai thác, hiệu suất sử dụng, chi phí vận hành bảo dưỡng và tự động tính toán hao mòn lũy kế. Hệ thống hỗ trợ ghi nhận định kỳ các chỉ tiêu khai thác, phân tích hiệu quả sử dụng tài sản và điều chỉnh giá trị hao mòn theo thực tế.

## Business Intent
Đảm bảo thông tin khai thác tài sản được ghi nhận liên tục, chính xác theo định kỳ, giúp đánh giá hiệu quả sử dụng, tối ưu chi phí vận hành và duy trì tính trung thực của giá trị tài sản trên sổ kế toán. Cung cấp dữ liệu phục vụ công tác quản lý, dự toán ngân sách và ra quyết định đầu tư bổ sung hoặc thay thế tài sản.

## Flow Summary
Quy trình bắt đầu khi người dùng đăng nhập vào hệ thống và chọn tài sản cần cập nhật thông tin khai thác. Người dùng nhập các chỉ tiêu khai thác định kỳ (tháng/quý/năm) bao gồm: thời gian hoạt động thực tế, mức độ khai thác, chi phí vận hành và bảo dưỡng, tình trạng kỹ thuật. Hệ thống tự động tính toán lại hao mòn lũy kế và giá trị còn lại của tài sản dựa trên chỉ tiêu khai thác thực tế, sau đó lưu lịch sử khai thác và tạo báo cáo hiệu quả sử dụng. Nếu phát hiện bất thường (hao mòn thực tế vượt quá tính toán, chi phí vận hành tăng đột biến), hệ thống tự động cảnh báo và đề xuất kiểm tra.

## Acceptance Criteria
1. Người dùng có thể cập nhật thông tin khai thác tài sản định kỳ với đầy đủ các chỉ tiêu (thời gian hoạt động, mức độ khai thác, chi phí vận hành, tình trạng kỹ thuật).
2. Hệ thống tự động tính toán lại hao mòn lũy kế và giá trị còn lại của tài sản sau mỗi lần cập nhật khai thác.
3. Hệ thống tự động cảnh báo khi có bất thường về hao mòn hoặc chi phí vận hành vượt quá ngưỡng quy định.
4. Báo cáo hiệu quả khai thác tài sản được tạo tự động theo định kỳ tháng/quý/năm.

## In Scope
- Cập nhật thông tin khai thác tài sản định kỳ (tháng, quý, năm)
- Tự động tính toán lại hao mòn lũy kế và giá trị còn lại
- Ghi nhận chi phí vận hành và bảo dưỡng
- Cảnh báo bất thường về hao mòn hoặc chi phí
- Tạo báo cáo hiệu quả khai thác tài sản

## Out of Scope
- Quy trình mua sắm thiết bị vận hành
- Bảo trì, sửa chữa lớn tài sản (thuộc module khác)
- Thanh lý tài sản sau khi hết thời hạn khai thác
- Tích hợp với hệ thống đo đạc, thu thập dữ liệu tự động

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Nhân viên khai thác | Cập nhật, Xem thông tin khai thác tài sản |
| Kế toán | Xem, Xác nhận hao mòn lũy kế |
| Trưởng phòng | Xem, Duyệt thông tin khai thác |
| Lãnh đạo | Xem báo cáo hiệu quả khai thác |
| Admin hệ thống | Quản lý phân quyền, cấu hình ngưỡng cảnh báo |

## Entities
- **TaiSanKCHT**: id, loaiTaiSan, viTri, giaTriBanDau, HaoMonLucKe, GiaTriConLai, trangThai, createdAt, updatedAt
- **KhaiThacTaiSan**: id, taiSanId, ThoiGianHoatDong, MucDoKhaiThac, ChiPhiVanHanh, ChiPhiBaoDuong, TinhTrangKyThuat, thangKhaiThac, createdAt, updatedAt

## Business Rules
1. Thông tin khai thác phải được cập nhật theo định kỳ tối thiểu mỗi tháng một lần cho từng tài sản.
2. Hao mòn lũy kế không được vượt quá nguyên giá ban đầu của tài sản.
3. Chi phí vận hành và bảo dưỡng phải thuộc ngân sách được phê duyệt cho năm hiện tại.
4. Cảnh báo tự động được kích hoạt khi hao mòn thực tế vượt quá 10% hao mòn tính toán hoặc chi phí vận hành tăng trên 20% so với kỳ trước.
5. Báo cáo hiệu quả khai thác được tạo tự động vào cuối mỗi tháng, quý và năm.

## Testing Strategy
Kiểm thử cập nhật thông tin khai thác với dữ liệu mẫu cho từng loại tài sản và từng định kỳ (tháng, quý, năm). Kiểm thử tính toán hao mòn tự động với các kịch bản: hao mòn bình thường, hao mòn cao bất thường, chi phí vận hành tăng đột biến. Kiểm thử cơ chế cảnh báo tự động với các ngưỡng cấu hình khác nhau. Kiểm thử báo cáo hiệu quả khai thác theo các mốc thời gian khác nhau.
