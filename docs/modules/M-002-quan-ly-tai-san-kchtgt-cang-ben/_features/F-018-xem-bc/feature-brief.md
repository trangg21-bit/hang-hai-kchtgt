---
id: F-018
name: Xem danh sách & Chi tiết Bến cảng
slug: xem-bc
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:42Z
last-updated: 2026-07-30
locked-fields: []
consumed_by_modules: []
---
# Feature: Xem danh sách & Chi tiết Bến cảng

## Description

Tính năng cho phép người dùng xem danh sách và thông tin chi tiết của Bến cảng. Danh sách hiển thị dạng bảng với tìm kiếm, lọc, phân trang. Trang chi tiết hiển thị đầy đủ các trường dữ liệu kỹ thuật, vị trí GPS, trạng thái, badge màu phê duyệt, và hỗ trợ các hành động: chỉnh sửa, xóa, phê duyệt (Leader only), lịch sử.

## Business Intent

Việc cung cấp thông tin chi tiết về Bến cảng giúp các bên liên quan có thể tra cứu nhanh chóng, chính xác các thông tin kỹ thuật phục vụ công tác phân bổ lượt tàu, lập kế hoạch tiếp cận bến và đánh giá năng lực phục vụ của từng bến cảng.

## Flow Summary

**Danh sách:** Người dùng truy cập "Quản lý Bến cảng" → bảng danh sách phân trang 20/100 dòng, sắp xếp updatedAt giảm dần. Tìm kiếm theo maBen/tenBen, lọc theo trạng thái hoạt động. Mỗi hàng có badge trạng thái và các nút hành động: Xem chi tiết, Chỉnh sửa, Xóa, Phê duyệt (Leader), Lịch sử.

**Chi tiết:** Người dùng click "Xem chi tiết" → breadcrumb "Danh sách Bến cảng > Chi tiết: [maBen]" → hiển thị tất cả trường BenCang + badge trạng thái + metadata (createdBy, updatedBy, createdAt, updatedAt). Nếu có quyền Leader: nút Phê duyệt/Từ chối.

## Acceptance Criteria

1. Danh sách hiển thị các cột: maBen, tenBen, cangBienId (tên cảng cha), viDo, kinhDo, badge trạng thái hoạt động, badge trạng thái phê duyệt, updatedAt.
2. Badge trạng thái phê duyệt: vàng (CHO_PHE_DUYET), xanh lá (DUOC_PHE_DUYET), đỏ (TU_CHO).
3. Badge trạng thái hoạt động: xanh dương (HIEN_HANH), cam (TAM_NGUNG).
4. Tìm kiếm theo maBen/tenBen, lọc theo trạng thái hoạt động, phân trang 20/100.
5. Trang chi tiết hiển thị đầy đủ tất cả trường + tọa độ GPS ±XX.XXXXXX + metadata datetime dd/MM/yyyy HH:mm:ss.
6. Nút Phê duyệt/Từ chối chỉ hiển thị cho role có `bencang:approve`.
7. Nút Chỉnh sửa, Xóa, Lịch sử hiển thị theo RBAC.

## In Scope

- Bảng danh sách với phân trang, sắp xếp, tìm kiếm, lọc
- Badge trạng thái với mã màu chuẩn
- Trang chi tiết đầy đủ trường + GPS + metadata
- Breadcrumb điều hướng
- Nút hành động theo RBAC (Xem, Sửa, Xóa, Phê duyệt, Lịch sử)
- Loading state và error handling

## Out of Scope

- Tạo mới Bến cảng (thuộc F-014)
- Cập nhật Bến cảng (thuộc F-015)
- Xóa Bến cảng (thuộc F-016)
- Phê duyệt Bến cảng (thuộc F-017)
- Lịch sử thay đổi (thuộc F-019)
- Xuất dữ liệu ra Excel/PDF

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Quản trị viên | Xem đầy đủ, mọi hành động |
| Quản lý cảng | Xem đầy đủ, Sửa, Phê duyệt |
| Nhân viên vận hành | Xem (một số trường kỹ thuật bị ẩn) |
| KháchExternal | Không có quyền truy cập |

