---
id: F-029
name: Phê duyệt Cảng cạn
slug: phe-duyet-cct
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-21
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Phê duyệt Cảng cạn

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-029 — Phê duyệt Cảng cạn
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng có bước phê duyệt (quy trình 2 cấp theo file chuẩn)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng. Quy trình 2 cấp (trạng thái, vòng duyệt, quyền duyệt theo chức vụ) KHÔNG chép lại ở đây — đọc `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`.

---

## 1. Mô tả ngắn

Cho phép người có thẩm quyền (`dryport:approve`) thực hiện **Phê duyệt** hoặc **Từ chối** đối với Cảng cạn đang ở trạng thái chờ duyệt trong quy trình 2 cấp (theo file chuẩn). Thao tác thực hiện từ danh sách (F-030) hoặc màn hình phê duyệt: dòng có trạng thái chờ duyệt hiển thị nút **Phê duyệt** / **Từ chối**. Sau khi phê duyệt, Cảng cạn chuyển trạng thái Đã duyệt và có thể đưa vào sử dụng; bị từ chối → quay lại người tạo sửa và gửi lại (F-027). Mọi quyết định ghi vào `approval_logs` (bất biến) và ghi nhận lịch sử.

## 2. Trường dữ liệu

Không có form nhập liệu mới — thao tác trên bản ghi `DryPort` hiện có + nhật ký phê duyệt.

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | id | Có | UUID | Hồ sơ cảng cạn cần xử lý |
| 2 | approvalStatus | Có (hệ thống) | Enum `ApprovalStatus` (7 trạng thái, lưu số theo tài liệu nền mục 3.5) | Trạng thái trong quy trình 2 cấp (tài liệu nền mục 3.5) |
| 3 | reason (lý do từ chối) | Có khi từ chối | Text, tối thiểu 10 ký tự | Lý do chấp thuận là tùy chọn |
| 4 | approval_logs | Có (hệ thống) | Bảng `approval_logs` | Người duyệt, thời điểm, hành động, lý do — bất biến |

## 3. Trạng thái và phê duyệt

- **Toàn bộ quy trình phê duyệt 2 cấp theo `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`** — không mô tả lại tại đây. Bản đồ 7 trạng thái → enum `ApprovalStatus` theo tài liệu nền mục 3.5 (đã chốt — M-1006 DP-9/AC-25).
- Chỉ hồ sơ ở trạng thái chờ duyệt đúng cấp mới được xử lý; duyệt tuần tự, không vượt cấp; từ chối/trả về ở bất kỳ cấp nào dừng quy trình, hồ sơ quay lại người tạo.
- APPROVED / REJECTED_LEVEL1 / REJECTED_LEVEL2 không duyệt lại lần nữa — muốn thay đổi phải qua F-027 (Lưu và phê duyệt).
- Sau quyết định: cập nhật trạng thái + ghi `approval_logs` + ghi lịch sử (F-031). Log không được sửa/xóa.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-029-01 | Chỉ hồ sơ ở trạng thái chờ duyệt đúng cấp mới được phê duyệt/từ chối (theo file chuẩn) | Approve |
| BR-029-02 | Phê duyệt → trạng thái Đã duyệt; ghi người duyệt + thời điểm vào `approval_logs` | Approve |
| BR-029-03 | Từ chối phải có lý do ≥ 10 ký tự; trạng thái chuyển Từ chối | Reject |
| BR-029-04 | APPROVED và REJECTED_LEVEL1/REJECTED_LEVEL2 không duyệt/từ chối lại — thay đổi phải qua F-027 | Approve |
| BR-029-05 | Cần `dryport:approve` để thấy và thực hiện nút Phê duyệt / Từ chối | RBAC |
| BR-029-06 | Mọi thao tác ghi vào `approval_logs` để kiểm toán | Audit |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem hồ sơ chờ duyệt + chi tiết | `dryport:read` |
| Phê duyệt / Từ chối ở cấp được phân quyền | `dryport:approve` |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Toàn quyền |
| Lãnh đạo | Thường được gán `dryport:approve` — vai trò chính thực hiện duyệt |
| admin / admin-operation | Theo `dryport:approve` được gán |
| Cán bộ | Tạo + gửi duyệt (không duyệt) |
| Cá nhân | Không truy cập |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — xem full dữ liệu + phê duyệt/từ chối mọi đơn vị + xem người duyệt trong `approval_logs`.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — dùng 7 trạng thái chung (tài liệu nền mục 3.5) |
| 2 | Có bước phê duyệt không | Có — phê duyệt 2 cấp theo QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị (orgUnitId — tài liệu nền mục 3.3) |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `dryport:approve` (kèm `dryport:read`) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/dry-ports` với bộ lọc trạng thái chờ duyệt | Danh sách hồ sơ chờ duyệt của cấp hiện tại | `dryport:approve` |
| GET | `/api/v1/dry-ports/{id}` | Chi tiết hồ sơ | `dryport:read` |
| POST | `/api/v1/dry-ports/{id}/approve` | Phê duyệt ở cấp hiện tại | `dryport:approve` |
| POST | `/api/v1/dry-ports/{id}/reject?reason=` | Từ chối (reason ≥ 10 ký tự) | `dryport:approve` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `dry_ports`:** sử dụng `approval_status` (SMALLINT, enum `ApprovalStatus`) có sẵn; bổ sung theo dõi quy trình 2 cấp theo mẫu `Berth` (SA chốt): 🔴 `submitted_for_approval_at`/`submitted_for_approval_by`, 🔴 `port_authority_approved_at`/`port_authority_approved_by`/`port_authority_approval_content` (vòng 1), 🔴 `department_approved_at`/`department_approved_by`/`department_approval_content` (vòng 2), 🔴 `rejection_reason` (VARCHAR 500).

**Bảng `approval_logs` (nhật ký phê duyệt):** id (UUID PK), entityId (UUID), entityType (NVARCHAR 50 — "DRY_PORT"), 🔴 cap (cấp duyệt), action (NVARCHAR 20 — APPROVE / REJECT), approvedBy (UUID), approvedAt (TIMESTAMP), reason (NVARCHAR 500, nullable) — ghi tự động, bất biến.
