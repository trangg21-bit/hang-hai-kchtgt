---
feature-id: F-038
document: lean-spec
output-mode: lean
last-updated: 2026-08-24
---
# Tạo mới Luồng hàng hải

## Summary

Hệ thống cần cho phép người dùng có thẩm quyền tạo mới hồ sơ Luồng hàng hải theo đúng spec Excel sheet "Luồng hàng hải" gồm 71 trường. Form tạo mới chỉ bắt buộc 3 trường: Đơn vị quản lý (`orgUnitId`), Tên luồng hàng hải (`channelName`) và Tình trạng (`conditionStatus`). Các trường nhập liệu từ #1 đến #46 thuộc hồ sơ chính, tuyến luồng, bản đồ và file đính kèm; các trường #47 đến #71 là thông tin trạng thái, kiểm toán, liên kết kết cấu hạ tầng, vận hành, bảo trì và sự cố chỉ đọc khi xem chi tiết. Luồng phê duyệt phải theo 2 cấp: Cảng vụ/Chi cục duyệt cấp 1, sau đó Cục duyệt cấp 2; trạng thái lưu dạng số, không lưu chuỗi trạng thái trong database.

## Scope

| | Items |
|---|---|
| In scope | Tạo mới hồ sơ Luồng hàng hải theo 71 trường Excel; validation 3 trường bắt buộc #1/#5/#8; tự sinh mã luồng prefix `LHH` cho `channelCode`; tạo/sửa bảng con tuyến luồng #22-#38; nhập phạm vi bảo vệ, bản đồ, tọa độ và file đính kèm #39-#46; hiển thị nhưng không cho sửa các trường chỉ đọc #47-#71; ghi nhận trạng thái và kiểm toán phê duyệt 2 cấp #47-#57; phân quyền `navigationchannel:*`; lọc dữ liệu theo đơn vị bằng `orgUnitId` và Data Scope. |
| Out of scope | Sửa code hoặc schema trong lượt BA này; thay đổi feature khác của M-003; tạo màn riêng cho vận hành/bảo trì/sự cố; tự sinh dữ liệu mẫu; public endpoint không cần đăng nhập; thay đổi quy ước giao diện chung. |
| Assumptions | Người dùng đã đăng nhập; danh mục Đơn vị quản lý, Cảng biển, Tình trạng, Loại tuyến luồng, Phân cấp, Biểu tượng và Loại đối tượng đã có nguồn dữ liệu; Cục hoặc tài khoản có quyền `orgunit:scope_all` xem được toàn bộ theo quy ước data scope; Section kỹ thuật là đề xuất BA để SA chốt. |

### Field Coverage Matrix

