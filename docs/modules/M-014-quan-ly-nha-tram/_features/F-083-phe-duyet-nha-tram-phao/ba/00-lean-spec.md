---
feature-id: F-083
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Phê duyệt Nhà trạm phao

## Summary

Tính năng thực hiện quy trình phê duyệt 2 cấp cho hồ sơ Nhà trạm phao (`BuoyStation`, `@Table buoy_station`) theo `docs/conventions/approval-2-level-spec.md` mục 3: submit → approve-l1 (Cảng vụ/Chi cục) → approve-l2 (Cục) / reject. Endpoints thực tế trên `BuoyStationController` (`/api/v1/buoy-station`): `POST /{id}/submit-approval`, `POST /{id}/approve-l1`, `POST /{id}/approve-l2`, `POST /{id}/reject`. 7 trạng thái chuẩn: `DRAFT` → `PENDING_APPROVAL` → `APPROVED_LEVEL1` → `APPROVED`; reject → `REJECTED_LEVEL1`/`REJECTED_LEVEL2`; xóa mềm → `ARCHIVED`. Chống tự duyệt (4-eyes), lý do từ chối ≥ 10 ký tự, phân cấp theo `OrgUnit.level` (người gửi cấp Cục bỏ vòng 1). Enum `approvalStatus` của `BuoyStation` lưu ORDINAL + smallint (đúng AGENTS.md).

## Scope

| | Items |
|---|---|
| In scope | Submit (gửi duyệt); approve C1; approve C2; reject C1/C2 kèm lý do bắt buộc; ghi `level1/level2ApprovedBy/Date` + `level1/level2ApprovalContent`; cập nhật `approvalStatus`/`approvalLevel`; chống tự duyệt; phân cấp theo đơn vị; notification; phân quyền `buoystation:approvec1`/`approvec2`. |
| Out of scope | Sửa (F-081); xóa (F-082); lịch sử (F-085); tạo mới (F-080); migration. |
| Assumptions | User đăng nhập; quyền gắn với chức vụ (lãnh đạo Cảng vụ/Chi cục duyệt vòng 1, lãnh đạo Cục duyệt vòng 2); phần kỹ thuật là đề xuất BA, SA chốt. |

### Field Coverage Matrix

