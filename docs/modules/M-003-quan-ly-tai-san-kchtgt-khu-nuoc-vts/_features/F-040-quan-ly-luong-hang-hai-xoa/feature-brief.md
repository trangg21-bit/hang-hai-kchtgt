---
id: F-040
name: Quan ly Luong hang hai - Xoa
slug: quan-ly-luong-hang-hai-xoa
module-id: M-003
status: implemented
classification: local
priority: P1
created: 2026-06-29T00:00:00Z
last-updated: 2026-08-26T02:59:33Z
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Xóa Luồng hàng hải

**Tài liệu:** Tài liệu chức năng — phần riêng theo template 7 section.
**Chức năng:** F-040 — Xóa (soft delete) Luồng hàng hải.
**Module:** M-003 — Quản lý tài sản KCHTGT khu nước & VTS.
**Loại:** Chức năng thường (không có bước phê duyệt riêng cho thao tác xóa).
**Tham chiếu:** Entity `NavigationChannel` và cơ chế audit/soft delete chung tại F-038 (`_features/F-038-quan-ly-luong-hang-hai-tao-moi/feature-brief.md`, `ba/00-lean-spec.md`, `design/00-design-plan.md`) + `BaseEntity` (common). File này CHỈ mô tả phần RIÊNG của F-040.

## 1. Mô tả ngắn

Chức năng F-040 cho phép người dùng có `navigationchannel:delete` xóa mềm hồ sơ Luồng hàng hải **đã được duyệt xong** (`APPROVED` = 5). Hệ thống đánh dấu `deletedAt`/`deletedBy` từ phiên người thao tác và xóa đối tượng bản đồ GIS liên quan; hồ sơ bị xóa không còn xuất hiện trong danh sách, tìm kiếm hay chi tiết (filter `deleted_at IS NULL`). Hồ sơ ở trạng thái khác `APPROVED` bị từ chối với thông báo tiếng Việt rõ nghĩa. Thao tác xóa không thể hoàn tác qua UI.

## 2. Trường dữ liệu

Thao tác xóa không có form nhập liệu. Các trường do hệ thống ghi:

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | `deletedAt` (Thời điểm xóa) | Hệ thống ghi | `TIMESTAMP` | Gán `LocalDateTime.now()` khi xóa mềm (BaseEntity.java:111-115). |
| 2 | `deletedBy` (Người xóa) | Hệ thống ghi | UUID | Lấy từ session người thao tác (`operatorId`), không nhận từ client. |
| 3 | `approvalStatus` (Trạng thái — điều kiện xóa) | Hệ thống kiểm tra | Enum số | Chỉ `APPROVED` (5) được xóa — BR-040-01. |
| 4 | `spatialId` (Đối tượng bản đồ) | Hệ thống xử lý | UUID | Nếu có, đối tượng `GisSpatialObject` bị xóa cùng lúc. |

## 3. Trạng thái và phê duyệt

