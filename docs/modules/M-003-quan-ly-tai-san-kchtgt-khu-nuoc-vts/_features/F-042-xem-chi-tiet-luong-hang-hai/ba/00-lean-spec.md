---
feature-id: F-042
document: lean-spec
output-mode: lean
last-updated: 2026-08-26
---
# Xem chi tiết / Danh sách Luồng hàng hải

## Summary

Hệ thống cung cấp màn hình Danh sách Luồng hàng hải với bộ lọc (đơn vị quản lý #1 dạng TreeSelect, cảng biển #2, tỉnh/thành #6, tình trạng #8, từ khóa, trạng thái phê duyệt #47), StatusTabs, phân trang và màn Chi tiết đầy đủ 71 trường (#1-#46 dữ liệu nhập, #47-#71 read-only do hệ thống ghi hoặc lấy từ module liên quan). Mọi truy vấn đọc bị giới hạn bởi data scope (`@DataScope` + `orgUnitFilter` + `recordSecurityLevelFilter`). Danh sách sắp xếp theo thời gian tạo giảm dần, chỉ trả hồ sơ chưa xóa mềm.

## Scope

| | Items |
|---|---|
| In scope | Danh sách phân trang (`GET /`); tìm kiếm/lọc (`GET /search` với `orgUnitId`/`seaportId`/`provinceId`/`conditionStatus`/`keyword`/`approvalStatus`); lọc nhanh theo trạng thái (`GET /approval-status/{status}`); chi tiết 71 trường (`GET /{id}`); StatusTabs; data scope đọc; hiển thị metadata nhạy cảm theo quyền `read:restricted`/`read:confidential`. |
| Out of scope | Thao tác ghi (F-038/F-039/F-040); phê duyệt (F-041); lịch sử (F-043); export Excel/PDF; cập nhật hàng loạt. |
| Assumptions | Dữ liệu danh mục (đơn vị, cảng biển, tỉnh/thành, tình trạng) đã có; list-view components và token system đã có theo convention chung; user đã đăng nhập. |

### Field Coverage Matrix

| # | Label | Technical field | Control | Required | Visibility / behavior |
|---|---|---|---|---|---|
| L1 | Đơn vị quản lý (#1) | `orgUnitId` | TreeSelect (cây đơn vị) | Không | Filter; giữ giá trị `orgUnitId` khi gọi API. |
| L2 | Thuộc cảng biển (#2) | `seaportId` | Select KCHT (CB) | Không | Filter. |
| L3 | Địa điểm Tỉnh/TP (#6) | `provinceId` | Select | Không | Filter. |
| L4 | Tình trạng (#8) | `conditionStatus` | Select enum | Không | Filter. |
| L5 | Từ khóa | `keyword` | Input | Không | LIKE trên tên/mã, trim + lowercase. |
| L6 | Trạng thái (#47) | `approvalStatus` | StatusTabs / Select | Không | Đồng bộ tab; giá trị enum `ApprovalStatus`. |
| C1 | Cột mã luồng (#4) | `channelCode` | DataTable column | — | DS. |
| C2 | Cột tên luồng (#5) | `channelName` | DataTable column | — | DS. |
| C3 | Cột địa điểm (#6) | `provinceId` | DataTable column | — | DS, hiển thị tên tỉnh. |
| C4 | Cột tình trạng (#8) | `conditionStatus` | Badge | — | DS. |
| C5 | Cột trạng thái (#47) | `approvalStatus` | `ApprovalStatusBadge` | — | DS. |
| C6 | Cột ngày cập nhật (#48) | `updatedAt` | DataTable column | — | DS, sortable. |
| D1 | Chi tiết #1-#46 | theo F-038 | Descriptions read-only | — | CT; `channelCode`/`routeCode` hiển thị giá trị tự sinh. |
| D2 | Chi tiết #47-#57 | theo F-038 | Descriptions read-only + badge | — | CT; null → "—". |
| D3 | Chi tiết #58-#71 | theo F-038 | Descriptions read-only | — | CT; nguồn rỗng → "—", không placeholder. |
| D4 | Khối phê duyệt | — | `ApprovalActionBar` + `HistoryTimeline` | — | CT; theo trạng thái + quyền. |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-042-01 | Chuyên viên | Xem danh sách với bộ lọc + tab trạng thái | Tìm nhanh hồ sơ cần xử lý | Must Have |
| US-042-02 | Người quản lý | Xem chi tiết đủ 71 trường | Kiểm tra hồ sơ trước khi duyệt | Must Have |
| US-042-03 | Lãnh đạo Cục/Admin Cục | Xem metadata nhạy cảm + thông tin liên quan #58-#71 | Ra quyết định và truy vết | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-042-01 | US-042-01 | Danh sách đầy đủ | Given user có `navigationchannel:read`; When mở màn danh sách; Then hiển thị cột #4/#5/#6/#8/#47/#48 + StatusTabs + filter + phân trang | Không hiển thị thao tác không được phép. |
| AC-042-02 | US-042-01 | Lọc kết hợp | Given user chọn filter bất kỳ trong 6 filter; When gọi search; Then danh sách được lọc, phân trang, kèm tổng số | Response `SearchResultResponse` đúng `totalElements`. |
| AC-042-03 | US-042-01 | Data scope đọc | Given user thuộc đơn vị con; When gọi danh sách; Then chỉ thấy hồ sơ đơn vị mình + subtree | Tập `orgUnitId` trả về nằm trong subtree được phép. |
| AC-042-04 | US-042-01 | Lọc theo tab trạng thái | Given user chọn tab `PENDING_APPROVAL`; When gọi search với `approvalStatus`; Then chỉ trả hồ sơ đúng trạng thái | Toàn bộ `approvalStatus` khớp tab. |
| AC-042-05 | US-042-02 | Chi tiết đủ trường | Given hồ sơ tồn tại; When mở chi tiết; Then hiển thị đủ #1-#71; #47-#71 read-only; null → "—" | Không có input chỉnh sửa cho #47-#71. |
| AC-042-06 | US-042-02 | Ngoài phạm vi | Given hồ sơ ngoài phạm vi đơn vị/security level; When gọi GET `/{id}`; Then bị chặn, không trả dữ liệu | HTTP 403 hoặc không tìm thấy. |
| AC-042-07 | US-042-01 | Phân quyền | Given user thiếu `navigationchannel:read`; When gọi list/search/getById; Then HTTP 403 | — |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-042-01 | Danh sách phân trang (mặc định 0/20), sort `createdAt` DESC, chỉ hồ sơ chưa xóa | AC-042-01 | Không. |
| BR-042-02 | Filter rỗng/không hợp lệ bị bỏ qua, không lỗi | AC-042-02 | Không. |
| BR-042-03 | Filter đơn vị dùng TreeSelect/Cascader cây, giữ `orgUnitId` | AC-042-01 | Không. |
| BR-042-04 | Chi tiết đủ 71 trường; phân biệt null/empty; không placeholder | AC-042-05 | Không. |
| BR-042-05 | Đọc bị giới hạn bởi `orgUnitFilter` + `recordSecurityLevelFilter`; metadata nhạy cảm theo quyền | AC-042-03/06 | Cục full scope qua `orgunit:scope_all`/`admin:all`/`*`. |
| BR-042-06 | #58-#71 rỗng → "—" có kiểm soát, không gán giá trị giả | AC-042-05 | Không. |
| BR-042-07 | User thiếu `navigationchannel:read` → 403 | AC-042-07 | ROLE_SYSTEM_ADMIN vượt qua. |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Danh sách/lọc phản hồi ổn định; dùng index `idx_navigation_channel_org_unit` | SA/Dev chốt chỉ số cụ thể. |
| Security | RBAC `navigationchannel:read*` + data scope đọc | HTTP 403 khi thiếu quyền hoặc ngoài phạm vi; không rò rỉ dữ liệu. |
| UX | Cột/label tiếng Việt có dấu; badge trạng thái theo convention | Không hardcode màu/spacing/font. |
| Reliability | Detail hiển thị rỗng có kiểm soát khi nguồn liên quan chưa có | Không placeholder. |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-042-01 | AC-042-01 | Happy path: danh sách đủ cột + tabs + filter + phân trang | UI/Integration |
| TS-042-02 | AC-042-02 | Boundary: lọc kết hợp nhiều filter, filter rỗng bị bỏ qua | Integration |
| TS-042-03 | AC-042-03 | Security: user đơn vị con chỉ thấy hồ sơ subtree | Security |
| TS-042-04 | AC-042-04 | Boundary: tab `PENDING_APPROVAL` chỉ trả hồ sơ đúng trạng thái | Integration |
| TS-042-05 | AC-042-05 | Happy path: chi tiết đủ #1-#71, #47-#71 read-only | UI/Integration |
| TS-042-06 | AC-042-06 | Security: GET hồ sơ ngoài phạm vi bị chặn | Security |
| TS-042-07 | AC-042-07 | Security: thiếu `navigationchannel:read` → 403 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No - reuse | Không thay đổi entity/schema; đọc từ `navigation_channel` + bảng con đã có. |
| Architecture affected? | No | Endpoint GET `/`, `/search`, `/approval-status/{status}`, `/{id}` đã tồn tại (NavigationChannelController.java:44-56, 119-156). |
| Implementation clear? | Yes | Filter set, phân trang, data scope, cột danh sách và nhóm chi tiết đều observable và đã implement (FE NavigationChannelList.tsx/NavigationChannelForm.tsx). |
| Documentation risk | Low | Không có điểm lệch hành vi so với code. |
| **Verdict** | `Ready for Solution Designer review` | BA spec khớp code hiện tại với anchor; không có blocker. |
