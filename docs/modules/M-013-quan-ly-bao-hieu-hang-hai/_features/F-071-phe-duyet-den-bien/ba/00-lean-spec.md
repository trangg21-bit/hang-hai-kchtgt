---
feature-id: F-071
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Phê duyệt Đèn biển (và nhà trạm)

## Summary

Hệ thống cung cấp luồng phê duyệt hồ sơ Đèn biển: gửi phê duyệt (submit), phê duyệt/trả về cấp Cảng vụ/Chi cục (C1, quyền `beaconstation:approvec1`), phê duyệt cấp Cục (C2, quyền `beaconstation:approvec2` — mục tiêu theo Excel #54-#56). Trạng thái lưu dạng số theo enum `ApprovalStatus` (DRAFT=0, PROPOSED=1, PENDING_APPROVAL=2, APPROVED=5, REJECTED=6, ARCHIVED=7, REJECTED_LEVEL1=8, REJECTED_LEVEL2=9). Tuân thủ 4-eyes principle ở cấp 1 (người tạo không tự duyệt). Lý do từ chối bắt buộc ≥ 10 ký tự. Mỗi bước ghi history (`APPROVE_L1`/`REJECT`...).

> ⚠ **Drift & hiện trạng code (ghi nhận, không lan truyền):** (1) brief cũ mô tả entity `Beacon`; hiện trạng `BeaconStation` (`/api/beacon-stations`). (2) Hiện trạng `BeaconStationController` chỉ có `POST /{id}/approve-l1` và `POST /{id}/reject` — **chưa có endpoint approve-l2**; `approveL1` đưa thẳng về `APPROVED` (đơn cấp), `reject` đưa về `DRAFT` + `REJECTED` (chưa phân biệt REJECTED_LEVEL1/2) — lệch mục tiêu 2 cấp của Excel/convention; SA/Dev chốt bổ sung approve-l2. (3) `approve-l1`/`reject` nhận `approverId` qua `@RequestParam` từ client thay vì từ `Authentication` — lệch convention, SA/Dev chốt sửa. (4) endpoint `reject` **thiếu `@PreAuthorize`** (bảo mật). Không sửa feature-brief.md hay src/**.

## Scope

| | Items |
|---|---|
| In scope | Submit (`POST /{id}/submit-approval`); approve C1 (`POST /{id}/approve-l1`); reject (`POST /{id}/reject`, lý do bắt buộc); state machine; 4-eyes cấp 1; ghi history; phân quyền `beaconstation:approvec1`/`approvel1`; mục tiêu C2 (`approvec2`/`approvel2`) theo Excel #54-#56. |
| Out of scope | Cập nhật sau duyệt (F-069); xóa (F-070); màn chi tiết (F-072); lịch sử (F-073); thông báo email/SMS; sửa code trong lượt BA này. |
| Assumptions | Hồ sơ đã tồn tại từ F-068/F-069; user đã đăng nhập; 4-eyes đối chiếu người tạo (created_by) với người duyệt; C2 là bước đích cần SA/Dev bổ sung. |

### Field Coverage Matrix (feature-scoped — ma trận đầy đủ tại F-068)

| # | Label | Technical field | Control | Required | Visibility / behavior |
|---|---|---|---|---|---|
| — | Quyết định | `status` | Select | Có | Payload phê duyệt: `APPROVED`/`APPROVE` = duyệt; `REJECTED`/`REJECT` = trả về (theo endpoint). |
| — | Lý do / nội dung | `rejectReason` | TextArea | Có khi trả về | "Lý do từ chối phải có ít nhất 10 ký tự"; lưu `rejectionReason`. |
| — | Cấp phê duyệt | `approvalLevel` | Enum | Không | Endpoint quyết định cấp; payload không quyết định. |
| — | Người duyệt | `approverId` | — | Có | Hiện trạng nhận `@RequestParam` từ client (drift); mục tiêu: lấy từ `Authentication`. |
| 49-50 | Ngày/cán bộ gửi phê duyệt | `submittedForApprovalAt`/`By` | Read-only | Hệ thống ghi | Entity Đèn biển hiện chưa có cột — nguồn workflow, SA chốt. |
| 51-53 | Ngày/cán bộ/nội dung duyệt C1 | `level1ApprovedDate`/`level1ApprovedBy`/`level1ApprovalContent` | Read-only | Hệ thống ghi | Entity hiện dùng `approvedBy`/`approvedDate` cho bước duyệt C1 — SA chốt ánh xạ. |
| 54-56 | Ngày/cán bộ/nội dung duyệt C2 | `level2ApprovedDate`/`level2ApprovedBy`/`level2ApprovalContent` | Read-only | Hệ thống ghi | Chưa có endpoint/ghi nhận C2 cho Đèn biển (drift). |
| 57 | Trạng thái | `approvalStatus` | Badge | Không | Lưu số theo enum `ApprovalStatus`. |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-071-01 | Chuyên viên | Gửi hồ sơ Đèn biển đi phê duyệt | Thay đổi dữ liệu được kiểm soát | Must Have |
| US-071-02 | Lãnh đạo Cảng vụ/Chi cục | Duyệt hoặc trả về cấp 1 (kèm lý do) | Kiểm soát nghiệp vụ trước khi gửi Cục | Must Have |
| US-071-03 | Lãnh đạo Cục | Duyệt cấp 2 (mục tiêu) | Quyết định cuối cùng | Must Have |
| US-071-04 | Người thao tác | Hệ thống chặn tự duyệt | Đảm bảo nguyên tắc 4 mắt | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-071-01 | US-071-01 | Submit | Given hồ sơ `DRAFT`, user có `beaconstation:create`/`update`; When submit-approval; Then `status=PENDING_APPROVAL`, `approvalStatus=PROPOSED`, `approvalLevel=1` | Chỉ từ `DRAFT` (hiện trạng code). |
| AC-071-02 | US-071-02 | Duyệt C1 | Given hồ sơ `PENDING_APPROVAL`, user có `beaconstation:approvec1`/`approvel1`, không phải người tạo; When approve-l1; Then `status=APPROVED`, `approvalStatus=APPROVED`, ghi `approvedBy`/`approvedDate`, history `APPROVE_L1` | 4-eyes. |
| AC-071-03 | US-071-04 | Chống tự duyệt | Given người gọi là người tạo; When approve-l1; Then từ chối "Bạn không thể phê duyệt bản do chính mình gửi" | — |
| AC-071-04 | US-071-02 | Trả về thiếu lý do | Given hồ sơ `PENDING_APPROVAL`; When reject không có lý do / < 10 ký tự; Then từ chối "Lý do từ chối phải có ít nhất 10 ký tự", trạng thái không đổi | — |
| AC-071-05 | US-071-02 | Trả về có lý do | Given hồ sơ `PENDING_APPROVAL`; When reject có lý do hợp lệ; Then `status=DRAFT`, `approvalStatus=REJECTED`, lưu `rejectionReason`, history `REJECT` | Hiện trạng; mục tiêu convention: `REJECTED_LEVEL1` + cho gửi lại. |
| AC-071-06 | US-071-03 | Duyệt C2 | Given hồ sơ đã qua C1; When approve-l2; Then `APPROVED`/`APPROVED_LEVEL1→APPROVED` + ghi C2 fields (#54-56) | **Chưa implement** — SA/Dev bổ sung theo Excel. |
| AC-071-07 | US-071-01..03 | Phân quyền | Given thiếu `approvec1`/`approvec2`; When gọi endpoint tương ứng; Then HTTP 403 | Endpoint `reject` hiện thiếu `@PreAuthorize` (drift bảo mật). |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-071-01 | Submit chỉ từ `DRAFT` (hiện trạng code `BeaconStationService.submitForApproval`); sau khi gửi → `PENDING_APPROVAL` + `PROPOSED` + `approvalLevel=1` | AC-071-01 | Mục tiêu convention: cho gửi lại từ `REJECTED_LEVEL1/2` — SA chốt mở rộng. |
| BR-071-02 | Duyệt C1 chỉ từ `PENDING_APPROVAL`; thành công → `APPROVED` (hiện trạng) | AC-071-02 | Mục tiêu 2 cấp: C1 → `APPROVED_LEVEL1` rồi C2 mới `APPROVED` — SA/Dev chốt theo Excel #51-56. |
| BR-071-03 | 4-eyes cấp 1: người tạo (created_by) không tự duyệt | AC-071-03 | ROLE_SYSTEM_ADMIN vẫn bị chặn (check theo userId). |
| BR-071-04 | Trả về bắt buộc lý do ≥ 10 ký tự; lưu `rejectionReason` (trim) | AC-071-04/05 | Không. |
| BR-071-05 | Người duyệt phải lấy từ `Authentication`, không nhận từ body/param — **hiện trạng nhận `@RequestParam approverId` (drift, cần sửa)** | AC-071-02 | Không. |
| BR-071-06 | Mỗi bước ghi history `APPROVE_L1`/`REJECT` (BeaconHistory/`infrastructure_history`) | AC-071-02/05 | Không. |
| BR-071-07 | Trạng thái lưu số theo enum `ApprovalStatus`; không lưu chuỗi | AC-071-01/02/05 | Không. |
| BR-071-08 | Permission: `beaconstation:approvec1`/`approvel1` (+`data:approvec1`/`approvel1`) cho C1; `approvec2`/`approvel2` cho C2; **endpoint reject hiện thiếu `@PreAuthorize` (drift bảo mật, cần bổ sung)** | AC-071-07 | ROLE_SYSTEM_ADMIN vượt qua. |
| BR-071-09 | Bản ghi đã xóa / không tồn tại không duyệt được | AC-071-01..05 | Không. |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Security | RBAC theo cấp + 4-eyes + data scope đọc | 403/400 khi vi phạm; không duyệt sai cấp. |
| Auditability | Người duyệt từ session (mục tiêu); ghi history từng bước | Truy vết người/thời điểm/nội dung. |
| Data integrity | Ghi trạng thái + field duyệt + history trong transaction | Không nửa bước phê duyệt. |
| UX | Message tiếng Việt có dấu; dialog trả về bắt buộc lý do | Không hardcode UI. |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-071-01 | AC-071-01 | Approval: submit từ `DRAFT` → `PENDING_APPROVAL` + `PROPOSED` | Integration |
| TS-071-02 | AC-071-02 | Approval: approve-l1 → `APPROVED` + history `APPROVE_L1` | Integration |
| TS-071-03 | AC-071-03 | Negative: người tạo tự duyệt → chặn 4-eyes | Integration |
| TS-071-04 | AC-071-04 | Negative: reject lý do < 10 ký tự → chặn | Integration |
| TS-071-05 | AC-071-05 | Negative: reject hợp lệ → `DRAFT`/`REJECTED` + lưu lý do + history | Integration |
| TS-071-06 | AC-071-06 | Gap: approve-l2 chưa tồn tại — test sẽ fail tới khi SA/Dev bổ sung | Integration |
| TS-071-07 | AC-071-07 | Security: thiếu `approvec1` → 403; reject không `@PreAuthorize` (cần sửa) | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes - target revision | Mục tiêu 2 cấp cần bổ sung endpoint approve-l2 + ghi `level1/2Approved*` fields cho Đèn biển; hiện trạng đơn cấp (`approvedBy`/`approvedDate`). |
| Architecture affected? | Medium | `BeaconStationController` thiếu approve-l2 + `@PreAuthorize` cho reject + `approverId` từ session; SA/Dev chốt. |
| Implementation clear? | Yes (với drift rõ) | State machine hiện tại + delta mục tiêu đều observable. |
| Documentation risk | High | Lệch 2 cấp giữa Excel/convention và code Đèn biển; ghi nhận rõ để SA chốt trước khi Dev. |
| **Verdict** | `Ready for Solution Designer review` | BA spec mô tả đúng hiện trạng code + delta mục tiêu theo Excel 2 cấp; các drift được đánh dấu để SA chốt. |
