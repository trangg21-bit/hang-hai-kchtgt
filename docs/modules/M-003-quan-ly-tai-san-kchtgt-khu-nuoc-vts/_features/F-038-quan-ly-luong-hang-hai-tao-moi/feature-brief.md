---
id: F-038
name: "Tạo mới Luồng hàng hải"
slug: quan-ly-luong-hang-hai-tao-moi
module-id: M-003
status: proposed
classification: local
priority: P0
created: "2026-06-29T00:00:00Z"
last-updated: "2026-08-24"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Tạo mới Luồng hàng hải

**Tài liệu:** Tài liệu chức năng — phần riêng theo template 7 section.  
**Chức năng:** F-038 — Tạo mới Luồng hàng hải.  
**Module:** M-003 — Quản lý tài sản KCHTGT khu nước & VTS.  
**Loại:** Chức năng có bước phê duyệt 2 cấp.  
**Tham chiếu:** Excel sheet "Luồng hàng hải" gồm 71 trường. Tại thời điểm cập nhật, module M-003 không có `ba/01-base-pattern.md`; brief này tự chứa các phần chung cần thiết và phần riêng của F-038.

## 1. Mô tả ngắn

Chức năng F-038 cho phép người dùng có thẩm quyền tạo mới hồ sơ Luồng hàng hải theo đúng danh mục 71 trường từ spec Excel. Người dùng nhập thông tin hồ sơ chính, tuyến luồng, phạm vi bảo vệ, bản đồ, tọa độ và file đính kèm; hệ thống tự sinh mã luồng hàng hải với prefix `LHH`. Các trường trạng thái, kiểm toán, kết cấu hạ tầng liên quan, vận hành, bảo trì và sự cố chỉ hiển thị read-only khi xem chi tiết. Hồ sơ sau khi tạo đi theo quy trình phê duyệt 2 cấp: Cảng vụ/Chi cục duyệt cấp 1, Cục duyệt cấp 2.

## 2. Trường dữ liệu

