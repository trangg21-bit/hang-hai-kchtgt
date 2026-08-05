---
id: F-033
name: Quản lý Vùng nước - Cập nhật
slug: ql-vn-cap-nhat
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-04
locked-fields: []
consumed_by_modules: []
merged-from: [F-033-BE, F-091-UI]
---
# Đặc tả nghiệp vụ: Quản lý Vùng nước - Cập nhật

**Tài liệu:** BA Feature Brief (merged BE+UI)
**Feature:** F-033 — Quản lý Vùng nước - Cập nhật
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-04

> Tài liệu merge từ F-033 (BE) + F-091 (UI) + designer spec 04-update.

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Cập nhật thông tin Vùng nước qua modal form pre-populated từ GET API. `maVungNuoc` readonly (bất biến). `trangThaiPheDuyet` hiển thị Badge không sửa được. Mọi thay đổi ghi vào lịch sử tự động. Thay đổi độ sâu kích hoạt phê duyệt lại.

### 1.2. Tại sao cần?

Cập nhật khi có thay đổi điều kiện tự nhiên, mở rộng năng lực. Dữ liệu luôn chính xác, hỗ trợ kiểm toán.

### 1.3. Luồng chính

F-036 → "Chỉnh sửa" → modal mở pre-filled từ `GET /api/v1/vung-nuoc/{id}` → chỉnh sửa → Submit → `PUT /api/v1/vung-nuoc` → toast "Cập nhật thành công" → đóng modal, refresh.

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Phân quyền

| Permission | Mô tả |
|---|---|
| `vungnuoc:update` | Cập nhật Vùng nước |

> Phân quyền do M-001 quản lý.

| Vai trò | Update |
|---|---|
| system-admin | ✅ |
| LeDuan | ✅ |
| Chuyên viên Cục/Cảng vụ | ✅ |
| Doanh nghiệp cảng | ✅ |
| Nhân viên vận hành | ❌ |

### 2.2. Logic Admin Cục

Admin Cục cập nhật không giới hạn đơn vị.

---

## 3. User Stories

### Must
- **US-033-01:** Cập nhật thông tin Vùng nước với dữ liệu cũ pre-filled. (`vungnuoc:update`)
- **US-033-02:** Cảnh báo khi Vùng nước đang CHỜ_PHÊ_DUYỆT trước khi cập nhật.

### Should
- **US-033-03:** Thay đổi độ sâu → tự động phê duyệt lại.

### Could
- **US-033-04:** Cảnh báo unsaved changes khi đóng modal nếu form dirty.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### Nhóm 1: Form

**AC-033-01:** Form pre-populated từ `GET /api/v1/vung-nuoc/{id}`. `maVungNuoc` readonly (gray bg, `aria-readonly="true"`, skip tab order).
**AC-033-02:** `trangThaiPheDuyet` hiển thị Badge readonly.
**AC-033-03:** Các trường editable: tenVungNuoc, cangBienId, dienTich, doSauMax, doSauTrungBinh, loaiVungNuoc, trangThaiHoatDong.

### Nhóm 2: Submit

**AC-033-04:** Submit → `PUT /api/v1/vung-nuoc` (chỉ gửi các trường thay đổi + id) → toast "Cập nhật vùng nước thành công".
**AC-033-05:** Không có thay đổi → toast "Không có thay đổi nào được thực hiện", không gọi API.
**AC-033-06:** `trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT` → cảnh báo nhưng cho phép tiếp tục sau xác nhận.

### Nhóm 3: Chặn

**AC-033-07:** `deletedAt != null` → chặn cập nhật, toast "Vùng nước đã bị xóa, không thể cập nhật".
**AC-033-08:** 404 → "Không tìm thấy vùng nước để cập nhật" + back.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng cho | Nguồn | Ngoại lệ |
|---|---|---|---|---|
| BR-033-01 | `maVungNuoc` bất biến sau khi tạo | PUT | Entity | Không |
| BR-033-02 | Chỉ Vùng nước CHỜ_PHÊ_DUYỆT, TỪ_CHỐI, hoặc HIỆN_HÀNH mới được cập nhật | PUT | State machine | Không |
| BR-033-03 | Thay đổi `doSau` → kích hoạt phê duyệt lại | PUT | Business | Không |
| BR-033-04 | `deletedAt != null` → không được cập nhật | PUT | Soft-delete | Không |
| BR-033-05 | Mọi cập nhật ghi LichSuThayDoi tự động | PUT | Audit | Không |

---

## 6. Mô hình dữ liệu

> Kế thừa F-036 Section 6. Các trường editable khi cập nhật:

