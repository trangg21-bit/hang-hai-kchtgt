---
id: F-035
name: Phê duyệt Vùng nước
slug: phe-duyet-vn
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-21
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Phê duyệt Vùng nước

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-035 — Phê duyệt Vùng nước
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng có bước phê duyệt (quy trình 2 cấp theo file chuẩn)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng. Quy trình 2 cấp (trạng thái, vòng duyệt, quyền duyệt theo chức vụ) KHÔNG chép lại ở đây — đọc `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`. (Nội dung merge từ F-035 BE + F-092 UI.)

---

## 1. Mô tả ngắn

Cho phép người duyệt có thẩm quyền (`waterzone:approve`) xử lý hồ sơ Vùng nước đang chờ duyệt trong quy trình phê duyệt 2 cấp (theo file chuẩn): modal 2 tab **Phê duyệt** (checkbox confirm) và **Từ chối** (lý do ≥ 10 ký tự + checkbox). Modal hiển thị SummaryCard thông tin Vùng nước + lịch sử phê duyệt trước đó. Mỗi quyết định tạo bản ghi `approval_log` (bất biến) và ghi lịch sử thay đổi. Hồ sơ bị từ chối quay lại người tạo để sửa (F-033) và gửi lại.

> **⚠️ Ghi chú:** brief merge cũ (theo designer spec) mô tả modal phê duyệt 1 cấp. Theo tài liệu nền mục 3.5, quy trình chuẩn của 5 cluster là **2 cấp** (theo `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`) — tài liệu này tuân theo quy trình chuẩn; **SA chốt** số cấp áp dụng cho Vùng nước.

## 2. Trường dữ liệu

Không có form nhập liệu mới — thao tác trên bản ghi `WaterZone` hiện có + nhật ký phê duyệt.

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | id | Có | UUID | Hồ sơ vùng nước cần xử lý |
| 2 | approvalStatus | Có (hệ thống) | Enum `ApprovalStatus` (7 trạng thái, lưu số theo tài liệu nền mục 3.5) | Trạng thái trong quy trình 2 cấp (tài liệu nền mục 3.5) |
| 3 | reason (lý do từ chối) | Có khi từ chối | TextArea, tối thiểu 10 ký tự, tối đa 500 | Lý do chấp thuận là tùy chọn |
| 4 | approval_log | Có (hệ thống) | Bảng `approval_log` | Người duyệt, cấp, thời gian, quyết định, lý do — bất biến |

## 3. Trạng thái và phê duyệt

- **Toàn bộ quy trình phê duyệt 2 cấp theo `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`** — không mô tả lại tại đây. Bản đồ 7 trạng thái → enum `ApprovalStatus` theo tài liệu nền mục 3.5 (đã chốt — M-1006 DP-9/AC-25).
- Chỉ hồ sơ ở trạng thái chờ duyệt đúng cấp mới được xử lý; duyệt tuần tự, không vượt cấp; từ chối/trả về ở bất kỳ cấp nào dừng quy trình, hồ sơ quay lại người tạo.
- Hồ sơ **Đã duyệt** mới chính thức có hiệu lực và được sử dụng trong khai thác.
- Sau quyết định: cập nhật trạng thái + ghi `approval_log` + ghi lịch sử (F-037). Log không được sửa/xóa.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-035-01 | Chỉ hồ sơ ở trạng thái chờ duyệt đúng cấp mới được phê duyệt/từ chối (theo file chuẩn) | Approve |
| BR-035-02 | Từ chối phải có lý do ≥ 10 ký tự (≤ 500); chấp thuận không cần lý do | Reject |
| BR-035-03 | Mỗi quyết định tạo bản ghi `approval_log` (APPROVE/REJECT) — bất biến, không sửa/xóa | Audit |
| BR-035-04 | Phòng chống thao tác đồng thời: hồ sơ đã được xử lý → toast "đã được phê duyệt/từ chối trước đó" | Approve |
| BR-035-05 | Chống tự duyệt (4-eyes principle): người tạo hồ sơ không tự duyệt hồ sơ của mình (theo file chuẩn) | Approve |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem hồ sơ chờ duyệt + chi tiết | `waterzone:read` |
| Phê duyệt / Từ chối ở cấp được phân quyền | `waterzone:approve` |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Toàn quyền |
| Lãnh đạo (LeDuan) | Phê duyệt / Từ chối |
| Chuyên viên Cục / Cảng vụ | Không phê duyệt |
| Doanh nghiệp cảng | Không phê duyệt |
| Nhân viên vận hành | Không phê duyệt |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — toàn quyền phê duyệt/từ chối + xem người duyệt, thời gian duyệt, lý do từ chối.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — dùng 7 trạng thái chung (tài liệu nền mục 3.5) |
| 2 | Có bước phê duyệt không | Có — phê duyệt theo QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md (2 cấp; SA chốt) |
| 3 | Lọc cha-con / theo đơn vị | Có — theo đơn vị (orgUnitId) + theo Cảng biển mẹ (portId) |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `waterzone:approve` (kèm `waterzone:read`) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/water-zones` với bộ lọc trạng thái chờ duyệt | Danh sách hồ sơ chờ duyệt của cấp hiện tại | `waterzone:approve` |
| GET | `/api/v1/water-zones/{id}` | Chi tiết hồ sơ + lịch sử phê duyệt | `waterzone:read` |
| POST | `/api/v1/water-zones/{id}/approve` | Phê duyệt ở cấp hiện tại | `waterzone:approve` |
| POST | `/api/v1/water-zones/{id}/reject?reason=` | Từ chối (reason ≥ 10 ký tự) | `waterzone:approve` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `water_zones`:** sử dụng `approval_status` (SMALLINT, enum `ApprovalStatus`) có sẵn; bổ sung theo dõi quy trình 2 cấp theo mẫu `Berth` (SA chốt): 🔴 `submitted_for_approval_at`/`submitted_for_approval_by`, 🔴 `port_authority_approved_at`/`port_authority_approved_by`/`port_authority_approval_content` (vòng 1), 🔴 `department_approved_at`/`department_approved_by`/`department_approval_content` (vòng 2), 🔴 `rejection_reason` (VARCHAR 500).

**Bảng `approval_log` (nhật ký phê duyệt):** id (UUID PK), entityType, entityId (UUID), 🔴 cap (cấp duyệt), action (enum APPROVE/REJECT), approvedBy (UUID), approvedAt (TIMESTAMP), reason (VARCHAR 500, nullable) — lưu vĩnh viễn, không sửa/xóa.
