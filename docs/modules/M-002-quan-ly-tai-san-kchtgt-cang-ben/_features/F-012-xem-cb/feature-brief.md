---
id: F-012
name: Xem chi tiết Cảng biển
slug: xem-cb
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:19Z
last-updated: 2026-07-28
locked-fields: []
consumed_by_modules: []
---
# Feature: Xem chi tiết Cảng biển

## Description

Tính năng cho phép người dùng xem danh sách và thông tin chi tiết của Cảng biển bao gồm các trường dữ liệu cơ bản, vị trí trên bản đồ, trạng thái hiện tại, thông tin người tạo và người cập nhật cuối. Giao diện CangBienListPage (danh sách) hiển thị bảng phân trang với filter, search, và hành động; CangBienDetailPage (chi tiết) hiển thị đầy đủ 15 trường, badge trạng thái màu, đính kèm, breadcrumb điều hướng.

## Business Intent

Việc cung cấp thông tin chi tiết về Cảng biển giúp các bên liên quan — từ cán bộ quản lý đến đối tác logistics — có thể tra cứu nhanh chóng, chính xác và đầy đủ các thông tin kỹ thuật, pháp lý về cảng.

## Flow Summary

### BE Flow
Người dùng truy cập mục quản lý Cảng biển, sử dụng thanh tìm kiếm để tra cứu theo mã cảng, tên cảng, hoặc tỉnh/thành phố. Hệ thống hiển thị danh sách kết quả. Người dùng click vào một Cảng biển để xem trang chi tiết với đầy đủ thông tin, bản đồ, trạng thái.

### UI Flow

**Danh sách (F-068):** Người dùng vào /Port, thấy bảng CangBienListPage với phân trang 20/trang, filter bar (mã/tên, tỉnh, trạng thái), live search debounce 300ms. Mỗi hàng có actions: Xem chi tiết, Chỉnh sửa, Xóa, Lịch sử.

**Chi tiết (F-069):** Nhấp "Xem chi tiết" → GET /api/v1/cang-bien/:id → CangBienDetailPage hiển thị breadcrumb "Quản lý cảng biển > Chi tiết cảng [maCang]", 15 trường với định dạng GPS ±XX.XXXXXX, badge trạng thái (vàng/xanh/đỏ), danh sách đính kèm với Download/Print. Hành động Phê duyệt/Từ chối chỉ hiện cho Lãnh đạo. Responsive: desktop ≥1024px, tablet ≥768px.

## Acceptance Criteria

1. Người dùng có quyền "Xem" có thể tra cứu Cảng biển theo mã, tên, tỉnh/thành với kết quả trong 3 giây.
2. Danh sách hiển thị tối đa 50 kết quả mỗi trang, có phân trang và sắp xếp.
3. Trang chi tiết hiển thị đầy đủ tất cả các trường thông tin.
4. [UI] Danh sách: phân trang 20/trang, filter bar, live search, cột maCang/tenCang/tinhThanhPho/trangThai/updatedAt.
5. [UI] Chi tiết: 15 trường, GPS ±XX.XXXXXX, badge màu, đính kèm Download/Print, breadcrumb.
6. [UI] Phê duyệt/Từ chối chỉ hiện cho Lãnh đạo.
7. [UI] Responsive desktop ≥1024px, tablet ≥768px.

## In Scope

- Thanh tìm kiếm với bộ lọc
- Bảng danh sách với phân trang và sắp xếp
- Trang chi tiết hiển thị đầy đủ thông tin
- Badge trạng thái màu
- Danh sách đính kèm với Download/Print
- Breadcrumb điều hướng
- Responsive design

## Out of Scope

