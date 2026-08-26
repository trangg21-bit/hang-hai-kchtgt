---
id: F-043
name: Quan ly Luong hang hai - Lich su
slug: quan-ly-luong-hang-hai-lich-su
module-id: M-003
status: implemented
classification: local
priority: P1
created: 2026-06-29T00:00:00Z
last-updated: 2026-08-26T02:59:34Z
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Lịch sử thay đổi Luồng hàng hải

**Tài liệu:** Tài liệu chức năng — phần riêng theo template 7 section.
**Chức năng:** F-043 — Lịch sử thay đổi/phê duyệt Luồng hàng hải.
**Module:** M-003 — Quản lý tài sản KCHTGT khu nước & VTS.
**Loại:** Chức năng thường (màn hình đọc lịch sử, không có bước phê duyệt).
**Tham chiếu:** Cơ chế lịch sử dùng chung bảng `approval_history` (`ApprovalHistory`/`ApprovalHistoryStatus`/`InfrastructureApprovalService`) + entity `NavigationChannel` tại F-038. File này CHỈ mô tả phần RIÊNG của F-043.

## 1. Mô tả ngắn

Chức năng F-043 cung cấp dòng thời gian lịch sử của một hồ sơ Luồng hàng hải: mỗi bước gửi phê duyệt, phê duyệt, trả về được ghi thành một sự kiện trong bảng `approval_history` (refType = NAVIGATION_CHANNEL) và trả về theo thứ tự thời gian giảm dần qua `GET /{id}/history`. Response `HistoryEntry` gồm cấp phê duyệt, trạng thái sự kiện, người thao tác (tên hiển thị), thời điểm và lý do. Frontend hiển thị bằng `HistoryTimeline` ngay trong màn chi tiết (NavigationChannelForm.tsx:772).

## 2. Trường dữ liệu

Response `List<HistoryEntry>` (HistoryEntry.java:10-28) — một dòng = một sự kiện:

| # | Trường | Kiểu | Ghi chú |
|---|---|---|---|
| 1 | `id` | UUID | Id dòng `approval_history`. |
| 2 | `navigationChannelId` | UUID | `refId` = id hồ sơ. |
| 3 | `approvalLevel` | Enum | Cấp xử lý: `LEVEL_1` (Cảng vụ/Chi cục), `LEVEL_2` (Cục), `LEVEL_0` (submit). |
| 4 | `status` | String | Code sự kiện `ApprovalHistoryStatus`: `PROPOSED` (submit), `APPROVED` (duyệt), `REJECTED` (trả về). |
| 5 | `approvedBy` | String | Tên hiển thị người thao tác (fullName, fallback username, fallback id UUID) — NavigationChannelService.java:437-447. |
| 6 | `approvedDate` | LocalDateTime | Thời điểm sự kiện; sắp xếp giảm dần (mới nhất trước). |
| 7 | `reason` | String | Lý do/nội dung (bắt buộc khi trả về; null với duyệt không ghi lý do). |

**Sự kiện được ghi trong code hiện tại (NavigationChannel):**

| Hành động | Sự kiện (`ApprovalHistoryStatus`) | approvalLevel | Nguồn |
|---|---|---|---|
| Gửi phê duyệt (submit) | `PROPOSED` | LEVEL_0 | InfrastructureApprovalService.java:100-106 |
| Phê duyệt C1 | `APPROVED` | LEVEL_1 | InfrastructureApprovalService.java:157-164 |
| Trả về C1 | `REJECTED` | LEVEL_1 | InfrastructureApprovalService.java:141-147 |
| Phê duyệt C2 | `APPROVED` | LEVEL_2 | InfrastructureApprovalService.java:220-228 |
| Trả về C2 | `REJECTED` | LEVEL_2 | InfrastructureApprovalService.java:204-211 |

