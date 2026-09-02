---
feature-id: F-091
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Lịch sử Nhà trạm đèn

## Summary

Tính năng cho phép người dùng có quyền đọc xem lịch sử thay đổi của hồ sơ Nhà trạm đèn (`BeaconStation`, `@Table beacon_light`). **DRIFT (đã xác minh):** `BeaconStationController` **KHÔNG có endpoint history** — khác `BuoyStationController` có `GET /{id}/history`. History hiện có thể truy cập qua `BuoyController` (`/api/buoys/...`, dành cho phao tiêu) và `StationHistoryController` (`/api/v1/station-history`). Nguồn dữ liệu chuẩn theo quy ước: bảng tập trung `infrastructure_history` (bỏ `change_logs`/`approval_logs`). Tài liệu ghi nhận drift: cần SA chốt endpoint history riêng cho BeaconStation hoặc dùng kênh chung.

## Scope

| | Items |
|---|---|
| In scope | Xem lịch sử hồ sơ nhà trạm đèn (tạo/sửa/gửi duyệt/duyệt/từ chối/xóa) với người + thời điểm; truy vấn `infrastructure_history`; phân quyền đọc; data scope theo `orgUnitId`. |
| Out of scope | Sửa (F-087); duyệt (F-089); chi tiết (F-090); thêm endpoint history vào BeaconStationController (quyết định SA/Dev — ghi nhận drift); migration. |
| Assumptions | User đăng nhập có quyền đọc; hồ sơ thuộc phạm vi; phần kỹ thuật là đề xuất BA, SA chốt. |

### Field Coverage Matrix

Nguồn: Excel sheet "QL Đèn biển và nhà trạm" (line ~113). Cột DS = Danh sách, Lọc = Bộ lọc, CT = Xem chi tiết, Tạo/Sửa = Form tạo mới/chỉnh sửa. Với F-091, lịch sử là tập entry biến đổi theo thời gian; ma trận hiện trạng dùng chung F-086.

