---
feature-id: F-089
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Phê duyệt Nhà trạm đèn

## Summary

Tính năng thực hiện quy trình phê duyệt cho hồ sơ Nhà trạm đèn (`BeaconStation`, `@Table beacon_light`) theo `docs/conventions/approval-2-level-spec.md` mục 3. **DRIFT QUAN TRỌNG (đã xác minh code):** `BeaconStationController` (`/api/beacon-stations`) hiện CHỈ có `POST /{id}/submit-approval`, `POST /{id}/approve-l1`, `POST /{id}/reject` — **KHÔNG có endpoint `approve-l2`** (khác `BuoyStationController` có đủ approve-l1/approve-l2). `BeaconStationService` cũng chỉ có `submitForApproval`, `approveL1`, `reject` (không có `approveL2`). Do đó luồng C2 cho Nhà trạm đèn chưa được code hỗ trợ: tài liệu ghi nhận drift, đề xuất SA chốt (bổ sung approve-l2 hoặc chấp nhận 1 cấp + ghi rõ). Trạng thái: `DRAFT`(String "DRAFT") → `PENDING_APPROVAL` → `APPROVED_LEVEL1` → `APPROVED`; reject → `REJECTED_LEVEL1`/`REJECTED_LEVEL2`. `approvalStatus` lưu STRING (`@Enumerated(EnumType.STRING)`) — drift vs AGENTS.md. Chống tự duyệt, lý do từ chối ≥ 10 ký tự.

## Scope

| | Items |
|---|---|
| In scope | Submit; approve C1; reject C1/C2 với lý do bắt buộc; ghi `approvedBy/approvedDate/rejectionReason`; cập nhật `approvalStatus`/`approvalLevel`; chống tự duyệt; phân cấp theo đơn vị; notification; phân quyền `beaconstation:approvec1` (+ `approvel1` legacy). |
| Out of scope | Sửa (F-087); xóa (F-088); lịch sử (F-091); bổ sung endpoint approve-l2 (là quyết định SA/Dev — ghi nhận drift, không tự sửa); migration. |
| Assumptions | User đăng nhập; quyền theo chức vụ; phần kỹ thuật là đề xuất BA, SA chốt. |

### Field Coverage Matrix

Nguồn: Excel sheet "QL Đèn biển và nhà trạm" (line ~113). Cột DS = Danh sách, Lọc = Bộ lọc, CT = Xem chi tiết, Tạo/Sửa = Form tạo mới/chỉnh sửa. Với F-089 các trường #49-#57 là output của luồng duyệt.

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
| 49 | Ngày gửi phê duyệt | submittedAt (history) | Textarea | — | Có | Không | Có | Không | Không |
| 50 | Cán bộ gửi phê duyệt | submittedBy (history) | Textarea | — | Có | Không | Có | Không | Không |
| 51 | Ngày phê duyệt cấp Cảng vụ/Chi cục | `level1ApprovedDate`* | Textarea | — | Có | Không | Có | Không | Không |
| 52 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | `level1ApprovedBy`* | Textarea | — | Có | Không | Có | Không | Không |
| 53 | Nội dung phê duyệt | `level1ApprovalContent`* | Textarea | — | Không | Không | Có | Không | Không |
| 54 | Ngày phê duyệt cấp Cục | `level2ApprovedDate`* | Textarea | — | Có | Không | Có | Không | Không |
| 55 | Cán bộ phê duyệt cấp Cục | `level2ApprovedBy`* | Textarea | — | Có | Không | Có | Không | Không |
| 56 | Nội dung phê duyệt | `level2ApprovalContent`* | Textarea | — | Không | Không | Có | Không | Không |
| 57 | Trạng thái | `approvalStatus` | Select (Dropdown) | — | Có | Có | Có | Không | Không |

