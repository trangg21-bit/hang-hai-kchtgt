---
id: F-139
name: Quản lý thông tin KCHT trên bản đồ
slug: quan-ly-thong-tin-kcht-tren-ban-do
module-id: M-007
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý thông tin KCHT trên bản đồ

## Description
Quản lý toàn bộ thông tin cơ sở hạ tầng giao thông đường biển (KCHT) hiển thị trên bản đồ GIS, bao gồm cập nhật chi tiết thuộc tính, hình ảnh, hồ sơ kỹ thuật và tình trạng thực tế của từng đối tượng KCHT đã được đánh dấu trên bản đồ, cho phép tra cứu, xem xét và quản lý hồ sơ theo không gian.

## Business Intent
Xây dựng hệ thống quản lý thông tin KCHT tích hợp trên bản đồ GIS nhằm phục vụ công tác giám sát, đánh giá và ra quyết định trong quản lý cơ sở hạ tầng hàng hải, thay thế việc lưu trữ hồ sơ phân tán thành một nền tảng thông tin không gian tập trung, giúp cán bộ quản lý theo dõi tình trạng và lập kế hoạch bảo trì, nâng cấp một cách hiệu quả.

## Flow Summary
Người dùng truy cập giao diện bản đồ GIS và chọn mục quản lý thông tin KCHT, sau đó thực hiện các thao tác: tìm kiếm đối tượng KCHT trên bản đồ bằng tên, mã hoặc loại; xem chi tiết thông tin thuộc tính, hình ảnh, hồ sơ kỹ thuật và tình trạng thực tế của đối tượng; cập nhật hoặc bổ sung thông tin mới; tải lên tài liệu liên quan (hồ sơ thiết kế, biên bản nghiệm thu); đánh giá tình trạng KCHT theo định kỳ; xuất báo cáo tổng hợp tình trạng KCHT khu vực.

## Acceptance Criteria
- Người dùng có thể tìm kiếm và hiển thị thông tin chi tiết của một đối tượng KCHT trên bản đồ GIS, bao gồm thuộc tính cơ bản, hình ảnh và hồ sơ kỹ thuật liên quan.
- Người dùng có thể cập nhật thông tin thuộc tính, bổ sung hình ảnh và tải lên tài liệu mới cho một đối tượng KCHT đã tồn tại, dữ liệu được lưu chính xác và hiển thị cập nhật ngay lập tức.
- Người dùng có thể xem danh sách các đối tượng KCHT cùng loại hoặc trong một khu vực địa lý cụ thể với thông tin tóm tắt tình trạng.
- Người dùng có thể đánh giá tình trạng KCHT (tốt/bình thường/kém) với lý do đánh giá được ghi nhận.
- Hệ thống không cho phép xóa thông tin KCHT đã được xác nhận nghiệm thu mà chỉ cho phép vô hiệu hóa.

## In Scope
- Xem chi tiết thông tin KCHT trên bản đồ GIS
- Cập nhật thuộc tính, hình ảnh, tài liệu cho KCHT
- Đánh giá tình trạng KCHT theo định kỳ
- Tìm kiếm KCHT theo tên, mã, loại, vị trí, tình trạng
- Hiển thị bản đồ tổng hợp tình trạng KCHT
- Xuất báo cáo tình trạng KCHT khu vực
- Ghi nhật ký thay đổi thông tin KCHT

## Out of Scope
- Quản lý danh mục đối tượng điểm, đường, vùng (thuộc F-136, F-137, F-138)
- Tính toán chi phí bảo trì hoặc dự toán ngân sách
- Tích hợp trực tiếp hệ thống ERP quản lý tài sản
- Cảnh báo tự động khi KCHT vượt ngưỡng nguy hiểm

## Roles + Permissions
| Role | Permissions |
|------|-------------|
| Visitor | Xem thông tin KCHT trên bản đồ |
| User | Xem, cập nhật thuộc tính, đánh giá tình trạng KCHT |
| Admin | Xem, cập nhật tất cả thông tin KCHT, xác nhận đánh giá, xuất báo cáo |

## Entities
- **KCHTInfo**: id, kchtCode, kchtName, objectType (point/line/region), category, description, status, conditionRating (good/fair/poor), conditionNote, createdById, lastReviewDate, createdAt, updatedAt
- **KCHTAttachment**: id, kchtId, fileUrl, fileType, uploadedBy, uploadedAt
- **KCHTConditionRecord**: id, kchtId, rating, reviewer, reviewDate, notes

## Business Rules
1. Mã KCHT phải là duy nhất và tuân thủ quy định về định dạng mã do cấp có thẩm quyền ban hành.
2. Tình trạng KCHT chỉ được cập nhật bởi người dùng có quyền đánh giá và phải ghi nhận người đánh giá, ngày đánh giá.
3. Hồ sơ KCHT đã được xác nhận nghiệm thu không thể xóa bỏ, chỉ có thể vô hiệu hóa hoặc cập nhật tình trạng mới.
4. Khi thay đổi tình trạng từ tốt xuống kém, hệ thống tự động gửi thông báo đến người phụ trách quản lý KCHT.
5. Số lượng tài liệu đính kèm không vượt quá giới hạn 10 file mỗi đối tượng KCHT.

## Testing Strategy
Kiểm thử đơn vị các service quản lý thông tin KCHT, kiểm thử tích hợp API REST với payload bao gồm metadata và attachment, kiểm thử E2E trên giao diện bản đồ bằng Playwright/Cypress bao gồm tìm kiếm, xem chi tiết, cập nhật thông tin và đánh giá tình trạng, kiểm thử xác thực file tải lên, kiểm thử quyền truy cập theo role, kiểm thử gửi thông báo tự động.
