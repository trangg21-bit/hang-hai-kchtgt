---
id: F-023
name: Phê duyệt Cầu cảng
slug: phe-duyet-cc
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-21
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Phê duyệt Cầu cảng

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-023 — Phê duyệt Cầu cảng
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng có bước phê duyệt (quy trình 2 cấp theo file chuẩn)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng. Quy trình 2 cấp (trạng thái, vòng duyệt, quyền duyệt theo chức vụ) KHÔNG chép lại ở đây — đọc `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`.

---

## 1. Mô tả ngắn

Cho phép người duyệt có thẩm quyền (`pier:approve`) xử lý hồ sơ Cầu cảng trong quy trình phê duyệt 2 cấp (theo file chuẩn): xem danh sách hồ sơ chờ duyệt đúng cấp của mình, xem chi tiết, **chấp thuận** hoặc **từ chối** kèm lý do (bắt buộc ≥ 10 ký tự khi từ chối). Mỗi quyết định ghi PheDuyetLog (bất biến, không sửa/xóa) và thông báo cho người tạo. Hồ sơ bị từ chối quay lại người nhập để chỉnh sửa và gửi lại (F-021). Hồ sơ được duyệt mới chính thức có hiệu lực, khả dụng trong các module khác.

## 2. Trường dữ liệu

Không có form nhập liệu mới — thao tác trên bản ghi `Pier` hiện có + nhật ký phê duyệt.

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | id | Có | UUID | Hồ sơ cầu cảng cần xử lý |
| 2 | approvalStatus | Có (hệ thống) | Enum `ApprovalStatus` (lưu số 0..6) | Trạng thái trong quy trình 2 cấp (tài liệu nền mục 3.5) |
| 3 | reason (lý do từ chối) | Có khi từ chối | TextArea, tối thiểu 10 ký tự | Lý do chấp thuận là tùy chọn |
| 4 | PheDuyetLog | Có (hệ thống) | Bảng `approval_log` | Người duyệt, cấp, thời gian, quyết định, lý do — lưu vĩnh viễn |

## 3. Trạng thái và phê duyệt

- **Toàn bộ quy trình phê duyệt 2 cấp theo `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`** — không mô tả lại tại đây. Bản đồ 7 trạng thái → enum `ApprovalStatus` theo tài liệu nền mục 3.5 (BA đề xuất, SA chốt).
- Chỉ hồ sơ ở trạng thái chờ duyệt đúng cấp mới được xử lý; duyệt tuần tự, không vượt cấp; từ chối/trả về ở bất kỳ cấp nào dừng quy trình và hồ sơ quay lại người nhập.
- Hồ sơ **Đã duyệt** mới chính thức có hiệu lực và được tham chiếu bởi module khác.
- Sau quyết định: cập nhật trạng thái + ghi PheDuyetLog + thông báo người tạo. Log không được sửa/xóa.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-023-01 | Chỉ hồ sơ ở trạng thái chờ duyệt đúng cấp mới được phê duyệt/từ chối; duyệt tuần tự 2 cấp, không vượt cấp (theo file chuẩn) | Approve |
| BR-023-02 | Lý do từ chối ≥ 10 ký tự, bắt buộc; < 10 ký tự → chặn submit | Reject |
| BR-023-03 | Mỗi quyết định ghi PheDuyetLog: người duyệt, cấp, thời gian, quyết định, lý do — bất biến, không sửa/xóa | Audit |
| BR-023-04 | Chống tự duyệt (4-eyes principle): người tạo hồ sơ không tự duyệt hồ sơ của mình | Approve |
| BR-023-05 | Hồ sơ bị từ chối → quay lại người nhập; sửa và gửi lại qua F-021 | Reject |
| BR-023-06 | Mọi thay đổi trạng thái ghi vào lịch sử (F-025) | Audit |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem hồ sơ chờ duyệt + chi tiết | `pier:read` |
| Chấp thuận / Từ chối ở cấp được phân quyền | `pier:approve` |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Toàn quyền |
| Lãnh đạo, Admin | Phê duyệt / Từ chối (nút hiển thị theo quyền + cấp duyệt) |
| Nhân viên Cảng / Quản lý tài sản | Khởi tạo, sửa khi bị từ chối, xem — không tự duyệt |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — full quyền + xem metadata người duyệt từng cấp, thời gian duyệt, lý do từ chối.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — dùng 7 trạng thái chung (tài liệu nền mục 3.5) |
| 2 | Có bước phê duyệt không | Có — phê duyệt 2 cấp theo QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md |
| 3 | Lọc cha-con / theo đơn vị | Có — theo đơn vị (orgUnitId) + theo Cảng biển → Bến cảng (cha-con) |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `pier:approve` (kèm `pier:read`) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/pier` với bộ lọc trạng thái chờ duyệt | Danh sách hồ sơ chờ duyệt của cấp hiện tại | `pier:approve` |
| GET | `/api/v1/pier/{id}` | Chi tiết hồ sơ (JOIN berth, attachments) | `pier:read` |
| POST | `/api/v1/pier/{id}/approve` | Chấp thuận ở cấp hiện tại | `pier:approve` |
| POST | `/api/v1/pier/{id}/reject` | Từ chối (bắt buộc lý do ≥ 10 ký tự) | `pier:approve` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `piers`:** sử dụng `approval_status` (SMALLINT, enum `ApprovalStatus`) có sẵn; bổ sung theo dõi quy trình 2 cấp (theo mẫu `Berth` — SA chốt): 🔴 `submitted_for_approval_at`/`submitted_for_approval_by`, 🔴 `port_authority_approved_at`/`port_authority_approved_by`/`port_authority_approval_content` (vòng 1), 🔴 `department_approved_at`/`department_approved_by`/`department_approval_content` (vòng 2), 🔴 `rejection_reason` (VARCHAR 500).

**Bảng `approval_log` (PheDuyetLog — nhật ký phê duyệt):** id (UUID PK), entityType, entityId (UUID), 🔴 cap (VARCHAR 20 — cấp duyệt), action (enum APPROVE/REJECT), approvedBy (UUID), approvedAt (TIMESTAMP), reason (VARCHAR 500, nullable) — lưu vĩnh viễn, không sửa/xóa.
