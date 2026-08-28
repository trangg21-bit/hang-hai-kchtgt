---
id: F-323
name: "Quản lý Bến phao - Lịch sử"
slug: ql-bp-lich-su
module-id: M-026
status: proposed
classification: local
priority: medium
created: 2026-08-28
last-updated: 2026-08-28
locked-fields: []
consumed_by_modules: []
---

# Lean Spec — F-323 Lịch sử Bến phao

**Module:** M-026 — Quản lý Bến phao
**Phần chung:** `ba/00-lean-spec.md` (module mục 11 — drift c.8) + `infrastructure-feature-standard-architecture.md` mục 4.8 (drawer lịch sử 2 cột, tab Phê duyệt cuối drawer form).
**Nguồn:** code hiện trạng (READ ONLY): `BuoyBerthApprovalService.getHistory/getAllHistory`, `BuoyBerthController` (history endpoints), `BuoyBerthDetailContent.tsx` (tab approval/history).

## 1. Mục đích & phạm vi

Xem tiến trình phê duyệt + biến động dữ liệu của hồ sơ bến phao: (A) tab "Phê duyệt"/"Thay đổi" trong drawer chi tiết; (B) drawer "Lịch sử" từ rowActions. **Điểm đặc thù:** bảng `change_logs`/`approval_logs` đã bị drop (V20260825162500) → nguồn lịch sử hiện tại là approval-audit columns trên `buoy_berths`; endpoint history trả rỗng (drift c.8). **Ngoài phạm vi:** khôi phục bảng history, ghi log mới (quyết định thuộc SA/Dev, ngoài brief này).

## 2. Use Cases

- UC-01 Xem tab "Phê duyệt" (5 mốc: tạo, gửi, C1 + nội dung, C2 + nội dung, lý do từ chối).
- UC-02 Xem tab "Thay đổi" trong drawer chi tiết.
- UC-03 Mở drawer "Lịch sử" từ rowActions: lọc từ khóa + khoảng ngày, lưới 2 cột.
- UC-04 Xem lịch sử toàn module (nếu có quyền).

## 3. Business Rules (BR-323-NN)

| ID | Quy tắc | Oracle kiểm chứng |
|---|---|---|
| BR-323-01 | Tab Phê duyệt/Thay đổi ẩn khi `drawerMode === 'create'` | Mở "Thêm mới" → không có 2 tab này |
| BR-323-02 | Lịch sử chỉ trong DataScope | User đơn vị khác → không xem được hồ sơ/lịch sử |
| BR-323-03 | Nguồn = approval-audit columns; không query change_logs/approval_logs (đã drop); rỗng → hiển thị trạng thái trống, không crash | Hồ sơ APPROVED: tab Phê duyệt hiện đủ mốc từ columns; tab Thay đổi hiện "chưa có dữ liệu" |
| BR-323-04 | Hiển thị fullName người thực hiện; thời gian `DD/MM/YYYY HH:mm:ss` | UI không hiện UUID/email |
| BR-323-05 | Drawer lịch sử: lưới `minmax(310px, 0.38fr) minmax(0, 1fr)`, gap 16px; badge hành động pill | Mở drawer → đúng layout, badge phân loại hành động |

## 4. Luồng chính

1. Tab "Phê duyệt" trong drawer chi tiết: đọc approval-audit columns từ `GET /{id}` → render 5 mốc.
2. Nút "Lịch sử" trên dòng → `GET /{id}/history` → drawer 2 cột (metadata trái, chi tiết phải).
3. Bộ lọc từ khóa/khoảng ngày lọc client-side hoặc theo API.

**Luồng lỗi:** không có quyền `buoyberth:history` → ẩn nút; dữ liệu rỗng → trạng thái trống.

## 5. Trạng thái

Không có bước phê duyệt — chỉ phản ánh tiến trình đã xảy ra (F-321).

## 6. Validation

Không có nhập liệu. Kiểm tra quyền đọc + DataScope.

## 7. Data scope & phân quyền

- DataScope theo đơn vị user.
- Quyền: `buoyberth:history` (lịch sử), `buoyberth:read` (chi tiết chứa tab). Admin Cục full + metadata.
- ⚠️ Drift c.8: endpoint history trả `changeHistory`/`approvalLog` rỗng (bảng đã drop) — hành vi hiện trạng, đã ghi nhận trong drift register.

## 8. Tài liệu tham chiếu

`ba/00-lean-spec.md` (module mục 11) · feature-brief F-323 · `BuoyBerthApprovalService.getHistory/getAllHistory` · `BuoyBerthController` (GET /history/all, GET /{id}/history) · `BuoyBerthDetailContent.tsx`.
