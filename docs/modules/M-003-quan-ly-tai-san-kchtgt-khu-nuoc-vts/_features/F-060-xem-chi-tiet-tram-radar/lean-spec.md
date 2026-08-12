---
feature-id: F-060
document: lean-spec
output-mode: lean
last-updated: 2026-08-07
---
# Xem chi tiết Trạm radar

## Summary

Hệ thống cần cung cấp trang xem chi tiết read-only cho Trạm radar, hiển thị toàn bộ thông tin: cơ bản, hành chính, kỹ thuật, trạng thái (badge màu), tọa độ GIS (kèm nút "Xem vị trí" trên bản đồ), file đính kèm, metadata (chỉ Admin Cục), và các tab phụ: thông tin phê duyệt, kết cấu hạ tầng, vận hành khai thác, bảo trì, sự cố. Nút hành động (Chỉnh sửa, Phê duyệt, Từ chối, Lịch sử) hiển thị động theo vai trò và trạng thái.

## Scope

| | Items |
|---|---|
| In scope | Trang read-only hiển thị 8 nhóm thông tin (A-H); JOIN VtsSystem để lấy tên + hyperlink; Badge màu trạng thái (PROPOSED=vàng, UNDER_REVIEW=xanh nhạt, APPROVED=xanh lá, REJECTED=đỏ); Nút "Xem vị trí" mở modal bản đồ; 5 tab collapsible (I-M): Thông tin phê duyệt, Kết cấu hạ tầng, Vận hành, Bảo trì, Sự cố; Nút hành động động theo vai trò + trạng thái; Breadcrumb; Metadata chỉ hiển thị cho Admin Cục |
| Out of scope | Chỉnh sửa (F-057); Phê duyệt (F-059); Xóa (F-058); Tạo mới (F-056) |
| Assumptions | Trạm radar đã tồn tại; Người dùng đã đăng nhập |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-060-01 | Chuyên viên | Xem toàn bộ thông tin chi tiết trạm radar | Nắm tình trạng hiện tại | Must Have |
| US-060-02 | Lãnh đạo | Xem chi tiết và phê duyệt/từ chối ngay trên trang | Tiết kiệm thời gian | Must Have |
| US-060-03 | Chuyên viên | Xem vị trí trạm radar trên bản đồ | Kiểm tra tọa độ GIS | Must Have |
| US-060-04 | Chuyên viên | Tải xuống file đính kèm | Phục vụ kiểm tra | Should Have |
| US-060-05 | Chuyên viên | Xem lịch sử thay đổi từ trang chi tiết | Biết ai thay đổi gì, khi nào | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-060-01 | US-060-01 | Hiển thị đầy đủ thông tin | Given chọn trạm radar; When GET detail; Then hiển thị tất cả trường + JOIN VtsSystem | Nếu lỗi → thông báo + nút Thử lại |
| AC-060-02 | US-060-01 | Link Hệ thống VTS | Given có vtsSystemId; When hiển thị; Then tên VTS dạng hyperlink | Nếu VTS bị xóa → tag "(không khả dụng)" |
| AC-060-03 | US-060-01 | Badge trạng thái | Given trạng thái hiện tại; When hiển thị; Then badge đúng màu | PROPOSED=vàng, UNDER_REVIEW=xanh nhạt, APPROVED=xanh lá, REJECTED=đỏ |
| AC-060-04 | US-060-04 | File đính kèm | Given có file; When hiển thị; Then bảng file + nút Tải xuống | Nếu không có → "Không có file đính kèm" |
| AC-060-05 | US-060-02 | Nút hành động động | Given trạng thái + vai trò; When hiển thị; Then nút tương ứng hiện/ẩn | PROPOSED + Leader → hiện Phê duyệt/Từ chối |
| AC-060-06 | US-060-03 | Nút Xem vị trí | Given có tọa độ; When click; Then modal bản đồ hiển thị | Không có tọa độ → ẩn nút |
| AC-060-07 | US-060-01 | Breadcrumb | Given trang chi tiết; When hiển thị; Then "Khu nước & VTS > Trạm radar > [tên]" | |
| AC-060-08 | US-060-01 | Metadata Admin Cục | Given Admin Cục; When xem; Then thấy createdBy, createdDate, updatedBy, updatedDate | Vai trò khác → ẩn |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-060-01 | Xem được ở mọi trạng thái | AC-060-01 | Không có ngoại lệ |
| BR-060-02 | Trang read-only, chỉnh sửa qua F-057 | AC-060-01 | Không có ngoại lệ |
| BR-060-03 | Nút hành động thay đổi theo trạng thái | AC-060-05 | Không có ngoại lệ |
| BR-060-04 | VTS link; nếu VTS bị xóa → cảnh báo | AC-060-02 | Không có ngoại lệ |
| BR-060-05 | Dữ liệu làm mới mỗi lần truy cập, không cache | AC-060-01 | Không có ngoại lệ |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Tải trang chi tiết (JOIN VtsSystem + attachment) | ≤ 1 giây |
| Performance | Tải file đính kèm | ≤ 3 giây (max 10MB) |
| Security | RBAC; metadata chỉ Admin Cục | HTTP 403 |
| UX | Responsive; loading skeleton; collapsible tabs | WCAG 2.1 AA |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-060-01 | AC-060-01 | Happy path: Xem chi tiết trạm radar APPROVED | Integration |
| TS-060-02 | AC-060-03 | Edge: Kiểm tra badge từng trạng thái | Unit |
| TS-060-03 | AC-060-05 | Edge: PROPOSED + Leader → hiện Phê duyệt/Từ chối | Integration |
| TS-060-04 | AC-060-02 | Edge: VTS bị xóa → tag "(không khả dụng)" | Integration |
| TS-060-05 | AC-060-08 | Edge: Admin Cục thấy metadata; Chuyên viên không thấy | Integration |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Chỉ đọc, không thay đổi schema |
| Architecture affected? | No | GET API + JOIN pattern hiện có |
| Implementation clear? | Yes | Trang detail read-only, badge màu, tab collapsible |
| **Verdict** | `Ready for Technical Lead planning` | Trang xem chi tiết, không có quyết định kiến trúc mới |
