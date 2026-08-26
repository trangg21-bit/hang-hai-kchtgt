---
feature-id: F-043
document: lean-spec
output-mode: lean
last-updated: 2026-08-26
---
# Lịch sử thay đổi Luồng hàng hải

## Summary

Hệ thống cung cấp dòng thời gian lịch sử phê duyệt của một hồ sơ Luồng hàng hải qua `GET /{id}/history`: mỗi bước submit/approve/reject được ghi một dòng trong bảng `approval_history` (refType = NAVIGATION_CHANNEL) và trả về dưới dạng `List<HistoryEntry>` theo thời gian giảm dần. Mỗi sự kiện gồm cấp phê duyệt, trạng thái (`PROPOSED`/`APPROVED`/`REJECTED`), người thao tác (tên hiển thị), thời điểm và lý do. Frontend hiển thị bằng `HistoryTimeline` trong màn chi tiết. Code hiện tại KHÔNG ghi sự kiện `CREATED`/`UPDATED`/`DELETED` cho `NavigationChannel` — điểm lệch với kỳ vọng work order ban đầu, cần PMO chốt (brief mục 2 đã ghi chú).

## Scope

| | Items |
|---|---|
| In scope | `GET /{id}/history` trả `List<HistoryEntry>`; sắp xếp giảm dần theo `approvedDate`; map tên người thao tác; hiển thị timeline trong chi tiết; quyền `navigationchannel:history`; data scope đọc. |
| Out of scope | Ghi thêm sự kiện `CREATED`/`UPDATED`/`DELETED` cho `NavigationChannel` (chờ PMO chốt — nếu chốt làm sẽ là task dev riêng, pattern có sẵn ở RadarStationService/ShipRepairFacilityService/VtsSystemService); đổi tên code sự kiện `ApprovalHistoryStatus`; phân trang lịch sử. |
| Assumptions | Bảng `approval_history` dùng chung đã có; các bước submit/approve/reject (F-041) đã ghi history; user đã đăng nhập. |

### Field Coverage Matrix

| # | Label | Technical field | Control | Required | Visibility / behavior |
|---|---|---|---|---|---|
| 1 | Id sự kiện | `id` | Text | — | Id dòng `approval_history`. |
| 2 | Hồ sơ | `navigationChannelId` | Text | — | `refId` = id hồ sơ. |
| 3 | Cấp xử lý | `approvalLevel` | Badge | — | `LEVEL_0` (submit), `LEVEL_1` (Cảng vụ/Chi cục), `LEVEL_2` (Cục). |
| 4 | Trạng thái sự kiện | `status` | Badge | — | Code `ApprovalHistoryStatus`: `PROPOSED`/`APPROVED`/`REJECTED`. |
| 5 | Người thao tác | `approvedBy` | Text | — | Tên hiển thị (fullName → username → id) từ ánh xạ user. |
| 6 | Thời điểm | `approvedDate` | Text | — | Sắp xếp giảm dần (mới nhất trước). |
| 7 | Lý do / nội dung | `reason` | Text | — | Có khi trả về (reject); null với các bước khác. |