| # | Label | Technical field | Control | Required | Visibility / behavior |
|---|---|---|---|---|---|
| 1 | Đơn vị quản lý | `orgUnitId` | SelectOrgCode | Có | DS/Lọc/CT/Tạo/Sửa; dùng cho data scope. |
| 2 | Thuộc cảng biển | `seaportId` | SelectKcht(CB) | Không | DS/Lọc/CT/Tạo/Sửa. |
| 3 | Đơn vị vận hành | `operatingUnitId` | SelectCateOther | Không | CT/Tạo/Sửa. |
| 4 | Mã luồng hàng hải | `channelCode` | Input disabled | Không | DS/Lọc/CT/Tạo/Sửa; tự sinh prefix `LHH`. |
| 5 | Tên luồng hàng hải | `channelName` | InputTextArea | Có | DS/Lọc/CT/Tạo/Sửa. |
| 6 | Địa điểm (Tỉnh/TP) | `provinceId` | SelectCateOther | Không | DS/Lọc/CT/Tạo/Sửa. |
| 7 | Địa điểm chi tiết | `detailedLocation` | InputTextArea | Không | CT/Tạo/Sửa. |
| 8 | Tình trạng | `conditionStatus` | SelectAppParams | Có | DS/Lọc/CT/Tạo/Sửa. |
| 9 | Trạm quản lý luồng | `managementStation` | InputTextArea | Không | CT/Tạo/Sửa. |
| 10 | Số lượng trạm | `stationCount` | Input | Không | CT/Tạo/Sửa. |
| 11 | Số lượng nhân sự tại trạm | `stationStaffCount` | Input | Không | CT/Tạo/Sửa. |
| 12 | Diện tích trạm m² | `stationAreaSquareMeters` | InputDecimal | Không | CT/Tạo/Sửa. |
| 13 | Thời điểm sửa chữa trạm gần nhất | `latestStationRepairMonth` | DatePicker tháng/năm | Không | CT/Tạo/Sửa. |
| 14 | Năm bảo trì gần nhất | `latestMaintenanceYear` | DatePicker năm | Không | CT/Tạo/Sửa. |
| 15 | Khối lượng nạo vét năm gần nhất m³ | `latestDredgingVolumeCubicMeters` | InputDecimal | Không | CT/Tạo/Sửa. |
| 16 | Số lượng phao | `buoyCount` | Input | Không | CT/Tạo/Sửa. |
| 17 | Số lượng tiêu | `beaconCount` | Input | Không | CT/Tạo/Sửa. |
| 18 | Ghi chú | `notes` | InputTextArea | Không | CT/Tạo/Sửa. |
| 19 | Quyết định công bố số | `announcementDecisionNumber` | Input | Không | CT/Tạo/Sửa. |
| 20 | Ngày ra quyết định công bố | `announcementDecisionDate` | DatePicker | Không | CT/Tạo/Sửa. |
| 21 | Đơn vị ra quyết định công bố | `announcementDecisionIssuer` | InputTextArea | Không | CT/Tạo/Sửa. |
| 22 | Phân loại | `routeClassification` | SelectAppParams | Không | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 23 | Mã | `routeCode` | Input disabled | Không | Bảng con tuyến luồng; tự sinh; CT/Tạo/Sửa. |
| 24 | Tên | `routeName` | InputTextArea | Không | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 25 | Loại tuyến luồng | `routeType` | SelectAppParams | Không | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 26 | Vị trí vũng quay tàu | `turningBasinLocation` | InputTextArea | Không | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 27 | Bán kính vũng quay tàu m | `turningBasinRadiusMeters` | InputDecimal | Không | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 28 | Chiều cao tĩnh không | `verticalClearanceMeters` | InputDecimal | Không | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 29 | Chiều dài luồng km | `channelLengthKilometers` | InputDecimal | Không | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 30 | Chiều rộng thiết kế lớn nhất m | `maximumDesignWidthMeters` | InputDecimal | Không | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 31 | Chiều rộng thiết kế nhỏ nhất m | `minimumDesignWidthMeters` | InputDecimal | Không | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 32 | Độ sâu thiết kế m | `designDepthMeters` | Input số | Không | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 33 | Độ sâu hiện tại m | `currentDepthMeters` | Input số | Không | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 34 | Mái dốc thiết kế | `designSlope` | InputDecimal | Không | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 35 | Bán kính cong nhỏ nhất | `minimumCurveRadiusMeters` | InputDecimal | Không | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 36 | Khối lượng nạo vét năm gần nhất m³ | `routeLatestDredgingVolumeCubicMeters` | InputDecimal | Không | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 37 | Năm bảo trì gần nhất | `routeLatestMaintenanceYear` | DatePicker năm | Không | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 38 | Phân cấp | `routeGrade` | SelectAppParams | Không | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 39 | Phạm vi bảo vệ luồng | `protectionScopeMeters` | Input số | Không | CT/Tạo/Sửa. |
| 40 | Ghi chú | `protectionNotes` | InputTextArea | Không | CT/Tạo/Sửa. |
| 41 | Loại đối tượng | `geometryType` | Select Điểm/Đường/Vùng | Không | CT/Tạo/Sửa. |
| 42 | Biểu tượng | `mapIconId` | Select | Không | CT/Tạo/Sửa. |
| 43 | Hệ quy chiếu | `coordinateReferenceSystem` | Text | Không | CT/Tạo/Sửa. |
| 44 | Quy tắc hiển thị | `displayRule` | Text | Không | CT/Tạo/Sửa. |
| 45 | Tọa độ | `coordinates` | Bảng con Kinh độ/Vĩ độ | Không | CT/Tạo/Sửa; mỗi dòng gồm longitude/latitude. |
| 46 | File đính kèm | `attachments` | UploadFileTable | Không | CT/Tạo/Sửa. |
| 47 | Trạng thái | `approvalStatus` | Badge | Không | Read-only; DS/Lọc/CT. |
| 48 | Ngày cập nhật | `updatedAt` | Text | Không | Read-only; DS/Lọc/CT. |
| 49 | Cán bộ cập nhật | `updatedBy` | Text | Không | Read-only; CT. |
| 50 | Ngày gửi phê duyệt | `submittedAt` | Text | Không | Read-only; CT. |
| 51 | Cán bộ gửi phê duyệt | `submittedBy` | Text | Không | Read-only; CT. |
| 52 | Ngày phê duyệt cấp Cảng vụ/Chi cục | `level1ApprovedAt` | Text | Không | Read-only; CT. |
| 53 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | `level1ApprovedBy` | Text | Không | Read-only; CT. |
| 54 | Nội dung phê duyệt | `level1ApprovalContent` | Text | Không | Read-only; CT. |
| 55 | Ngày phê duyệt cấp Cục | `level2ApprovedAt` | Text | Không | Read-only; CT. |
| 56 | Cán bộ phê duyệt cấp Cục | `level2ApprovedBy` | Text | Không | Read-only; CT. |
| 57 | Nội dung phê duyệt | `level2ApprovalContent` | Text | Không | Read-only; CT. |
| 58 | Tên kết cấu hạ tầng | `relatedInfrastructureName` | Text | Không | Read-only; CT. |
| 59 | Loại kết cấu hạ tầng | `relatedInfrastructureType` | Dropdown bộ lọc | Không | Read-only; CT. |
| 60 | Mã kế hoạch | `operationPlanCode` | Text | Không | Read-only; CT. |
| 61 | Tên kế hoạch | `operationPlanName` | Text | Không | Read-only; CT. |
| 62 | Ngày bắt đầu | `operationStartDate` | Text | Không | Read-only; CT. |
| 63 | Ngày kết thúc | `operationEndDate` | Text | Không | Read-only; CT. |
| 64 | Mã kế hoạch | `maintenancePlanCode` | Text | Không | Read-only; CT. |
| 65 | Tên kế hoạch | `maintenancePlanName` | Text | Không | Read-only; CT. |
| 66 | Thời gian bắt đầu | `maintenanceStartTime` | Text | Không | Read-only; CT. |
| 67 | Thời gian kết thúc | `maintenanceEndTime` | Text | Không | Read-only; CT. |
| 68 | Mã sự cố | `incidentCode` | Text | Không | Read-only; CT. |
| 69 | Loại sự cố | `incidentType` | Text | Không | Read-only; CT. |
| 70 | Địa điểm | `incidentLocation` | Text | Không | Read-only; CT. |
| 71 | Thời gian | `incidentTime` | Text | Không | Read-only; CT. |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-038-01 | Chuyên viên | Tạo mới hồ sơ Luồng hàng hải với đủ thông tin Excel #1-#46 | Ghi nhận đúng hồ sơ KCHT đường thủy theo đơn vị quản lý | Must Have |
| US-038-02 | Chuyên viên | Chỉ phải nhập 3 trường bắt buộc #1/#5/#8 khi tạo | Tránh ép nhập dữ liệu chưa có trong hồ sơ ban đầu | Must Have |
| US-038-03 | Chuyên viên | Nhập nhiều dòng tuyến luồng #22-#38 trong cùng hồ sơ | Quản lý chi tiết từng tuyến luồng thuộc luồng hàng hải | Must Have |
| US-038-04 | Chuyên viên | Nhập tọa độ và file đính kèm #45-#46 | Hoàn thiện thông tin bản đồ và hồ sơ số | Should Have |
| US-038-05 | Lãnh đạo Cảng vụ/Chi cục | Duyệt hoặc trả về hồ sơ ở cấp 1 | Kiểm soát nghiệp vụ trước khi gửi Cục | Must Have |
| US-038-06 | Lãnh đạo Cục/Admin Cục | Duyệt hoặc trả về hồ sơ ở cấp 2 và xem metadata nhạy cảm | Xác nhận cuối cùng và theo dõi trách nhiệm cập nhật | Must Have |
| US-038-07 | Người xem có quyền | Xem các thông tin vận hành, bảo trì, sự cố chỉ đọc #60-#71 | Có ngữ cảnh khai thác nhưng không chỉnh sửa sai nguồn dữ liệu | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-038-01 | US-038-01 | Hiển thị đúng 71 trường | Given người dùng có `navigationchannel:create`; When mở form Tạo mới Luồng hàng hải; Then hệ thống cung cấp các trường #1-#46 để nhập theo đúng control Excel và không hiển thị các trường #47-#71 như input chỉnh sửa | Các trường chỉ đọc chỉ xuất hiện ở CT theo scope. |
| AC-038-02 | US-038-02 | Validation trường bắt buộc | Given thiếu `orgUnitId`, `channelName` hoặc `conditionStatus`; When nhấn lưu; Then hệ thống chặn submit và hiển thị lỗi tiếng Việt tại trường tương ứng | Chỉ #1/#5/#8 bắt buộc khi tạo. |
| AC-038-03 | US-038-01 | Tạo mới thành công | Given request hợp lệ; When lưu; Then bản ghi `NavigationChannel` được tạo, `channelCode` tự sinh prefix `LHH`, trạng thái khởi tạo theo hành động lưu/gửi duyệt, và các trường read-only không nhận từ client | Ghi audit từ session, không nhận operator từ client. |
| AC-038-04 | US-038-03 | Lưu tuyến luồng | Given payload có nhiều dòng route details; When tạo mới; Then các dòng #22-#38 được lưu gắn với cùng `navigationChannelId` trong một transaction | Lỗi ở một dòng làm rollback toàn bộ create. |
| AC-038-05 | US-038-04 | Lưu bản đồ và file | Given payload có `geometryType`, `coordinates` hoặc `attachments`; When tạo mới; Then hệ thống lưu đúng loại đối tượng, tọa độ longitude/latitude và danh sách file; không gán dữ liệu giả nếu thiếu | Upload tuân thủ kiểm soát file của hệ thống. |
| AC-038-06 | US-038-05 | Duyệt cấp Cảng vụ/Chi cục | Given hồ sơ đã gửi duyệt và user có `navigationchannel:approvec1`; When duyệt hoặc trả về; Then hệ thống cập nhật các trường #52-#54 và trạng thái số tương ứng | User không có quyền nhận 403. |
| AC-038-07 | US-038-06 | Duyệt cấp Cục | Given hồ sơ đã qua cấp 1 và user có `navigationchannel:approvec2`; When duyệt hoặc trả về; Then hệ thống cập nhật các trường #55-#57 và trạng thái số cuối cùng | Áp dụng 4-eyes principle nếu hệ thống chung yêu cầu. |
| AC-038-08 | US-038-07 | Chỉ đọc dữ liệu liên quan | Given chi tiết hồ sơ có KCHT, vận hành, bảo trì hoặc sự cố liên quan; When xem chi tiết; Then các trường #58-#71 hiển thị dạng read-only và không xuất hiện trong payload create/update | Không tự tạo placeholder khi nguồn dữ liệu chưa có. |
| AC-038-09 | US-038-01 | Lọc dữ liệu theo đơn vị | Given user thuộc đơn vị có phạm vi giới hạn; When tạo, sửa, đọc hoặc lọc danh sách; Then dữ liệu bị giới hạn theo `orgUnitId` và subtree được phép | Cục có full scope qua `orgunit:scope_all`/`admin:all`/`*`. |
| AC-038-10 | US-038-01 | Phân quyền thao tác | Given user thiếu permission tương ứng; When gọi API create/update/delete/read/approval/history; Then API trả 403 và UI không hiển thị thao tác không được phép | Permission resource là `navigationchannel`. |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-038-01 | Source of truth của F-038 là Excel sheet "Luồng hàng hải" với đúng 71 trường; không dùng field cũ không có trong Excel làm yêu cầu đích | AC-038-01 | Không có ngoại lệ trong scope BA này. |
| BR-038-02 | Khi tạo mới chỉ bắt buộc `orgUnitId`, `channelName`, `conditionStatus`; các field còn lại optional hoặc read-only theo ma trận #1-#71 | AC-038-02 | SA có thể bổ sung validation kỹ thuật nhưng không được làm trái 3 trường bắt buộc Excel. |
| BR-038-03 | `channelCode` và `routeCode` là mã tự sinh, disabled trên UI; client không được sửa giá trị sinh mã | AC-038-03, AC-038-04 | Không có. |
| BR-038-04 | `orgUnitId` là nguồn data scope; create/update phải validate đơn vị trong phạm vi user và không để trống vì #1 là bắt buộc | AC-038-09 | Admin Cục/Cục có full scope theo permission hệ thống. |
| BR-038-05 | Text input phải được trim trước khi gửi API và trước khi lưu để tránh sai lệch tìm kiếm/lọc | AC-038-02, AC-038-03 | Không có. |
| BR-038-06 | Trường #47-#71 là read-only trong create/update; nếu client gửi các trường này, server bỏ qua hoặc trả lỗi validation rõ nghĩa | AC-038-08 | Không có. |
| BR-038-07 | Duyệt cấp 1 ghi #52-#54; duyệt cấp 2 ghi #55-#57; trạng thái lưu dạng số theo enum hiện hành | AC-038-06, AC-038-07 | Không lưu chuỗi trạng thái trong database. |
| BR-038-08 | Các bảng con route details, coordinates và attachments phải lưu cùng transaction với hồ sơ chính | AC-038-04, AC-038-05 | Không có. |
| BR-038-09 | Permission `navigationchannel:create/update/delete/approvec1/approvec2/read/read:restricted/read:confidential/history` kiểm soát từng thao tác | AC-038-10 | ROLE_SYSTEM_ADMIN vượt qua kiểm tra theo cơ chế hệ thống. |
| BR-038-10 | Dữ liệu liên quan vận hành, bảo trì, sự cố và KCHT #58-#71 được lấy từ nguồn nghiệp vụ liên quan; không gán mặc định hoặc placeholder khi nguồn không có dữ liệu | AC-038-08 | Không có. |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Data integrity | Create/update `NavigationChannel`, route details, coordinates và attachments trong transaction | Không có bản ghi mồ côi khi lỗi. |
| Security | RBAC theo permission `navigationchannel:*` và data scope theo `orgUnitId` | HTTP 403 khi không có quyền hoặc ngoài phạm vi. |
| Auditability | Các field #47-#57 lấy từ workflow/session; không nhận trực tiếp từ client | Truy vết được người và thời điểm cập nhật/phê duyệt. |
| UX | Form dùng label tiếng Việt có dấu; technical keys và API dùng English identifiers | Không hardcode màu, spacing, font trong mô tả UI. |
| Performance | Danh sách và bộ lọc DS/Lọc trên #1/#2/#4/#5/#6/#8/#47/#48 phản hồi ổn định | SA/Dev chốt chỉ số cụ thể theo kiến trúc. |
| Reliability | Không tạo placeholder cho dữ liệu vận hành/bảo trì/sự cố khi nguồn rỗng | Hiển thị rỗng/null có kiểm soát. |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-038-01 | AC-038-01 | Happy path: user có `navigationchannel:create` mở form và thấy đúng nhóm field #1-#46, không nhập được #47-#71 | Integration |
| TS-038-02 | AC-038-02 | Negative: thiếu `orgUnitId`/`channelName`/`conditionStatus` thì bị chặn với thông báo tiếng Việt | Integration |
| TS-038-03 | AC-038-03 | Happy path: tạo hồ sơ hợp lệ, `channelCode` sinh prefix `LHH`, field read-only không lấy từ client | Integration |
| TS-038-04 | AC-038-04 | Boundary: một route detail lỗi làm rollback parent và toàn bộ route details | Integration |
| TS-038-05 | AC-038-05 | Happy path: lưu tọa độ longitude/latitude và file đính kèm trong cùng hồ sơ | Integration |
| TS-038-06 | AC-038-09 | Security: user chọn `orgUnitId` ngoài phạm vi thì API từ chối và không tạo bản ghi | Security |
| TS-038-07 | AC-038-06 | Approval: user có `navigationchannel:approvec1` duyệt cấp 1 và field #52-#54 được ghi | Integration |
| TS-038-08 | AC-038-07 | Approval: user có `navigationchannel:approvec2` duyệt cấp 2 và field #55-#57 được ghi | Integration |
| TS-038-09 | AC-038-08 | Negative: payload create gửi #58-#71 thì server không lưu như dữ liệu chỉnh sửa | Integration |
| TS-038-10 | AC-038-10 | Security: user thiếu permission gọi endpoint tương ứng nhận 403 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes - target aggregate revision | Excel 71 trường yêu cầu `NavigationChannel` mở rộng và bảng con route details/coordinates/attachments; các field cũ ngoài Excel cần loại khỏi target proposal. |
| Architecture affected? | Low/Medium | Dùng endpoint resource hiện có `/api/v1/navigation-channel`, permission `navigationchannel:*`, Data Scope chung; SA cần chốt schema target và migration. |
| Implementation clear? | Yes | Field matrix, required fields, approval states, data scope, permissions and read-only behavior are explicit and observable. |
| Documentation risk | Medium | Module-level `ba/01-base-pattern.md` không tồn tại, nên feature docs tự chứa phần chung cần thiết và không bịa tham chiếu nền. |
| **Verdict** | `Ready for Solution Designer review` | BA spec đã định nghĩa target Excel 71 trường, 3 trường bắt buộc, phê duyệt 2 cấp, data scope và permission boundary. |
