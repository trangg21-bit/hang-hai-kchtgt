---
id: F-035
name: Phê duyệt Vùng nước
slug: phe-duyet-vn
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-04
locked-fields: []
consumed_by_modules: []
merged-from: [F-035-BE, F-092-UI]
---
# Đặc tả nghiệp vụ: Phê duyệt Vùng nước

**Tài liệu:** BA Feature Brief (merged BE+UI)
**Feature:** F-035 — Phê duyệt Vùng nước
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-04

> Tài liệu merge từ F-035 (BE) + F-092 (UI) + designer spec 05-approve.
> 
> ⚠️ **Ghi chú thiết kế:** BE brief gốc (F-035) mô tả quy trình phê duyệt **hai cấp** (Cấp 1: Trưởng phòng → Cấp 2: Cục). Tuy nhiên, designer spec (05-approve-ui-spec) và UI feature-brief (F-092) đều thiết kế modal phê duyệt **một cấp** với 2 tab Phê duyệt/Từ chối. Tài liệu merge này theo designer spec — phê duyệt 1 cấp. Nếu sau này cần khôi phục 2 cấp, tham khảo BE brief gốc.

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Modal phê duyệt/từ chối Vùng nước đang `CHỜ_PHÊ_DUYỆT`. 2 tab: **Phê duyệt** (checkbox confirm) và **Từ chối** (lý do ≥ 10 ký tự + checkbox). Hiển thị SummaryCard thông tin Vùng nước + lịch sử phê duyệt. Mỗi lần phê duyệt/từ chối tạo bản ghi `PheDuyetLog`.

### 1.2. Tại sao cần?

Đảm bảo mọi Vùng nước qua kiểm duyệt trước khi khai thác chính thức.

### 1.3. Luồng chính

F-036 → "Phê duyệt" → modal tab "Phê duyệt" active → xem thông tin → check confirm → `POST /approve` → toast → refresh. Hoặc tab "Từ chối" → nhập lý do ≥ 10 ký tự → check confirm → `POST /reject` → toast → refresh.

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Phân quyền

| Permission | Mô tả |
|---|---|
| `vungnuoc:approve` | Phê duyệt / Từ chối Vùng nước |

> Phân quyền do M-001 quản lý.

| Vai trò | Approve | Reject |
|---|---|---|
| system-admin | ✅ | ✅ |
| LeDuan | ✅ | ✅ |
| Chuyên viên Cục/Cảng vụ | ❌ | ❌ |
| Doanh nghiệp cảng | ❌ | ❌ |
| Nhân viên vận hành | ❌ | ❌ |

### 2.2. Logic Admin Cục

Toàn quyền phê duyệt/từ chối toàn bộ.

---

## 3. User Stories

### Must
- **US-035-01:** Phê duyệt Vùng nước đang chờ duyệt. (`vungnuoc:approve`)
- **US-035-02:** Từ chối Vùng nước kèm lý do. (`vungnuoc:approve`)

### Should
- **US-035-03:** Xem lịch sử phê duyệt trước đó.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### Nhóm 1: Hiển thị

**AC-035-01:** Modal hiển thị SummaryCard: maVungNuoc, tenVungNuoc, tenCang, dienTich, doSauMax, doSauTrungBinh, loaiVungNuoc, createdBy, createdAt + badge trạng thái hiện tại `CHỜ_PHÊ_DUYỆT`.
**AC-035-02:** 2 tab: "Phê duyệt" (default active) / "Từ chối". Arrow keys chuyển tab.

### Nhóm 2: Phê duyệt

**AC-035-03:** Tab Phê duyệt: chỉ checkbox "Tôi xác nhận phê duyệt vùng nước này", không cần reason.
**AC-035-04:** Check → enable [Xác nhận] → `POST /approve` → `trangThaiPheDuyet = ĐƯỢC_PHÊ_DUYỆT` → tạo PheDuyetLog(APPROVE) → toast "Đã phê duyệt thành công".

### Nhóm 3: Từ chối

**AC-035-05:** Tab Từ chối: TextArea reason (min 10, max 500) + checkbox confirm.
**AC-035-06:** Nhập reason ≥ 10 + check → enable → `POST /reject?reason=...` → `trangThaiPheDuyet = TỪ_CHỐI` → tạo PheDuyetLog(REJECT) → toast "Đã từ chối".

### Nhóm 4: Lỗi

**AC-035-07:** Concurrent modification → toast "Vùng nước này đã được phê duyệt/từ chối trước đó" + đóng modal.
**AC-035-08:** 403 → "Bạn không có quyền phê duyệt".

---