## Entities

- **BenCang**: id (UUID), maBen (string, unique), tenBen (string), cangMeId (UUID, FK → CangBien), tuyensDuongThuy (string), toDo (JSON: {lat, lng}), chieuDaiBen (decimal, m), chieuRongBen (decimal, m), loaiBen (enum), doSauLuongTruocBen (decimal, m), trangThai (enum), ghiChu (text), createdAt (timestamp), updatedAt (timestamp), createdBy (UUID), updatedBy (UUID, nullable), deletedAt (nullable)
- **CangBien**: id (UUID), ten (string) — join qua cangMeId để hiển thị tên và link

## Business Rules

1. Chỉ Bến cảng có deletedAt = NULL mới hiển thị trong danh sách hoạt động.
2. Badge màu trạng thái theo chuẩn: vàng/xanh lá/đỏ/xanh dương/cam.
3. GPS hiển thị định dạng ±XX.XXXXXX (5 chữ số thập phân).
4. Metadata datetime hiển thị dd/MM/yyyy HH:mm:ss.

## UI Scope

### Danh sách (F-073 merged)
- **Component:** `BenCangListPage` — bảng với ScreenHeader + FilterBar + StatusTabs + DataTable + Pagination
- **API endpoint:** `GET /api/v1/ben-cang?page=&pageSize=&sortBy=updatedAt&sortOrder=DESC&search=&status=`
- **Columns:** maBen, tenBen, cangBienId (tên cảng cha), viDo, kinhDo, trangThaiHoatDong (badge), trangThaiPheDuyet (badge), updatedAt
- **Actions:** Xem chi tiết (F-018 detail), Chỉnh sửa (F-015), Xóa (F-016), Phê duyệt (F-017, Leader only), Lịch sử (F-019)
- **Search/Filter:** Tìm theo maBen/tenBen, lọc trạng thái HIEN_HANH/TAM_NGUNG
- **Pagination:** 20/100 mục mỗi trang
- **RBAC:** Nút "Phê duyệt" chỉ hiển thị cho `bencang:approve`, "Xóa" cho `bencang:delete`, "Chỉnh sửa" cho `bencang:update`

### Chi tiết (F-074 merged)
- **Component:** `BenCangDetailPage` — hiển thị toàn bộ trường + breadcrumb
- **API endpoint:** `GET /api/v1/ben-cang/:id`
- **Breadcrumb:** "Danh sách Bến cảng" (link F-073) → "Chi tiết: [maBen]"
- **Fields hiển thị:** maBen (readonly), tenBen, cangBienId (link đến CangBien detail), tuyenDuongThuy, viDo (±XX.XXXXXX), kinhDo (±XX.XXXXXX), chieuDai, chieuRong, loaiBen, doSauLuong, trangThaiHoatDong (badge), trangThaiPheDuyet (badge), orgUnitId, createdBy, updatedBy, createdAt, updatedAt
- **Approval actions (Leader only):** Nút "Phê duyệt" và "Từ chối" → hộp thoại xác nhận → POST /:id/approve hoặc POST /:id/reject
- **RBAC:** Nút Phê duyệt/Từ chối chỉ hiển thị cho `bencang:approve`

## Testing Strategy

### BE Testing
Kiểm thử đơn vị cho các hàm tra cứu và lọc; kiểm thử tích hợp cho API trả về danh sách và chi tiết Bến cảng; kiểm thử phân quyền cho các vai trò khác nhau.

### UI Testing
React Testing Library: danh sách hiển thị đúng cột, phân trang, tìm kiếm, lọc. E2E: danh sách → click tên → chi tiết hiển thị đủ trường → breadcrumb đúng; badge màu đúng; nút Phê duyệt chỉ hiển thị cho Leader.

## Consolidation Note

Merged with UI features F-073 (ui-ql-bc-danh-sach) and F-074 (ui-xem-bc-chi-tiet) — 2026-07-30
