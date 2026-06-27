---
id: F-279
name: "Tra cứu log"
slug: tra-cuu-log
module-id: M-011
status: done
classification: local
priority: medium
created: "2026-06-16T04:42:24Z"
last-updated: "2026-06-25T08:22:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Tra cứu log

## Description

Cung cấp giao diện quản trị và các REST API tương ứng cho phép Quản trị viên hệ thống (Admin / System Admin) tra cứu danh sách, tìm kiếm bộ lọc nâng cao, xem chi tiết và xuất dữ liệu lịch sử nhật ký hệ thống ra định dạng file CSV.

## Business Intent

- Giúp Quản trị viên dễ dàng tìm kiếm và phát hiện các hành động bất thường của người dùng hoặc các lỗi kết nối từ các hệ thống liên thông.
- Hỗ trợ xuất dữ liệu báo cáo audit phục vụ mục đích kiểm toán định kỳ.
- Hiển thị biểu đồ thống kê trực quan số lượng log hoạt động theo ngày.

## Flow Summary

1. Quản trị viên truy cập màn hình **Nhật ký hệ thống**.
2. Hệ thống gọi API `GET /api/access-logs` kèm theo các tham số phân trang, sắp xếp và bộ lọc.
3. Người dùng có thể lọc theo: ID người dùng, Tên phân hệ (Module), Khoảng thời gian (Từ ngày - Đến ngày).
4. Để xuất báo cáo, người dùng nhấn nút **Xuất CSV** -> Gọi API `GET /api/logs/export/csv`.
5. Hệ thống kết xuất file CSV chứa danh sách log tương thích với các ứng dụng đọc bảng tính (như Excel).

## Acceptance Criteria

- **Tra cứu và Phân trang**: Hiển thị danh sách log có phân trang (mặc định size 20), hỗ trợ sắp xếp theo thời gian tạo mới nhất trước.
- **Bộ lọc động**: Hỗ trợ tìm kiếm theo nhiều tham số tùy chọn cùng lúc.
- **Xuất CSV an toàn**: Hỗ trợ xuất file CSV chuẩn mã hóa UTF-8, tự động escape các ký tự đặc biệt (như dấu ngoặc kép `"`) trong trường chi tiết log và User-Agent để tránh lỗi định dạng file.
- **Thống kê tổng quan**: Cung cấp API lấy tổng số lượng log và đếm số lượng log thành công/thất bại trong ngày.

## In Scope

- API tra cứu danh sách và chi tiết log.
- API xuất file CSV an toàn và tải xuống.
- API lấy thống kê tổng số lượng và phân loại trạng thái log trong ngày.