## 5. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng cho | Nguồn | Ngoại lệ |
|---|---|---|---|---|
| BR-035-01 | Chỉ Vùng nước `CHỜ_PHÊ_DUYỆT` mới được phê duyệt/từ chối | POST | State machine | Không |
| BR-035-02 | Từ chối phải có lý do ≥ 10 ký tự, ≤ 500 ký tự | POST /reject | Validation | Không |
| BR-035-03 | Mỗi lần phê duyệt/từ chối → tạo `PheDuyetLog` (APPROVE/REJECT) | POST | Audit | Không |
| BR-035-04 | Phê duyệt 1 cấp (đơn giản hóa từ thiết kế 2 cấp ban đầu) | POST | Design decision | Có thể khôi phục 2 cấp sau |

---

## 6. Mô hình dữ liệu

### `phe_duyet_logs`

| # | Tên trường | Kiểu | Mô tả | Status |
|---|---|---|---|---|
| 1 | id | UUID | PK | ✅ |
| 2 | vung_nuoc_id | UUID | FK | ✅ |
| 3 | hanh_dong | NVARCHAR(20) | APPROVE / REJECT | ✅ |
| 4 | nguoi_thuc_hien | NVARCHAR(100) | | ✅ |
| 5 | ly_do | NVARCHAR(500) | Required for REJECT | ✅ |
| 6 | thoi_gian | TIMESTAMP | | ✅ |

---

## 7. API Endpoints

| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/v1/vung-nuoc/{id}/approve` | Phê duyệt | `vungnuoc:approve` |
| POST | `/api/v1/vung-nuoc/{id}/reject?reason=...` | Từ chối (kèm lý do) | `vungnuoc:approve` |

---

## 8. Chi tiết nghiệp vụ

### 8.1. Mở modal

F-036 → "Phê duyệt" (chỉ hiện khi `CHỜ_PHÊ_DUYỆT` + `vungnuoc:approve`) → modal `role="dialog"`, max-width 600px. SummaryCard 2 cột. Tab "Phê duyệt" active mặc định.

### 8.2. Phê duyệt

Check "Tôi xác nhận phê duyệt vùng nước này" → enable [Xác nhận] → `POST /approve` → backend set `trangThaiPheDuyet = ĐƯỢC_PHÊ_DUYỆT`, tạo PheDuyetLog(APPROVE) → 200 → toast "Đã phê duyệt thành công" → đóng modal → refresh.

### 8.3. Từ chối

Chọn tab "Từ chối" → nhập lý do ≥ 10 ký tự → check confirm → enable → `POST /reject?reason=...` → backend set `trangThaiPheDuyet = TỪ_CHỐI`, tạo PheDuyetLog(REJECT) → 200 → toast "Đã từ chối" → đóng modal → refresh.

### 8.4. History

ApprovalHistoryList hiển thị timeline các lần phê duyệt/từ chối trước (nếu có).

---

## 9. Yêu cầu phi chức năng

- Modal `role="dialog"`, `aria-modal="true"`, focus trap
- Esc đóng với confirm prompt nếu form dirty
- Toast "Đã phê duyệt/Từ chối thành công"

---

## 10. Yêu cầu giao diện

> Token: `theme.ts` + `tokens.ts`.

### 10.1. Layout

```
VungNuocApprovalModal (role="dialog", max-width 600px)
├── Header: "Phê duyệt Vùng nước — [maVungNuoc] | [tenVungNuoc]"
├── SummaryCard (2 cột, read-only)
├── TabSwitcher: [Phê duyệt ✅] [Từ chối ❌]
├── Tab Phê duyệt: checkbox confirm
├── Tab Từ chối: TextArea reason (min 10, max 500) + checkbox confirm
├── ApprovalHistoryList (timeline)
└── Footer: [Hủy] + [Xác nhận] primary (disabled)
```

### 10.2. Zod Schema

```typescript
const approveSchema = z.object({
  confirmed: z.boolean().refine(val => val === true, {
    message: "Bạn cần xác nhận hành động này",
  }),
});

const rejectSchema = z.object({
  reason: z.string().min(10, "Lý do từ chối tối thiểu 10 ký tự").max(500),
  confirmed: z.boolean().refine(val => val === true, {
    message: "Bạn cần xác nhận hành động này",
  }),
});
```

### 10.3. UX

- `borderRadius: radiusPill`, `height: 40`
- Nút confirm disabled đến khi form valid
- Tab switching: arrow keys, Enter/Space

---

## 11. Xử lý lỗi

| Tình huống | Xử lý |
|---|---|
| 403 | "Bạn không có quyền phê duyệt vùng nước này" |
| 404 | "Không tìm thấy vùng nước để phê duyệt" |
| 422 (reason short) | Inline "Lý do từ chối tối thiểu 10 ký tự" |
| Concurrent | Toast "Đã được phê duyệt/từ chối trước đó" + đóng |

## Testing Strategy

Unit: State machine transition. Integration: POST approve/reject API. E2E: Modal tabs, checkbox enable, reason validation, toast + refresh.

---

## Implementation Status

| Layer | Status |
|---|---|
| Backend | Done |
| Frontend | Pending |