Bảng dưới đây là source of truth cho field coverage F-038. Cột **Trường** ghi label tiếng Việt và technical field English trong ngoặc backtick. Cột **Ghi chú** ghi phạm vi hiển thị theo Excel: DS = Danh sách, Lọc = Bộ lọc, CT = Xem chi tiết, Tạo = Tạo mới, Sửa = Chỉnh sửa.

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Đơn vị quản lý (`orgUnitId`) | Có | SelectOrgCode | DS/Lọc/CT/Tạo/Sửa. Field bắt buộc cho data scope. |
| 2 | Thuộc cảng biển (`seaportId`) | Không | SelectKcht(CB) | DS/Lọc/CT/Tạo/Sửa. |
| 3 | Đơn vị vận hành (`operatingUnitId`) | Không | SelectCateOther | CT/Tạo/Sửa. |
| 4 | Mã luồng hàng hải (`channelCode`) | Không | Input disabled | DS/Lọc/CT/Tạo/Sửa; tự sinh prefix `LHH`, không cho nhập tay. |
| 5 | Tên luồng hàng hải (`channelName`) | Có | InputTextArea | DS/Lọc/CT/Tạo/Sửa. |
| 6 | Địa điểm (Tỉnh/TP) (`provinceId`) | Không | SelectCateOther | DS/Lọc/CT/Tạo/Sửa. |
| 7 | Địa điểm chi tiết (`detailedLocation`) | Không | InputTextArea | CT/Tạo/Sửa. |
| 8 | Tình trạng (`conditionStatus`) | Có | SelectAppParams | DS/Lọc/CT/Tạo/Sửa. |
| 9 | Trạm quản lý luồng (`managementStation`) | Không | InputTextArea | CT/Tạo/Sửa. |
| 10 | Số lượng trạm (`stationCount`) | Không | Input | CT/Tạo/Sửa. |
| 11 | Số lượng nhân sự tại trạm (`stationStaffCount`) | Không | Input | CT/Tạo/Sửa. |
| 12 | Diện tích trạm m² (`stationAreaSquareMeters`) | Không | InputDecimal | CT/Tạo/Sửa. |
| 13 | Thời điểm sửa chữa trạm gần nhất (`latestStationRepairMonth`) | Không | DatePicker tháng/năm | CT/Tạo/Sửa. |
| 14 | Năm bảo trì gần nhất (`latestMaintenanceYear`) | Không | DatePicker năm | CT/Tạo/Sửa. |
| 15 | Khối lượng nạo vét năm gần nhất m³ (`latestDredgingVolumeCubicMeters`) | Không | InputDecimal | CT/Tạo/Sửa. |
| 16 | Số lượng phao (`buoyCount`) | Không | Input | CT/Tạo/Sửa. |
| 17 | Số lượng tiêu (`beaconCount`) | Không | Input | CT/Tạo/Sửa. |
| 18 | Ghi chú (`notes`) | Không | InputTextArea | CT/Tạo/Sửa. |
| 19 | Quyết định công bố số (`announcementDecisionNumber`) | Không | Input | CT/Tạo/Sửa. |
| 20 | Ngày ra quyết định công bố (`announcementDecisionDate`) | Không | DatePicker | CT/Tạo/Sửa. |
| 21 | Đơn vị ra quyết định công bố (`announcementDecisionIssuer`) | Không | InputTextArea | CT/Tạo/Sửa. |
| 22 | Phân loại (`routeClassification`) | Không | SelectAppParams | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 23 | Mã (`routeCode`) | Không | Input disabled | Bảng con tuyến luồng; CT/Tạo/Sửa; tự sinh, không nhập tay. |
| 24 | Tên (`routeName`) | Không | InputTextArea | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 25 | Loại tuyến luồng (`routeType`) | Không | SelectAppParams | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 26 | Vị trí vũng quay tàu (`turningBasinLocation`) | Không | InputTextArea | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 27 | Bán kính vũng quay tàu m (`turningBasinRadiusMeters`) | Không | InputDecimal | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 28 | Chiều cao tĩnh không (`verticalClearanceMeters`) | Không | InputDecimal | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 29 | Chiều dài luồng km (`channelLengthKilometers`) | Không | InputDecimal | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 30 | Chiều rộng thiết kế lớn nhất m (`maximumDesignWidthMeters`) | Không | InputDecimal | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 31 | Chiều rộng thiết kế nhỏ nhất m (`minimumDesignWidthMeters`) | Không | InputDecimal | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 32 | Độ sâu thiết kế m (`designDepthMeters`) | Không | Input số | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 33 | Độ sâu hiện tại m (`currentDepthMeters`) | Không | Input số | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 34 | Mái dốc thiết kế (`designSlope`) | Không | InputDecimal | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 35 | Bán kính cong nhỏ nhất (`minimumCurveRadiusMeters`) | Không | InputDecimal | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 36 | Khối lượng nạo vét năm gần nhất m³ (`routeLatestDredgingVolumeCubicMeters`) | Không | InputDecimal | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 37 | Năm bảo trì gần nhất (`routeLatestMaintenanceYear`) | Không | DatePicker năm | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 38 | Phân cấp (`routeGrade`) | Không | SelectAppParams | Bảng con tuyến luồng; CT/Tạo/Sửa. |
| 39 | Phạm vi bảo vệ luồng (`protectionScopeMeters`) | Không | Input số | CT/Tạo/Sửa. |
| 40 | Ghi chú (`protectionNotes`) | Không | InputTextArea | CT/Tạo/Sửa. |
| 41 | Loại đối tượng (`geometryType`) | Không | Select Điểm/Đường/Vùng | CT/Tạo/Sửa. |
| 42 | Biểu tượng (`mapIconId`) | Không | Select | CT/Tạo/Sửa. |
| 43 | Hệ quy chiếu (`coordinateReferenceSystem`) | Không | Text | CT/Tạo/Sửa. |
| 44 | Quy tắc hiển thị (`displayRule`) | Không | Text | CT/Tạo/Sửa. |
| 45 | Tọa độ (`coordinates`) | Không | Bảng con Kinh độ/Vĩ độ | CT/Tạo/Sửa; mỗi dòng gồm longitude/latitude. |
| 46 | File đính kèm (`attachments`) | Không | UploadFileTable | CT/Tạo/Sửa. |
| 47 | Trạng thái (`approvalStatus`) | Không | Badge, read-only | DS/Lọc/CT; hệ thống ghi theo workflow, không cho nhập. |
| 48 | Ngày cập nhật (`updatedAt`) | Không | Text, read-only | DS/Lọc/CT; hệ thống ghi. |
| 49 | Cán bộ cập nhật (`updatedBy`) | Không | Text, read-only | CT; hệ thống ghi. |
| 50 | Ngày gửi phê duyệt (`submittedAt`) | Không | Text, read-only | CT; hệ thống ghi. |
| 51 | Cán bộ gửi phê duyệt (`submittedBy`) | Không | Text, read-only | CT; hệ thống ghi. |
| 52 | Ngày phê duyệt cấp Cảng vụ/Chi cục (`level1ApprovedAt`) | Không | Text, read-only | CT; hệ thống ghi khi duyệt cấp 1. |
| 53 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục (`level1ApprovedBy`) | Không | Text, read-only | CT; hệ thống ghi khi duyệt cấp 1. |
| 54 | Nội dung phê duyệt (`level1ApprovalContent`) | Không | Text, read-only | CT; hệ thống ghi khi duyệt/trả về cấp 1. |
| 55 | Ngày phê duyệt cấp Cục (`level2ApprovedAt`) | Không | Text, read-only | CT; hệ thống ghi khi duyệt cấp 2. |
| 56 | Cán bộ phê duyệt cấp Cục (`level2ApprovedBy`) | Không | Text, read-only | CT; hệ thống ghi khi duyệt cấp 2. |
| 57 | Nội dung phê duyệt (`level2ApprovalContent`) | Không | Text, read-only | CT; hệ thống ghi khi duyệt/trả về cấp 2. |
| 58 | Tên kết cấu hạ tầng (`relatedInfrastructureName`) | Không | Text, read-only | CT; lấy từ dữ liệu KCHT liên quan, không nhập trong F-038. |
| 59 | Loại kết cấu hạ tầng (`relatedInfrastructureType`) | Không | Dropdown bộ lọc, read-only | CT; dùng lọc trong khối KCHT liên quan. |
| 60 | Mã kế hoạch (`operationPlanCode`) | Không | Text, read-only | CT; thông tin vận hành khai thác. |
| 61 | Tên kế hoạch (`operationPlanName`) | Không | Text, read-only | CT; thông tin vận hành khai thác. |
| 62 | Ngày bắt đầu (`operationStartDate`) | Không | Text, read-only | CT; thông tin vận hành khai thác. |
| 63 | Ngày kết thúc (`operationEndDate`) | Không | Text, read-only | CT; thông tin vận hành khai thác. |
| 64 | Mã kế hoạch (`maintenancePlanCode`) | Không | Text, read-only | CT; thông tin bảo trì. |
| 65 | Tên kế hoạch (`maintenancePlanName`) | Không | Text, read-only | CT; thông tin bảo trì. |
| 66 | Thời gian bắt đầu (`maintenanceStartTime`) | Không | Text, read-only | CT; thông tin bảo trì. |
| 67 | Thời gian kết thúc (`maintenanceEndTime`) | Không | Text, read-only | CT; thông tin bảo trì. |
| 68 | Mã sự cố (`incidentCode`) | Không | Text, read-only | CT; thông tin sự cố. |
| 69 | Loại sự cố (`incidentType`) | Không | Text, read-only | CT; thông tin sự cố. |
| 70 | Địa điểm (`incidentLocation`) | Không | Text, read-only | CT; thông tin sự cố. |
| 71 | Thời gian (`incidentTime`) | Không | Text, read-only | CT; thông tin sự cố. |

