---
id: F-027
name: Quản lý Cảng cạn - Cập nhật
slug: ql-cct-cap-nhat
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-21
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Cảng cạn - Cập nhật

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-027 — Quản lý Cảng cạn - Cập nhật
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng có bước phê duyệt (cập nhật → duyệt lại; bản ghi đã duyệt bắt buộc Lưu và phê duyệt)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung. Form giống hệt F-026 (mục 2) — chỉ khác các điểm nêu dưới đây.

---

## 1. Mô tả ngắn

Cho phép người dùng có thẩm quyền (`dryport:update`) chỉnh sửa thông tin Cảng cạn đã tồn tại; form 4 tab, 25 trường pre-filled từ API. **Mã CC-XXXXXX** và **Đơn vị quản lý** bất biến (read-only/disabled). Hai nút: **Lưu tạm** (giữ trạng thái; **không áp dụng cho bản ghi đã duyệt**) và **Lưu và phê duyệt** (cần `dryport:approve`). Với bản ghi đã duyệt (APPROVED): bắt buộc dùng "Lưu và phê duyệt" để phê duyệt lại — người không có `dryport:approve` không được sửa. Mọi thay đổi ghi vào change history. "Gửi phê duyệt" là hành động trên màn hình Danh sách, không nằm trên form này.

## 2. Trường dữ liệu

Cấu trúc theo entity `DryPort` (bảng `dry_ports`) — danh sách trường giống F-026 (mục 2). Điểm khác biệt:

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | dryPortCode | Có | Text (VARCHAR 50) | **Disabled — bất biến vĩnh viễn**; backend từ chối nếu payload đổi mã |
| 2 | orgUnitId | Có | TreeSelect (UUID) | **Disabled — bất biến vĩnh viễn**; backend từ chối nếu payload đổi đơn vị |
| 3 | Các trường khác của `DryPort` | Không | Theo entity | Cho phép chỉnh sửa (validation giống F-026) |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.5 (7 trạng thái → enum `ApprovalStatus`) và quy trình 2 cấp tại `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`.
- **Lưu tạm:** giữ nguyên trạng thái, form ở lại; không áp dụng cho bản ghi đã duyệt.
- **Lưu và phê duyệt** (cần `dryport:approve`): đầy đủ 6 trường bắt buộc → trạng thái đã duyệt + ghi change history + approval log.
- **Bản ghi đã duyệt (APPROVED):** vẫn mở form cập nhật được, nhưng nút "Lưu tạm" bị ẩn — bắt buộc "Lưu và phê duyệt" để duyệt lại; không có `dryport:approve` thì không được sửa.
- Mọi cập nhật: ghi change history (từng trường thay đổi: old_value → new_value) + thông tin kiểm toán (operatorId, updatedBy, updatedAt).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-027-01 | Mã CC-XXXXXX bất biến vĩnh viễn — sinh khi tạo mới (F-026), không bao giờ sửa; backend từ chối payload đổi mã | Update |
| BR-027-01a | Đơn vị quản lý bất biến vĩnh viễn — gán khi tạo mới, không bao giờ sửa; backend từ chối payload đổi đơn vị | Update |
| BR-027-02 | Lưu tạm giữ nguyên trạng thái; tối thiểu tên cảng cạn | Update (draft) |
| BR-027-03 | Lưu và phê duyệt: đủ 6 trường bắt buộc + `dryport:approve` → trạng thái đã duyệt | Update (approve) |
| BR-027-04 | Bản ghi APPROVED: chỉ "Lưu và phê duyệt" (không có "Lưu tạm"); cần `dryport:approve` để sửa | Update |
| BR-027-05 | Ghi change history cho mọi thay đổi (chỉ ghi trường thực sự thay đổi) | Update |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem cảng cạn (pre-fill) | `dryport:read` |
| Cập nhật Cảng cạn | `dryport:update` |
| Lưu và phê duyệt (bắt buộc với bản ghi APPROVED) | `dryport:update` + `dryport:approve` |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Toàn quyền |
| admin / admin-operation / Cán bộ | Cập nhật theo permission được gán |
| Lãnh đạo | Thường được gán `dryport:approve` (phê duyệt lại) |
| Cá nhân | Không truy cập |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — full quyền + xem metadata người tạo/người sửa/thời gian.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — dùng 7 trạng thái chung; bản ghi APPROVED bắt buộc Lưu và phê duyệt |
| 2 | Có bước phê duyệt không | Có — cập nhật bản ghi đã duyệt phải Lưu và phê duyệt lại |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị (orgUnitId — tài liệu nền mục 3.3) |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — dryPortCode + orgUnitId disabled; "Lưu tạm" ẩn với bản ghi APPROVED; nút "Lưu và phê duyệt" chỉ khi có `dryport:approve` |
| 5 | Quyền riêng | `dryport:update` (kèm `dryport:read`, `dryport:approve`) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không (đính kèm quản lý tại F-026/F-030) |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/dry-ports/{id}` | Pre-fill form | `dryport:read` |
| PUT | `/api/v1/dry-ports/{id}` | Cập nhật (body: action `draft`/`approve` + trường + coordinates[]) | `dryport:update` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `dry_ports`:** cấu trúc giống F-026 (mục 7) — F-027 không thêm trường; dryPortCode/orgUnitId bất biến.

**Bảng `change_history` (nhật ký thay đổi — dùng chung module):** id (UUID PK), entityId (UUID), entityType (NVARCHAR 50 — "DRY_PORT"), actionType (NVARCHAR 20 — CREATE / UPDATE / DELETE), fieldName (NVARCHAR 100), oldValue, newValue, changedBy (UUID), changedAt (TIMESTAMP) — ghi tự động, bất biến.
