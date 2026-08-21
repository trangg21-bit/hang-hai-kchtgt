---
id: F-011
name: Phê duyệt Cảng biển
slug: phe-duyet-cb
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:19Z
last-updated: 2026-08-21
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Phê duyệt Cảng biển

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-011 — Phê duyệt Cảng biển
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng có bước phê duyệt (quy trình 2 cấp theo file chuẩn)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung. Quy trình 2 cấp (trạng thái, vòng duyệt, quyền duyệt theo chức vụ) KHÔNG chép lại ở đây — đọc `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`.

---

## 1. Mô tả ngắn

Cho phép người duyệt có thẩm quyền (`port:approve`) xử lý hồ sơ Cảng biển trong quy trình phê duyệt 2 cấp: xem chi tiết hồ sơ chờ duyệt, đánh giá tính hợp lệ, **chấp thuận** hoặc **từ chối** kèm lý do cụ thể (bắt buộc khi từ chối, tối thiểu 10 ký tự). Mỗi quyết định duyệt được ghi vào nhật ký phê duyệt (approval log — lưu vĩnh viễn, không sửa/xóa) và thông báo kết quả cho người tạo hồ sơ.

## 2. Trường dữ liệu

Không có form nhập liệu mới — thao tác trên bản ghi `Port` hiện có + nhật ký phê duyệt.

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | id | Có | UUID | Hồ sơ cảng cần xử lý |
| 2 | approvalStatus | Có (hệ thống) | Enum `ApprovalStatus` (lưu số 0..6) | Trạng thái hiện tại của hồ sơ trong quy trình 2 cấp |
| 3 | reason (lý do từ chối) | Có khi từ chối | TextArea, tối thiểu 10 ký tự | Lý do chấp thuận là tùy chọn |
| 4 | approval log | Có (hệ thống) | Bảng `approval_log` | Người duyệt, thời gian, quyết định, lý do — lưu vĩnh viễn |

## 3. Trạng thái và phê duyệt

- **Toàn bộ quy trình phê duyệt 2 cấp theo `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`** — không mô tả lại tại đây. Áp dụng cho Cảng biển: số vòng duyệt (1 hoặc 2) phụ thuộc đơn vị gửi; quyền duyệt gắn chức vụ (lãnh đạo Cảng vụ/Chi cục duyệt vòng 1, lãnh đạo Cục duyệt vòng 2).
- Bản đồ 7 trạng thái → enum `ApprovalStatus` theo tài liệu nền mục 3.5 (BA đề xuất, SA chốt).
- **Trạng thái hiển thị:** hồ sơ chờ duyệt ở cấp tương ứng (Cảng vụ/Chi cục hoặc Cục) được đưa vào danh sách chờ duyệt của cấp đó; hồ sơ bị trả về quay lại người nhập để sửa; hồ sơ **Đã duyệt** mới chính thức có hiệu lực.
- Sau quyết định: cập nhật trạng thái + ghi approval log + thông báo cho người tạo. Nhật ký phê duyệt không được xóa hoặc sửa.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-011-01 | Hồ sơ chỉ được duyệt khi đang ở trạng thái chờ duyệt đúng cấp (vòng 1: Cảng vụ/Chi cục; vòng 2: Cục — theo file chuẩn) | Approve |
| BR-011-02 | Lý do từ chối là bắt buộc, tối thiểu 10 ký tự; lý do chấp thuận là tùy chọn | Reject |
| BR-011-03 | Mỗi quyết định duyệt ghi approval log: người duyệt, thời gian, quyết định, lý do — lưu vĩnh viễn, không cho phép xóa hoặc sửa | Audit |
| BR-011-04 | Chống tự duyệt (4-eyes principle): người tạo hồ sơ không được tự duyệt hồ sơ của mình (theo file chuẩn) | Approve |
| BR-011-05 | Thông báo kết quả duyệt đến người tạo hồ sơ | Approve/Reject |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem hồ sơ chờ duyệt + chi tiết | `port:read` |
| Chấp thuận / Từ chối ở cấp được phân quyền | `port:approve` |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Toàn quyền |
| Lãnh đạo Cảng vụ / Chi cục | Duyệt vòng 1 (chấp thuận / trả về) |
| Lãnh đạo Cục | Duyệt vòng 2 (quyết định cuối) |
| Người tạo hồ sơ | Xem trạng thái, không tự duyệt |
| Nhân viên vận hành | Xem |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — full quyền + xem metadata người tạo/người sửa/thời gian (phục vụ kiểm toán duyệt).

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — dùng 7 trạng thái chung (tài liệu nền mục 3.5) |
| 2 | Có bước phê duyệt không | Có — phê duyệt 2 cấp theo QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị (orgUnitId — tài liệu nền mục 3.3) |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `port:approve` (kèm `port:read`) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/ports` với bộ lọc trạng thái chờ duyệt | Danh sách hồ sơ chờ duyệt của cấp hiện tại | `port:approve` |
| GET | `/api/v1/ports/{id}` | Chi tiết hồ sơ kèm lịch sử thay đổi | `port:read` |
| POST | `/api/v1/ports/{id}/approve` | Chấp thuận ở cấp hiện tại (chuyển sang cấp tiếp theo hoặc Đã duyệt — theo file chuẩn) | `port:approve` |
| POST | `/api/v1/ports/{id}/reject` | Từ chối / trả về (bắt buộc lý do ≥ 10 ký tự) | `port:approve` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `ports`:** sử dụng cột `approval_status` (SMALLINT, enum `ApprovalStatus`) có sẵn; bổ sung theo quy trình 2 cấp nếu cần theo dõi người duyệt từng vòng — 🔴 `submitted_for_approval_at` / `submitted_for_approval_by`, 🔴 `port_authority_approved_at` / `port_authority_approved_by` / `port_authority_approval_content` (vòng 1), 🔴 `department_approved_at` / `department_approved_by` / `department_approval_content` (vòng 2), 🔴 `rejection_reason` (VARCHAR 500) — tham khảo mẫu đã áp dụng tại entity `Berth` (bảng `berths`), SA chốt.

**Bảng `approval_log` (nhật ký phê duyệt):** id (UUID PK), entityType, entityId (UUID), approvedBy (UUID), decision (enum: APPROVED/REJECTED), reason (text), approvedAt (TIMESTAMP) — lưu vĩnh viễn, không xóa/sửa.