## 3. Trạng thái và phê duyệt

- F-038 là chức năng có bước phê duyệt 2 cấp. Trạng thái hồ sơ lưu dạng số theo enum trạng thái phê duyệt hiện hành; UI hiển thị label tiếng Việt, không lưu chuỗi label vào database.
- Khi lưu tạm, hồ sơ ở `DRAFT` = 0. Khi người dùng gửi phê duyệt, hồ sơ chuyển sang `PENDING_APPROVAL` = 2 và hệ thống ghi `submittedAt` (#50), `submittedBy` (#51).
- Cấp 1 — Cảng vụ/Chi cục: người có `navigationchannel:approvec1` duyệt hồ sơ đang chờ cấp 1. Nếu duyệt, trạng thái chuyển `APPROVED_LEVEL1` = 3 và hệ thống ghi `level1ApprovedAt` (#52), `level1ApprovedBy` (#53), `level1ApprovalContent` (#54). Nếu trả về, trạng thái chuyển `REJECTED_LEVEL1` = 8 và vẫn ghi nội dung trả về tại #54.
- Cấp 2 — Cục: người có `navigationchannel:approvec2` duyệt hồ sơ đã qua cấp 1. Nếu duyệt, trạng thái chuyển `APPROVED` = 5 và hệ thống ghi `level2ApprovedAt` (#55), `level2ApprovedBy` (#56), `level2ApprovalContent` (#57). Nếu trả về, trạng thái chuyển `REJECTED_LEVEL2` = 9 và ghi nội dung trả về tại #57.
- Các trường #47-#57 đều read-only trên form tạo/sửa. Client không được gửi các trường này như dữ liệu chỉnh sửa; hệ thống tự ghi từ workflow và session người thao tác.
- Nếu hồ sơ cần trạng thái trung gian `PROPOSED` = 1 theo quyết định thiết kế, SA phải chốt điểm chuyển trạng thái nhưng không được làm thay đổi yêu cầu Excel: #1/#5/#8 là các trường duy nhất bắt buộc khi tạo.

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-038-01 | F-038 phải bám đúng Excel sheet "Luồng hàng hải" gồm 71 trường; không dùng các field cũ ngoài Excel làm yêu cầu đích. | Create / Update / Detail |
| BR-038-02 | Khi tạo mới chỉ bắt buộc 3 field: `orgUnitId` (#1), `channelName` (#5), `conditionStatus` (#8). | Create |
| BR-038-03 | `channelCode` (#4) và `routeCode` (#23) là mã tự sinh, disabled trên UI; client không được tự nhập hoặc sửa. | Create / Update |
| BR-038-04 | `orgUnitId` (#1) là field data scope bắt buộc; tạo/sửa phải validate đơn vị thuộc phạm vi người thao tác. | Create / Update / Read |
| BR-038-05 | Các trường input text/textarea phải được trim trước khi gửi API và trước khi lưu. | Create / Update / Filter |
| BR-038-06 | Các trường #47-#71 là read-only trong create/update; nếu client gửi trong payload, server phải bỏ qua hoặc trả lỗi validation tiếng Việt rõ nghĩa. | Create / Update |
| BR-038-07 | Duyệt cấp 1 ghi #52-#54; duyệt cấp 2 ghi #55-#57; trạng thái lưu dạng số theo enum, không lưu chuỗi label. | Approval |
| BR-038-08 | Bảng con tuyến luồng #22-#38, tọa độ #45 và file đính kèm #46 phải lưu cùng transaction với hồ sơ chính. | Create / Update |
| BR-038-09 | Dữ liệu KCHT, vận hành, bảo trì, sự cố #58-#71 lấy từ nguồn nghiệp vụ liên quan; không tự gán placeholder hoặc giá trị mặc định khi nguồn rỗng. | Detail |
| BR-038-10 | Mọi thao tác API phải kiểm tra permission `navigationchannel:<action>` tương ứng; user thiếu quyền nhận 403 Forbidden. | Security |

### 4.2. Acceptance Criteria kế thừa

| AC-ID | Given | When | Then | Oracle |
|---|---|---|---|---|
| AC-038-01 | Người dùng có `navigationchannel:create` | Mở form Tạo mới Luồng hàng hải | Hệ thống cung cấp các trường #1-#46 đúng control Excel; không cho nhập #47-#71 | Form schema/DOM hoặc response cấu hình form có đủ 46 field nhập và không có input editable cho read-only field. |
| AC-038-02 | Người dùng bỏ trống `orgUnitId`, `channelName` hoặc `conditionStatus` | Nhấn lưu | Hệ thống chặn submit và hiển thị lỗi tiếng Việt tại field tương ứng | Không có bản ghi mới được tạo. |
| AC-038-03 | Payload hợp lệ và nằm trong phạm vi đơn vị | Tạo mới | Hệ thống tạo `NavigationChannel`, tự sinh `channelCode` prefix `LHH`, lưu dữ liệu nhập #1-#46 và bỏ qua #47-#71 từ client | Response trả về bản ghi mới có id, `channelCode`, audit tạo từ session. |
| AC-038-04 | Payload có nhiều dòng tuyến luồng | Tạo mới | Các dòng #22-#38 được lưu gắn với cùng `navigationChannelId` | Lỗi ở bất kỳ dòng con làm rollback toàn bộ create. |
| AC-038-05 | User chọn `orgUnitId` ngoài phạm vi | Gọi create/update/read theo đơn vị đó | API từ chối và không thay đổi dữ liệu | HTTP 403 hoặc lỗi nghiệp vụ tiếng Việt; database không phát sinh bản ghi sai scope. |
| AC-038-06 | Hồ sơ ở trạng thái chờ cấp 1 và user có `navigationchannel:approvec1` | Duyệt hoặc trả về cấp 1 | Hệ thống cập nhật trạng thái số và các field #52-#54 | Field #52-#54 có giá trị từ workflow/session, không từ payload tùy ý. |
| AC-038-07 | Hồ sơ đã qua cấp 1 và user có `navigationchannel:approvec2` | Duyệt hoặc trả về cấp 2 | Hệ thống cập nhật trạng thái số và các field #55-#57 | Field #55-#57 có giá trị từ workflow/session, không từ payload tùy ý. |
| AC-038-08 | Chi tiết hồ sơ có hoặc không có dữ liệu liên quan #58-#71 | Xem chi tiết | Hệ thống hiển thị dữ liệu read-only nếu có; nếu nguồn rỗng thì để rỗng có kiểm soát, không gán dữ liệu giả | Response detail phân biệt null/empty và không tạo placeholder. |
| AC-038-09 | User thiếu permission thao tác | Gọi API tương ứng | API trả 403 và UI không hiển thị thao tác | Permission code khớp `navigationchannel:<action>`. |

### 4.3. User Stories kế thừa

- **US-038-01:** Là Chuyên viên, tôi muốn tạo mới hồ sơ Luồng hàng hải theo đúng 71 trường Excel để dữ liệu KCHT hàng hải được chuẩn hóa.
- **US-038-02:** Là Chuyên viên, tôi muốn chỉ phải nhập 3 trường bắt buộc #1/#5/#8 khi tạo để có thể lưu hồ sơ khi các thông tin khác chưa đầy đủ.
- **US-038-03:** Là Chuyên viên, tôi muốn nhập nhiều tuyến luồng con #22-#38 trong một hồ sơ để mô tả đầy đủ cấu trúc luồng.
- **US-038-04:** Là Chuyên viên, tôi muốn nhập tọa độ và file đính kèm để hoàn thiện hồ sơ bản đồ và tài liệu.
- **US-038-05:** Là Lãnh đạo Cảng vụ/Chi cục, tôi muốn duyệt hoặc trả về hồ sơ cấp 1 để kiểm soát nghiệp vụ trước khi gửi Cục.
- **US-038-06:** Là Lãnh đạo Cục/Admin Cục, tôi muốn duyệt hoặc trả về hồ sơ cấp 2 và xem metadata nhạy cảm để quyết định cuối cùng và truy vết trách nhiệm.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem danh sách/chi tiết thông thường | `navigationchannel:read` |
| Xem bản ghi hạn chế | `navigationchannel:read:restricted` |
| Xem bản ghi mật hoặc metadata nhạy cảm | `navigationchannel:read:confidential` |
| Tạo mới | `navigationchannel:create` |
| Cập nhật | `navigationchannel:update` |
| Xóa | `navigationchannel:delete` |
| Phê duyệt cấp Cảng vụ/Chi cục | `navigationchannel:approvec1` |
| Phê duyệt cấp Cục | `navigationchannel:approvec2` |
| Xem lịch sử phê duyệt | `navigationchannel:history` |

| Vai trò | Xem | Tạo | Sửa | Xóa | Duyệt C1 | Duyệt C2 | Lịch sử | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| Chuyên viên thuộc đơn vị | Có, theo scope | Có | Có với hồ sơ được phép | Có nếu được gán quyền | Không | Không | Có nếu được gán quyền | Bị giới hạn theo `orgUnitId`. |
| Lãnh đạo Cảng vụ/Chi cục | Có, theo scope | Có nếu được gán quyền | Có nếu được gán quyền | Có nếu được gán quyền | Có | Không | Có | Duyệt cấp 1 cho hồ sơ trong phạm vi. |
| Lãnh đạo Cục / Admin Cục | Có, toàn phạm vi Cục khi có `orgunit:scope_all`/`admin:all`/`*` | Có nếu được gán quyền | Có nếu được gán quyền | Có nếu được gán quyền | Có nếu được gán quyền | Có | Có | Được xem metadata nhạy cảm: người tạo, người sửa cuối, thời gian tạo/cập nhật và các field kiểm toán #47-#57 theo quyền. |
| Quản trị hệ thống | Có | Có | Có | Có | Có | Có | Có | ROLE_SYSTEM_ADMIN vượt qua mọi kiểm tra quyền theo cơ chế hệ thống. |
| Người không có quyền tương ứng | Không | Không | Không | Không | Không | Không | Không | API trả 403 Forbidden. |

**Admin Cục:** Phải được khai báo trong mọi feature. Với F-038, Admin Cục được xem toàn bộ dữ liệu Luồng hàng hải trong phạm vi Cục, bao gồm metadata nhạy cảm và lịch sử phê duyệt; được thao tác tạo/sửa/xóa/duyệt chỉ khi có permission `navigationchannel:<action>` tương ứng hoặc quyền tổng `admin:all`/`*`. Admin Cục không được làm mất yêu cầu data scope và 4-eyes principle nếu hệ thống chung đang bật kiểm soát này.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có. Dùng workflow phê duyệt số: `DRAFT`=0, `PENDING_APPROVAL`=2, `APPROVED_LEVEL1`=3, `APPROVED`=5, `REJECTED_LEVEL1`=8, `REJECTED_LEVEL2`=9; `PROPOSED`=1 chỉ dùng nếu SA chốt điểm chuyển trung gian. |
| 2 | Có bước phê duyệt không | Có. 2 cấp: Cảng vụ/Chi cục duyệt cấp 1 bằng `navigationchannel:approvec1`, Cục duyệt cấp 2 bằng `navigationchannel:approvec2`; các trường #47-#57 read-only. |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị. Field scope là #1 `orgUnitId`, bắt buộc khi tạo. Entity nghiệp vụ đích phải có `orgUnitId` và `@Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")`; controller phải khai `@DataScope` để `DataScopeAspect` bật filter. Nguồn gán đơn vị khi tạo là `orgUnitId` trong request sau khi người dùng chọn Đơn vị quản lý; nếu hệ thống tự prefill từ đơn vị user thì vẫn phải gửi/lưu `orgUnitId`. Chiều ghi phải validate đơn vị trong phạm vi user bằng cơ chế scope (`OrgUnitScopeService` hoặc service tương đương); cấm để `orgUnitId` NULL và cấm gán đơn vị ngoài phạm vi. |
| 4 | Trường chỉ hiện trong điều kiện nào | Có. #47-#71 chỉ read-only ở màn xem chi tiết; #52-#54 chỉ có dữ liệu sau xử lý cấp 1; #55-#57 chỉ có dữ liệu sau xử lý cấp 2; #58-#71 chỉ có dữ liệu khi nguồn KCHT/vận hành/bảo trì/sự cố liên quan tồn tại. |
| 5 | Quyền riêng | `navigationchannel:read`, `navigationchannel:read:restricted`, `navigationchannel:read:confidential`, `navigationchannel:create`, `navigationchannel:update`, `navigationchannel:delete`, `navigationchannel:approvec1`, `navigationchannel:approvec2`, `navigationchannel:history`. |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không. Tất cả endpoint F-038 yêu cầu đăng nhập, RBAC và data scope. |
| 7 | Tải lên tệp | Có. Field #46 `attachments` dùng UploadFileTable; file đính kèm thuộc hồ sơ Luồng hàng hải và lưu cùng transaction nghiệp vụ theo thiết kế SA/Dev chốt. |
| 8 | Giao diện khác mẫu chung | Không tạo layout riêng. Màn danh sách/form/modal tuân thủ convention chung của dự án; brief này chỉ yêu cầu đúng field, trạng thái read-only và visibility theo Excel, không mô tả hardcode màu/spacing/font. |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/navigation-channel` | Lấy danh sách Luồng hàng hải; hỗ trợ DS/Lọc theo #1, #2, #4, #5, #6, #8, #47, #48 và data scope `orgUnitId`. | `navigationchannel:read` |
| GET | `/api/v1/navigation-channel/{id}` | Xem chi tiết đủ 71 trường; #47-#71 read-only. | `navigationchannel:read` + `navigationchannel:read:restricted`/`navigationchannel:read:confidential` khi xem dữ liệu hạn chế/mật. |
| POST | `/api/v1/navigation-channel` | Tạo mới hồ sơ Luồng hàng hải với #1-#46; server tự sinh `channelCode` và ghi audit. | `navigationchannel:create` |
| PUT | `/api/v1/navigation-channel/{id}` | Cập nhật hồ sơ và bảng con nhập liệu #1-#46; không nhận #47-#71 như dữ liệu chỉnh sửa. | `navigationchannel:update` |
| DELETE | `/api/v1/navigation-channel/{id}` | Xóa hồ sơ theo cơ chế xóa mềm nếu hệ thống chung áp dụng. | `navigationchannel:delete` |
| POST | `/api/v1/navigation-channel/{id}/submit-approval` | Gửi hồ sơ vào quy trình phê duyệt, ghi #50-#51 và trạng thái số tương ứng. | `navigationchannel:update` |
| POST | `/api/v1/navigation-channel/{id}/approve-level-1` | Phê duyệt cấp Cảng vụ/Chi cục, ghi #52-#54. | `navigationchannel:approvec1` |
| POST | `/api/v1/navigation-channel/{id}/reject-level-1` | Trả về cấp Cảng vụ/Chi cục, ghi nội dung trả về ở #54. | `navigationchannel:approvec1` |
| POST | `/api/v1/navigation-channel/{id}/approve-level-2` | Phê duyệt cấp Cục, ghi #55-#57. | `navigationchannel:approvec2` |
| POST | `/api/v1/navigation-channel/{id}/reject-level-2` | Trả về cấp Cục, ghi nội dung trả về ở #57. | `navigationchannel:approvec2` |
| GET | `/api/v1/navigation-channel/{id}/history` | Lấy lịch sử phê duyệt/thay đổi của hồ sơ. | `navigationchannel:history` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm/chuẩn hóa theo Excel; ~~gạch ngang~~ = trường cũ cần loại bỏ khỏi target vì không còn trong Excel 71 trường. Technical identifiers dưới đây dùng English; SA chốt migration, index, kiểu dữ liệu cụ thể và backfill.

**Entity chính `NavigationChannel` / bảng `navigation_channel`:**

| Nhóm | Field đề xuất | Ghi chú BA |
|---|---|---|
| Định danh | `id`, `channel_code`, `channel_name` | `channel_code` tự sinh prefix `LHH`; `channel_name` bắt buộc. |
| Đơn vị và vị trí | 🔴 `org_unit_id`, 🔴 `seaport_id`, 🔴 `operating_unit_id`, 🔴 `province_id`, 🔴 `detailed_location`, 🔴 `condition_status` | `org_unit_id` và `condition_status` bắt buộc; `org_unit_id` dùng data scope. |
| Thông tin trạm/khác | 🔴 `management_station`, 🔴 `station_count`, 🔴 `station_staff_count`, 🔴 `station_area_square_meters`, 🔴 `latest_station_repair_month`, 🔴 `latest_maintenance_year`, 🔴 `latest_dredging_volume_cubic_meters`, 🔴 `buoy_count`, 🔴 `beacon_count`, 🔴 `notes` | Tương ứng #9-#18. |
| Công bố đưa vào sử dụng | 🔴 `announcement_decision_number`, 🔴 `announcement_decision_date`, 🔴 `announcement_decision_issuer` | Tương ứng #19-#21. |
| Bảo vệ/bản đồ | 🔴 `protection_scope_meters`, 🔴 `protection_notes`, 🔴 `geometry_type`, 🔴 `map_icon_id`, 🔴 `coordinate_reference_system`, 🔴 `display_rule` | Tương ứng #39-#44. |
| Trạng thái và kiểm toán phê duyệt | `approval_status`, `updated_at`, `updated_by`, 🔴 `submitted_at`, 🔴 `submitted_by`, 🔴 `level1_approved_at`, 🔴 `level1_approved_by`, 🔴 `level1_approval_content`, 🔴 `level2_approved_at`, 🔴 `level2_approved_by`, 🔴 `level2_approval_content` | Tương ứng #47-#57; read-only với client. Có thể kế thừa một phần từ `BaseApprovableEntity`, SA chốt tránh trùng cột. |
| Field cũ cần loại khỏi target | ~~`registered_area`~~, ~~`operating_hours`~~, ~~`recorded_date`~~, ~~`quantity`~~, ~~`load_capacity`~~ | Các field này không nằm trong Excel 71 trường của Luồng hàng hải. |

**Bảng con `channel_route_detail` cho tuyến luồng #22-#38:**

| Field đề xuất | Ghi chú BA |
|---|---|
| `id`, `navigation_channel_id`, `sequence_no` | FK `navigation_channel_id` đến `navigation_channel`; giữ thứ tự dòng. |
| 🔴 `route_classification`, 🔴 `route_code`, 🔴 `route_name`, 🔴 `route_type`, 🔴 `turning_basin_location`, 🔴 `turning_basin_radius_meters` | #22-#27; `route_code` tự sinh/disabled. |
| 🔴 `vertical_clearance_meters`, 🔴 `channel_length_kilometers`, 🔴 `maximum_design_width_meters`, 🔴 `minimum_design_width_meters`, 🔴 `design_depth_meters`, 🔴 `current_depth_meters` | #28-#33. |
| 🔴 `design_slope`, 🔴 `minimum_curve_radius_meters`, 🔴 `route_latest_dredging_volume_cubic_meters`, 🔴 `route_latest_maintenance_year`, 🔴 `route_grade` | #34-#38. |

**Bảng con `navigation_channel_coordinate` cho tọa độ #45:**

| Field đề xuất | Ghi chú BA |
|---|---|
| `id`, `navigation_channel_id`, `sequence_no`, `longitude`, `latitude` | Lưu bảng con Kinh độ/Vĩ độ; SA chốt kiểu số và hệ tọa độ. |

**Bảng con/quan hệ `navigation_channel_attachment` cho file #46:**

| Field đề xuất | Ghi chú BA |
|---|---|
| `id`, `navigation_channel_id`, `file_id`, `file_name`, `file_url`, `content_type`, `file_size`, `uploaded_at`, `uploaded_by` | UploadFileTable; SA chốt storage và kiểm soát file theo pattern chung. |

**Dữ liệu read-only lấy từ module liên quan, không nhập trong F-038:**

| Nhóm | Field response đề xuất | Ghi chú BA |
|---|---|---|
| Kết cấu hạ tầng thuộc luồng | `relatedInfrastructureName`, `relatedInfrastructureType` | #58-#59; có thể lấy qua query/view/link table, không tạo placeholder. |
| Vận hành khai thác | `operationPlanCode`, `operationPlanName`, `operationStartDate`, `operationEndDate` | #60-#63; chỉ CT. |
| Bảo trì | `maintenancePlanCode`, `maintenancePlanName`, `maintenanceStartTime`, `maintenanceEndTime` | #64-#67; chỉ CT. |
| Sự cố | `incidentCode`, `incidentType`, `incidentLocation`, `incidentTime` | #68-#71; chỉ CT. |
