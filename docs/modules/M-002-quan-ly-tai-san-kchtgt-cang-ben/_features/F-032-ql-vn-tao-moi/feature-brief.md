---
id: F-032
name: Quản lý Vùng nước - Tạo mới
slug: ql-vn-tao-moi
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-04
locked-fields: []
consumed_by_modules: []
merged-from: [F-032-BE, F-090-UI]
---
# Đặc tả nghiệp vụ: Quản lý Vùng nước - Tạo mới

**Tài liệu:** BA Feature Brief (merged BE+UI)
**Feature:** F-032 — Quản lý Vùng nước - Tạo mới
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-04

> Tài liệu merge từ F-032 (BE) + F-090 (UI) + designer spec 03-create.

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Tạo mới Vùng nước qua modal form với Zod validation, kiểm tra unique mã real-time. Form gồm 3 nhóm: **Thông tin chung** (4 trường), **Thống kê** (3 trường), **Trạng thái** (1 trường). Có thể để trống `maVungNuoc` — hệ thống tự sinh mã. Sau khi tạo, trạng thái mặc định `CHỜ_PHÊ_DUYỆT`.

### 1.2. Tại sao cần?

Chuẩn hóa đăng ký Vùng nước mới, phục vụ quản lý hạ tầng cảng biển và phân vùng khai thác. Dữ liệu đầy đủ trước khi vào quy trình phê duyệt.

### 1.3. Luồng chính

F-036 → "Thêm mới" → modal mở → điền form (có thể bỏ trống `maVungNuoc` để hệ thống tự sinh, unique check on blur nếu có nhập) → Submit → `POST /api/v1/vung-nuoc` → toast "Tạo mới thành công — chờ phê duyệt" → đóng modal, refresh danh sách.

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Phân quyền

| Permission | Mô tả |
|---|---|
| `vungnuoc:create` | Tạo mới Vùng nước |

> Phân quyền do M-001 quản lý.

| Vai trò | Create |
|---|---|
| system-admin | ✅ |
| LeDuan | ✅ |
| Chuyên viên Cục/Cảng vụ | ✅ |
| Doanh nghiệp cảng | ✅ |
| Nhân viên vận hành | ❌ |

### 2.2. Logic Admin Cục

Admin Cục tạo không giới hạn đơn vị. Chuyên viên chỉ tạo trong phạm vi Org Unit.

---

## 3. User Stories

### Must
- **US-032-01:** Tạo mới Vùng nước với đầy đủ thông tin bắt buộc. (`vungnuoc:create`)
- **US-032-02:** Hệ thống kiểm tra trùng mã real-time khi blur khỏi ô input.

### Should
- **US-032-03:** Để trống mã → hệ thống tự sinh mã Vùng nước unique.

### Could
- **US-032-04:** Tab/Enter điều hướng form.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### Nhóm 1: Form & Validate

**AC-032-01:** Form hiển thị: maVungNuoc (input, optional — nếu để trống hệ thống tự sinh), tenVungNuoc (input, required, max 255), cangBienId (Select CangBien HIEN_HANH, required), dienTich, doSauMax, doSauTrungBinh (input number, optional), loaiVungNuoc (input, optional, free text, max 100), trangThaiHoatDong (Select, default HIỆN_HÀNH).
**AC-032-02:** Nếu người dùng nhập maVungNuoc → blur → `GET /api/v1/vung-nuoc?maVungNuoc={value}` → trùng → "Mã vùng nước đã tồn tại".
**AC-032-03:** Bỏ trống trường bắt buộc (tenVungNuoc, cangBienId) → lỗi "Đây là trường bắt buộc", không gửi API.

### Nhóm 2: Submit

**AC-032-04:** Submit → `POST /api/v1/vung-nuoc` → 201 → toast "Tạo mới vùng nước thành công — chờ phê duyệt". Trạng thái mặc định `CHỜ_PHÊ_DUYỆT`.
**AC-032-05:** 409 Conflict → toast + inline error trên maVungNuoc.
**AC-032-06:** 422 → React Hook Form map errors → inline field messages.