- Xóa mềm chỉ áp dụng cho hồ sơ ở trạng thái **`APPROVED`** (Đã duyệt = 5): `if (nc.getApprovalStatus() != ApprovalStatus.APPROVED) throw new IllegalStateException("Chỉ có luồng hàng hải đã duyệt mới có thể xóa mềm")` (NavigationChannelService.java:341). Các trạng thái khác (`DRAFT`, `PENDING_APPROVAL`, `APPROVED_LEVEL1`, `REJECTED_LEVEL1`, `REJECTED_LEVEL2`…) đều bị từ chối.
- **⚠️ Điểm lệch so với kỳ vọng ban đầu của work order** ("xóa ở trạng thái cho phép nhiều trạng thái, ghi history DELETE qua `ApprovalHistoryUtils.recordSoftDelete`"): code hiện tại CHỈ cho phép xóa hồ sơ `APPROVED`, và `NavigationChannelService.softDelete` KHÔNG ghi dòng history `DELETE` (grep toàn repo: `ApprovalHistoryUtils.recordSoftDelete` được định nghĩa tại ApprovalHistoryUtils.java:30 nhưng chưa có caller nào). PMO cần chốt: (a) giữ behavior hiện tại và tài liệu như file này, hoặc (b) yêu cầu dev bổ sung ghi history DELETE như một task riêng. Brief này mô tả behavior code hiện tại (phương án a).
- Hồ sơ đã xóa mềm: ẩn khỏi danh sách/tìm kiếm/chi tiết nhờ `@SQLRestriction("deleted_at IS NULL")` trên `BaseEntity` (BaseEntity.java:23) và `findByDeletedAtIsNull` ở repository; gọi GET/PUT/DELETE lại với id đã xóa → lỗi "Không tìm thấy luồng hàng hải với id".

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-040-01 | Chỉ xóa mềm được hồ sơ ở trạng thái `APPROVED` (5); trạng thái khác → `IllegalStateException` "Chỉ có luồng hàng hải đã duyệt mới có thể xóa mềm". | Delete |
| BR-040-02 | Xóa mềm: gán `deletedAt` = thời điểm hiện tại và `deletedBy` = `operatorId` từ session; không xóa cứng bản ghi. | Delete |
| BR-040-03 | Nếu hồ sơ có `spatialId`, xóa đối tượng `GisSpatialObject` tương ứng trong cùng thao tác (NavigationChannelService.java:344-347). | Delete |
| BR-040-04 | Hồ sơ đã xóa mềm không xuất hiện trong danh sách/tìm kiếm/chi tiết; truy cập trực tiếp trả lỗi tiếng Việt "Không tìm thấy luồng hàng hải với id". | Read / Delete |
| BR-040-05 | User thiếu `navigationchannel:delete` → HTTP 403; UI không hiển thị nút Xóa (NavigationChannelList.tsx:326-340). | Security |
| BR-040-06 | Không cho xóa lại hồ sơ đã xóa (id không còn tồn tại trong view hoạt động). | Delete |

### 4.2. Acceptance Criteria

| AC-ID | Given | When | Then | Oracle |
|---|---|---|---|---|
| AC-040-01 | Hồ sơ ở trạng thái `APPROVED` và user có `navigationchannel:delete` | Gọi DELETE `/{id}` | Hệ thống gán `deletedAt`/`deletedBy` (từ session) và trả thành công | DB: `deleted_at` khác NULL, `deleted_by` = id user thao tác; response 200. |
| AC-040-02 | Hồ sơ ở trạng thái khác `APPROVED` (vd `DRAFT`) | Gọi DELETE `/{id}` | API từ chối, không thay đổi dữ liệu | HTTP 400-family + message "Chỉ có luồng hàng hải đã duyệt mới có thể xóa mềm". |
| AC-040-03 | Hồ sơ đã xóa mềm | Gọi GET danh sách / tìm kiếm | Hồ sơ không xuất hiện | Response danh sách không chứa bản ghi đã xóa. |
| AC-040-04 | Hồ sơ đã xóa mềm | Gọi GET/PUT/DELETE `/{id}` | API trả lỗi "Không tìm thấy luồng hàng hải với id" | HTTP 400-family, không có side effect. |
| AC-040-05 | Hồ sơ `APPROVED` có `spatialId` | Gọi DELETE `/{id}` | Đối tượng GIS bị xóa cùng hồ sơ | `gis_spatial_object` không còn bản ghi tương ứng. |
| AC-040-06 | User thiếu `navigationchannel:delete` | Gọi DELETE | HTTP 403; UI không hiển thị nút Xóa | Permission code khớp `navigationchannel:delete`. |

### 4.3. User Stories

- **US-040-01:** Là Chuyên viên/Lãnh đạo có quyền, tôi muốn xóa mềm hồ sơ Luồng hàng hải đã duyệt khi hồ sơ không còn giá trị sử dụng, để dữ liệu danh sách luôn phản ánh hiện trạng.
- **US-040-02:** Là người quản lý, tôi muốn hồ sơ bị xóa vẫn được truy vết người thực hiện và thời điểm để kiểm soát trách nhiệm.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xóa mềm hồ sơ | `navigationchannel:delete` |

