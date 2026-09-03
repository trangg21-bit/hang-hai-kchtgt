---
feature-id: F-096
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Xem chi tiết Đài TTDH (CoastalStationVTS)

## Summary

Tính năng xem chi tiết hồ sơ Đài TTDH. **ĐÃ XÁC MINH:** endpoint `GET /api/v1/stations/coastal/{id}` → `CoastalStationVTSService.getStationById` (EntityNotFoundException nếu không tồn tại); dữ liệu hiển thị qua `buildResponse`. Drawer chi tiết gồm 5 tab: Thông tin chung (TAB1), Vị trí GIS (TAB2), File đính kèm (TAB3), Vận hành & bảo trì (TAB4 — read-only, tích hợp từ module VH&BT: thông tin vận hành khai thác, bảo trì, sự cố), Xử lý & theo dõi (TAB5 — trạng thái, lịch sử phê duyệt). Quyền xem: `coastalstation:read` (VTS controller không khai `@PreAuthorize` riêng cho GET /{id} — mặc định authenticated; ghi nhận là điểm cần SA xác nhận chính sách quyền đọc). Data scope: chỉ xem được hồ sơ thuộc phạm vi đơn vị mình (`@DataScope` + filter unit_id).

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-096-01 | Người dùng trong phạm vi | Bấm hàng trên list → Xem chi tiết | Mở drawer 5 tab | Hiển thị đầy đủ thông tin theo ma trận CT |
| UC-096-02 | Người dùng ngoài phạm vi | GET /{id} hồ sơ đơn vị khác | DataScope filter | Không thấy (không 403, không trả dữ liệu) |

## Scope

| | Items |
|---|---|
| In scope | Hiển thị 5 tab theo cột CT=TRUE của Excel; trường read-only (TAB4 VH&BT, TAB5 Xử lý); quyền đọc; data scope. |
| Out of scope | CRUD; duyệt; lịch sử (F-097 dùng GET /{id}/history riêng). |

## Field Coverage Matrix

Nguồn: Excel sheet "Đài TTDH" (~line 1510) — cột CT (Xem chi tiết) quyết định. Toàn bộ 40 trường CT=T trừ: Mã/Tên/Đơn vị quản lý/Đơn vị khai thác/Phân loại/Địa điểm Tỉnh/TP/Tình trạng (DS+T), Địa điểm chi tiết/Vùng phủ sóng/Dịch vụ cung cấp/Ghi chú (chỉ CT), GIS 5 trường (CT), File (CT), TAB4 VH&BT 13 trường read-only (CT), TAB5 11 trường (CT). Chi tiết từng hàng: giống ma trận F-092 (Bảng Field Coverage Matrix đầy đủ tại F-092/ba/00-lean-spec.md — không lặp lại toàn bộ ở đây, chỉ khai báo cột CT).

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-096-01 | GET /{id} trả 200 + response đầy đủ; không tồn tại → 404 | AC-096-01 | |
| BR-096-02 | Data scope: chỉ xem trong phạm vi đơn vị (subtree) | AC-096-02 | `@DataScope` + filter |
| BR-096-03 | TAB4 VH&BT hiển thị read-only từ module vận hành/bảo trì/sự cố (M-0xx) — không nhập | AC-096-03 | Excel CT only |
| BR-096-04 | TAB5 hiển thị trạng thái qua `ApprovalStatusBadge`, người/thời điểm phê duyệt từ entity + history | AC-096-04 | Nhãn tiếng Việt chuẩn |
| BR-096-05 | Hiển thị tên đơn vị quản lý qua `OrgUnitCacheService` (không gọi API đơn vị theo từng bản ghi) | AC-096-05 | Cache convention |
| BR-096-06 | Quyền đọc: `coastalstation:read` — **ghi nhận:** controller hiện không có @PreAuthorize cho GET /{id}; chính sách cần SA chốt | AC-096-06 | |

## Domain Model

Giống F-092 (CoastalStationVTS + response DTO). Response gồm id, stationCode, stationName, frequencyBand, transmitPower, equipmentType, locationAddress, contactPerson/Phone, status, approvalStatus, approvalLevel, approvedBy/Date, submittedAt/By, approverLevel1/2, approvedDateLevel1/2, rejectionReason, createdAt/UpdatedAt/DeletedAt.

## Approval flow (2 cấp C1→C2)

Không thay đổi trạng thái — chỉ hiển thị. TAB5 trình bày vòng C1 (Cảng vụ/Chi cục) + C2 (Cục) kèm nội dung phê duyệt.

## Validation Rules

- Không có validation nhập liệu (read-only). Điều kiện: user có quyền đọc + trong data scope.

## Acceptance Criteria (observable)

| ID | Given/When/Then |
|---|---|
| AC-096-01 | Given hồ sơ tồn tại, When GET /{id}, Then 200 + response đầy đủ; Given id không tồn tại, When GET, Then 404 |
| AC-096-02 | Given user cấp đơn vị, When GET hồ sơ đơn vị khác, Then không nhận được dữ liệu (scope filter) |
| AC-096-03 | Drawer chi tiết có 5 tab; TAB4 hiển thị read-only vận hành/bảo trì/sự cố |
| AC-096-04 | TAB5 hiển thị badge trạng thái + người/thời điểm duyệt C1/C2, nội dung phê duyệt |
| AC-096-05 | Cột/chi tiết hiển thị `orgUnitName` (đã map qua OrgUnitCacheService) |
| AC-096-06 | Given user không có quyền đọc (nếu áp dụng chính sách), When GET, Then 403 — chờ SA chốt chính sách |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | |
| Architecture affected? | Low | Thiếu @PreAuthorize cho GET — chính sách đọc chờ SA |
| Implementation clear? | Yes | GET /{id} + buildResponse đã có |
| Documentation risk | Low | |
| **Verdict** | `Ready for Solution Designer review` | Rõ; 1 điểm mở (quyền đọc GET) |
