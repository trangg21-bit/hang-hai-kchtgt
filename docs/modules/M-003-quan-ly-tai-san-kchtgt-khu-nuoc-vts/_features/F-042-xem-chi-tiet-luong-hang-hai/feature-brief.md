---
id: F-042
name: Xem chi tiet Luong hang hai
slug: xem-chi-tiet-luong-hang-hai
module-id: M-003
status: implemented
classification: local
priority: P0
created: 2026-06-29T00:00:00Z
last-updated: 2026-08-26T02:59:34Z
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Xem chi tiết / Danh sách Luồng hàng hải

**Tài liệu:** Tài liệu chức năng — phần riêng theo template 7 section.
**Chức năng:** F-042 — Danh sách và Xem chi tiết Luồng hàng hải.
**Module:** M-003 — Quản lý tài sản KCHTGT khu nước & VTS.
**Loại:** Chức năng thường (màn hình đọc, không có bước phê duyệt).
**Tham chiếu:** Entity `NavigationChannel` 71 trường (#1-#46 nhập, #47-#71 read-only), bảng con và data scope tại F-038 (`feature-brief.md`, `ba/00-lean-spec.md`, `design/00-design-plan.md`) + convention list screen (`docs/conventions/list-screen-ui-standard.md`, `frontend/src/components/list-view/`). File này CHỈ mô tả phần RIÊNG của F-042.

## 1. Mô tả ngắn

Chức năng F-042 cung cấp màn hình Danh sách Luồng hàng hải với bộ lọc, tab trạng thái, phân trang và màn hình Chi tiết đầy đủ 71 trường. Danh sách hỗ trợ lọc theo đơn vị quản lý (#1), cảng biển (#2), tỉnh/thành (#6), tình trạng (#8), từ khóa và trạng thái phê duyệt (#47), phân trang theo thời gian tạo giảm dần; dữ liệu bị giới hạn theo data scope đơn vị. Chi tiết hiển thị #1-#46 (dữ liệu nhập) và #47-#71 (read-only do hệ thống ghi hoặc lấy từ module liên quan), kèm lịch sử phê duyệt và các thao tác theo quyền (Sửa/Xóa/Duyệt — F-039/F-040/F-041).

## 2. Trường dữ liệu

**Danh sách (DS):** cột và bộ lọc theo convention list-view; các cột chính (NavigationChannelList.tsx:280-320):

| # | Cột / Lọc | Label | Ghi chú |
|---|---|---|---|
| Lọc | `orgUnitId` (#1) | Đơn vị quản lý | TreeSelect cây đơn vị (OrgUnitTreeSelect), giữ giá trị `orgUnitId`; filter theo data scope. |
| Lọc | `seaportId` (#2) | Thuộc cảng biển | Select KCHT (CB). |
| Lọc | `provinceId` (#6) | Địa điểm Tỉnh/TP | Select danh mục. |
| Lọc | `conditionStatus` (#8) | Tình trạng | Select enum. |
| Lọc | `keyword` | Từ khóa | Tìm trong tên/mã luồng (LIKE, trim, lowercase). |
| Lọc | `approvalStatus` (#47) | Trạng thái | Đồng bộ với StatusTabs; giá trị hợp lệ của enum `ApprovalStatus`. |
| DS | `channelCode` (#4) | Mã luồng | Cột. |
| DS | `channelName` (#5) | Tên luồng | Cột. |
| DS | `provinceId` (#6) | Địa điểm | Cột. |
| DS | `conditionStatus` (#8) | Tình trạng | Cột, badge màu theo trạng thái. |
| DS | `approvalStatus` (#47) | Trạng thái | Cột, `ApprovalStatusBadge`. |
| DS | `updatedAt` (#48) | Ngày cập nhật | Cột, sortable. |

**StatusTabs (NavigationChannelList.tsx:50-54):** `DRAFT` (Nháp), `PENDING_APPROVAL` (Chờ phê duyệt), `APPROVED_LEVEL1` (Đã duyệt C1), `APPROVED` (Đã duyệt), `REJECTED` (Từ chối/Trả về — gộp `REJECTED`/`REJECTED_LEVEL1`/`REJECTED_LEVEL2`); mỗi tab hiển thị số lượng.

**Chi tiết (CT):** hiển thị đầy đủ 71 trường (NavigationChannelForm.tsx:700-790):
- #1-#46: dữ liệu nhập (Descriptions/Form read-only ở chế độ detail; `channelCode`/`routeCode` hiển thị giá trị tự sinh).
- #47-#57: trạng thái và kiểm toán phê duyệt — read-only, `ApprovalStatusBadge` cho #47; null hiển thị "—".
- #58-#71: dữ liệu liên quan (KCHT, vận hành, bảo trì, sự cố) — read-only, lấy từ nguồn nghiệp vụ liên quan; nguồn rỗng → hiển thị "—", không gán dữ liệu giả (BR-038-09/BR-042-06).
- Khối phê duyệt: `ApprovalActionBar` (theo trạng thái + quyền) + `HistoryTimeline` (F-043).
- Metadata nhạy cảm (người tạo, người sửa cuối, thời gian tạo/cập nhật): hiển thị theo quyền đọc hạn chế/mật (`navigationchannel:read:restricted`/`read:confidential`).

## 3. Trạng thái và phê duyệt

- F-042 là màn hình đọc: không có bước phê duyệt riêng; hiển thị trạng thái `approvalStatus` (#47) dạng badge theo enum số (UI map label tiếng Việt, không lưu chuỗi).
- Danh sách chỉ chứa hồ sơ chưa xóa mềm (`deleted_at IS NULL`); hồ sơ đã xóa không xuất hiện (F-040).
- Dữ liệu đọc bị giới hạn bởi data scope: `@DataScope` trên controller bật `orgUnitFilter` (đơn vị + subtree theo quyền) và `recordSecurityLevelFilter` (security level).

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-042-01 | Danh sách mặc định phân trang (page/size, mặc định 0/20), sắp xếp `createdAt` giảm dần; chỉ trả hồ sơ chưa xóa. | List |
| BR-042-02 | Bộ lọc bao gồm `orgUnitId`, `seaportId`, `provinceId`, `conditionStatus`, `keyword`, `approvalStatus`; filter rỗng/không hợp lệ bị bỏ qua, không lỗi. | List |
| BR-042-03 | Filter đơn vị dùng TreeSelect/Cascader dạng cây, giữ giá trị `orgUnitId` khi gọi API; không dùng Select phẳng (theo AGENTS.md). | List |
| BR-042-04 | Chi tiết trả đủ 71 trường: #1-#46 từ hồ sơ + bảng con; #47-#57 từ workflow; #58-#71 từ nguồn liên quan; response phân biệt null/empty, không placeholder. | Detail |
| BR-042-05 | Đọc dữ liệu ngoài phạm vi đơn vị/security level bị chặn bởi `orgUnitFilter`/`recordSecurityLevelFilter`; metadata nhạy cảm theo `read:restricted`/`read:confidential`. | List / Detail |
| BR-042-06 | Dữ liệu #58-#71 hiển thị rỗng có kiểm soát ("—") khi nguồn không có; không tự gán giá trị mặc định. | Detail |
| BR-042-07 | User thiếu `navigationchannel:read` → HTTP 403; UI không hiển thị nút Xem chi tiết. | Security |

### 4.2. Acceptance Criteria

| AC-ID | Given | When | Then | Oracle |
|---|---|---|---|---|
| AC-042-01 | User có `navigationchannel:read` | Mở màn danh sách | Hiển thị các cột #4/#5/#6/#8/#47/#48 + StatusTabs + bộ lọc + phân trang | DOM/response có đủ cột và filter; không có cột thao tác không được phép. |
| AC-042-02 | User chọn filter `orgUnitId`/`seaportId`/`provinceId`/`conditionStatus`/`keyword`/`approvalStatus` | Gọi search | API trả danh sách đã lọc, phân trang, tổng số | Response `SearchResultResponse` có `totalElements`/`totalPages` khớp dữ liệu lọc. |
| AC-042-03 | User thuộc đơn vị con | Gọi danh sách | Chỉ thấy hồ sơ của đơn vị mình + đơn vị con (subtree) | So sánh tập `orgUnitId` trả về với subtree được phép. |
| AC-042-04 | User chọn tab trạng thái (vd `PENDING_APPROVAL`) | Gọi search với `approvalStatus` | Chỉ trả hồ sơ đúng trạng thái | Tất cả `approvalStatus` trong response khớp tab. |
| AC-042-05 | Hồ sơ tồn tại | Mở chi tiết | Hiển thị đủ #1-#71; #47-#71 read-only; null hiển thị "—" | DOM chi tiết có đủ nhóm trường; không có input chỉnh sửa cho #47-#71. |
| AC-042-06 | Hồ sơ nằm ngoài phạm vi đơn vị/security level | Gọi GET `/{id}` | Bị chặn (không trả dữ liệu) | HTTP 403 hoặc không tìm thấy; không rò rỉ dữ liệu. |
| AC-042-07 | User thiếu `navigationchannel:read` | Gọi list/search/getById | HTTP 403 | Permission code khớp `navigationchannel:read`. |

### 4.3. User Stories

- **US-042-01:** Là Chuyên viên, tôi muốn xem danh sách Luồng hàng hải với bộ lọc và tab trạng thái để nhanh chóng tìm hồ sơ cần xử lý.
- **US-042-02:** Là người quản lý, tôi muốn xem chi tiết đầy đủ 71 trường để kiểm tra hồ sơ trước khi duyệt.
- **US-042-03:** Là Lãnh đạo Cục/Admin Cục, tôi muốn xem metadata nhạy cảm và thông tin liên quan #58-#71 để ra quyết định.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem danh sách / chi tiết thông thường | `navigationchannel:read` |
| Xem bản ghi hạn chế | `navigationchannel:read:restricted` |
| Xem bản ghi mật / metadata nhạy cảm | `navigationchannel:read:confidential` |

| Vai trò | Xem danh sách/chi tiết | Ghi chú |
|---|---|---|
| Chuyên viên thuộc đơn vị | Có, theo scope | Chỉ thấy hồ sơ đơn vị mình + subtree. |
| Lãnh đạo Cảng vụ/Chi cục | Có, theo scope | — |
| Lãnh đạo Cục / Admin Cục | Có, toàn phạm vi Cục khi có `orgunit:scope_all`/`admin:all`/`*` | Xem được metadata nhạy cảm: người tạo, người sửa cuối, thời gian tạo/cập nhật và field kiểm toán #47-#57 theo quyền. |
| Quản trị hệ thống | Có | ROLE_SYSTEM_ADMIN vượt qua mọi kiểm tra quyền. |
| Người không có quyền tương ứng | Không | API trả 403 Forbidden. |

**Admin Cục:** với F-042, Admin Cục được xem toàn bộ dữ liệu Luồng hàng hải trong phạm vi Cục, bao gồm metadata nhạy cảm, lịch sử phê duyệt và các field kiểm toán #47-#57; vẫn chịu ràng buộc data scope và security level theo hệ thống.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không có trạng thái riêng; hiển thị trạng thái phê duyệt `approvalStatus` (#47) dạng badge, dùng làm tab lọc trong danh sách. |
| 2 | Có bước phê duyệt không | Không có bước phê duyệt (màn hình đọc); các thao tác duyệt nằm ở F-041. |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị. Field scope là #1 `orgUnitId`; filter danh sách dùng TreeSelect cây đơn vị giữ giá trị `orgUnitId` (BR-042-03). Entity khai `@Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")` (NavigationChannel.java:22); controller khai `@DataScope` (NavigationChannelController.java:25) → `DataScopeAspect` bật `orgUnitFilter` + `recordSecurityLevelFilter` cho mọi query đọc (findAll/search/getById). Ngoại lệ: không có — màn danh sách/chi tiết đều bị scope; Cục xem full qua `orgunit:scope_all`/`admin:all`/`*`. |
| 4 | Trường chỉ hiện trong điều kiện nào | #47-#57 chỉ read-only ở chi tiết và chỉ có dữ liệu sau bước workflow tương ứng; #58-#71 chỉ có dữ liệu khi nguồn KCHT/vận hành/bảo trì/sự cố tồn tại (rỗng → "—"); metadata nhạy cảm theo quyền read:restricted/confidential. |
| 5 | Quyền riêng | `navigationchannel:read`, `navigationchannel:read:restricted`, `navigationchannel:read:confidential`. |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không. Mọi endpoint đọc yêu cầu đăng nhập, RBAC và data scope. |
| 7 | Tải lên tệp | Không (màn đọc; file #46 hiển thị danh sách attachment read-only). |
| 8 | Giao diện khác mẫu chung | Không. Tuân thủ convention list screen: `ScreenHeader`/`FilterBar`/`StatusTabs`/`DataTable`/`Pagination` (list-view components), TreeSelect cho filter đơn vị, chi tiết mở Modal theo convention chung; không mô tả hardcode màu/spacing/font. |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/navigation-channel` | Danh sách phân trang (page/size), hồ sơ chưa xóa, sort `createdAt` DESC. | `navigationchannel:read` |
| GET | `/api/v1/navigation-channel/search` | Tìm kiếm/lọc: `orgUnitId`, `seaportId`, `provinceId`, `conditionStatus`, `keyword`, `approvalStatus`, `page`, `size`; trả `SearchResultResponse {results, totalElements, totalPages, currentPage, pageSize}`. | `navigationchannel:read` |
| GET | `/api/v1/navigation-channel/approval-status/{status}` | Lọc nhanh theo trạng thái (dùng cho StatusTabs đếm). | `navigationchannel:read` |
| GET | `/api/v1/navigation-channel/{id}` | Chi tiết đủ 71 trường + routeDetails + coordinateList + attachments + history. | `navigationchannel:read` (+ `read:restricted`/`read:confidential` theo security level) |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Không có thay đổi schema mới cho F-042. Nguồn dữ liệu đọc: `navigation_channel` + `channel_route_detail` + `navigation_channel_coordinate` + `infrastructure_attachments` (refType=NAVIGATION_CHANNEL) + `approval_history` — toàn bộ đã chốt tại F-038 (design/00-design-plan.md mục 4) và migration `V20260825120000`. Index phục vụ đọc: `idx_navigation_channel_org_unit (org_unit_id)`, `idx_channel_route_detail_nc`, `idx_navigation_channel_coordinate_nc`, `ux_navigation_channel_org_code` (design plan mục 4.1-4.3). Không thêm cột, không thêm index.