| Vai trò | Xem | Xóa | Ghi chú |
|---|---|---|---|
| Chuyên viên thuộc đơn vị | Có, theo scope | Có nếu được gán quyền `navigationchannel:delete` | Chỉ xóa hồ sơ đọc được trong phạm vi `orgUnitId`. |
| Lãnh đạo Cảng vụ/Chi cục | Có, theo scope | Có nếu được gán quyền | — |
| Lãnh đạo Cục / Admin Cục | Có, toàn phạm vi Cục khi có `orgunit:scope_all`/`admin:all`/`*` | Có nếu được gán quyền | Xem được metadata nhạy cảm theo quyền. |
| Quản trị hệ thống | Có | Có | ROLE_SYSTEM_ADMIN vượt qua mọi kiểm tra quyền. |
| Người không có quyền tương ứng | Không | Không | API trả 403 Forbidden. |

**Admin Cục:** với F-040, Admin Cục được xóa hồ sơ trong phạm vi Cục khi có `navigationchannel:delete` hoặc quyền tổng `admin:all`/`*`; vẫn tuân thủ guard trạng thái `APPROVED` và data scope chung.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có. Chỉ xóa mềm được hồ sơ ở trạng thái `APPROVED` (5); trạng thái khác bị từ chối (NavigationChannelService.java:341). |
| 2 | Có bước phê duyệt không | Không có bước phê duyệt cho thao tác xóa; hồ sơ phải đã qua phê duyệt xong (APPROVED) mới được xóa. |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị. Field scope là #1 `orgUnitId`; entity `NavigationChannel` khai `@Filter(orgUnitFilter)` (NavigationChannel.java:22), controller khai `@DataScope` (NavigationChannelController.java:25) → hồ sơ phải đọc được trong phạm vi user mới có thể xóa. Chiều ghi không gán đơn vị mới (không đổi `orgUnitId`), nên không có validate write-scope riêng; cấm để `orgUnitId` NULL vẫn giữ từ F-038. |
| 4 | Trường chỉ hiện trong điều kiện nào | Nút Xóa chỉ hiển thị khi user có `navigationchannel:delete`; UI xác nhận trước khi gọi DELETE (NavigationChannelList.tsx:326-340). |
| 5 | Quyền riêng | `navigationchannel:delete`. |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không. Endpoint DELETE yêu cầu đăng nhập, RBAC và data scope. |
| 7 | Tải lên tệp | Không. |
| 8 | Giao diện khác mẫu chung | Không tạo layout riêng; dùng popup xác nhận (Modal) theo convention chung; không mô tả hardcode màu/spacing/font. |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| DELETE | `/api/v1/navigation-channel/{id}` | Xóa mềm hồ sơ `APPROVED`: gán `deletedAt`/`deletedBy` từ session, xóa GIS spatial object nếu có. | `navigationchannel:delete` |
| GET | `/api/v1/navigation-channel` | Danh sách chỉ chứa hồ sơ chưa xóa (`deleted_at IS NULL`) — phục vụ kiểm chứng F-040. | `navigationchannel:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Không có thay đổi schema mới cho F-040. Cột `deleted_at`/`deleted_by` đã có sẵn từ `BaseEntity` (BaseEntity.java:28-46) và được migration `V20260825120000` đảm bảo trên `navigation_channel`; filter đọc mặc định `deleted_at IS NULL`. History `DELETE` (nếu PMO yêu cầu theo phương án b ở mục 3) sẽ ghi vào bảng `approval_history` dùng chung qua `ApprovalHistoryUtils.recordSoftDelete` (ApprovalHistoryUtils.java:30-58) với `refType = InfrastructureType.NAVIGATION_CHANNEL` — là task bổ sung, không nằm trong behavior hiện tại.
