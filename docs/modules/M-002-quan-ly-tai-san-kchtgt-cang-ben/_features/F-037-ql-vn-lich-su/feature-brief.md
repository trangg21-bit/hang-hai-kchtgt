---
id: F-037
name: Quản lý Vùng nước - Lịch sử
slug: ql-vn-lich-su
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-04
locked-fields: []
consumed_by_modules: []
merged-from: [F-037-BE, F-102-UI]
---
# Đặc tả nghiệp vụ: Quản lý Vùng nước - Lịch sử

**Tài liệu:** BA Feature Brief (merged BE+UI)
**Feature:** F-037 — Quản lý Vùng nước - Lịch sử
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-04

> Tài liệu merge từ F-037 (BE) + F-102 (UI) + designer spec 07-history.

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Trang hiển thị toàn bộ lịch sử thay đổi (`LichSuThayDoi`) của một Vùng nước theo timeline. Dòng đầu tiên indicator "Tạo mới" (CREATE, oldValue = null). Các dòng sau "Cập nhật" (UPDATE). Filter theo Field bằng dropdown. Click dòng → drawer chi tiết.

### 1.2. Tại sao cần?

Truy vết và kiểm toán toàn bộ thay đổi. Phục vụ kiểm tra chất lượng dữ liệu, truy nguyên lỗi, tuân thủ quy trình quản lý.

### 1.3. Luồng chính

F-036 → "Lịch sử" → `GET /api/v1/vung-nuoc/{id}/history` → timeline DESC → filter Field → click dòng → drawer chi tiết.

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Phân quyền

| Permission | Mô tả |
|---|---|
| `vungnuoc:history` | Xem lịch sử thay đổi Vùng nước |

> Phân quyền do M-001 quản lý.

| Vai trò | View History |
|---|---|
| system-admin | ✅ |
| LeDuan | ✅ |
| Chuyên viên Cục/Cảng vụ | ✅ |
| Doanh nghiệp cảng | ✅ |
| Nhân viên vận hành | ❌ |

### 2.2. Logic Admin Cục

Xem toàn bộ lịch sử, không giới hạn.

---

## 3. User Stories

### Must
- **US-037-01:** Xem toàn bộ lịch sử thay đổi theo thứ tự thời gian. (`vungnuoc:history`)
- **US-037-02:** Xem chi tiết từng lần thay đổi (người thực hiện, thời gian).

### Should
- **US-037-03:** Lọc lịch sử theo trường thay đổi cụ thể.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### Nhóm 1: Hiển thị

**AC-037-01:** `GET /api/v1/vung-nuoc/{id}/history` → timeline sắp xếp changedAt DESC.
**AC-037-02:** Dòng đầu: indicator "Tạo mới" (CREATE), oldValue = null.
**AC-037-03:** Dòng sau: "Cập nhật" (UPDATE), oldValue ≠ newValue.
**AC-037-04:** Cột: Field, Old Value, New Value, Changed By, Changed At (yyyy-MM-dd HH:mm:ss).
**AC-037-05:** Breadcrumb: "Danh sách Vùng nước > Chi tiết {tenVungNuoc} > Lịch sử".

### Nhóm 2: Tương tác

**AC-037-06:** Dropdown Field filter: Tất cả / maVungNuoc / tenVungNuoc / loaiVungNuoc / cangBienId / dienTich / doSauMax / doSauTrungBinh / trangThaiHoatDong / trangThaiPheDuyet.
**AC-037-07:** Click dòng → drawer: tên/username Changed By, changedAt, giải thích.
**AC-037-08:** Empty → "Không có lịch sử thay đổi".

---

## 5. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng cho | Nguồn | Ngoại lệ |
|---|---|---|---|---|
| BR-037-01 | Bản ghi đầu: action=CREATE, oldValue=null | History | F-037 BE | Không |
| BR-037-02 | Bản ghi sau: action=UPDATE, oldValue ≠ newValue | History | F-037 BE | Không |
| BR-037-03 | Sắp xếp changedAt DESC | History | INT-003 | Không |
| BR-037-04 | Lịch sử immutable — không xóa, không sửa, chỉ bổ sung | History | Audit | Không |

