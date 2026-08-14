---
feature-id: F-048-detail
document: lean-spec
output-mode: lean
last-updated: 2026-08-13
---
# Xem chi tiết Đê/kè

## Summary

Hệ thống cần cung cấp trang chi tiết hiển thị toàn bộ thông tin Đê/kè ở chế độ read-only, gồm các nhóm thông tin (A: cơ bản, B: kỹ thuật, C: thời gian, D: trạng thái, E: tab phê duyệt, F: GIS, G: file đính kèm, H: metadata, I: nhóm hành động). Trang là điểm trung tâm điều hướng đến chỉnh sửa (F-045), phê duyệt (F-047), lịch sử (F-049). Hiển thị badge trạng thái theo vòng đời (PROPOSED/UNDER_REVIEW/APPROVED/REJECTED) và tình trạng (3 mức khai thác), metadata chỉ hiển thị cho Admin Cục. Thành công khi tất cả trường hiển thị đúng, badge màu chính xác, nút hành động hiện theo vai trò + trạng thái.

## Scope

| | Items |
|---|---|
| In scope | Các nhóm hiển thị A→I (cơ bản, kỹ thuật, thời gian, trạng thái, tab phê duyệt, GIS, file đính kèm, metadata, hành động); Badge trạng thái 4 màu + tình trạng 3 mức; Breadcrumb; Nút hành động theo vai trò + trạng thái (Sửa, Gửi duyệt, Phê duyệt, Từ chối, Lịch sử); Tab thông tin phê duyệt (Nội dung/Ngày/Cán bộ); Metadata cho Admin Cục |
| Out of scope | Tạo mới (F-044); Cập nhật (F-045); Xóa (F-046); Phê duyệt (F-047); Lịch sử (F-049); Danh sách (F-048) |
| Assumptions | Đê/kè đã tồn tại; JOIN dike_revetment_attachment; Nhóm A, B, D mở mặc định; C, E, F thu gọn |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-D-01 | Chuyên viên | Xem toàn bộ thông tin chi tiết đê/kè | Nắm tình trạng hiện tại | Must Have |
| US-D-02 | Trưởng phòng | Xem đầy đủ trường kỹ thuật + trạng thái | Kiểm tra trước khi phê duyệt | Must Have |
| US-D-03 | Cục trưởng | Xem chi tiết + phê duyệt/từ chối ngay | Tiết kiệm thời gian | Must Have |
| US-D-04 | Chuyên viên | Tải file đính kèm | Phục vụ kiểm tra thực tế | Should Have |
| US-D-05 | Chuyên viên | Xem lịch sử từ trang chi tiết | Biết ai thay đổi gì | Should Have |
| US-D-06 | Người dùng | Breadcrumb điều hướng rõ ràng | Dễ quay lại danh sách | Should Have |
| US-D-07 | Chuyên viên | Xem vị trí trên bản đồ | Trực quan hóa | Could Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-D-01 | US-D-01 | Hiển thị đầy đủ thông tin | Given click vào đê/kè; When GET /api/v1/dike-revetment/{id}; Then hiển thị toàn bộ trường entity + badge trạng thái | API lỗi → thông báo + nút Thử lại |
| AC-D-02 | US-D-01 | Badge trạng thái + tình trạng | Given trạng thái; Then PROPOSED vàng, UNDER_REVIEW xanh dương, APPROVED xanh lá, REJECTED đỏ; tình trạng Đang khai thác xanh lá, Chưa khai thác cam, Dừng khai thác đỏ | |
| AC-D-03 | US-D-04 | Danh sách file đính kèm | Given có file; Then hiển thị tên/kích thước/loại/ngày + nút Tải xuống. Không có → "Không có file đính kèm" | |
| AC-D-04 | US-D-03 | Nút hành động theo trạng thái | Given PROPOSED; Then Sửa + Gửi duyệt + Phê duyệt (Cục). Given UNDER_REVIEW; Then Phê duyệt C2 + Từ chối. Given APPROVED; Then Sửa (quyền đặc biệt). Given REJECTED; Then Sửa + gửi lại | |
| AC-D-05 | US-D-06 | Breadcrumb đúng | Then Trang chủ > KCHTGT Khu nước & VTS > Đê/kè > [tên]. Click "Đê/kè" → F-048 | |
| AC-D-06 | US-D-01 | Metadata cho Admin Cục | Given Admin Cục; Then thấy createdBy/createdAt/updatedBy/updatedAt + người/ngày duyệt C1/C2. Vai trò khác → ẩn | |
| AC-D-07 | US-D-01 | Cảnh báo trạng thái | Given PROPOSED/UNDER_REVIEW; Then "chưa được phê duyệt, không khả dụng". APPROVED → "đang khả dụng". REJECTED → "bị từ chối: [lý do]" | |
| AC-D-08 | US-D-01 | Tab thông tin phê duyệt | Given tab phê duyệt; Then bảng: Nội dung phê duyệt / Ngày phê duyệt / Cán bộ phê duyệt | Tab trống → empty state |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-D-01 | Xem được ở mọi trạng thái | AC-D-01 | Không có ngoại lệ |
| BR-D-02 | Read-only — mọi chỉnh sửa qua F-045 | AC-D-01 | |
| BR-D-03 | Phê duyệt/từ chối từ trang chi tiết (F-047) | AC-D-04 | |
| BR-D-04 | Dữ liệu làm mới mỗi lần truy cập, không cache | AC-D-01 | |
| BR-D-05 | Nút hành động thay đổi theo trạng thái hiện tại | AC-D-04 | |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Tải trang chi tiết ≤ 1 giây | p95 ≤ 1s |
| Performance | Tải file đính kèm ≤ 3 giây (max 10MB) | p95 ≤ 3s |
| Security | RBAC trên API; metadata chỉ Admin Cục | |
| UX | Nhóm A/B/D mở, C/E/F thu gọn; Loading skeleton; Empty state; WCAG 2.1 AA | |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-D-01 | AC-D-01 | Happy path: mở chi tiết → hiển thị đủ các nhóm + badge | Integration |
| TS-D-02 | AC-D-02 | Các trạng thái → badge màu đúng | UI |
| TS-D-03 | AC-D-04 | Trưởng phòng thấy nút Phê duyệt khi PROPOSED | UI + RBAC |
| TS-D-04 | AC-D-04 | User thường không thấy nút phê duyệt | Security |
| TS-D-05 | AC-D-06 | Admin Cục thấy metadata; vai trò khác không | Security |
| TS-D-06 | AC-D-08 | Tab phê duyệt load đúng danh sách | Integration |
| TS-D-07 | AC-D-01 | API lỗi → thông báo + nút Thử lại | Negative |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Read-only trên `dike_revetment` hiện có + JOIN attachment |
| Architecture affected? | No | GET detail theo pattern có sẵn; field-level RBAC cho metadata |
| Implementation clear? | Yes | Pattern read-only đã rõ; collapsible sections theo pattern F-024 |
| **Verdict** | `Ready for Technical Lead planning` | Read-only; implementation rõ ràng từ pattern có sẵn |
