---
id: F-034
name: Quản lý Vùng nước - Xóa
slug: ql-vn-xoa
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-04
locked-fields: []
consumed_by_modules: []
merged-from: [F-034-BE, F-101-UI]
---
# Đặc tả nghiệp vụ: Quản lý Vùng nước - Xóa

**Tài liệu:** BA Feature Brief (merged BE+UI)
**Feature:** F-034 — Quản lý Vùng nước - Xóa
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-04

> Tài liệu merge từ F-034 (BE) + F-101 (UI) + designer spec 06-delete.

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Xóa mềm (soft-delete) Vùng nước qua modal xác nhận với checkbox confirm. **Chỉ Vùng nước đã được phê duyệt (`ĐƯỢC_PHÊ_DUYỆT`) mới có thể xóa.** VungNuoc là leaf entity — **không cần child guard check**. Sau khi xóa: `deletedAt = now()`, ẩn khỏi danh sách mặc định, dữ liệu vẫn lưu trữ để truy xuất.

### 1.2. Tại sao cần?

Loại bỏ Vùng nước không còn hoạt động khỏi danh sách khai thác. Soft-delete đảm bảo dữ liệu không mất vĩnh viễn, hỗ trợ kiểm toán và khôi phục.

### 1.3. Luồng chính

F-036 → "Xóa" → hệ thống kiểm tra `trangThaiPheDuyet = ĐƯỢC_PHÊ_DUYỆT` → nếu không đạt, toast "Chỉ xóa được Vùng nước đã được phê duyệt" → nếu đạt, modal xác nhận (info + warning amber + checkbox) → check confirm → `DELETE /api/v1/vung-nuoc/{id}` → soft-delete → toast "Xóa thành công" → refresh.

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Phân quyền

| Permission | Mô tả |
|---|---|
| `vungnuoc:delete` | Xóa Vùng nước |

> Phân quyền do M-001 quản lý.

| Vai trò | Delete |
|---|---|
| system-admin | ✅ |
| LeDuan | ✅ |
| Chuyên viên Cục/Cảng vụ | ❌ |
| Doanh nghiệp cảng | ❌ |
| Nhân viên vận hành | ❌ |

### 2.2. Logic Admin Cục

Admin Cục toàn quyền xóa.

---

## 3. User Stories

### Must
- **US-034-01:** Xóa Vùng nước không còn sử dụng với xác nhận an toàn. (`vungnuoc:delete`)
- **US-034-02:** Dữ liệu đã xóa vẫn lưu trữ để truy xuất (soft-delete).

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### Nhóm 1: Hiển thị

**AC-034-01:** Nút "Xóa" chỉ hiển thị cho system-admin và LeDuan, và chỉ khi `trangThaiPheDuyet = ĐƯỢC_PHÊ_DUYỆT`.
**AC-034-02:** Modal: maVungNuoc, tenVungNuoc, tenCang, createdBy, createdAt + warning amber "Dữ liệu sẽ được ẩn nhưng vẫn lưu trữ" + checkbox "Tôi xác nhận muốn xóa vùng nước này".

### Nhóm 2: Pre-check

**AC-034-03:** Click "Xóa" → backend kiểm tra `trangThaiPheDuyet`. Nếu không phải `ĐƯỢC_PHÊ_DUYỆT` → HTTP 409 + toast "Chỉ có thể xóa Vùng nước đã được phê duyệt". Nếu `ĐƯỢC_PHÊ_DUYỆT` → mở modal xác nhận.
**AC-034-04:** Không child guard check — VungNuoc leaf entity.

### Nhóm 3: Xác nhận & Xóa

**AC-034-05:** Checkbox chưa check → nút "Xác nhận xóa" disabled.
**AC-034-06:** Check → enable → click → `DELETE /api/v1/vung-nuoc/{id}` → `deletedAt = now()` → toast "Xóa thành công" → refresh.
**AC-034-07:** Đã xóa → không hiển thị trong danh sách, không cho phép xóa lại.

### Nhóm 4: Hủy