---

## 6. Mô hình dữ liệu

### `lich_su_thay_doi`

| # | Tên trường | Kiểu | Mô tả | Status |
|---|---|---|---|---|
| 1 | id | UUID | PK | ✅ |
| 2 | vung_nuoc_id | UUID | FK | ✅ |
| 3 | field | NVARCHAR(100) | Tên trường thay đổi | ✅ |
| 4 | old_value | TEXT | Nullable (null cho CREATE) | ✅ |
| 5 | new_value | TEXT | | ✅ |
| 6 | changed_by | UUID | FK → User | ✅ |
| 7 | changed_at | TIMESTAMP | | ✅ |
| 8 | action | NVARCHAR(20) | CREATE / UPDATE | ✅ |

---

## 7. API Endpoints

| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/vung-nuoc/{id}/history` | Lịch sử thay đổi | `vungnuoc:history` |

---

## 8. Chi tiết nghiệp vụ

### 8.1. Mở trang

F-036 → "Lịch sử" → `GET /api/v1/vung-nuoc/{id}/history` → hiển thị EntitySummaryCard (thông tin cơ bản + badge trạng thái) + timeline bên dưới.

### 8.2. Timeline

Vertical timeline, alternating left/right desktop, single column mobile. Mỗi item: timestamp (bold), actor, field changes (old → new: red strikethrough old, green new), reason nếu reject.

### 8.3. Filter

Dropdown Field filter: chọn field cụ thể → chỉ hiển thị dòng có field trùng khớp. Mặc định "Tất cả".

### 8.4. Drawer chi tiết

Click dòng → drawer: tên/username Changed By, changedAt đầy đủ, giải thích thay đổi.

---

## 9. Yêu cầu phi chức năng

- Timeline `role="list"`, `aria-label`, mỗi item `role="listitem"`
- Color: old red strikethrough, new green + text labels (không chỉ màu)
- Keyboard: Tab item, Enter expand/collapse

---

## 10. Yêu cầu giao diện

> Token: `theme.ts` + `tokens.ts`.

### 10.1. Layout

```
VungNuocHistoryPage
├── PageHeader ("Lịch sử thay đổi — [maVungNuoc] | [tenVungNuoc]", breadcrumbs, Back)
├── EntitySummaryCard (maVungNuoc, tenVungNuoc, tenCang, dienTich, doSauMax, doSauTrungBinh, loaiVungNuoc + badge)
├── FieldFilterDropdown
└── HistoryTimeline (role="list")
    ├── TimelineItem (role="listitem")
    │   ├── timestamp (bold)
    │   ├── actor
    │   ├── changes (old→new: red strikethrough / green)
    │   └── reason (if reject)
    └── EmptyState: "Chưa có thay đổi nào được ghi nhận"
```

### 10.2. Row Indicators

| Action | Indicator | Old Value | New Value |
|---|---|---|---|
| CREATE | Badge "Tạo mới" | null | Giá trị ban đầu |
| UPDATE | Badge "Cập nhật" | Giá trị cũ | Giá trị mới |

### 10.3. UX

- `borderRadius: radiusPill`, `height: 40` cho nút Back
- Loading skeleton khi GET đang chạy
- Drawer animation mượt

---

## 11. Xử lý lỗi

| Tình huống | Xử lý |
|---|---|
| 404 | "Không tìm thấy vùng nước" + back |
| 403 | "Bạn không có quyền xem lịch sử" |
| API error | Toast "Không thể tải lịch sử" + retry |
| Empty | "Không có lịch sử thay đổi" (không phải lỗi) |

## Testing Strategy

Unit: CREATE/UPDATE logic, DESC sort. Integration: POST → CREATE record, PUT → UPDATE record. E2E: Timeline đúng thứ tự, indicator CREATE/UPDATE, Field filter, drawer.

---

## Implementation Status

| Layer | Status |
|---|---|
| Backend | Done |
| Frontend | Pending |
