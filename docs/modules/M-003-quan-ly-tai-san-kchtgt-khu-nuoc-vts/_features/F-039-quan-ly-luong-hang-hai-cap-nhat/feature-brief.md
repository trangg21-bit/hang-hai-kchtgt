---
id: F-039
name: Quan ly Luong hang hai - Cap nhat
slug: quan-ly-luong-hang-hai-cap-nhat
module-id: M-003
status: implemented
classification: local
priority: P0
created: 2026-06-29T00:00:00Z
last-updated: 2026-08-26T02:59:33Z
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Cập nhật Luồng hàng hải

**Tài liệu:** Tài liệu chức năng — phần riêng theo template 7 section.
**Chức năng:** F-039 — Cập nhật Luồng hàng hải.
**Module:** M-003 — Quản lý tài sản KCHTGT khu nước & VTS.
**Loại:** Chức năng có bước phê duyệt liên quan (sửa hồ sơ rồi gửi lại quy trình 2 cấp).
**Tham chiếu:** Entity `NavigationChannel` 71 trường, bảng con `channel_route_detail`/`navigation_channel_coordinate`, attachment, migration `V20260825120000`, cơ chế phê duyệt 2 cấp và data scope đã được chốt tại F-038: `_features/F-038-quan-ly-luong-hang-hai-tao-moi/feature-brief.md`, `_features/F-038-quan-ly-luong-hang-hai-tao-moi/ba/00-lean-spec.md`, `design/00-design-plan.md`. File này CHỈ mô tả phần RIÊNG của F-039 — không lặp lại toàn bộ 71 trường.

## 1. Mô tả ngắn

Chức năng F-039 cho phép người dùng có `navigationchannel:update` chỉnh sửa hồ sơ Luồng hàng hải đã tồn tại. Cập nhật theo kiểu partial update: chỉ các trường được gửi trong request mới được áp dụng; toàn bộ write surface là #1-#46 (hồ sơ chính, tuyến luồng, phạm vi bảo vệ, bản đồ, tọa độ, file đính kèm) giống F-038, các trường #47-#71 và mã tự sinh `channelCode`/`routeCode` không nhận từ client. Hệ thống ghi `updatedBy`/`updatedAt` từ phiên người thao tác. Sau khi sửa, hồ sơ có thể được gửi lại quy trình phê duyệt 2 cấp qua endpoint submit-approval (F-041). Dữ liệu đã duyệt (`APPROVED`) vẫn có thể mở form sửa theo code hiện tại (xem mục 3 — điểm cần PMO chốt).

## 2. Trường dữ liệu

Cập nhật dùng cùng write surface #1-#46 với F-038 (danh sách đầy đủ và control chuẩn tại F-038 brief mục 2). Điểm khác biệt của F-039:

