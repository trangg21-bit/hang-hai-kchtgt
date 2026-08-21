---
id: F-021
name: Cập nhật Cầu cảng
slug: ql-cc-cap-nhat
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16
last-updated: 2026-08-21
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Cập nhật Cầu cảng

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-021 — Cập nhật Cầu cảng
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng có bước phê duyệt (cập nhật → duyệt lại theo quy trình 2 cấp)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung. Form và trường dữ liệu giống hệt F-020 (mục 2) — chỉ khác các điểm nêu dưới đây.

---

## 1. Mô tả ngắn

Cho phép người dùng có thẩm quyền (`pier:update`) chỉnh sửa thông tin Cầu cảng đã tồn tại; form pre-fill từ API, trường và validation giống Tạo mới (F-020). Các trường bị khóa: **Đơn vị quản lý**, **Thuộc cảng biển**, **Mã cầu cảng** (read-only). File đính kèm: hiển thị danh sách đã upload, cho phép thêm/xóa. Ba action lưu: **Cập nhật** (giữ trạng thái), **Cập nhật và gửi phê duyệt**, **Cập nhật và phê duyệt** (Admin/Lãnh đạo). Sau mỗi cập nhật, trạng thái phê duyệt quay về chờ duyệt — phải duyệt lại; cầu cảng đã duyệt bị sửa sẽ tạm thời không khả dụng ở module khác cho đến khi duyệt lại. Mọi cập nhật ghi change log.

## 2. Trường dữ liệu

Cấu trúc theo entity `Pier` (bảng `piers`) — danh sách trường giống F-020 (mục 2). Điểm khác biệt:

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | orgUnitId | Có | TreeSelect (UUID) | **Disabled — không đổi đơn vị quản lý** |
| 2 | portId | Có | TreeSelect (UUID) | **Disabled — không đổi cảng biển cha** |
| 3 | pierCode | Có | Text | **Disabled — mã bất biến** |
| 4 | Các trường khác của `Pier` | Không | Theo entity | Cho phép chỉnh sửa (validation giống F-020) |
| 5 | attachments[] | Không | File | Hiển thị file đã upload (fileUrl, fileSize, key); thêm/xóa được |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.5 (7 trạng thái → enum `ApprovalStatus`) và quy trình 2 cấp tại `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`.
- Sau khi cập nhật, trạng thái phê duyệt **tự động quay về trạng thái chờ duyệt** — phải duyệt lại từ vòng 1 (F-023). Cầu cảng ở trạng thái đã duyệt bị sửa → tạm thời biến mất khỏi dropdown của module khác cho đến khi duyệt lại.
- "Cập nhật" thường: giữ trạng thái hiện tại (không gửi duyệt); "Cập nhật và gửi phê duyệt": vào quy trình 2 cấp; "Cập nhật và phê duyệt" (Admin/Lãnh đạo): đạt trạng thái đã duyệt ngay.
- Mọi cập nhật: ghi change log (fieldChanged, oldValue, newValue, changedBy, changedAt) + thông tin kiểm toán (operatorId, updatedBy, updatedAt).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-021-01 | Chỉ user thuộc đúng đơn vị quản lý của cầu cảng mới được sửa (backend kiểm tra orgUnitId của user khớp) | Update |
| BR-021-02 | Sửa xong phải duyệt lại: trạng thái quay về chờ duyệt; cầu cảng đã duyệt bị sửa → tạm thời không khả dụng ở module khác | Update |
| BR-021-03 | Ghi nhật ký thay đổi (actionType = CAP_NHAT) cho mọi lần cập nhật | Update |
| BR-021-04 | orgUnitId, portId, pierCode bất biến — disabled trên form, server từ chối nếu payload đổi | Update |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem cầu cảng (pre-fill) | `pier:read` |
| Cập nhật Cầu cảng | `pier:update` |
| Cập nhật và phê duyệt | `pier:update` + `pier:approve` |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Toàn quyền |
| Admin | Cập nhật, Gửi PD, Cập nhật và phê duyệt |
| Quản lý tài sản (cùng đơn vị) | Cập nhật, Gửi PD |
| Lãnh đạo | Cập nhật và phê duyệt |
| Nhân viên vận hành | Xem (không sửa) |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — full quyền + xem metadata người tạo/người sửa/thời gian.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — dùng 7 trạng thái chung; cập nhật reset về trạng thái chờ duyệt |
| 2 | Có bước phê duyệt không | Có — mọi cập nhật phải duyệt lại (trừ action thường không gửi duyệt) |
| 3 | Lọc cha-con / theo đơn vị | Có — theo đơn vị (orgUnitId) + theo Cảng biển → Bến cảng (cha-con) |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — orgUnitId + portId + pierCode disabled (bất biến) |
| 5 | Quyền riêng | `pier:update` (kèm `pier:read`, `pier:approve`) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Có — thêm/xóa file đính kèm của cầu cảng |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/pier/{id}` | Load dữ liệu hiện tại để pre-fill | `pier:read` |
| PUT | `/api/v1/pier/{id}` | Cập nhật (body: action `draft`/`submit`/`approve` + trường + coordinates[]) | `pier:update` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `piers`:** cấu trúc giống F-020 (mục 7) — F-021 không thêm trường; pierCode/portId/orgUnitId bất biến.

**Bảng `change_log` (nhật ký thay đổi — dùng chung module):** id (UUID PK), entityType, entityId (UUID), changeType (UPDATE), changedField, oldValue, newValue, changedBy (UUID), changedAt — ghi tự động mỗi lần cập nhật.
