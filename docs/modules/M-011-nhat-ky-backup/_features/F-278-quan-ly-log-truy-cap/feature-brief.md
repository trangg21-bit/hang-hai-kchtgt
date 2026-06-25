---
id: F-278
name: "Quản lý log truy cập"
slug: quan-ly-log-truy-cap
module-id: M-011
status: done
classification: local
priority: medium
created: "2026-06-16T04:42:24Z"
last-updated: "2026-06-25T08:22:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý log truy cập

## Description

Hệ thống ghi nhận vết hoạt động (audit logs) của người dùng đối với các tài nguyên nhạy cảm thông qua một cơ chế chặn yêu cầu tập trung (Spring MVC HandlerInterceptor). Log được phân chia thành 5 nhóm logic: truy cập (ACCESS), đăng nhập (AUTH), lỗi (ERROR/FAIL), tài khoản (USER) và cấu hình (CONNECTION/BACKUP/REPORT).

## Business Intent

- Đảm bảo tính minh bạch, khả năng truy vết nguồn gốc hành động của tài khoản khi có sự cố.
- Giám sát an toàn thông tin hệ thống, phát hiện truy cập bất thường (ví dụ: brute force đăng nhập).
- Tự động dọn dẹp các bản ghi log cũ hơn 90 ngày để tránh quá tải dung lượng cơ sở dữ liệu.

## Flow Summary

1. Người dùng gửi yêu cầu tới các API endpoint được đánh dấu `@AuditLog`.
2. `AccessLogInterceptor` thực hiện bắt thông tin sau khi request hoàn thành (`afterCompletion`).
3. Trích xuất địa chỉ IP của Client (xử lý proxy header `X-Forwarded-For`), thông tin trình duyệt (`User-Agent`).
4. Lấy thông tin tài khoản đăng nhập (`username`, `userId`) từ Spring Security context.
5. Xác định trạng thái thực hiện (`SUCCESS` hoặc `FAILED`) dựa vào HTTP Response Code và Exception ném ra.
6. Lưu thông tin nhật ký vào bảng `access_logs`.

## Acceptance Criteria

- **Ghi log đầy đủ**: Tự động lưu vết tất cả các request tới Controller có cấu hình `@AuditLog`.
- **Thông tin chi tiết**: Lưu trữ đầy đủ các thông tin gồm ID người dùng, tên đăng nhập, IP, User-Agent, chức năng thực hiện, kết quả và chi tiết lỗi nếu có.
- **Cơ chế cảnh báo lỗi**: Gửi cảnh báo hệ thống (qua warning log) nếu số lượng log FAILED trong 30 phút vượt quá ngưỡng (mặc định 100).
- **Tự động lưu giữ**: Dọn dẹp tự động log định kỳ (Retention Policy 90 ngày).

## In Scope

- Xây dựng Annotation `@AuditLog` và Interceptor ghi log tự động.
- Áp dụng ghi log cho các nghiệp vụ: Đăng nhập/xác thực, Quản lý tài khoản, Quản lý kết nối, Sao lưu/Khôi phục, Báo cáo.
- Bộ đếm và kiểm tra cảnh báo lỗi truy cập.
- Scheduler dọn dẹp log định kỳ hàng ngày.