- **⚠️ Điểm lệch so với kỳ vọng ban đầu của work order** ("history gồm CREATE/UPDATE/APPROVE_C1/APPROVE_C2/REJECT_C1/REJECT_C2/DELETE"): enum `ApprovalHistoryStatus` (ApprovalHistoryStatus.java:4-15) không có các code `APPROVE_C1`/`REJECT_C1`… — duyệt/trả về dùng `APPROVED`/`REJECTED` kèm `approvalLevel` 1/2. Ngoài ra, code hiện tại KHÔNG ghi sự kiện `CREATED` khi tạo, `UPDATED` khi sửa, hay `DELETED` khi xóa mềm cho `NavigationChannel` (không có code path nào gọi ghi history cho 3 thao tác này — `ApprovalHistoryUtils.recordSoftDelete` tại ApprovalHistoryUtils.java:30 chưa có caller). PMO cần chốt: (a) giữ behavior hiện tại, hoặc (b) yêu cầu dev bổ sung ghi `CREATED`/`UPDATED`/`DELETED` (pattern đã có ở `RadarStationService`/`ShipRepairFacilityService`/`VtsSystemService`) thành task riêng. Brief này mô tả behavior code hiện tại (phương án a).

## 3. Trạng thái và phê duyệt

- F-043 là màn hình đọc lịch sử, không có bước phê duyệt riêng.
- Lịch sử chỉ hiển thị cho hồ sơ chưa xóa và đọc được trong phạm vi đơn vị user (data scope).
- Sự kiện trả về theo `approvedDate` giảm dần (mới nhất trước) — `findByRefTypeAndRefIdOrderByApprovedDateDesc` (NavigationChannelService.java:419-422).

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-043-01 | Mỗi bước submit/approve/reject ghi một dòng `approval_history` với `refType = InfrastructureType.NAVIGATION_CHANNEL`, `refId` = id hồ sơ. | History |
| BR-043-02 | Sự kiện gồm `status` (`PROPOSED`/`APPROVED`/`REJECTED`), `approvalLevel` (0/1/2), người thao tác từ session, thời điểm, lý do (nếu có). | History |
| BR-043-03 | Danh sách sự kiện sắp xếp theo thời gian giảm dần (mới nhất trước). | History |
| BR-043-04 | `approvedBy` trả tên hiển thị (fullName → username → id) qua ánh xạ user, không gọi API danh sách user từ frontend. | History |
| BR-043-05 | Hồ sơ không tồn tại/đã xóa mềm → trả lỗi tiếng Việt "Không tìm thấy luồng hàng hải với id"; hồ sơ không có sự kiện → trả danh sách rỗng (không lỗi). | History |
| BR-043-06 | User thiếu `navigationchannel:history` → HTTP 403; UI không hiển thị timeline. | Security |

### 4.2. Acceptance Criteria

| AC-ID | Given | When | Then | Oracle |
|---|---|---|---|---|
| AC-043-01 | Hồ sơ đã qua submit + duyệt C1 + duyệt C2 | Gọi GET `/{id}/history` | Trả 3 sự kiện theo thứ tự giảm dần thời gian (C2 trước, C1, submit) | Response `List<HistoryEntry>` đúng thứ tự và nội dung. |
| AC-043-02 | Hồ sơ bị trả về C1 | Gọi GET `/{id}/history` | Sự kiện `REJECTED` level 1 có `reason` = lý do trả về | `status=REJECTED`, `approvalLevel=LEVEL_1`, `reason` không rỗng. |
| AC-043-03 | Hồ sơ chưa có sự kiện nào | Gọi GET `/{id}/history` | Trả danh sách rỗng, không lỗi | HTTP 200 + `[]`. |
| AC-043-04 | Hồ sơ không tồn tại / đã xóa mềm | Gọi GET `/{id}/history` | Trả lỗi tiếng Việt "Không tìm thấy luồng hàng hải với id" | HTTP 400-family. |
| AC-043-05 | User thiếu `navigationchannel:history` | Gọi GET `/{id}/history` | HTTP 403; UI không hiển thị timeline | Permission code khớp `navigationchannel:history`. |
| AC-043-06 | Hồ sơ nằm ngoài phạm vi đơn vị | Gọi GET `/{id}/history` | Không trả dữ liệu lịch sử | Bị chặn bởi data scope, không rò rỉ. |