**AC-034-08:** Hủy/Esc → đóng modal, không gọi API.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng cho | Nguồn | Ngoại lệ |
|---|---|---|---|---|
| BR-034-01 | Soft-delete: `deletedAt = now()`, không xóa vật lý | DELETE | Soft-delete | Không |
| BR-034-02 | Không child guard — VungNuoc leaf entity | DELETE | Entity model | Không |
| BR-034-03 | Chỉ system-admin và LeDuan được xóa | DELETE | RBAC | Không |
| BR-034-04 | Chỉ Vùng nước `ĐƯỢC_PHÊ_DUYỆT` mới được xóa | DELETE | State machine | Không |
| BR-034-05 | `deletedAt != null` → không hiển thị, không xóa lại | List, DELETE | Soft-delete | Không |

---

## 6. Mô hình dữ liệu

> Liên quan đến xóa:

| # | Tên trường | Kiểu | Status |
|---|---|---|---|
| 1 | id | UUID | ✅ |
| 2 | ma_vung_nuoc | NVARCHAR(50) | ✅ |
| 3 | ten_vung_nuoc | NVARCHAR(255) | ✅ |
| 4 | trang_thai_phe_duyet | NVARCHAR(50) | ✅ |
| 5 | deleted_at | TIMESTAMP (nullable) | ✅ |

---

## 7. API Endpoints

| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/vung-nuoc/{id}` | Pre-check trạng thái phê duyệt trước khi xóa | `vungnuoc:delete` |
| DELETE | `/api/v1/vung-nuoc/{id}` | Soft-delete | `vungnuoc:delete` |

---

## 8. Chi tiết nghiệp vụ

### 8.1. Pre-check

F-036 → "Xóa" → `GET /api/v1/vung-nuoc/{id}` kiểm tra `trangThaiPheDuyet`. Nếu ≠ `ĐƯỢC_PHÊ_DUYỆT` → 409 + toast. Nếu OK → mở modal.

### 8.2. Modal xác nhận

Modal `role="alertdialog"`, max-width 480px. Hiển thị: mã, tên, cảng, người tạo, ngày tạo. Warning amber callout. Checkbox confirm.

### 8.3. Xác nhận & Xóa

Checkbox "Tôi xác nhận muốn xóa vùng nước này" → enable nút [Xác nhận xóa] (màu đỏ). Click → `DELETE /api/v1/vung-nuoc/{id}` → backend set `deletedAt = now()` → 200 → toast → refresh.

### 8.4. Hủy

Cancel/Esc → đóng modal, không thay đổi.

---

## 9. Yêu cầu phi chức năng

- Modal `role="alertdialog"`, focus trap, Esc đóng
- Screen reader: warning `aria-live="assertive"`
- Nút Delete màu `statusDanger`, disabled đến khi checkbox checked

---

## 10. Yêu cầu giao diện

> Token: `theme.ts` + `tokens.ts`.

### 10.1. Layout

```
VungNuocDeleteModal (role="alertdialog", max-width 480px)
├── Header: "Xác nhận xóa" + icon 🗑
├── Info: Mã, Tên, Cảng, Người tạo, Ngày tạo
├── WarningCallout (amber): "Dữ liệu sẽ được ẩn... vẫn được lưu trữ."
├── Checkbox: "Tôi xác nhận muốn xóa vùng nước này"
└── Footer: [Hủy] outlined + [Xác nhận xóa] danger (disabled)
```

### 10.2. Zod Schema

```typescript
const deleteSchema = z.object({
  confirmed: z.boolean().refine(val => val === true, {
    message: "Bạn cần xác nhận để xóa",
  }),
});
```

### 10.3. UX

- `borderRadius: radiusPill`, `height: 40` cho nút
- Nút Delete màu `statusDanger`, disabled mặc định
- Toast "Xóa vùng nước thành công"

---

## 11. Xử lý lỗi

| Tình huống | Xử lý |
|---|---|
| 403 | "Bạn không có quyền xóa vùng nước này" |
| 404 | "Không tìm thấy vùng nước để xóa" |
| 409 (chưa phê duyệt) | "Chỉ có thể xóa Vùng nước đã được phê duyệt" |
| 409 (đã xóa) | "Vùng nước này đã bị xóa trước đó" |
| Network error | Toast "Kết nối thất bại. Vui lòng thử lại" |

## Testing Strategy

Unit: Soft-delete logic, pre-check state machine. Integration: DELETE API, verify deletedAt, verify 409 when not APPROVED. E2E: Modal, checkbox enable/disable, xóa thành công, refresh, chặn xóa khi chưa duyệt.

---

## Implementation Status

| Layer | Status |
|---|---|
| Backend | Done |
| Frontend | Pending |