- Tạo mới (thuộc F-008)
- Cập nhật (thuộc F-009)
- Xóa (thuộc F-010)
- Phê duyệt (thuộc F-011)
- Lịch sử thay đổi (thuộc F-013)
- Bản đồ GPS tương tác

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Admin | Xem đầy đủ, mọi hành động |
| Lãnh đạo | Xem đầy đủ + Phê duyệt |
| Chuyên viên Cục | Xem Cảng biển của Cục mình |
| Chuyên viên Cảng vụ | Xem Cảng biển của Cảng vụ mình |
| Doanh nghiệp cảng | Xem Cảng biển của đơn vị mình |
| Nhân viên vận hành | Xem (một số trường bị ẩn) |

## Entities

- **CangBien**: id (UUID), maCang (string, unique), tenCang (string), tinhThanhPho (string), viDo (BigDecimal), kinhDo (BigDecimal), dienTich (BigDecimal), khaNangTiepNhan (BigDecimal), trangThaiHoatDong (string), trangThaiPheDuyet (string: CHỜ_PHÊ_DUYỆT/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt, updatedAt

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | Kết quả tìm kiếm được cập nhật real-time với độ trễ không quá 500ms | Search | Entity spec |
| BR-002 | Chỉ Cảng biển "Hiện hành" hoặc "Tạm ngừng" hiển thị mặc định | Filter | Entity spec |
| BR-003 | Badge trạng thái: CHỜ_PHÊ_DUYỆT = vàng, ĐƯỢC_PHÊ_DUYỆT = xanh lá, TỪ_CHỐI = đỏ | UI | F-069 |

## UI Scope

### MH Danh sách (F-068)
- **Component:** `CangBienListPage` — bảng danh sách phân trang 20/trang
- **API:** `GET /api/v1/cang-bien` với query: search, trangThaiHoatDong, trangThaiPheDuyet, tinhThanhPho, page, size, sort
- **Columns:** maCang, tenCang, tinhThanhPho, trangThaiPheDuyet (badge màu), trangThaiHoatDong, updatedAt
- **Hành động:** Xem chi tiết, Chỉnh sửa, Xóa, Lịch sử
- **Filter bar:** Ô tìm kiếm (mã/tên), Select tỉnh/thành, Select trạng thái
- **Live search:** Debounce 300ms
- **RBAC:** `port:read` cho mọi role; nút "Thêm mới" chỉ hiện khi có `port:create`

### MH Chi tiết (F-069)
- **Component:** `CangBienDetailPage` — hiển thị đầy đủ 15 trường
- **API:** `GET /api/v1/cang-bien/:id`
- **Định dạng GPS:** ±XX.XXXXXX (5 chữ số thập phân)
- **Badge trạng thái:** CHỜ_PHÊ_DUYỆT = vàng, ĐƯỢC_PHÊ_DUYỆT = xanh lá, TỪ_CHỐI = đỏ
- **Đính kèm:** Danh sách file (PDF/DOCX/JPEG, max 10MB) với Download + Print
- **Hành động:** Phê duyệt/Từ chối (chỉ Lãnh đạo), Chỉnh sửa → F-071, Xóa → F-093, Lịch sử → F-094
- **Breadcrumb:** "Quản lý cảng biển > Chi tiết cảng [maCang]"
- **Responsive:** Desktop ≥1024px, tablet ≥768px, mobile cột đơn

## Testing Strategy

### BE Testing
Kiểm thử đơn vị cho các hàm tra cứu và lọc; kiểm thử tích hợp cho API danh sách và chi tiết; kiểm thử hiệu năng với 1000 Cảng biển.

### UI Testing
React Testing Library: render 15 trường entity, định dạng GPS, badge màu, danh sách đính kèm. Cypress E2E: danh sách → chi tiết → breadcrumb → Chỉnh sửa → F-071 → Xóa → F-093 → Lịch sử → F-094. Negative: Phê duyệt/Từ chối không hiện cho non-Leadership. Responsive: desktop 1440px, tablet 768px, mobile 375px.

## Consolidation Note

Merged with UI features F-068 (ui-ql-cb-danh-sach) and F-069 (ui-xem-cb-chi-tiet) — 2026-07-28
