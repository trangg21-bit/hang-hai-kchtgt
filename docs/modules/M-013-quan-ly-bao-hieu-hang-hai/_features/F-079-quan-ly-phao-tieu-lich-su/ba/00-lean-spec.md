---
feature-id: F-079
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Lịch sử Phao tiêu

## Summary

Hệ thống lưu và hiển thị lịch sử thay đổi của hồ sơ Phao tiêu qua bảng `BeaconHistory` (entity `BeaconHistory`, discriminator `BeaconType.BUOY`, action `BeaconHistoryActionType`: `CREATE`, `UPDATE`, `APPROVE_L1`, `APPROVE_L2`, `REJECT`, `SOFT_DELETE`). API đọc: `GET /api/beacon-history` (phân trang, lọc theo `beaconType`, `entityId`, `entityCode`, `actionType`, `changedBy`, khoảng thời gian). Permission: `buoy:history`/`buoy:read`/`data:read`. Ngoài ra, mỗi thay đổi Phao tiêu còn ghi qua `ChangeHistoryService` (`recordChanges`/`insertChangeRecord("Buoy", ...)`).

> ⚠ **Drift & hiện trạng code (ghi nhận, không lan truyền):** (1) brief cũ mô tả entity `Beacon`; hiện trạng `Buoy`. (2) Ghi `beacon_history` đang bị tắt trong code (`TODO 2026-08-26: DB đang chạy chưa có bảng beacon_history; migration thiếu` — `historyRepo.save(entry)` bị comment ở `BuoyService.logHistory`); lịch sử hiện tại ghi vào bảng chung `infrastructure_history` (`InfrastructureHistoryRepository` + `ChangeHistoryService`). SA/Dev chốt migration `beacon_history` + bật ghi. Không sửa feature-brief.md hay src/**.

## Scope

| | Items |
|---|---|
| In scope | Đọc lịch sử Phao tiêu qua `/api/beacon-history` (BeaconType.BUOY); action CREATE/UPDATE/APPROVE_L1/APPROVE_L2/REJECT/SOFT_DELETE; phân trang + lọc; permission `buoy:history`/`read`. |
| Out of scope | Tạo/sửa/xóa/duyệt (F-074..F-077); chi tiết (F-078); migration `beacon_history` (SA/Dev). |
| Assumptions | Bảng `beacon_history` sẽ được tạo bằng migration Flyway; cho tới đó lịch sử đọc từ nguồn hiện có; section kỹ thuật là đề xuất BA để SA chốt. |

### Field Coverage Matrix (feature-scoped — bảng lịch sử `BeaconHistory`)

| # | Label | Technical field | Control | Required | Visibility / behavior |
|---|---|---|---|---|---|
| 1 | Loại đối tượng | `beaconType` | Select lọc | Có (lọc) | `BUOY` (Phao tiêu) / `BEACON_LIGHT` (Đèn biển). |
| 2 | Mã bản ghi | `entityId` | — | Có (lọc) | UUID hồ sơ. |
| 3 | Hành động | `actionType` | Select lọc | Không | `CREATE`/`UPDATE`/`APPROVE_L1`/`APPROVE_L2`/`REJECT`/`SOFT_DELETE`; enum lưu INT. |
| 4 | Trường thay đổi | `changedField` | Text | Không | max 255. |
| 5 | Giá trị cũ | `previousValue` | Text | Không | TEXT. |
| 6 | Giá trị mới | `newValue` | Text | Không | TEXT; REJECT lưu lý do. |
| 7 | Người thay đổi | `changedBy` | Text | Không | Từ session; response kèm `changedByName`. |
| 8 | Thời điểm | `changedAt` | Text | Không | Lọc `from`/`to`. |
| 9 | Lý do | `reason` | Text | Không | Lý do từ chối (max 500). |
| 10 | Diff chi tiết | `diffData` | Text | Không | JSON. |
| — | Change record phụ | `ChangeHistoryService` ("Buoy") | — | Hệ thống ghi | `recordChanges` khi tạo/sửa; `insertChangeRecord("Buoy", ..., "Trạng thái", null, "Đã xóa", "system")` khi xóa. |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-079-01 | Chuyên viên / người xem | Xem lịch sử tạo, sửa, duyệt, xóa của Phao tiêu | Truy vết ai làm gì, khi nào | Must Have |
| US-079-02 | Lãnh đạo Cục | Lọc lịch sử theo hành động/thời gian/người | Rà soát kiểm toán | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-079-01 | US-079-01 | Đọc lịch sử | Given bản ghi có history, user có `buoy:history`/`read`; When GET `/api/beacon-history?beaconType=BUOY&entityId=...`; Then trả danh sách phân trang theo thời gian | — |
| AC-079-02 | US-079-02 | Lọc | When lọc `actionType`/`changedBy`/`from`/`to`; Then khớp bộ lọc | — |
| AC-079-03 | US-079-01 | Ghi history | When tạo/sửa (đã duyệt)/duyệt/trả về/xóa; Then ghi entry tương ứng | Hiện trạng: `infrastructure_history` + `ChangeHistoryService`; `beacon_history` chờ migration (drift). |
| AC-079-04 | US-079-01 | Phân quyền | Given thiếu permission; When gọi; Then HTTP 403 | — |
| AC-079-05 | US-079-01 | Data scope | Given hồ sơ ngoài phạm vi; When gọi; Then không trả lịch sử | — |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-079-01 | Lịch sử Phao tiêu dùng `BeaconType.BUOY`; không trộn với BEACON_LIGHT | AC-079-01 | Không. |
| BR-079-02 | Action chuẩn: `CREATE`/`UPDATE`/`APPROVE_L1`/`APPROVE_L2`/`REJECT`/`SOFT_DELETE`; enum lưu INT | AC-079-02 | Không. |
| BR-079-03 | `changedBy` từ session, không nhận từ client | AC-079-03 | Không. |
| BR-079-04 | History đọc phân trang + lọc (`beaconType`, `entityId`, `entityCode`, `actionType`, `changedBy`, `from`, `to`) | AC-079-01/02 | Không. |
| BR-079-05 | Permission `buoy:history`/`buoy:read`/`data:read`; data scope | AC-079-04/05 | ROLE_SYSTEM_ADMIN. |
| BR-079-06 | Ghi `beacon_history` cần migration Flyway (bảng chưa tồn tại ở DB đang chạy); cho tới khi bật, lịch sử ghi vào `infrastructure_history` + `ChangeHistoryService` — không xem nguồn này là placeholder | AC-079-03 | SA/Dev chốt migration. |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Auditability | Ghi đủ người/thời điểm/hành động/lý do | Truy vết toàn vẹn. |
| Performance | Phân trang + index entityId/beaconType/changedAt | Phản hồi ổn định. |
| Security | RBAC + data scope | 403 khi vi phạm. |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-079-01 | AC-079-01 | Happy path: GET `/api/beacon-history` trả lịch sử BUOY phân trang | Integration |
| TS-079-02 | AC-079-02 | Boundary: lọc actionType/thời gian/người | Integration |
| TS-079-03 | AC-079-03 | Happy path: tạo/duyệt/xóa ghi entry tương ứng (nguồn hiện tại) | Integration |
| TS-079-04 | AC-079-04 | Security: thiếu permission → 403 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes - migration needed | Bảng `beacon_history` chưa có migration; SA/Dev tạo Flyway + bật ghi (hiện comment). |
| Architecture affected? | Low | `/api/beacon-history` đã implement; cần bật writer + migration. |
| Implementation clear? | Yes | Entity/DTO/action enum đã có; gap ở migration + writer. |
| Documentation risk | Medium | Drift brief cũ + ghi chú tắt beacon_history trong code. |
| **Verdict** | `Ready for Solution Designer review` | Khớp `BeaconHistory`/`BeaconHistoryController` + `ChangeHistoryService`; migration là việc SA/Dev. |
