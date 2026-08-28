---
feature-id: F-085
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Lịch sử Nhà trạm phao

## Summary

Tính năng cho phép người dùng có quyền `buoystation:history`/`buoystation:read` xem lịch sử thay đổi của hồ sơ Nhà trạm phao (`BuoyStation`, `@Table buoy_station`) qua `GET /api/v1/buoy-station/{id}/history`. Nguồn dữ liệu là bảng tập trung `infrastructure_history` (quy ước Audit Trail chung — bỏ `change_logs`/`approval_logs`): mỗi lần tạo, sửa (diff), gửi duyệt, duyệt C1/C2, từ chối, xóa mềm đều ghi một entry với người thực hiện + thời điểm + nội dung thay đổi. Lịch sử hiển thị dạng bảng 2 cột (thời gian, nội dung/người thực hiện), mở từ menu dòng `rowActions` -> "Lịch sử".

## Scope

| | Items |
|---|---|
| In scope | GET lịch sử theo `{id}`; truy vấn `infrastructure_history` (hoặc cơ chế history service hiện có); hiển thị tạo/sửa/duyệt/từ chối/xóa với người + thời điểm; phân quyền `buoystation:history`/`read`; data scope theo `unitId`. |
| Out of scope | Sửa (F-081); duyệt (F-083); chi tiết (F-084); migration; export. |
| Assumptions | User đăng nhập có quyền đọc lịch sử; hồ sơ thuộc phạm vi đơn vị; phần kỹ thuật là đề xuất BA, SA chốt. |

### Field Coverage Matrix

Nguồn: Excel sheet "QL Nhà trạm phao tiêu" (sheet thay thế cho "QL Nhà trạm phao"). Cột DS = Danh sách, Lọc = Bộ lọc, CT = Xem chi tiết, Tạo/Sửa = Form tạo mới/chỉnh sửa. Với F-085, các trường #40-#50 thể hiện trạng thái hiện tại; lịch sử là tập các entry biến đổi theo thời gian.