Nguồn: Excel sheet "QL Nhà trạm phao tiêu" (sheet thay thế cho "QL Nhà trạm phao"). Cột DS = Danh sách, Lọc = Bộ lọc, CT = Xem chi tiết, Tạo/Sửa = Form tạo mới/chỉnh sửa. Với F-083 các trường #40, #43-#50 là output của luồng duyệt.

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
| 43 | Ngày gửi phê duyệt | `sentApprovedDate` | Text (read-only) | — | Có | Không | Có | Không | Không |
| 44 | Cán bộ gửi phê duyệt | `sentApprovedBy` | Text (read-only) | — | Có | Không | Có | Không | Không |
| 45 | Ngày phê duyệt cấp Cảng vụ/Chi cục | `level1ApprovedDate` | Text (read-only) | — | Có | Không | Có | Không | Không |
| 46 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | `level1ApprovedBy` | Text (read-only) | — | Có | Không | Có | Không | Không |
| 47 | Nội dung phê duyệt | `level1ApprovalContent` | Text (read-only) | — | Không | Không | Có | Không | Không |
| 48 | Ngày phê duyệt cấp Cục | `level2ApprovedDate` | Text (read-only) | — | Có | Không | Có | Không | Không |
| 49 | Cán bộ phê duyệt cấp Cục | `level2ApprovedBy` | Text (read-only) | — | Có | Không | Có | Không | Không |
| 50 | Nội dung phê duyệt | `level2ApprovalContent` | Text (read-only) | — | Không | Không | Có | Không | Không |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-083-01 | Chuyên viên | Gửi hồ sơ nhà trạm đi phê duyệt | Đưa hồ sơ vào quy trình 2 cấp | Must Have |
| US-083-02 | Lãnh đạo Cảng vụ/Chi cục | Duyệt/trả về vòng 1 | Kiểm soát nghiệp vụ trước khi gửi Cục | Must Have |
| US-083-03 | Lãnh đạo Cục | Duyệt/trả về vòng 2 | Xác nhận cuối cùng hồ sơ có hiệu lực | Must Have |
| US-083-04 | Mọi người duyệt | Không tự duyệt hồ sơ mình gửi | 4-eyes principle | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-083-01 | US-083-01 | Submit hồ sơ DRAFT | Given hồ sơ `DRAFT` và user có `buoystation:create`/`update`; When POST `/{id}/submit-approval`; Then chuyển `PENDING_APPROVAL` (hoặc `APPROVED_LEVEL1` nếu user thuộc cấp Cục), ghi `sentApprovedBy`/`sentApprovedDate` | Không submit hồ sơ đang chờ duyệt |
| AC-083-02 | US-083-02 | Approve C1 | Given hồ sơ `PENDING_APPROVAL` và user có `buoystation:approvec1`; When POST `/{id}/approve-l1`; Then `APPROVED_LEVEL1`, ghi `level1ApprovedBy/Date` | Chống tự duyệt: không duyệt hồ sơ mình gửi |
| AC-083-03 | US-083-02 | Reject C1 | Given hồ sơ `PENDING_APPROVAL`; When POST `/{id}/reject` với `rejectReason`; Then `REJECTED_LEVEL1`, lưu `rejectionReason` | Lý do ≥ 10 ký tự, bắt buộc |
| AC-083-04 | US-083-03 | Approve C2 | Given hồ sơ `APPROVED_LEVEL1` và user có `buoystation:approvec2`; When POST `/{id}/approve-l2`; Then `APPROVED`, ghi `level2ApprovedBy/Date` + `level2ApprovalContent` | Không nhảy vòng: `PENDING_APPROVAL` → `APPROVED` bị chặn |
| AC-083-05 | US-083-03 | Reject C2 | Given hồ sơ `APPROVED_LEVEL1`; When reject; Then `REJECTED_LEVEL2`, lưu lý do | Re-submit quay về vòng 1 |
| AC-083-06 | US-083-04 | Chống tự duyệt | Given user là người gửi hồ sơ; When gọi approve; Then 403 | 4-eyes principle |
| AC-083-07 | US-083-02 | Phân quyền | Given user thiếu `approvec1`/`approvec2`; When gọi approve/reject; Then 403 | `@PreAuthorize` trên controller |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-083-01 | Quy trình 2 cấp: submit → approve-l1 → approve-l2 / reject, đúng thứ tự, không nhảy vòng | AC-083-01..05 | Người gửi cấp Cục (theo `OrgUnit.level`) bỏ vòng 1 |
| BR-083-02 | Chống tự duyệt: người duyệt không duyệt hồ sơ do mình gửi | AC-083-06 | Không |
| BR-083-03 | Reject bắt buộc nhập lý do, tối thiểu 10 ký tự | AC-083-03, AC-083-05 | Không |
| BR-083-04 | Mỗi lần gửi/duyệt/từ chối ghi người thực hiện + thời điểm (sentApproved*, level1/level2Approved*, rejectionReason) | AC-083-01..05 | Không |
| BR-083-05 | Re-submit sau reject (cả vòng 1 và vòng 2) luôn quay về vòng 1 `PENDING_APPROVAL` | AC-083-05 | Không |
| BR-083-06 | Enum `approvalStatus` lưu ORDINAL + smallint (`buoy_station.approval_status`); 7 trạng thái chuẩn, không dùng legacy `PROPOSED`/`APPROVED_LEVEL2`/`REJECTED` | AC-083-02..05 | Legacy chỉ để đọc dữ liệu cũ |
| BR-083-07 | Permission `buoystation:approvec1`/`approvec2` (fallback `data:approvec1`/`data:approvec2`/legacy `buoystation:approvel1`/`approvel2`) | AC-083-07 | ROLE_SYSTEM_ADMIN vượt qua |
| BR-083-08 | Hiển thị trạng thái qua `ApprovalStatusBadge`/`normalizeApprovalStatus` — nguồn nhãn duy nhất | AC-083-02..05 | Không |

