---
feature-id: F-077
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Phê duyệt Phao tiêu

## Summary

Hệ thống cung cấp quy trình phê duyệt 2 cấp cho hồ sơ Phao tiêu: gửi phê duyệt (`POST /api/buoys/{id}/submit-approval`), duyệt cấp Cảng vụ/Chi cục C1 (`POST /{id}/approve-l1`, quyền `buoy:approvec1`/`approvel1`), duyệt cấp Cục C2 (`POST /{id}/approve-l2`, quyền `buoy:approvec2`/`approvel2`), trả về (`POST /{id}/reject`, quyền `buoy:approve`/`data:write`). Trạng thái lưu dạng số theo enum `ApprovalStatus`. Submit được phép từ `DRAFT`/`REJECTED`/`REJECTED_L1`/`REJECTED_L2`/`PENDING_APPROVAL`. Duyệt C1 → `APPROVED_L1` + ghi `level1*`; duyệt C2 → `PUBLISHED` + ghi `level2*` + đồng bộ lên bản đồ (`syncToMapBuoy`). Trả về bắt buộc lý do ≥ 10 ký tự, phân biệt `REJECTED_L1`/`REJECTED_L2` theo trạng thái hiện tại. Theo code hiện tại, **tự duyệt (self-approval) được cho phép** (comment `BR-077-09 relaxed`), khác convention 4-eyes — SA/Dev chốt.