| # | Nhóm trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | `securityLevel` (Mức độ bảo mật) | Không | Enum | Chỉ áp dụng nếu gửi; validate `RecordSecurityLevel.validateAssignment` theo quyền user. |
| 2 | Đơn vị quản lý (`orgUnitId` #1) | Không | TreeSelect | Nếu gửi phải nằm trong phạm vi đơn vị user (`OrgUnitScopeService.Scope.allows`) — BR-039-02. |
| 3 | Hồ sơ chính #2-#21 (`seaportId`, `operatingUnitId`, `channelName`, `provinceId`, `detailedLocation`, `conditionStatus`, `managementStation`, `stationCount`, `stationStaffCount`, `stationAreaSquareMeters`, `latestStationRepairMonth`, `latestMaintenanceYear`, `latestDredgingVolumeCubicMeters`, `buoyCount`, `beaconCount`, `notes`, `announcementDecisionNumber`, `announcementDecisionDate`, `announcementDecisionIssuer`) | Không | Theo F-038 | Partial update: field không gửi thì giữ nguyên; text trim trước khi lưu. |
| 4 | Tuyến luồng #22-#38 (`routeDetails`) | Không | Bảng con | Nếu gửi: thay thế toàn bộ danh sách cùng transaction; `routeCode` do server sinh, không nhận từ client. |
| 5 | Phạm vi bảo vệ + bản đồ #39-#44 (`protectionScopeMeters`, `protectionNotes`, `geometryType`, `mapIconId`, `coordinateReferenceSystem`, `displayRule`, `coordinates` — chuỗi WKT) | Không | Theo F-038 | `coordinates` rỗng → xóa spatial object; khác → tạo/cập nhật `GisSpatialObject`. |
| 6 | Tọa độ #45 (`coordinateList`) | Không | Bảng con | Nếu gửi: thay thế toàn bộ danh sách. |
| 7 | File đính kèm #46 (`attachments`) | Không | UploadFileTable | Nếu gửi: xóa attachment cũ (refType=NAVIGATION_CHANNEL) và lưu lại danh sách mới. |
| 8 | Mã tự sinh (`channelCode` #4, `routeCode` #23) | — | Không có trong DTO update | Client không được gửi; không thể sửa bằng API. |
| 9 | Trạng thái và kiểm toán #47-#57, dữ liệu liên quan #58-#71 | — | Không có trong DTO update | Client gửi các trường này bị bỏ qua — BR-039-03. |

## 3. Trạng thái và phê duyệt

- Cập nhật không làm thay đổi `approvalStatus` trong code hiện tại: `NavigationChannelService.update` (NavigationChannelService.java:206-336) không có guard trạng thái, không reset về `DRAFT`, không ghi history `UPDATE`. Hồ sơ ở bất kỳ trạng thái chưa xóa (kể cả `APPROVED` = 5) đều nhận được PUT nếu có quyền — UI hiển thị nút Sửa theo quyền, không theo trạng thái (NavigationChannelList.tsx:322-325).
- **⚠️ Điểm lệch so với kỳ vọng ban đầu của work order** ("chỉ sửa ở DRAFT/PENDING_APPROVAL/APPROVED_LEVEL1/REJECTED_LEVEL1/REJECTED_LEVEL2; sửa xong về DRAFT + ghi history UPDATE; APPROVED không sửa được"): behavior này CHƯA có trong code. PMO cần chốt: (a) giữ behavior hiện tại và cập nhật tài liệu như file này, hoặc (b) yêu cầu dev bổ sung guard + reset DRAFT + ghi history UPDATE thành task riêng. Brief này mô tả behavior code hiện tại (phương án a).
- Trạng thái hồ sơ lưu dạng số theo enum `ApprovalStatus` (DRAFT=0, PENDING_APPROVAL=2, APPROVED_LEVEL1=3, APPROVED=5, REJECTED_LEVEL1=8, REJECTED_LEVEL2=9… — ApprovalStatus.java:4-13); UI hiển thị label tiếng Việt.
- Sau khi sửa, hồ sơ đi lại quy trình phê duyệt 2 cấp (F-041): chuyên viên gọi `POST /{id}/submit-approval`; hồ sơ chuyển `PENDING_APPROVAL` hoặc `APPROVED_LEVEL1` (Rule 14) tùy cấp đơn vị người gửi.

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-039-01 | Cập nhật là partial update: chỉ field có trong request được áp dụng; field thiếu giữ nguyên giá trị hiện tại. | Update |
| BR-039-02 | Nếu request đổi `orgUnitId` (#1), đơn vị mới phải nằm trong phạm vi đơn vị user (`OrgUnitScopeService.Scope.allows`) — ngoài phạm vi → từ chối, không thay đổi dữ liệu. | Update |
| BR-039-03 | `channelCode` (#4), `routeCode` (#23), #47-#71 không nằm trong DTO update; client gửi các trường này bị bỏ qua/không lưu. | Update |
| BR-039-04 | Mọi text input trim trước khi lưu; không lưu khoảng trắng thừa đầu/cuối. | Update |
| BR-039-05 | `updatedBy`/`updatedAt` ghi từ session người thao tác, không nhận từ client. | Update |
| BR-039-06 | Bảng con `routeDetails`/`coordinateList`/`attachments` khi gửi sẽ thay thế toàn bộ danh sách cũ trong cùng transaction (cascade + orphanRemoval); lỗi ở bất kỳ phần nào rollback toàn bộ update. | Update |
| BR-039-07 | Hồ sơ không tồn tại hoặc đã bị xóa mềm → trả lỗi tiếng Việt "Không tìm thấy luồng hàng hải với id: …", không tạo bản ghi mới. | Update |
| BR-039-08 | `securityLevel` chỉ được nâng/hạ theo quyền tương ứng; user không đủ quyền → từ chối. | Update |

### 4.2. Acceptance Criteria

| AC-ID | Given | When | Then | Oracle |
|---|---|---|---|---|
| AC-039-01 | Người dùng có `navigationchannel:update` và hồ sơ tồn tại | Gửi PUT với một số trường #1-#46 | Chỉ các trường gửi được áp dụng; các trường còn lại giữ nguyên; response trả hồ sơ đã cập nhật | So sánh response: field không gửi không đổi giá trị; `updatedAt`/`updatedBy` mới. |
| AC-039-02 | Request đổi `orgUnitId` ngoài phạm vi user | Gửi PUT | API từ chối (403/denied) và dữ liệu không đổi | Không có thay đổi trong database; message tiếng Việt. |
| AC-039-03 | Request gửi kèm `channelCode`/`routeCode` hoặc #47-#71 | Gửi PUT | Server bỏ qua các trường này, không lưu | Response giữ nguyên `channelCode` cũ; approval status không đổi. |
| AC-039-04 | Request gửi `routeDetails` mới | Gửi PUT | Toàn bộ danh sách tuyến luồng cũ bị thay thế, `routeCode` tự sinh mới | DB chỉ còn danh sách mới gắn với `navigationChannelId`; lỗi một dòng → rollback. |
| AC-039-05 | Request gửi text có khoảng trắng thừa | Gửi PUT | Giá trị lưu đã trim | Response không còn khoảng trắng đầu/cuối. |
| AC-039-06 | Hồ sơ không tồn tại / đã xóa mềm | Gửi PUT | API trả lỗi tiếng Việt, không tạo bản ghi | HTTP 400-family + message "Không tìm thấy luồng hàng hải với id". |
| AC-039-07 | User thiếu `navigationchannel:update` | Gửi PUT | HTTP 403; UI không hiển thị nút Sửa | Permission code khớp `navigationchannel:update`. |

### 4.3. User Stories

- **US-039-01:** Là Chuyên viên, tôi muốn sửa các trường #1-#46 của hồ sơ Luồng hàng hải đã tạo để cập nhật thông tin khi có thay đổi.
- **US-039-02:** Là Chuyên viên, tôi muốn chỉ gửi các trường cần sửa mà không phải nhập lại toàn bộ form để cập nhật nhanh.
- **US-039-03:** Là Chuyên viên, tôi muốn sau khi sửa có thể gửi lại hồ sơ vào quy trình phê duyệt 2 cấp để thay đổi được kiểm soát.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Cập nhật hồ sơ | `navigationchannel:update` |
| Gửi lại phê duyệt sau khi sửa | `navigationchannel:update` (endpoint submit-approval) |

| Vai trò | Xem | Sửa | Gửi duyệt | Ghi chú |
|---|---|---|---|---|
| Chuyên viên thuộc đơn vị | Có, theo scope | Có nếu được gán quyền `navigationchannel:update` | Có | Chỉ sửa hồ sơ đọc được trong phạm vi `orgUnitId`; đổi đơn vị ngoài scope bị chặn. |
| Lãnh đạo Cảng vụ/Chi cục | Có, theo scope | Có nếu được gán quyền | Có nếu được gán quyền | — |
| Lãnh đạo Cục / Admin Cục | Có, toàn phạm vi Cục khi có `orgunit:scope_all`/`admin:all`/`*` | Có nếu được gán quyền | Có nếu được gán quyền | Xem được metadata nhạy cảm (người tạo, người sửa cuối, thời gian) theo quyền. |
| Quản trị hệ thống | Có | Có | Có | ROLE_SYSTEM_ADMIN vượt qua mọi kiểm tra quyền. |
| Người không có quyền tương ứng | Không | Không | Không | API trả 403 Forbidden. |

**Admin Cục:** với F-039, Admin Cục được sửa hồ sơ Luồng hàng hải trong phạm vi Cục khi có permission `navigationchannel:update` hoặc quyền tổng `admin:all`/`*`; vẫn chịu ràng buộc write-scope theo đơn vị và không được phá yêu cầu data scope chung.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không có guard trạng thái trong `service.update` (NavigationChannelService.java:206-336) — hồ sơ chưa xóa ở trạng thái nào cũng nhận PUT nếu có quyền; update không đổi `approvalStatus`. Điểm lệch với kỳ vọng work order đã ghi chú ở mục 3 để PMO chốt. |
| 2 | Có bước phê duyệt không | Gián tiếp: sửa xong hồ sơ được gửi lại quy trình 2 cấp qua `POST /{id}/submit-approval` (F-041); bản thân thao tác sửa không có bước duyệt riêng. |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị. Field scope là #1 `orgUnitId` (bắt buộc khi tạo, có thể đổi khi sửa). Entity `NavigationChannel` khai `@Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")` (NavigationChannel.java:22); controller `NavigationChannelController` khai `@DataScope` class-level (NavigationChannelController.java:25) để `DataScopeAspect` bật filter. Chiều ghi validate đơn vị trong phạm vi user: `if (!orgUnitScopeService.currentUserScope().allows(req.getOrgUnitId())) throw AccessDeniedException` (NavigationChannelService.java:212-215). Cấm để `orgUnitId` NULL và cấm gán đơn vị ngoài phạm vi. |
| 4 | Trường chỉ hiện trong điều kiện nào | `channelCode` (#4), `routeCode` (#23) disabled, không sửa được (NavigationChannelForm.tsx:838); #47-#71 không có trong DTO update nên không thể sửa qua API. |
| 5 | Quyền riêng | `navigationchannel:update` (sửa + gửi duyệt lại). |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không. Endpoint PUT yêu cầu đăng nhập, RBAC và data scope. |
| 7 | Tải lên tệp | Có. `attachments` (#46) gửi kèm update sẽ thay thế danh sách attachment cũ của hồ sơ trong cùng transaction. |
| 8 | Giao diện khác mẫu chung | Không tạo layout riêng. Form sửa dùng chung `NavigationChannelForm.tsx` (create/edit/detail), tuân thủ convention chung và token system; không mô tả hardcode màu/spacing/font. |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| PUT | `/api/v1/navigation-channel/{id}` | Cập nhật hồ sơ theo partial update #1-#46; không nhận `channelCode`/`routeCode`/#47-#71; ghi `updatedBy` từ session. | `navigationchannel:update` |
| POST | `/api/v1/navigation-channel/{id}/submit-approval` | Gửi lại hồ sơ vào quy trình phê duyệt sau khi sửa (chi tiết F-041). | `navigationchannel:update` |
| GET | `/api/v1/navigation-channel/{id}` | Lấy hồ sơ hiện tại để prefill form sửa (chi tiết F-042). | `navigationchannel:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Không có thay đổi schema mới cho F-039: entity `NavigationChannel`, bảng con `channel_route_detail`/`navigation_channel_coordinate`, attachment `infrastructure_attachments` (refType=NAVIGATION_CHANNEL) và migration `V20260825120000__navigation_channel_excel_71_fields.sql` đã chốt tại F-038 (design/00-design-plan.md mục 4-5). Update sử dụng cơ chế cascade `ALL` + `orphanRemoval` có sẵn trên `channelRouteDetailList`/`coordinates` (NavigationChannel.java:104-113). Không thêm cột, không thêm index.