| # | Tên trường | Kiểu | Edit | Status |
|---|---|---|---|---|
| 1 | id | UUID | ❌ (internal) | ✅ |
| 2 | ma_vung_nuoc | NVARCHAR(50) | ❌ (readonly) | ✅ |
| 3 | ten_vung_nuoc | NVARCHAR(255) | ✅ | ✅ |
| 4 | cang_bien_id | UUID | ✅ | ✅ |
| 5 | dien_tich | DECIMAL(15,2) | ✅ | ✅ |
| 6 | do_sau_max | DECIMAL(10,2) | ✅ | ✅ |
| 7 | do_sau_trung_binh | DECIMAL(10,2) | ✅ | ✅ |
| 8 | loai_vung_nuoc | NVARCHAR(100) | ✅ | ✅ |
| 9 | trang_thai_hoat_dong | NVARCHAR(50) | ✅ | ✅ |
| 10 | trang_thai_phe_duyet | NVARCHAR(50) | ❌ (badge) | ✅ |

---

## 7. API Endpoints

| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/vung-nuoc/{id}` | Pre-populate form | `vungnuoc:update` |
| PUT | `/api/v1/vung-nuoc` | Cập nhật (partial) | `vungnuoc:update` |

---

## 8. Chi tiết nghiệp vụ

### 8.1. Mở form

F-036 → "Chỉnh sửa" → `GET /api/v1/vung-nuoc/{id}` → pre-fill toàn bộ trường. `maVungNuoc` readonly, gray bg, skip tab. `trangThaiPheDuyet` Badge readonly. Layout giống form Tạo mới.

### 8.2. Submit

Zod validate → chỉ gửi các trường thay đổi + id → `PUT /api/v1/vung-nuoc`. Backend ghi LichSuThayDoi. Nếu không có trường nào thay đổi → toast "Không có thay đổi nào", không gọi API.

### 8.3. Cảnh báo

Nếu `trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT` → hiển thị warning "Vùng nước đang trong quá trình phê duyệt" trước khi cho phép chỉnh sửa. Unsaved changes → confirm khi đóng modal.

---

## 9. Yêu cầu phi chức năng

- Modal max-width 600px
- Change tracking: cảnh báo unsaved changes
- Toast "Cập nhật vùng nước thành công"

---

## 10. Yêu cầu giao diện

> Token: `theme.ts` + `tokens.ts`.

### 10.1. Form fields (giống Create, khác biệt được đánh dấu)

| STT | Trường | Loại | Edit | Bắt buộc | Default | Mô tả |
|---|---|---|---|---|---|---|
| 1 | Mã vùng nước | Input (readonly) | ❌ | Có | Pre-filled | Gray bg, skip tab |
| 2 | Tên vùng nước | Input text | ✅ | Không | Pre-filled | |
| 3 | Cảng biển chủ | Select | ✅ | Không | Pre-filled | |
| 4 | Loại vùng nước | Input text | ✅ | Không | Pre-filled | |
| 5 | Diện tích | Input number | ✅ | Không | Pre-filled | |
| 6 | Độ sâu tối đa | Input number | ✅ | Không | Pre-filled | |
| 7 | Độ sâu TB | Input number | ✅ | Không | Pre-filled | |
| 8 | Trạng thái HĐ | Select | ✅ | Không | Pre-filled | |
| 9 | Trạng thái phê duyệt | Badge (readonly) | ❌ | — | Pre-filled | Không editable |

### 10.2. Zod Schema

```typescript
const schema = z.object({
  id: z.string().uuid(),
  tenVungNuoc: z.string().max(255).optional().or(z.literal("")),
  cangBienId: z.string().uuid().optional(),
  dienTich: z.coerce.number().optional(),
  doSauMax: z.coerce.number().optional(),
  doSauTrungBinh: z.coerce.number().optional(),
  loaiVungNuoc: z.string().max(100).optional().or(z.literal("")),
  trangThaiHoatDong: z.enum(["HIỆN_HÀNH", "TẠM_NGƯNG"]).optional(),
});
```

### 10.3. UX

- `marginBottom: spaceFormField`, `borderRadius: radiusPill`, `height: 40`
- Readonly fields: gray bg, `aria-readonly="true"`
- Unsaved-changes warning on unload

---

## 11. Xử lý lỗi

| Tình huống | Xử lý |
|---|---|
| 404 | "Không tìm thấy vùng nước để cập nhật" + back |
| 422 | Map BE errors → inline fields |
| No changes | Toast "Không có thay đổi nào được thực hiện" |
| Đã xóa mềm | Toast "Vùng nước đã bị xóa, không thể cập nhật" |

## Testing Strategy

Unit: Form validation, immutable maVungNuoc. Integration: PUT API partial data. E2E: Mở modal, sửa field, submit, toast + refresh.

---

## Implementation Status

| Layer | Status |
|---|---|
| Backend | Done |
| Frontend | Pending |