**Bảng sự kiện được ghi (code hiện tại):** submit → `PROPOSED`/LEVEL_0 (InfrastructureApprovalService.java:100-106); approve C1 → `APPROVED`/LEVEL_1 (:157-164); reject C1 → `REJECTED`/LEVEL_1 (:141-147); approve C2 → `APPROVED`/LEVEL_2 (:220-228); reject C2 → `REJECTED`/LEVEL_2 (:204-211).

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-043-01 | Lãnh đạo Cảng vụ/Chi cục hoặc Cục | Xem dòng thời gian phê duyệt | Truy vết ai xử lý, khi nào, lý do | Must Have |
| US-043-02 | Chuyên viên | Xem lịch sử để biết hồ sơ đang ở bước nào | Theo dõi tiến độ xử lý | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-043-01 | US-043-01 | Timeline đầy đủ | Given hồ sơ đã qua submit + duyệt C1 + duyệt C2; When gọi GET `/{id}/history`; Then trả 3 sự kiện theo thứ tự giảm dần thời gian (C2, C1, submit) | Order theo `approvedDate` DESC. |
| AC-043-02 | US-043-01 | Sự kiện trả về | Given hồ sơ bị trả về C1; When gọi GET `/{id}/history`; Then sự kiện `REJECTED`/LEVEL_1 có `reason` = lý do | `reason` không rỗng. |
| AC-043-03 | US-043-02 | Không có sự kiện | Given hồ sơ chưa có sự kiện; When gọi GET `/{id}/history`; Then trả `[]`, không lỗi | HTTP 200. |
| AC-043-04 | US-043-01 | Hồ sơ không tồn tại | Given id không tồn tại/đã xóa mềm; When gọi GET `/{id}/history`; Then lỗi "Không tìm thấy luồng hàng hải với id" | HTTP 400-family. |
| AC-043-05 | US-043-01 | Phân quyền | Given user thiếu `navigationchannel:history`; When gọi GET `/{id}/history`; Then HTTP 403; UI không hiển thị timeline | — |
| AC-043-06 | US-043-01 | Ngoài phạm vi | Given hồ sơ ngoài phạm vi đơn vị; When gọi GET `/{id}/history`; Then không trả lịch sử | Data scope, không rò rỉ. |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-043-01 | Mỗi bước submit/approve/reject ghi một dòng `approval_history` (refType=NAVIGATION_CHANNEL) | AC-043-01 | Không. |
| BR-043-02 | Sự kiện gồm `status` + `approvalLevel` + người thao tác (session) + thời điểm + lý do | AC-043-01/02 | Không. |
| BR-043-03 | Sắp xếp giảm dần theo thời gian | AC-043-01 | Không. |
| BR-043-04 | `approvedBy` trả tên hiển thị qua ánh xạ user | AC-043-01 | Không. |
| BR-043-05 | Hồ sơ không tồn tại/đã xóa → lỗi; không sự kiện → `[]` | AC-043-03/04 | Không. |
| BR-043-06 | User thiếu `navigationchannel:history` → 403 | AC-043-05 | ROLE_SYSTEM_ADMIN vượt qua. |
| BR-043-07 | Hiện tại không ghi `CREATED`/`UPDATED`/`DELETED` cho NavigationChannel (lệch kỳ vọng work order — chờ PMO chốt) | toàn bộ | Quyết định PMO. |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Truy vấn history theo index `(ref_type, ref_id)` | Phản hồi nhanh cho timeline. |
| Security | RBAC `navigationchannel:history` + data scope đọc | HTTP 403 khi thiếu quyền hoặc ngoài phạm vi. |
| Auditability | Người thao tác hiển thị tên qua ánh xạ user; thời gian chính xác | Truy vết đầy đủ. |
| UX | Timeline theo convention `HistoryTimeline`; label tiếng Việt | Không hardcode màu/spacing/font. |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-043-01 | AC-043-01 | Happy path: chuỗi submit → C1 → C2 → 3 sự kiện đúng thứ tự | Integration |
| TS-043-02 | AC-043-02 | Negative: sự kiện reject C1 có `reason` | Integration |
| TS-043-03 | AC-043-03 | Boundary: hồ sơ chưa có sự kiện → `[]` | Integration |
| TS-043-04 | AC-043-04 | Negative: history hồ sơ không tồn tại/đã xóa → lỗi tiếng Việt | Integration |
| TS-043-05 | AC-043-05 | Security: thiếu `navigationchannel:history` → 403 | Security |
| TS-043-06 | AC-043-06 | Security: history hồ sơ ngoài phạm vi → bị chặn | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No - reuse | Dùng bảng `approval_history` dùng chung + `HistoryEntry` DTO đã có. |
| Architecture affected? | No | Endpoint GET `/{id}/history` đã tồn tại, guard `navigationchannel:history` (NavigationChannelController.java:115-117). |
| Implementation clear? | Yes | Order DESC, mapping tên user, event set thực tế (PROPOSED/APPROVED/REJECTED) — observable và đã implement. |
| Documentation risk | Medium | 2 điểm lệch với kỳ vọng work order: (1) không có code sự kiện `APPROVE_C1`/`REJECT_C1`… — dùng `APPROVED`/`REJECTED` + `approvalLevel`; (2) chưa ghi `CREATED`/`UPDATED`/`DELETED` — đã ghi chú ở brief mục 2, chờ PMO chốt. |
| **Verdict** | `Ready for Solution Designer review` | BA spec mô tả đúng behavior code hiện tại với anchor; điểm lệch đã nêu rõ để PMO quyết định. |