> \* `BeaconStation` entity không có cột level1/level2/sent riêng (chỉ `approvedBy/approvedDate/rejectionReason`); các trường này lấy từ history hoặc bổ sung — SA chốt.

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-089-01 | Chuyên viên | Gửi hồ sơ đi phê duyệt | Đưa hồ sơ vào quy trình | Must Have |
| US-089-02 | Lãnh đạo Cảng vụ/Chi cục | Duyệt/trả về vòng 1 | Kiểm soát nghiệp vụ | Must Have |
| US-089-03 | Lãnh đạo Cục | Duyệt/trả về vòng 2 | Xác nhận cuối cùng | Must Have |
| US-089-04 | Mọi người duyệt | Không tự duyệt hồ sơ mình gửi | 4-eyes | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-089-01 | US-089-01 | Submit | Given hồ sơ `DRAFT` + quyền create/update; When POST `/{id}/submit-approval`; Then chuyển `PENDING_APPROVAL` (hoặc `APPROVED_LEVEL1` nếu gửi từ cấp Cục) | Không submit hồ sơ đang chờ |
| AC-089-02 | US-089-02 | Approve C1 | Given `PENDING_APPROVAL` + `beaconstation:approvec1`; When POST `/{id}/approve-l1`; Then `APPROVED_LEVEL1`, ghi `approvedBy/approvedDate` | Chống tự duyệt |
| AC-089-03 | US-089-02 | Reject | Given `PENDING_APPROVAL`; When POST `/{id}/reject` + `rejectReason`; Then `REJECTED_LEVEL1`, lưu lý do | Lý do ≥ 10 ký tự |
| AC-089-04 | US-089-03 | Approve C2 (DRIFT) | Given `APPROVED_LEVEL1` + quyền C2; When gọi approve-l2; Then **endpoint KHÔNG tồn tại trên controller hiện tại** — cần SA chốt bổ sung | Ghi nhận drift, không tự code |
| AC-089-05 | US-089-04 | Chống tự duyệt | Given user là người gửi; When approve; Then 403 | 4-eyes |
| AC-089-06 | US-089-02 | Phân quyền | Given thiếu quyền; When approve/reject; Then 403 | `@PreAuthorize` |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-089-01 | Quy trình 2 cấp theo approval-2-level-spec mục 3: submit → approve-l1 → approve-l2/reject, không nhảy vòng | AC-089-01..03 | Người gửi cấp Cục bỏ vòng 1 |
| BR-089-02 | **DRIFT:** `BeaconStationController` thiếu endpoint `approve-l2` (đã xác minh `BeaconStationController.java` chỉ có submit-approval/approve-l1/reject/attachments; `BeaconStationService` không có approveL2) — SA chốt bổ sung hoặc chấp nhận 1 cấp | AC-089-04 | Không |
| BR-089-03 | Chống tự duyệt (4-eyes) | AC-089-05 | Không |
| BR-089-04 | Reject bắt buộc lý do ≥ 10 ký tự | AC-089-03 | Không |
| BR-089-05 | Mỗi gửi/duyệt/từ chối ghi người + thời điểm | AC-089-01..03 | Không |
| BR-089-06 | **DRIFT enum:** `approvalStatus` của `BeaconStation` lưu STRING (`@Enumerated(EnumType.STRING)`), trái AGENTS.md INT+ORDINAL; `status` String "DRAFT"; `@PrePersist` đặt `PENDING_APPROVAL` nếu null | AC-089-01 | Không bịa INT storage |
| BR-089-07 | Permission `beaconstation:approvec1`/`approvel1` (fallback `data:approvec1`/`data:approvel1`); reject dùng `approvec1`/`approvec2` | AC-089-06 | ROLE_SYSTEM_ADMIN vượt qua |
| BR-089-08 | Hiển thị trạng thái qua `ApprovalStatusBadge`/`normalizeApprovalStatus` | AC-089-02..04 | Không |

## Domain Model

`BeaconStation.approvalStatus` (STRING enum), `approvalLevel` (Integer), `approvedBy/approvedDate`, `rejectionReason`. Thiếu cột level1/level2/sent — các trường Excel #49-#56 cần nguồn từ history hoặc bổ sung cột (SA chốt).

## 2-level approval flow

| Từ | Hành động | Sang | Ai |
|---|---|---|---|
| DRAFT | submit | PENDING_APPROVAL (hoặc APPROVED_LEVEL1 từ cấp Cục) | Người nhập |
| PENDING_APPROVAL | approve-l1 | APPROVED_LEVEL1 | Cảng vụ/Chi cục |
| PENDING_APPROVAL | reject | REJECTED_LEVEL1 | Cảng vụ/Chi cục |
| APPROVED_LEVEL1 | approve-l2 | APPROVED | Cục — **endpoint hiện chưa có (drift)** |
| APPROVED_LEVEL1 | reject | REJECTED_LEVEL2 | Cục |
| REJECTED_* | sửa + gửi lại | PENDING_APPROVAL | Người nhập |

## Validation Rules

- Submit từ `DRAFT`; approve-l1 từ `PENDING_APPROVAL`.
- Reject: `rejectReason` ≥ 10 ký tự.
- Chống tự duyệt; thiếu quyền → 403; approver lấy từ session.

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-089-01 | AC-089-01 | Happy path: submit DRAFT → PENDING_APPROVAL | Integration |
| TS-089-02 | AC-089-02 | Approval: approve-l1 → APPROVED_LEVEL1 | Integration |
| TS-089-03 | AC-089-03 | Negative: reject thiếu lý do → 400 | Integration |
| TS-089-04 | AC-089-04 | **Drift test:** gọi approve-l2 → 404 (endpoint chưa tồn tại) — mở blocker cho SA | Integration |
| TS-089-05 | AC-089-05 | Security: tự duyệt → 403 | Security |
| TS-089-06 | AC-089-06 | Security: thiếu quyền → 403 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes - target aggregate revision | Thiếu approveL2 + cột level1/level2/sent trên `BeaconStation`; cần SA chốt. |
| Architecture affected? | Medium | Endpoint approve-l2 chưa tồn tại — khác biệt rõ với BuoyStation; permission C2 có thể đã seed. |
| Implementation clear? | Partially | Vòng C1 + reject rõ; vòng C2 là drift cần quyết định (bổ sung endpoint hay chấp nhận 1 cấp). |
| Documentation risk | Medium | Feature-brief F-089 dẫn `POST /api/v1/beacons/{id}/approve` — drift: endpoint thực tế `/{id}/approve-l1` + `/{id}/reject`; ghi nhận, không sửa brief. |
| **Verdict** | `Ready for Solution Designer review` | BA spec định nghĩa state machine, ghi nhận drift thiếu approve-l2 và enum STRING. |
