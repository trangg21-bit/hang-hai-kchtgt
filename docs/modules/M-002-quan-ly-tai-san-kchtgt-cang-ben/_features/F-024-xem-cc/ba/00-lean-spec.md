---
feature-id: F-024
document: lean-spec
output-mode: lean
last-updated: 2026-07-31
---
# Xem chi tiết Cầu cảng

## Summary

Hệ thống cần cung cấp trang chi tiết hiển thị toàn bộ thông tin Cầu cảng ở chế độ read-only, bao gồm 11 nhóm thông tin (A→K) dạng collapsible + 5 tab dữ liệu liên quan (phê duyệt, KCHT, vận hành, bảo trì, sự cố). Trang là điểm trung tâm điều hướng đến các tính năng khác: chỉnh sửa, phê duyệt, lịch sử. Hiển thị badge trạng thái theo vòng đời, cảnh báo trạng thái, và metadata (chỉ Admin Cục). Thành công khi tất cả trường hiển thị đúng, badge màu chính xác theo trạng thái, các tab liên quan load đủ dữ liệu.

## Scope

| | Items |
|---|---|
| In scope | 11 nhóm hiển thị (A: cơ bản, B: kỹ thuật, C: trạng thái + metadata, D: thời điểm, E: số lượng, F: ATHH, G: công bố, H: GIS, I: phạm vi & tọa độ, J: giấy tờ, K: hành động); 5 tab: phê duyệt, KCHT, vận hành, bảo trì, sự cố; Badge trạng thái theo vòng đời; Cảnh báo trạng thái; Breadcrumb; Nút hành động theo vai trò và trạng thái; Link Bến cảng cha; Metadata cho Admin Cục |
| Out of scope | Chỉnh sửa (F-021); Tạo mới (F-020); Xóa (F-022); Phê duyệt (F-023); Lịch sử (F-025) |
| Assumptions | Cầu cảng đã tồn tại; JOIN BenCang + GiayTo; Collapsible sections mặc định: A, B, C, J mở; D→I, L→P thu gọn |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-024-01 | Nhân viên vận hành | Xem toàn bộ thông tin chi tiết cầu cảng | Nắm tình trạng hiện tại phục vụ vận hành | Must Have |
| US-024-02 | Quản lý tài sản | Xem đầy đủ trường kỹ thuật và trạng thái | Kiểm tra trước khi chỉnh sửa | Must Have |
| US-024-03 | Lãnh đạo | Xem chi tiết + phê duyệt/từ chối ngay trên trang | Tiết kiệm thời gian | Must Have |
| US-024-04 | Nhân viên vận hành | Tải xuống/in giấy tờ đính kèm | Phục vụ kiểm tra thực tế | Should Have |
| US-024-05 | Quản lý tài sản | Xem lịch sử thay đổi từ trang chi tiết | Biết ai đã thay đổi gì | Should Have |
| US-024-06 | Người dùng | Breadcrumb điều hướng rõ ràng | Dễ dàng quay lại danh sách/Bến cảng cha | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-024-01 | US-024-01 | Hiển thị đầy đủ 11 nhóm thông tin | Given người dùng click vào cầu cảng từ danh sách; When GET /api/v1/cau-cang/:id thành công; Then hiển thị 11 nhóm A→K, badge trạng thái đúng màu, cảnh báo trạng thái phù hợp | API lỗi → thông báo + nút Thử lại |
| AC-024-02 | US-024-06 | Link Bến cảng cha hoạt động | Given trang chi tiết; When click tên Bến cảng; Then điều hướng đến trang chi tiết Bến cảng. Nếu bến đã xóa → hiển thị "(không khả dụng)" | |
| AC-024-03 | US-024-01 | Badge trạng thái theo vòng đời | Given cầu cảng CHO_PHE_DUYET; Then badge vàng; DUOC_PHE_DUYET → xanh dương; TU_CHOI → đỏ; TAM_NGUNG → vàng; HIEN_HANH → xanh lá | |
| AC-024-04 | US-024-01 | Danh sách giấy tờ đính kèm | Given cầu cảng có file; Then hiển thị bảng: tên, kích thước, loại, ngày upload + nút Tải xuống/In. Không có file → "Không có giấy tờ đính kèm" | |
| AC-024-05 | US-024-03 | Nút hành động theo trạng thái + vai trò | Given Leader/Admin + CHO_PHE_DUYET; Then hiển thị "Phê duyệt" + "Từ chối". Given DUOC_PHE_DUYET/TU_CHOI; Then ẩn nút phê duyệt. Given Admin/QLTS; Then hiển thị "Chỉnh sửa" | |
| AC-024-06 | US-024-06 | Breadcrumb đúng | Then hiển thị: Trang chủ > Quản lý KCHT Hàng Hải > Quản lý cầu cảng > [tên]. Click "Quản lý cầu cảng" → F-078 | |
| AC-024-07 | US-024-01 | Metadata cho Admin Cục | Given Admin Cục; Then thấy createdBy, createdAt, updatedBy, updatedAt. Vai trò khác → ẩn | |
| AC-024-08 | US-024-01 | 5 tab dữ liệu liên quan load đủ | Given tab Phê duyệt/KCHT/Vận hành/Bảo trì/Sự cố; When click tab; Then hiển thị bảng dữ liệu tương ứng với đầy đủ cột | Tab trống → empty state |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-024-01 | Xem được ở mọi trạng thái; luôn hiển thị trạng thái hiện tại | AC-024-01 | Không có ngoại lệ |
| BR-024-02 | Read-only — mọi chỉnh sửa qua F-021 | AC-024-01 | Không có ngoại lệ |
| BR-024-03 | Phê duyệt/từ chối từ trang chi tiết khi CHO_PHE_DUYET | AC-024-05 | |
| BR-024-04 | Bến cảng cha hiển thị link; nếu đã xóa → cảnh báo | AC-024-02 | |
| BR-024-05 | Dữ liệu làm mới mỗi lần truy cập, không cache | AC-024-01 | |
| BR-024-06 | Nút hành động thay đổi theo trạng thái | AC-024-05 | |
| BR-024-07 | Cảnh báo: CHO_PHE_DUYET/TU_CHOI → "chưa được duyệt"; DUOC_PHE_DUYET → "đang khả dụng" | AC-024-01 | |
| BR-024-08 | Cha (Bến/Cảng) mất → CC tự động TAM_NGUNG + cảnh báo | - | |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Tải trang chi tiết (JOIN BenCang + GiayTo) ≤ 1 giây | p95 ≤ 1s |
| Performance | Tải file đính kèm ≤ 3 giây (max 10MB) | p95 ≤ 3s |
| Security | RBAC trên API; metadata chỉ cho Admin Cục | |
| UX | Collapsible sections (A,B,C,J mở; còn lại thu gọn); Loading skeleton; Empty state; WCAG 2.1 AA | |
| Compliance | Thông tư 48/2017/TT-BGTVT | |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-024-01 | AC-024-01 | Happy path: Mở chi tiết → hiển thị đủ 11 nhóm + badge | Integration |
| TS-024-02 | AC-024-02 | Link Bến cảng cha → điều hướng đúng | UI |
| TS-024-03 | AC-024-03 | Các trạng thái → badge màu đúng | UI |
| TS-024-04 | AC-024-05 | Leader thấy nút Phê duyệt/Từ chối khi CHO_PHE_DUYET | UI + RBAC |
| TS-024-05 | AC-024-05 | User thường không thấy nút phê duyệt | Security |
| TS-024-06 | AC-024-07 | Admin Cục thấy metadata; vai trò khác không thấy | Security |
| TS-024-07 | AC-024-08 | 5 tab load đúng dữ liệu | Integration |
| TS-024-08 | AC-024-01 | API lỗi → thông báo + nút Thử lại | Negative |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Read-only trên entity hiện có + JOIN BenCang, GiayTo, PheDuyetLog, KCHT, Vận hành, Bảo trì, Sự cố |
| Architecture affected? | Yes | Cần JOIN nhiều bảng cho 5 tab; field-level RBAC cho metadata |
| Implementation clear? | Yes | Pattern read-only đã rõ; collapsible sections theo pattern F-020 |
| **Verdict** | `Ready for Technical Lead planning` | Read-only với nhiều JOIN; implementation rõ ràng từ pattern có sẵn |