| # | Label | Technical field | Control | Required | DS | Lọc | CT | Tạo | Sửa |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Mã đèn biển | `code` | Input (disabled, tự sinh `DBNT-%06d`) | Không (auto) | Có | Có | Có | Có | Có |
| 2 | Tên đèn biển | `name` | InputTextArea | **Có** | Có | Có | Có | Có | Có |
| 3 | Đơn vị quản lý | `orgUnitId` | SelectOrgCode | **Có** | Có | Có | Có | Có | Có |
| 4-8 | Cảng biển/vận hành/địa điểm/tình trạng | `seaportId`, `operator`/`unitId`, `provinceId`, `status`/`operationalStatus` | Select | Không | Có | Có | Có | Có | Có |
| 9-28 | Kỹ thuật đèn + nhà trạm | `primaryLightModel`...`note` | Input/TextArea | 18: Có | 11: Có | 9,11,21: Có | Có | Có | Có |
| 29-33 | GIS | `geometryType`, `mapSymbolId`, `coordinateSystem`, `displayRule`, `coordinates` | Select/LongLatTable | Không | Không | Không | Có | Có | Có |
| 34 | Danh sách file | `attachments` | UploadFileTable | Không | Không | Không | Có | Có | Có |
| 35-46 | Vận hành/bảo trì/sự cố | plan*/incident* (read-only) | Text (read-only) | — | Không | Không | Có | 46: Có | Không |
| 47 | Ngày cập nhật | `updatedAt` | Textarea | — | Có | Có | Có | Không | Không |
| 48 | Cán bộ cập nhật | `updatedBy` | Textarea | — | Có | Có | Có | Không | Không |
| 49-56 | Thông tin gửi/phê duyệt | submitted/level1/level2 (history) | Textarea | — | 49,51,52,54,55: Có | Không | Có | Không | Không |
| 57 | Trạng thái | `approvalStatus` | Select (Dropdown) | — | Có | Có | Có | Không | Không |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-091-01 | Người xem | Xem ai thay đổi gì, khi nào | Truy vết trách nhiệm | Must Have |
| US-091-02 | Admin Cục | Xem toàn bộ lịch sử kể cả metadata nhạy cảm | Kiểm toán đầy đủ | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-091-01 | US-091-01 | GET lịch sử | Given hồ sơ tồn tại + quyền đọc; When gọi endpoint history; Then trả entry từ `infrastructure_history` sort DESC, mỗi entry có action + người + thời điểm | Không dùng change_logs/approval_logs |
| AC-091-02 | US-091-01 | Ghi nhận đủ sự kiện | Given hồ sơ đã trải qua các bước; When xem; Then mỗi sự kiện có entry | Ghi log tại thời điểm thao tác |
| AC-091-03 | US-091-01 | **DRIFT endpoint** | Given cần lịch sử nhà trạm đèn; When tìm endpoint trên `BeaconStationController`; Then **không tồn tại** — cần SA chốt (thêm GET /{id}/history hoặc dùng `StationHistoryController`) | Ghi nhận drift, không tự code |
| AC-091-04 | US-091-01 | Data scope | Given hồ sơ ngoài phạm vi; When GET; Then 403/404 | `org_unit_id` filter |
| AC-091-05 | US-091-02 | Admin Cục | Given Admin Cục; When xem; Then thấy metadata nhạy cảm | view_sensitive |
| AC-091-06 | US-091-01 | Phân quyền | Given thiếu quyền; When GET; Then 403 | `@PreAuthorize` |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-091-01 | Lịch sử từ bảng tập trung `infrastructure_history`; bỏ `change_logs`, `approval_logs` | AC-091-01 | Không |
| BR-091-02 | Mỗi gửi/duyệt/từ chối/sửa/xóa ghi người + thời điểm | AC-091-02 | Không |
| BR-091-03 | Sort theo `changed_at DESC`, bảng 2 cột | AC-091-01 | Không |
| BR-091-04 | **DRIFT:** `BeaconStationController` thiếu endpoint history (đã xác minh) — SA chốt hướng truy cập | AC-091-03 | Không |
| BR-091-05 | Data scope áp dụng cho lịch sử | AC-091-04 | Cục full |
| BR-091-06 | Permission đọc lịch sử (fallback read/data:read); Admin Cục `view_sensitive` | AC-091-06 | ROLE_SYSTEM_ADMIN vượt qua |

## Domain Model

`InfrastructureHistory` (entityType/entityId, action, fieldName, oldValue, newValue, changedBy, changedAt). `BeaconStationService` ghi history khi create/update/approval/soft-delete.

## 2-level approval flow

Không áp dụng trực tiếp — lịch sử ghi lại các bước của luồng duyệt như sự kiện.

## Validation Rules

- GET `{id}` không tồn tại → 404; ngoài data scope → 403/404.

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-091-01 | AC-091-01 | Happy path: GET history trả đủ entry sort DESC | Integration |
| TS-091-02 | AC-091-02 | Happy path: mỗi bước tạo/sửa/duyệt có entry | Integration |
| TS-091-03 | AC-091-03 | **Drift test:** gọi GET /api/beacon-stations/{id}/history → 404 (endpoint chưa có) — mở blocker cho SA | Integration |
| TS-091-04 | AC-091-04 | Security: ngoài phạm vi → 403/404 | Security |
| TS-091-05 | AC-091-06 | Security: thiếu quyền → 403 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes - target aggregate revision | History từ `infrastructure_history`; cần kênh truy cập cho BeaconStation. |
| Architecture affected? | Medium | Thiếu endpoint history trên `BeaconStationController` — khác BuoyStation; SA chốt hướng. |
| Implementation clear? | Partially | Nguồn history rõ; kênh truy cập là drift cần quyết định. |
| Documentation risk | Medium | Feature-brief F-091 dẫn `GET /api/v1/beacons/{id}/history` — drift: endpoint không tồn tại trên controller thực tế; ghi nhận, không sửa brief. |
| **Verdict** | `Ready for Solution Designer review` | BA spec định nghĩa nguồn history, ghi nhận drift thiếu endpoint. |
