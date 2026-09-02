---
feature-id: F-073
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Lịch sử Đèn biển (và nhà trạm)

## Summary

Hệ thống lưu và hiển thị lịch sử thay đổi của hồ sơ Đèn biển qua bảng `BeaconHistory` (entity `BeaconHistory`, discriminator `BeaconType.BEACON_LIGHT`, action `BeaconHistoryActionType`: `CREATE`, `UPDATE`, `APPROVE_L1`, `APPROVE_L2`, `REJECT`, `SOFT_DELETE`). API đọc: `GET /api/beacon-history` (phân trang, lọc theo `beaconType`, `entityId`, `entityCode`, `actionType`, `changedBy`, khoảng thời gian). Permission: `beaconstation:history`/`beaconstation:read`/`data:read`.

> ⚠ **Drift & hiện trạng code (ghi nhận, không lan truyền):** (1) brief cũ mô tả entity `Beacon`; hiện trạng `BeaconStation`. (2) Ghi `beacon_history` đang bị tắt trong code (`TODO 2026-08-26: DB đang chạy chưa có bảng beacon_history; migration thiếu` — `historyRepo.save(entry)` bị comment ở `BeaconStationService.logHistory`); lịch sử hiện tại được ghi vào bảng chung `infrastructure_history` (`InfrastructureHistoryRepository`, status CREATED/UPDATED/DELETED/APPROVED/REJECTED). SA/Dev chốt migration `beacon_history` + bật ghi. Không sửa feature-brief.md hay src/**.

## Scope

| | Items |
|---|---|
| In scope | Đọc lịch sử Đèn biển qua `/api/beacon-history` (BeaconType.BEACON_LIGHT); các action CREATE/UPDATE/APPROVE_L1/APPROVE_L2/REJECT/SOFT_DELETE; phân trang + lọc; permission `beaconstation:history`/`read`. |
| Out of scope | Tạo/sửa/xóa/duyệt (F-068..F-071); chi tiết (F-072); migration `beacon_history` (SA/Dev); ghi history cho entity khác. |
| Assumptions | Bảng `beacon_history` sẽ được tạo bằng migration Flyway; cho tới khi đó lịch sử đọc từ nguồn hiện có (`infrastructure_history`); section kỹ thuật là đề xuất BA để SA chốt. |

### Field Coverage Matrix (feature-scoped — bảng lịch sử `BeaconHistory`)

| # | Label | Technical field | Control | Required | Visibility / behavior |
|---|---|---|---|---|---|
| 1 | Loại đối tượng | `beaconType` | Select lọc | Có (lọc) | `BEACON_LIGHT` (Đèn biển) / `BUOY` (Phao tiêu); discriminator. |
| 2 | Mã bản ghi | `entityId` | — | Có (lọc) | UUID hồ sơ; lọc theo từng hồ sơ. |
| 3 | Hành động | `actionType` | Select lọc | Không | `CREATE`/`UPDATE`/`APPROVE_L1`/`APPROVE_L2`/`REJECT`/`SOFT_DELETE`. |
| 4 | Trường thay đổi | `changedField` | Text | Không | Tên field (max 255). |
| 5 | Giá trị cũ | `previousValue` | Text | Không | TEXT. |
| 6 | Giá trị mới | `newValue` | Text | Không | TEXT; với REJECT lưu lý do. |
| 7 | Người thay đổi | `changedBy` | Text | Không | Lấy từ session; response kèm `changedByName`. |
| 8 | Thời điểm | `changedAt` | Text | Không | Lọc theo khoảng thời gian (`from`/`to`). |
| 9 | Lý do | `reason` | Text | Không | Lý do từ chối khi REJECT (max 500). |
| 10 | Diff chi tiết | `diffData` | Text | Không | JSON. |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-073-01 | Chuyên viên / người xem | Xem lịch sử tạo, sửa, duyệt, xóa của hồ sơ | Truy vết ai làm gì, khi nào | Must Have |
| US-073-02 | Lãnh đạo Cục | Lọc lịch sử theo hành động/thời gian/người | Rà soát kiểm toán | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-073-01 | US-073-01 | Đọc lịch sử | Given bản ghi có history, user có `beaconstation:history`/`read`; When GET `/api/beacon-history?beaconType=BEACON_LIGHT&entityId=...`; Then trả danh sách phân trang, sắp xếp theo thời gian | — |
| AC-073-02 | US-073-02 | Lọc | When lọc theo `actionType`/`changedBy`/`from`/`to`; Then kết quả khớp bộ lọc | — |
| AC-073-03 | US-073-01 | Ghi history | When tạo/sửa (đã duyệt)/duyệt/trả về/xóa; Then ghi entry history tương ứng | Hiện trạng: ghi `infrastructure_history`; `beacon_history` chờ migration (drift). |
| AC-073-04 | US-073-01 | Phân quyền | Given thiếu permission; When gọi; Then HTTP 403 | — |
| AC-073-05 | US-073-01 | Data scope | Given hồ sơ ngoài phạm vi; When gọi; Then không trả lịch sử | — |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-073-01 | Lịch sử Đèn biển dùng `BeaconType.BEACON_LIGHT` làm discriminator; không trộn với BUOY | AC-073-01 | Không. |
| BR-073-02 | Action chuẩn: `CREATE`, `UPDATE`, `APPROVE_L1`, `APPROVE_L2`, `REJECT`, `SOFT_DELETE`; enum lưu INT trong DB | AC-073-02 | Không. |
| BR-073-03 | Người thay đổi (`changedBy`) từ session, không nhận từ client | AC-073-03 | Không. |
| BR-073-04 | History đọc phân trang + lọc (`beaconType`, `entityId`, `entityCode`, `actionType`, `changedBy`, `from`, `to`) | AC-073-01/02 | Không. |
| BR-073-05 | Permission `beaconstation:history`/`beaconstation:read`/`data:read`; data scope theo đơn vị | AC-073-04/05 | ROLE_SYSTEM_ADMIN. |
| BR-073-06 | Ghi `beacon_history` cần migration Flyway (bảng chưa tồn tại ở DB đang chạy); cho tới khi bật, lịch sử ghi vào `infrastructure_history` — không xem nguồn này là placeholder | AC-073-03 | SA/Dev chốt migration. |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Auditability | Ghi đủ người/thời điểm/hành động/lý do cho mọi thay đổi | Truy vết toàn vẹn. |
| Performance | Phân trang + index theo entityId/beaconType/changedAt | Phản hồi ổn định. |
| Security | RBAC + data scope | 403 khi vi phạm. |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-073-01 | AC-073-01 | Happy path: GET `/api/beacon-history` trả lịch sử BEACON_LIGHT phân trang | Integration |
| TS-073-02 | AC-073-02 | Boundary: lọc actionType/thời gian/người | Integration |
| TS-073-03 | AC-073-03 | Happy path: tạo/duyệt/xóa ghi entry tương ứng (nguồn hiện tại) | Integration |
| TS-073-04 | AC-073-04 | Security: thiếu permission → 403 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes - migration needed | Bảng `beacon_history` chưa có migration; SA/Dev tạo Flyway + bật ghi (hiện comment). |
| Architecture affected? | Low | `/api/beacon-history` đã implement (`BeaconHistoryController`); cần bật writer + migration. |
| Implementation clear? | Yes | Entity/DTO/action enum đã có; gap chỉ ở migration + writer. |
| Documentation risk | Medium | Drift brief cũ + ghi chú tắt beacon_history trong code. |
| **Verdict** | `Ready for Solution Designer review` | Khớp `BeaconHistory`/`BeaconHistoryController`; migration `beacon_history` là việc SA/Dev. |
