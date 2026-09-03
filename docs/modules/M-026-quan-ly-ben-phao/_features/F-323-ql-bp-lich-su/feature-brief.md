---
id: F-323
name: "Quản lý Bến phao - Lịch sử"
slug: ql-bp-lich-su
module-id: M-026
status: proposed
classification: local
priority: medium
created: "2026-08-28"
last-updated: "2026-08-28"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý Bến phao - Lịch sử

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-323
**Module:** M-026 — Quản lý Bến phao
**Loại:** chức năng thường (không có bước phê duyệt)
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (bắt buộc đọc trước) + `docs/conventions/infrastructure-feature-standard-architecture.md` mục 4.8 + tài liệu yêu cầu gốc (TKCT)

> **Trước khi viết:** đọc tài liệu nền của module (`ba/00-lean-spec.md`) để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):** lịch sử chỉ truy vấn được trên hồ sơ trong phạm vi đơn vị user (DataScope); không ngoại lệ. Khai báo đầy đủ ở mục 5, dòng 3 — SA chốt khi duyệt.

---

## 1. Mô tả ngắn

Người dùng xem lịch sử của hồ sơ bến phao từ 2 nơi: (A) **tab "Phê duyệt" và tab "Thay đổi"** trong drawer chi tiết (tiến trình 2 cấp: người tạo/ngày tạo, người gửi/ngày gửi, Cảng vụ duyệt C1 + ngày, Cục duyệt C2 + ngày, lý do từ chối nếu có); (B) **nút "Lịch sử"** trong menu thao tác trên dòng (`rowActions`) mở drawer lịch sử biến động dữ liệu chi tiết (tìm kiếm từ khóa + lọc khoảng ngày, lưới 2 cột metadata + nội dung thay đổi). Nguồn dữ liệu: approval-audit columns trên chính bảng `buoy_berths` (bảng `change_logs`/`approval_logs` đã bị drop — drift c.8).

## 2. Trường dữ liệu

| Khu vực | Trường hiển thị |
|---|---|
| Tab "Phê duyệt" (trong drawer chi tiết) | Người tạo + ngày tạo · Người gửi duyệt + ngày gửi · Cảng vụ/Chi cục duyệt C1 + ngày (+ nội dung) · Cục duyệt C2 + ngày (+ nội dung) · Lý do từ chối nếu có |
| Tab "Thay đổi" | Nhật ký thay đổi dữ liệu (bản cũ vs bản mới) — hiện trống do bảng history đã drop (drift c.8) |
| Drawer "Lịch sử" từ rowActions | Cột trái: thời gian `HH:mm DD/MM/YYYY` + badge hành động + người cập nhật (fullName) + đơn vị quản lý; cột phải: chi tiết thay đổi từng trường (tên trường, giá trị cũ → mới); bộ lọc từ khóa + khoảng ngày |

## 3. Trạng thái và phê duyệt

- Trạng thái lưu dạng số, theo tài liệu nền mục 3.7.
- **Không có bước phê duyệt** — chức năng chỉ đọc lịch sử; tiến trình phê duyệt được phản ánh qua approval-audit columns (submitted, C1, C2, rejection) theo quy trình F-321.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-323-01 | Tab "Phê duyệt" + "Thay đổi" trong drawer chi tiết BẮT BUỘC ẩn khi đang tạo mới (`drawerMode === 'create'`), chỉ hiện ở chế độ xem/sửa | Read |
| BR-323-02 | Lịch sử chỉ xem được hồ sơ trong DataScope của user | Read |
| BR-323-03 | Nguồn dữ liệu chuẩn: approval-audit columns trên `buoy_berths` (submitted/portAuthority/department/rejection); KHÔNG truy vấn `change_logs`/`approval_logs` (đã drop — drift c.8); hiển thị trạng thái "chưa có dữ liệu" thay vì crash khi rỗng | Read |
| BR-323-04 | Hiển thị người thực hiện bằng Họ và tên (fullName), không hiển thị email/UUID; thời gian định dạng `DD/MM/YYYY HH:mm:ss` | Read |
| BR-323-05 | Drawer lịch sử biến động: lưới 2 cột `minmax(310px, 0.38fr) minmax(0, 1fr)`, bộ lọc từ khóa + khoảng ngày; badge hành động pill theo loại (create/update/delete/approve/reject) | Read |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-323-01 — Tab ẩn khi tạo:** Mở drawer "Thêm mới" → không có tab "Phê duyệt"/"Lịch sử"; mở chi tiết/sửa → có đủ.
- **AC-323-02 — Tiến trình đầy đủ:** Hồ sơ APPROVED hiển thị đủ 5 mốc: tạo, gửi, C1 (+nội dung), C2 (+nội dung); hồ sơ bị từ chối hiển thị lý do.
- **AC-323-03 — Không crash khi rỗng:** Hồ sơ không có dữ liệu history → drawer hiển thị trạng thái trống, không lỗi.

### 4.3. User Stories kế thừa (nếu có)

- **US-323-01:** Là cán bộ Cảng vụ, tôi muốn xem ai đã duyệt và nội dung phê duyệt để truy vết trách nhiệm.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem lịch sử phê duyệt (tab + drawer) | `buoyberth:history` |
| Xem chi tiết hồ sơ (chứa tab lịch sử) | `buoyberth:read` |

**Admin Cục:** full quyền `buoyberth:*` + xem thêm metadata (người tạo, người sửa cuối, thời gian tạo/cập nhật) — theo tài liệu nền mục 3.7/3.8, không có quyền riêng ngoài seed. **10 quyền `buoyberth:*` ĐÃ SEED — không seed lại.**

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không có — hiển thị tiến trình theo 7 trạng thái chuẩn |
| 2 | Có bước phê duyệt không | Không — chỉ đọc lịch sử |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — lịch sử chỉ truy vấn hồ sơ trong DataScope |
| 4 | Trường chỉ hiện trong điều kiện nào | Tab lịch sử ẩn khi `drawerMode === 'create'`; nút "Lịch sử" trên dòng luôn hiện (có `buoyberth:history`) |
| 5 | Quyền riêng | `buoyberth:history` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Không — theo mẫu chung mục 4.8 (drawer lịch sử 2 cột + tab Phê duyệt cuối drawer form); **điểm đặc thù**: nguồn dữ liệu là approval-audit columns trên chính bảng (history tables đã drop — drift c.8) |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/buoy-berth/{id}/history` | Lịch sử 1 hồ sơ (hiện trả `currentApprovalStatus` + mảng rỗng — drift c.8) | `buoyberth:history` |
| GET | `/api/v1/buoy-berth/history/all` | Lịch sử toàn module | `buoyberth:history` |
| GET | `/api/v1/buoy-berth/{id}` | Nạp approval-audit columns cho tab "Phê duyệt" | `buoyberth:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `buoy_berths` — approval-audit columns (nguồn lịch sử hiện tại):** `submitted_for_approval_at/by`, `port_authority_approved_at/by`, `port_authority_approval_content`, `department_approved_at/by`, `department_approval_content`, `rejection_reason` (+ `created_by`/`created_at`, `updated_by`/`updated_at` từ BaseEntity). ~~`change_logs`/`approval_logs`~~ (bảng đã drop — drift c.8; nếu SA quyết định khôi phục lịch sử chi tiết thì ghi ngoài phạm vi brief này, cần migration mới).