### Nhóm 3: Tự sinh mã

**AC-032-07 — Tự sinh mã:** Người dùng để trống `maVungNuoc` → submit → backend tự sinh mã unique (theo quy tắc VN-XXXXXX) → lưu thành công → toast hiển thị mã đã sinh.

### Nhóm 4: Hủy

**AC-032-08:** Hủy/Esc → đóng modal, không tạo bản ghi.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng cho | Nguồn | Ngoại lệ |
|---|---|---|---|---|
| BR-032-01 | `maVungNuoc` duy nhất toàn hệ thống (case-insensitive) | POST | Entity | Không |
| BR-032-02 | `tenVungNuoc` không trùng với Vùng nước đã tồn tại | POST | Entity | Không |
| BR-032-03 | Trạng thái mặc định: `CHỜ_PHÊ_DUYỆT` | POST | Default | Không |
| BR-032-04 | Các trường bắt buộc: tên, cảng mẹ. Mã: tự sinh nếu trống | POST | Validation | Mã optional |
| BR-032-05 | `cangBienId` phải có `trangThaiHoatDong = HIEN_HANH` | POST | Parent guard | Không |
| BR-032-06 | Mã tự sinh theo quy tắc VN-XXXXXX, unique | POST | Business | Không |
| BR-032-07 | Chuyên viên chỉ tạo trong phạm vi Org Unit của mình | POST | RBAC | Admin Cục toàn bộ |

---

## 6. Mô hình dữ liệu

> Kế thừa F-036 Section 6. Các trường nhập khi tạo:

| # | Tên trường | Kiểu | Bắt buộc | Status |
|---|---|---|---|---|
| 1 | ma_vung_nuoc | NVARCHAR(50) | Không* | ✅ (*tự sinh nếu trống) |
| 2 | ten_vung_nuoc | NVARCHAR(255) | Có | ✅ |
| 3 | cang_bien_id | UUID | Có | ✅ |
| 4 | dien_tich | DECIMAL(15,2) | Có | ✅ |
| 5 | do_sau_max | DECIMAL(10,2) | Không | ✅ |
| 6 | do_sau_trung_binh | DECIMAL(10,2) | Không | ✅ |
| 7 | loai_vung_nuoc | NVARCHAR(100) | Có | ✅ |
| 8 | trang_thai_hoat_dong | NVARCHAR(50) | Không | ✅ (default HIỆN_HÀNH) |
| 9 | trang_thai_phe_duyet | NVARCHAR(50) | Auto | ✅ (default CHỜ_PHÊ_DUYỆT) |

---

## 7. API Endpoints

| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/cang-bien?trangThaiHoatDong=HIEN_HANH` | Load dropdown cảng mẹ | `vungnuoc:create` |
| GET | `/api/v1/vung-nuoc?maVungNuoc={value}` | Kiểm tra unique mã | `vungnuoc:create` |
| POST | `/api/v1/vung-nuoc` | Tạo mới (backend tự sinh mã nếu maVungNuoc trống) | `vungnuoc:create` |

---

## 8. Chi tiết nghiệp vụ

### 8.1. Mở form

F-036 → "Thêm mới" → modal mở, form trống. Dropdown cảng mẹ gọi `GET /api/v1/cang-bien?trangThaiHoatDong=HIEN_HANH`. `trangThaiHoatDong` default HIỆN_HÀNH. `maVungNuoc` để trống — optional.

### 8.2. Unique check

Nếu người dùng nhập maVungNuoc → blur → gọi API kiểm tra → nếu trùng hiển thị lỗi inline "Mã vùng nước đã tồn tại". Debounce 300ms. Nếu để trống → bỏ qua unique check, backend sẽ tự sinh.

### 8.3. Tự sinh mã

Người dùng để trống `maVungNuoc` → submit → backend gọi generate code (VN-XXXXXX) → lưu kèm mã tự sinh. Toast hiển thị mã đã sinh: "Tạo mới vùng nước [mã] thành công — chờ phê duyệt".

### 8.4. Submit

Zod validate → nếu pass → `POST /api/v1/vung-nuoc` → backend lưu `trangThaiPheDuyet=CHỜ_PHÊ_DUYỆT` → 201 → toast → đóng modal → refresh F-036.

### 8.5. Hủy

Hủy/Esc → đóng modal, reset form, không gọi API.

---

## 9. Yêu cầu phi chức năng

- **Hiệu năng:** POST ≤ 2s; unique check ≤ 300ms; generate code ≤ 200ms
- **Bảo mật:** RBAC `vungnuoc:create`; HTTPS
- **UX:** Modal max-width 600px; submit button disabled khi đang gọi API; focus maVungNuoc khi mở

---

## 10. Yêu cầu giao diện

> Token: `theme.ts` + `tokens.ts`. KHÔNG hardcode.

### 10.1. Layout

- Header: "Tạo mới Vùng nước" + nút X
- Body: form 2 cột (label 180px, gap 24px)
- Footer: [Hủy] outlined + [Tạo mới] primary. `borderRadius: radiusPill`, `height: 40`.

### 10.2. Form fields

| STT | Trường | Loại | Edit | Bắt buộc | Default | Mô tả |
|---|---|---|---|---|---|---|
| 1 | Mã vùng nước | Input text | ✅ | Không | — | Để trống → tự sinh VN-XXXXXX |
| 2 | Tên vùng nước | Input text | ✅ | Có | — | |
| 3 | Cảng biển chủ | Select | ✅ | Có | — | Chỉ HIEN_HANH |
| 4 | Loại vùng nước | Input text | ✅ | Không | — | Free text |
| 5 | Diện tích (m²) | Input number | ✅ | Có | — | |
| 6 | Độ sâu tối đa (m) | Input number | ✅ | Không | — | |
| 7 | Độ sâu trung bình (m) | Input number | ✅ | Không | — | |
| 8 | Trạng thái hoạt động | Select | ✅ | Không | HIỆN_HÀNH | HIỆN_HÀNH / TẠM_NGƯNG |

### 10.3. Zod Schema

```typescript
const schema = z.object({
  maVungNuoc: z.string().max(50).optional().or(z.literal("")),
  tenVungNuoc: z.string().min(1, "Tên vùng nước không được để trống").max(255),
  cangBienId: z.string().uuid("Cảng biển chủ không được để trống"),
  dienTich: z.coerce.number().optional(),
  doSauMax: z.coerce.number().optional(),
  doSauTrungBinh: z.coerce.number().optional(),
  loaiVungNuoc: z.string().max(100).optional().or(z.literal("")),
  trangThaiHoatDong: z.enum(["HIỆN_HÀNH", "TẠM_NGƯNG"]).optional().default("HIỆN_HÀNH"),
});
```

> Ghi chú: `maVungNuoc` là optional trong Zod schema — nếu trống, backend tự sinh.

### 10.4. UX

- `marginBottom: spaceFormField`, `borderRadius: radiusPill`, `height: 40`
- Lỗi đỏ dưới input
- Toast `statusOperational` 3s (kèm mã đã sinh nếu tự động)
- Focus `maVungNuoc` khi mở modal

---

## 11. Xử lý lỗi

| Tình huống | Xử lý |
|---|---|
| 409 Conflict | Toast "Mã vùng nước 'X' đã tồn tại" + inline error |
| 422 Validation | Map BE errors → inline field messages |
| Network error | Toast "Kết nối thất bại. Vui lòng thử lại" |
| Generate code fail | Toast "Không thể tạo mã. Vui lòng thử lại" |

## Testing Strategy

Unit: Zod schema, unique check, auto-generate code logic. Integration: POST API valid/invalid data, POST with empty maVungNuoc → verify auto-generated code. E2E: Mở modal, điền form, submit, toast + refresh, verify mã hiển thị.

---

## Implementation Status

| Layer | Status |
|---|---|
| Backend | Done |
| Frontend | Pending |