> ⚠ **Drift tài liệu:** brief cũ mô tả entity `Beacon`; hiện trạng là `Buoy` (`/api/buoys`), permission `buoy:*`. Không lan truyền nội dung cũ; không sửa feature-brief.md hay src/**.

## Scope

| | Items |
|---|---|
| In scope | Submit; approve C1 (`approve-l1`); approve C2 (`approve-l2`); reject (lý do bắt buộc); state machine 2 cấp; ghi field phê duyệt #49-#56 từ workflow/session; đồng bộ bản đồ khi duyệt C2; ghi history `APPROVE_L1`/`APPROVE_L2`/`REJECT`; phân quyền `buoy:approvec1`/`approvec2`/`approve`. |
| Out of scope | Tạo (F-074); cập nhật (F-075); xóa (F-076); chi tiết (F-078); lịch sử (F-079); thông báo email/SMS; sửa code trong lượt BA này. |
| Assumptions | Hồ sơ đã có từ F-074/F-075; user đã đăng nhập; 4-eyes hiện tại nới lỏng cho Phao tiêu (code) — SA/Dev chốt chính sách cuối; section kỹ thuật là đề xuất BA để SA chốt. |

### Field Coverage Matrix (feature-scoped — ma trận đầy đủ tại F-074)

| # | Label | Technical field | Control | Required | Visibility / behavior |
|---|---|---|---|---|---|
| — | Quyết định | `status` | Select | Có | `APPROVED`/`APPROVE` = duyệt; `REJECTED`/`REJECT` = trả về. |
| — | Lý do / nội dung | `rejectReason` / `content` | TextArea | Có khi trả về | "Lý do từ chối phải có ít nhất 10 ký tự"; lưu `rejectionReason` + `level1/2ApprovalContent` (trim). |
| — | Cấp phê duyệt | `approvalLevel` | Enum | Không | Endpoint quyết định cấp (approve-l1/approve-l2). |
| 49-50 | Ngày/cán bộ gửi phê duyệt | `submittedForApprovalAt`/`By` | Read-only | Hệ thống ghi | Ghi khi submit. |
| 51-53 | Ngày/cán bộ/nội dung duyệt C1 | `level1ApprovedDate`/`level1ApprovedBy`/`level1ApprovalContent` | Read-only | Hệ thống ghi | Ghi khi approve-l1; nội dung trim nếu không rỗng. |
| 54-56 | Ngày/cán bộ/nội dung duyệt C2 | `level2ApprovedDate`/`level2ApprovedBy`/`level2ApprovalContent` | Read-only | Hệ thống ghi | Ghi khi approve-l2. |
| 46 | Trạng thái | `approvalStatus` | Badge | Không | Lưu số enum `ApprovalStatus`. |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-077-01 | Chuyên viên | Gửi hồ sơ Phao tiêu đi phê duyệt (kể cả sau khi bị trả về) | Thay đổi dữ liệu được kiểm soát 2 cấp | Must Have |
| US-077-02 | Lãnh đạo Cảng vụ/Chi cục | Duyệt hoặc trả về cấp 1 (kèm lý do) | Kiểm soát nghiệp vụ trước khi gửi Cục | Must Have |
| US-077-03 | Lãnh đạo Cục | Duyệt cấp 2 → phao tiêu chính thức hiển thị trên bản đồ | Quyết định cuối cùng + đồng bộ bản đồ | Must Have |
| US-077-04 | Người thao tác | Trả về phân biệt cấp 1/cấp 2 | Theo dõi trạng thái chính xác | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-077-01 | US-077-01 | Submit | Given hồ sơ `DRAFT`/`REJECTED`/`REJECTED_L1`/`REJECTED_L2`/`PENDING_APPROVAL`, user có `buoy:create`/`update`; When submit-approval; Then `PENDING_APPROVAL` + `PROPOSED` + `approvalLevel=1` + ghi #49-#50 | Ngoài các trạng thái trên → chặn (message tiếng Việt). |
| AC-077-02 | US-077-02 | Duyệt C1 | Given hồ sơ `PENDING_APPROVAL`, user có `buoy:approvec1`/`approvel1`; When approve-l1; Then `status=APPROVED_L1` + `approvalStatus=APPROVED` + ghi #51-#53 + history `APPROVE_L1` | Tự duyệt được phép theo code hiện tại (BR-077-09 relaxed). |
| AC-077-03 | US-077-03 | Duyệt C2 | Given hồ sơ `APPROVED_L1`, user có `buoy:approvec2`/`approvel2`; When approve-l2; Then `status=PUBLISHED` + `approvalStatus=APPROVED` + ghi #54-#56 + `syncToMapBuoy` + history `APPROVE_L2` | — |
| AC-077-04 | US-077-04 | Trả về C1 | Given hồ sơ `PENDING_APPROVAL`; When reject có lý do ≥ 10 ký tự; Then `REJECTED_L1` + `REJECTED_LEVEL1` + lưu lý do + history `REJECT` | — |
| AC-077-05 | US-077-04 | Trả về C2 | Given hồ sơ `APPROVED_L1`; When reject có lý do; Then `REJECTED_L2` + `REJECTED_LEVEL2` + lưu lý do | Phân biệt theo trạng thái hiện tại. |
| AC-077-06 | US-077-02 | Trả về thiếu lý do | When reject lý do null/< 10 ký tự; Then từ chối "Lý do từ chối phải có ít nhất 10 ký tự", trạng thái không đổi | — |
| AC-077-07 | US-077-01..03 | Phân quyền | Given thiếu `approvec1`/`approvec2`/`approve`; When gọi endpoint; Then HTTP 403 | — |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-077-01 | Submit chỉ từ `DRAFT`/`REJECTED`/`REJECTED_L1`/`REJECTED_L2`/`PENDING_APPROVAL`; → `PENDING_APPROVAL` + `PROPOSED` + `approvalLevel=1` + ghi #49-#50 | AC-077-01 | Không. |
| BR-077-02 | Duyệt C1 chỉ từ `PENDING_APPROVAL`; → `APPROVED_L1` + `level1ApprovedBy/Date` + `level1ApprovalContent` (trim nếu có) | AC-077-02 | Không. |
| BR-077-03 | Duyệt C2 chỉ từ `APPROVED_L1`; → `PUBLISHED` + `level2*` + `syncToMapBuoy` | AC-077-03 | Không. |
| BR-077-04 | Trả về bắt buộc lý do ≥ 10 ký tự; lưu trim vào `rejectionReason` | AC-077-04/05/06 | Không. |
| BR-077-05 | Trạng thái trả về phân biệt theo trạng thái hiện tại: `APPROVED_L1` → `REJECTED_L2`; ngược lại → `REJECTED_L1`; enum tương ứng `REJECTED_LEVEL2`/`REJECTED_LEVEL1` | AC-077-04/05 | Không. |
| BR-077-06 | Mỗi bước ghi history `APPROVE_L1`/`APPROVE_L2`/`REJECT` (BeaconHistory/`infrastructure_history`) | AC-077-02/03/04/05 | Không. |
| BR-077-07 | Người duyệt từ session (`SecurityUtils.getCurrentUserId()` trong create/update action; approve nhận từ service) — SA chốt nguồn cho approve-l1/l2 | AC-077-02/03 | Không. |
| BR-077-08 | Trạng thái lưu số enum `ApprovalStatus`; không lưu chuỗi | AC-077-01..05 | Không. |
| BR-077-09 | **4-eyes (self-approval): hiện trạng code CHO PHÉP tự duyệt** (`// Self-approval: allowed per user request (BR-077-09 relaxed)` trong `BuoyService.approveL1`); chưa có kiểm tra C2 ≠ C1 — SA/Dev chốt chính sách theo convention `approval-2-level-spec.md` | AC-077-02/03 | ROLE_SYSTEM_ADMIN vẫn theo chính sách chốt. |
| BR-077-10 | Permission: `buoy:approvec1`/`approvel1` (+`data:*`) cho C1; `buoy:approvec2`/`approvel2` cho C2; reject: `buoy:approve`/`data:write` | AC-077-07 | ROLE_SYSTEM_ADMIN. |
| BR-077-11 | Bản ghi đã xóa / không tồn tại không duyệt được | AC-077-01..05 | Không. |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Security | RBAC theo cấp + data scope đọc | 403 khi vi phạm; không duyệt sai cấp. |
| Auditability | Người duyệt từ session; #49-#56 ghi theo workflow | Truy vết đầy đủ. |
| Data integrity | Ghi trạng thái + field + history + sync map trong transaction | Không nửa bước phê duyệt. |
| UX | Message tiếng Việt có dấu; dialog trả về bắt buộc lý do | Không hardcode UI. |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-077-01 | AC-077-01 | Approval: submit từ các trạng thái cho phép → `PENDING_APPROVAL` + #49-#50 | Integration |
| TS-077-02 | AC-077-02 | Approval: approve-l1 → `APPROVED_L1` + #51-#53 + history | Integration |
| TS-077-03 | AC-077-03 | Approval: approve-l2 → `PUBLISHED` + #54-#56 + `syncToMapBuoy` | Integration |
| TS-077-04 | AC-077-06 | Negative: reject thiếu lý do → chặn | Integration |
| TS-077-05 | AC-077-04/05 | Negative: reject C1 → `REJECTED_L1`; reject C2 → `REJECTED_L2` | Integration |
| TS-077-06 | AC-077-01 | Boundary: gửi lại sau reject → thành công, timestamp refresh | Integration |
| TS-077-07 | AC-077-07 | Security: thiếu `approvec1`/`approvec2`/`approve` → 403 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No - reuse | `Buoy` đã có đủ submitted/level1/level2 fields; không thêm field. |
| Architecture affected? | No | 6 endpoint approve/reject/submit đã implement (`BuoyController.java:99-138`); permission đã seed. |
| Implementation clear? | Yes | State machine 2 cấp, lý do bắt buộc, sync map — observable từ code. |
| Documentation risk | Medium | Điểm cần chốt: self-approval hiện được phép (BR-077-09 relaxed) trái convention 4-eyes — SA/Dev quyết. |
| **Verdict** | `Ready for Solution Designer review` | Khớp `BuoyService` submit/approveL1/approveL2/reject; drift 4-eyes được nêu rõ. |
