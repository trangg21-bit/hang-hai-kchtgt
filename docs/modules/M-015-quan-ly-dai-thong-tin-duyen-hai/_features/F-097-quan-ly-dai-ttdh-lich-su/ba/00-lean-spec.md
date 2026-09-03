---
feature-id: F-097
document: lean-spec
output-mode: lean
last-updated: 2026-08-28
---
# Lịch sử Đài TTDH (CoastalStationVTS)

## Summary

Tính năng xem lịch sử thay đổi & phê duyệt của hồ sơ Đài TTDH. **ĐÃ XÁC MINH:** 2 đường đọc: (a) `GET /api/v1/stations/coastal/{id}/history` → `CoastalStationVTSService.getHistory` → `historyService.getHistory(COASTAL_RADIO_STATION, id, code)` trả `List<CoastalStationVTSHistoryResponse>` (id, stationCode, actionType, previousValue, newValue, changedBy, changedAt); (b) `GET /api/v1/station-history` (`StationHistoryController`) — phân trang, lọc `type` (giá trị nhận: `VTS`/`COASTAL_VTS`/`DAI_DUYEN_HAI` cho TTDH theo `StationHistoryService` map), `entityId`, `actionType`, `changedBy`, `from`, `to`. **ActionType:** `StationHistoryActionType` = CREATE, UPDATE, DELETE, APPROVE_L1, APPROVE_L2, REJECT. Lịch sử tập trung (không dùng change_logs/approval_logs).

## Use Cases

| UC | Actor | Trigger | Flow | Outcome |
|---|---|---|---|---|
| UC-097-01 | Người dùng | Menu dòng → "Lịch sử" | Mở drawer timeline | Danh sách sự kiện CREATE/UPDATE/DELETE/APPROVE_L1/APPROVE_L2/REJECT |
| UC-097-02 | Người dùng | Lọc lịch sử theo loại | GET /api/v1/station-history?type=VTS&actionType=... | Trang kết quả lọc đúng |

## Scope

| | Items |
|---|---|
| In scope | Hiển thị timeline lịch sử; 2 endpoint; lọc actionType/changedBy/thời gian; phân trang; quyền đọc. |
| Out of scope | Ghi history (do service thực hiện khi CRUD/duyệt); sửa code. |

## Field Coverage Matrix

Không có trường nhập liệu. Hiển thị: actionType (nhãn tiếng Việt: Tạo mới/Cập nhật/Xóa/Duyệt C1/Duyệt C2/Từ chối), previousValue/newValue, changedBy (tên người dùng), changedAt. Liên quan TAB5 (Xử lý & theo dõi) hiển thị read-only.

## Business Rules

| ID | Rule | Acceptance | Note |
|---|---|---|---|
| BR-097-01 | Mọi thay đổi CRUD + mỗi bước duyệt đều ghi history (CREATE/UPDATE/DELETE/APPROVE_L1/APPROVE_L2/REJECT) | AC-097-01 | |
| BR-097-02 | GET /{id}/history trả danh sách theo thời gian giảm dần | AC-097-02 | |
| BR-097-03 | GET /api/v1/station-history lọc theo type/entityId/actionType/changedBy/from/to, sort approvedDate desc, phân trang (page/size) | AC-097-03 | |
| BR-097-04 | Type string cho TTDH: `VTS` / `COASTAL_VTS` / `DAI_DUYEN_HAI` | AC-097-04 | Map trong StationHistoryService |
| BR-097-05 | Hiển thị changedBy bằng tên người dùng (fullName), không UUID | AC-097-05 | |
| BR-097-06 | Quyền đọc: như F-096 (read) | AC-097-06 | |

## Domain Model

`StationHistoryResponse`: type, entityId, actionType, previousValue, newValue, changedBy, changedAt, approvedDate. ActionType enum: CREATE/UPDATE/DELETE/APPROVE_L1/APPROVE_L2/REJECT.

## Approval flow (2 cấp C1→C2)

Lịch sử phản ánh từng bước duyệt (APPROVE_L1 sau approve-l1, APPROVE_L2 sau approve-l2, REJECT khi từ chối).

## Validation Rules

- `type` bắt buộc; entityId/actionType/changedBy/from/to tùy chọn; page/size mặc định 0/20.
- Type không hợp lệ → không trả kết quả (map không nhận diện).

## Acceptance Criteria (observable)

| ID | Given/When/Then |
|---|---|
| AC-097-01 | Given hồ sơ có create+update+duyệt, When GET /{id}/history, Then có đủ CREATE/UPDATE/APPROVE_L1/APPROVE_L2 theo thứ tự thời gian |
| AC-097-02 | GET /api/v1/station-history?type=VTS&entityId={id} trả page lịch sử đúng hồ sơ |
| AC-097-03 | Lọc actionType=APPROVE_L1 chỉ trả sự kiện duyệt C1 |
| AC-097-04 | Hiển thị tên người thao tác (không phải UUID) |
| AC-097-05 | Given type không hỗ trợ, When truy vấn, Then trả page rỗng (không lỗi 500) |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | History dùng bảng tập trung |
| Architecture affected? | Low | 2 endpoint đã có |
| Implementation clear? | Yes | |
| Documentation risk | Low | |
| **Verdict** | `Ready for Solution Designer review` | Rõ ràng |