## Domain Model

`BuoyStation.approvalStatus` (ORDINAL smallint, default 0 = `DRAFT`), `approvalLevel` (ApprovalLevel ORDINAL), `approvedBy/approvedDate`, `level1ApprovedBy/Date`, `level2ApprovedBy/Date`, `sentApprovedBy/Date`, `rejectionReason`, `level1/level2ApprovalContent`. Dùng chung `InfrastructureApprovalService` nếu có; CẤM tự viết lại điều kiện.

## 2-level approval flow

| Từ | Hành động | Sang | Ai |
|---|---|---|---|
| DRAFT | submit | PENDING_APPROVAL (hoặc APPROVED_LEVEL1 nếu gửi từ cấp Cục) | Người nhập |
| PENDING_APPROVAL | approve-l1 | APPROVED_LEVEL1 | Lãnh đạo Cảng vụ/Chi cục |
| PENDING_APPROVAL | reject | REJECTED_LEVEL1 | Lãnh đạo Cảng vụ/Chi cục |
| APPROVED_LEVEL1 | approve-l2 | APPROVED | Lãnh đạo Cục |
| APPROVED_LEVEL1 | reject | REJECTED_LEVEL2 | Lãnh đạo Cục |
| REJECTED_* | sửa + gửi lại | PENDING_APPROVAL | Người nhập |

## Validation Rules

- Submit chỉ từ `DRAFT`; approve-l1 chỉ từ `PENDING_APPROVAL`; approve-l2 chỉ từ `APPROVED_LEVEL1`.
- Reject: `rejectReason` bắt buộc, ≥ 10 ký tự.
- Chống tự duyệt; thiếu quyền → 403.
- Không nhận approver từ client (lấy từ session/`SecurityUtils.getCurrentUserId()`).

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-083-01 | AC-083-01 | Happy path: submit DRAFT → PENDING_APPROVAL, ghi sentApproved* | Integration |
| TS-083-02 | AC-083-02 | Approval: approve-l1 → APPROVED_LEVEL1 + ghi level1Approved* | Integration |
| TS-083-03 | AC-083-03 | Negative: reject thiếu lý do/ngắn → 400 | Integration |
| TS-083-04 | AC-083-04 | Approval: approve-l2 → APPROVED + ghi level2Approved* | Integration |
| TS-083-05 | AC-083-04 | Negative: approve-l2 từ PENDING_APPROVAL (nhảy vòng) → 400/409 | Integration |
| TS-083-06 | AC-083-06 | Security: tự duyệt hồ sơ mình gửi → 403 | Security |
| TS-083-07 | AC-083-07 | Security: thiếu approvec1/approvec2 → 403 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes - target aggregate revision | Cần kiểm tra `InfrastructureApprovalService` có phủ `BuoyStation` hay service hiện có tự quản lý state. |
| Architecture affected? | Low/Medium | Endpoints submit/approve-l1/approve-l2/reject đã tồn tại trên `/api/v1/buoy-station`; permission `buoystation:*`. |
| Implementation clear? | Yes | 7 trạng thái, 2 vòng, chống tự duyệt, lý do từ chối ≥ 10 ký tự là rõ ràng. |
| Documentation risk | Medium | Feature-brief F-083 dẫn `POST /api/v1/buoys/{id}/approve` — drift: endpoint thực tế `/{id}/approve-l1` + `/{id}/approve-l2` + `/{id}/reject`; ghi nhận, không sửa brief. |
| **Verdict** | `Ready for Solution Designer review` | BA spec định nghĩa state machine 2 cấp, chống tự duyệt, lý do từ chối và permission boundary. |