### 4.3. User Stories

- **US-043-01:** Là Lãnh đạo Cảng vụ/Chi cục hoặc Cục, tôi muốn xem dòng thời gian phê duyệt của hồ sơ để truy vết ai đã xử lý, khi nào và lý do.
- **US-043-02:** Là Chuyên viên, tôi muốn xem lịch sử để biết hồ sơ của mình đang ở bước nào trong quy trình.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem lịch sử phê duyệt | `navigationchannel:history` |

| Vai trò | Xem lịch sử | Ghi chú |
|---|---|---|
| Chuyên viên thuộc đơn vị | Có nếu được gán quyền | Chỉ xem hồ sơ trong phạm vi `orgUnitId`. |
| Lãnh đạo Cảng vụ/Chi cục | Có | Theo scope. |
| Lãnh đạo Cục / Admin Cục | Có | Xem được toàn bộ lịch sử trong phạm vi Cục + metadata nhạy cảm. |
| Quản trị hệ thống | Có | ROLE_SYSTEM_ADMIN vượt qua mọi kiểm tra quyền. |
| Người không có quyền tương ứng | Không | API trả 403 Forbidden. |

**Admin Cục:** với F-043, Admin Cục được xem toàn bộ lịch sử phê duyệt của hồ sơ trong phạm vi Cục để truy vết trách nhiệm; vẫn chịu ràng buộc data scope chung.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không có trạng thái riêng; lịch sử phản ánh các bước của workflow phê duyệt F-041 (`PROPOSED`/`APPROVED`/`REJECTED` kèm cấp 1/2). |
| 2 | Có bước phê duyệt không | Không có bước phê duyệt (màn hình đọc lịch sử). |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị. Hồ sơ phải đọc được trong phạm vi user (`@Filter(orgUnitFilter)` NavigationChannel.java:22 + `@DataScope` NavigationChannelController.java:25) thì lịch sử mới được trả; endpoint history đặt trong controller có `@DataScope` nên được bảo vệ cùng cơ chế. |
| 4 | Trường chỉ hiện trong điều kiện nào | Timeline chỉ hiển thị khi có dữ liệu và user có `navigationchannel:history`; `reason` chỉ hiển thị khi có giá trị (reject). |
| 5 | Quyền riêng | `navigationchannel:history` (đã đổi guard từ `read` sang `history` — NavigationChannelController.java:115-117). |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không. Endpoint history yêu cầu đăng nhập, RBAC và data scope. |
| 7 | Tải lên tệp | Không. |
| 8 | Giao diện khác mẫu chung | Không. Dùng `HistoryTimeline` shared component trong màn chi tiết; không mô tả hardcode màu/spacing/font. |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/navigation-channel/{id}/history` | Trả `List<HistoryEntry>` các sự kiện submit/approve/reject của hồ sơ, sắp xếp giảm dần theo thời gian. | `navigationchannel:history` |
| GET | `/api/v1/navigation-channel/{id}` | Chi tiết hồ sơ cũng kèm danh sách `ApprovalResponse` (history) khi includeDetails — phục vụ hiển thị nhanh. | `navigationchannel:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Không có thay đổi schema mới cho F-043. Nguồn dữ liệu là bảng `approval_history` dùng chung (`ApprovalHistory` — ref_id, ref_type, approval_level, status SMALLINT ordinal, approved_by, approved_date, reason, changed_field, previous_value, new_value), truy vấn theo `ref_type = InfrastructureType.NAVIGATION_CHANNEL` (ordinal 6) + `ref_id` + order `approved_date DESC` (NavigationChannelService.java:419-422). Không thêm bảng, không thêm cột, không thêm index.
