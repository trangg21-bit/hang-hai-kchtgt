---
feature-id: F-031
document: business-context
last-updated: 2026-06-27
---
# Business Context: Quản lý Cảng cạn - Lịch sử (F-031)

## Business Intent

Cung cấp khả năng truy vết toàn bộ quá trình biến động của Cảng cạn theo thời gian, hỗ trợ công tác kiểm toán, giải trình khi có thắc mắc và phân tích xu hướng vận hành logistics. Là yêu cầu bắt buộc trong quản lý hạ tầng cảng biển để đảm bảo tính minh bạch và trách nhiệm giải trình, đặc biệt quan trọng khi Cảng cạn liên quan đến nhiều bên tham gia logistics.

## Actors

| Actor | Role Slug | Access Level |
|---|---|---|
| Quản trị viên | ROLE_SYSTEM_ADMIN / ROLE_ADMIN | Xem toàn bộ lịch sử không giới hạn org-unit |
| Chuyên viên | ROLE_SPECIALIST | Xem lịch sử theo phạm vi org-unit |
| Người dùng tại Cảng | ROLE_PORT_OPERATOR | Xem lịch sử giới hạn theo org-unit |
| Cá nhân/Tổ chức bên ngoài | Public User | Không có quyền truy cập (HTTP 403) |

## Event Sources

| Feature | Sự kiện ghi vào lịch sử |
|---|---|
| F-026 (Tạo mới Cảng cạn) | TAO_MOI |
| F-027 (Cập nhật Cảng cạn) | CAP_NHAT |
| F-028 (Xóa Cảng cạn) | XOA |
| F-029 (Phê duyệt Cảng cạn) | PHE_DUYET |

## Key Business Rules

| BR-ID | Rule |
|---|---|
| BR-001 | Mọi thay đổi Cảng cạn phải tự động ghi nhận — không cho phép bỏ qua |
| BR-002 | Bản ghi lịch sử immutable — không sửa, không xóa |
| BR-004 | Giá trị JSON/GPS chuyển sang text trước khi ghi |
| BR-006 | Mặc định hiển thị 90 ngày gần nhất; lọc tối đa 1 năm |

## Architecture Decisions Needed (for SA)

- Storage strategy: DB trigger vs Spring AOP interceptor vs explicit service call
- Transaction boundary: ghi lịch sử trong cùng transaction hay async
- Index strategy: cangCanId + thoiGian, loaiSuKien