| # | Label | Technical field | Control | Required | DS | Lọc | CT | Tạo | Sửa |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Mã nhà trạm | `code` | Input (disabled, tự sinh `NT-{seq}`) | Không (auto) | Có | Có | Có | Có | Có |
| 2 | Tên nhà trạm | `name` | InputTextArea | **Có** | Có | Có | Có | Có | Có |
| 3 | Đơn vị quản lý | `unitId` | SelectOrgCode | **Có (khi tạo)** | Có | Có | Có | Có | Có |
| 4 | Đơn vị khai thác | `operatingOrgId` | SelectCateOther | **Có** | Có | Không | Có | Có | Có |
| 5 | Thuộc cảng biển | `portId` | SelectKcht (CB) | Không | Có | Có | Có | Có | Có |
| 6 | Thuộc luồng hàng hải | `waterwayId` | SelectKcht (LHH) | **Có** | Có | Có | Có | Có | Có |
| 7 | Tuyến luồng hàng hải | `waterwayRouteId` | SelectKcht (LHH_TL) | Không | Không | Không | Có | Có | Có |
| 8 | Địa điểm (Tỉnh/TP) | `province` / `provinceId` | SelectCateOther | **Có** | Không | Có | Có | Có | Có |
| 9 | Địa điểm chi tiết | `address` | InputTextArea | Không | Không | Không | Có | Có | Có |
| 10 | Thời điểm xây dựng | `constructionDate` | DatePicker | Không | Không | Không | Có | Có | Có |
| 11 | Tình trạng | `condition` (entity còn `status` StationStatus) | SelectAppParams | **Có** | Có | Có | Có | Có | Có |
| 12 | Tổng diện tích (m²) | `totalArea` | InputDecimal | Không | Không | Không | Có | Có | Có |
| 13 | Diện tích sử dụng (m²) | `usableArea` | InputDecimal | Không | Không | Không | Có | Có | Có |
| 14 | Số lượng nhân sự bố trí | `staffCount` | Input | **Có** | Không | Không | Có | Có | Có |
| 15 | Năm bảo trì gần nhất | `lastMaintenanceYear` | DatePicker (năm) | Không | Không | Không | Có | Có | Có |
| 16 | Ghi chú | `note` | InputTextArea | Không | Không | Không | Có | Có | Có |
| 17 | Loại đối tượng | `objectType` / `geometryType` | Select (Điểm/Đường/Vùng) | Không | Không | Không | Có | Có | Có |
| 18 | Biểu tượng | `icon` | Select | Không | Không | Không | Có | Có | Có |
| 19 | Hệ quy chiếu | `coordinateSystem` | Text | Không | Không | Không | Có | Có | Có |
| 20 | Quy tắc hiển thị | `displayFormat` | Text | Không | Không | Không | Có | Có | Có |
| 21 | Tọa độ GIS | `latitude`/`longitude`/`coordinates` | LocationInformationForm | Không | Không | Không | Có | Có | Có |
| 22 | File đính kèm | `attachments` | UploadFileTable | Không | Không | Không | Có | Có | Có |
| 23-39 | Phao tiêu + vận hành/bảo trì/sự cố | `buoy.*`, `operationPlan*`, `maintenancePlan*`, `incident*` | Text (read-only) | — | 25,26: Có | 25,26: Có | Có | Không | Không |
| 40 | Trạng thái | `approvalStatus` | Badge (read-only) | — | Có | Có | Có | Không | Không |
| 41 | Ngày cập nhật | `updatedAt` | Text (read-only) | — | Có | Có | Có | Không | Không |
| 42 | Cán bộ cập nhật | `updatedBy` | Text (read-only) | — | Có | Không | Có | Không | Không |
| 43-50 | Thông tin gửi/phê duyệt C1/C2 | `sentApproved*`, `level1/level2Approved*`, `level1/level2ApprovalContent` | Text (read-only) | — | 43-46,48,49: Có | Không | Có | Không | Không |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-085-01 | Người xem | Xem ai đã thay đổi gì, khi nào trên hồ sơ | Truy vết trách nhiệm | Must Have |
| US-085-02 | Admin Cục | Xem toàn bộ lịch sử kể cả metadata nhạy cảm | Kiểm toán đầy đủ | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-085-01 | US-085-01 | GET lịch sử | Given hồ sơ tồn tại và user có `buoystation:history`/`read`; When GET `/api/v1/buoy-station/{id}/history`; Then trả các entry từ `infrastructure_history` sort theo thời gian DESC, mỗi entry có action + người + thời điểm | Không dùng `change_logs`/`approval_logs` |
| AC-085-02 | US-085-01 | Ghi nhận đủ sự kiện | Given hồ sơ đã trải qua tạo/sửa/gửi duyệt/duyệt/từ chối; When xem lịch sử; Then mỗi sự kiện có entry tương ứng | Ghi log tại thời điểm thao tác |
| AC-085-03 | US-085-01 | Data scope | Given hồ sơ ngoài phạm vi; When GET history; Then 403/404 | `@Filter` + `@DataScope` |
| AC-085-04 | US-085-02 | Admin Cục | Given user Admin Cục; When xem; Then thấy cả metadata nhạy cảm | view_sensitive |
| AC-085-05 | US-085-01 | Phân quyền | Given user thiếu quyền; When GET; Then 403 | `@PreAuthorize` |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-085-01 | Lịch sử truy vấn từ bảng tập trung duy nhất `infrastructure_history`; bỏ `change_logs`, `approval_logs` | AC-085-01 | Không |
| BR-085-02 | Mỗi lần gửi duyệt/duyệt/từ chối/sửa/xóa ghi người thực hiện + thời điểm | AC-085-02 | Không |
| BR-085-03 | Sort theo `changed_at DESC`; hiển thị dạng bảng 2 cột (thời gian, nội dung/người) | AC-085-01 | Không |
| BR-085-04 | Data scope áp dụng cho lịch sử như hồ sơ chính | AC-085-03 | Cục full scope |
| BR-085-05 | Permission `buoystation:history` (fallback `buoystation:read`/`data:read`); Admin Cục thêm `view_sensitive` | AC-085-05 | ROLE_SYSTEM_ADMIN vượt qua |

## Domain Model

`InfrastructureHistory` (bảng tập trung): entityType/entityId, action, fieldName, oldValue, newValue, changedBy, changedAt. `BuoyStationService` ghi history khi create/update/approval/soft-delete (qua `StationHistoryService`/`ApprovalHistoryUtils.recordSoftDelete`).

## 2-level approval flow

Không áp dụng trực tiếp — lịch sử ghi lại các bước của luồng duyệt (submit/approve/reject) như các sự kiện.

## Validation Rules

- GET `{id}` không tồn tại → 404.
- Ngoài data scope → 403/404.

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-085-01 | AC-085-01 | Happy path: GET history trả đủ entry sort DESC | Integration |
| TS-085-02 | AC-085-02 | Happy path: tạo → sửa → gửi duyệt → duyệt C1/C2 mỗi bước có entry | Integration |
| TS-085-03 | AC-085-03 | Security: GET history hồ sơ ngoài phạm vi → 403/404 | Security |
| TS-085-04 | AC-085-05 | Security: thiếu quyền → 403 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes - target aggregate revision | History từ `infrastructure_history`; cần verify service ghi đủ sự kiện. |
| Architecture affected? | Low | `GET /api/v1/buoy-station/{id}/history` đã tồn tại trên controller. |
| Implementation clear? | Yes | Nguồn history, sort, permission và data scope rõ ràng. |
| Documentation risk | Medium | Feature-brief F-085 dẫn `GET /api/v1/buoys/{id}/history` — drift: endpoint thực tế `/api/v1/buoy-station/{id}/history`; ghi nhận, không sửa brief. |
| **Verdict** | `Ready for Solution Designer review` | BA spec định nghĩa nguồn history tập trung, sự kiện ghi nhận và permission. |
