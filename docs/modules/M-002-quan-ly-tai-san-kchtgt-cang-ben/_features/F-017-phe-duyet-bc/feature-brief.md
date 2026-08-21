---
id: F-017
name: Phê duyệt Bến cảng
slug: phe-duyet-bc
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:42Z
last-updated: 2026-08-21
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Phê duyệt Bến cảng

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-017 — Phê duyệt Bến cảng
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng có bước phê duyệt (quy trình 2 cấp theo file chuẩn)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng. Quy trình 2 cấp (trạng thái, vòng duyệt, quyền duyệt theo chức vụ) KHÔNG chép lại ở đây — đọc `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`.

---

## 1. Mô tả ngắn

Cho phép người duyệt có thẩm quyền (`berth:approve`) xử lý hồ sơ Bến cảng theo **quy trình 2 cấp**: vòng 1 — lãnh đạo Cảng vụ/Chi cục duyệt (chuyển sang chờ Cục); vòng 2 — lãnh đạo Cục duyệt (quyết định cuối, hồ sơ chính thức có hiệu lực). Mỗi cấp có thể **chấp thuận** hoặc **từ chối/trả về** (lý do bắt buộc, tối thiểu 10 ký tự khi từ chối). Mỗi quyết định ghi **PheDuyetLog** có trường `cap` (cấp duyệt) — lưu vĩnh viễn, không sửa/xóa. Màn hình hiển thị danh sách hồ sơ chờ duyệt đúng cấp của người dùng. Ngoài ra, admin-operation / system-admin có thể phê duyệt nhanh cả 2 cấp qua nút "Lưu và phê duyệt" (F-014/F-015).

## 2. Trường dữ liệu

Không có form nhập liệu mới — thao tác trên bản ghi `Berth` hiện có + nhật ký phê duyệt.

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | id | Có | UUID | Hồ sơ bến cần xử lý |
| 2 | approvalStatus | Có (hệ thống) | Enum `ApprovalStatus` (lưu số 0..6) | Trạng thái trong quy trình 2 cấp (tài liệu nền mục 3.5) |
| 3 | reason (lý do từ chối) | Có khi từ chối | TextArea, tối thiểu 10 ký tự | Lý do chấp thuận là tùy chọn |
| 4 | cap (cấp duyệt) | Có | Enum: CANG_VU / CUC | Phân biệt vòng 1 / vòng 2 trong PheDuyetLog |
| 5 | PheDuyetLog | Có (hệ thống) | Bảng `approval_log` | Người duyệt, cấp, thời gian, quyết định, lý do — lưu vĩnh viễn |

## 3. Trạng thái và phê duyệt

- **Toàn bộ quy trình phê duyệt 2 cấp theo `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`** — không mô tả lại tại đây. Bản đồ 7 trạng thái → enum `ApprovalStatus` theo tài liệu nền mục 3.5 (BA đề xuất, SA chốt).
- Duyệt **tuần tự, không vượt cấp**: vòng 1 (Cảng vụ/Chi cục) trước → chờ Cục → vòng 2 (Cục). Từ chối/trả về ở bất kỳ cấp nào sẽ dừng quy trình, hồ sơ quay lại người nhập (theo file chuẩn).
- Trạng thái hiển thị: danh sách chờ duyệt theo cấp của người dùng; hồ sơ **Đã duyệt** mới chính thức có hiệu lực và vào báo cáo.
- Sau quyết định: cập nhật trạng thái + ghi PheDuyetLog + thông báo cho người tạo. Log không được sửa/xóa.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-017-01 | Duyệt tuần tự 2 cấp, không vượt cấp: vòng 1 (Cảng vụ/Chi cục) → vòng 2 (Cục) | Approve |
| BR-017-02 | Từ chối/trả về ở bất kỳ cấp nào dừng quy trình; muốn duyệt lại → cập nhật (F-015) → gửi lại | Reject |
| BR-017-03 | Lý do từ chối ≥ 10 ký tự, bắt buộc; không cho bỏ trống | Reject |
| BR-017-04 | PheDuyetLog có trường `cap` (CANG_VU / CUC) — bất biến sau khi ghi | Audit |
| BR-017-05 | Phân quyền theo cấp: Cảng vụ/Chi cục chỉ duyệt cấp mình; Cục chỉ duyệt cấp mình; Admin Cục / admin-operation duyệt được cả 2 cấp | RBAC |
| BR-017-06 | Chống tự duyệt (4-eyes principle): người tạo hồ sơ không tự duyệt hồ sơ của mình (theo file chuẩn) | Approve |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem hồ sơ chờ duyệt + chi tiết | `berth:read` |
| Chấp thuận / Từ chối ở cấp được phân quyền | `berth:approve` |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Toàn quyền (cả 2 cấp) |
| admin-operation | Duyệt cả 2 cấp |
| Lãnh đạo (cấp Cục) | Duyệt vòng 2 (Cục) |
| Cán bộ Cảng vụ / Chi cục | Duyệt vòng 1 (Cảng vụ/Chi cục) |
| admin / Chuyên viên / Lãnh đạo đơn vị | Không có quyền phê duyệt |
| Cá nhân | Không |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — xem toàn bộ bến mọi cấp + người phê duyệt từng cấp, thời gian phê duyệt từng cấp, lý do từ chối đầy đủ.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — dùng 7 trạng thái chung (tài liệu nền mục 3.5) |
| 2 | Có bước phê duyệt không | Có — phê duyệt 2 cấp theo QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md |
| 3 | Lọc cha-con / theo đơn vị | Có — theo đơn vị (orgUnitId) + lọc theo Cảng biển mẹ (portId) |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `berth:approve` (kèm `berth:read`) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/berths` với bộ lọc trạng thái chờ duyệt theo cấp | Danh sách hồ sơ chờ duyệt của cấp hiện tại | `berth:approve` |
| GET | `/api/v1/berths/{id}` | Chi tiết hồ sơ kèm lịch sử phê duyệt | `berth:read` |
| POST | `/api/v1/berths/{id}/approve` | Chấp thuận ở cấp hiện tại (body: `cap`) — chuyển cấp tiếp theo hoặc Đã duyệt | `berth:approve` |
| POST | `/api/v1/berths/{id}/reject` | Từ chối / trả về (body: `cap` + `lyDo` ≥ 10 ký tự) | `berth:approve` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `berths`:** sử dụng `approval_status` (SMALLINT, enum `ApprovalStatus`) + các cột theo dõi 2 cấp có sẵn trong entity `Berth`: `submitted_for_approval_at`/`submitted_for_approval_by`, `port_authority_approved_at`/`port_authority_approved_by`/`port_authority_approval_content` (vòng 1), `department_approved_at`/`department_approved_by`/`department_approval_content` (vòng 2), `rejection_reason` (VARCHAR 500).

**Bảng `approval_log` (PheDuyetLog — nhật ký phê duyệt):** id (UUID PK), entityType, entityId (UUID), 🔴 cap (VARCHAR 20, NOT NULL — CANG_VU / CUC), action (enum APPROVE/REJECT), approvedBy (UUID), approvedAt (TIMESTAMP), reason (VARCHAR 500, nullable) — lưu vĩnh viễn, không sửa/xóa.
