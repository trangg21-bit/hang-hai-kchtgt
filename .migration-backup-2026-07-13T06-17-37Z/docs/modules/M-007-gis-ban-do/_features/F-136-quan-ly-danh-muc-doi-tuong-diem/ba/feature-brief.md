# F-136: Quản lý danh mục đối tượng điểm — BA Complete

> **Status:** in_design (BA stage complete, ready for SA/design)
> **Source:** docs/modules/M-007-gis-ban-do/_features/F-136/feature-brief.md (root copy after ba stage)

## In Scope

- Tạo mới đối tượng điểm (CRUD) cho các loại: Cảng biển, Đèn biển, Phao tiêu, Đài thông tin
- Cập nhật thông tin đối tượng điểm (tên, mã, tọa độ, mô tả, trạng thái)
- Xóa đối tượng điểm (soft delete, giữ lịch sử)
- Phân loại đối tượng điểm theo danh mục biểu tượng bản đồ (MapIcon.Category: BUOY, LIGHTHOUSE, BEACON, WHARF, OTHER)
- Gán biểu tượng bản đồ (MapIcon) cho từng đối tượng điểm theo loại
- Xem trước vị trí đối tượng điểm trên bản đồ GIS trước khi lưu
- Tìm kiếm và lọc đối tượng điểm theo tên, mã, danh mục, trạng thái, tọa độ
- Gửi đối tượng điểm mới/sửa cho phê duyệt 2 cấp (Cảng vụ/Chi cục → Cục)
- Xem và phản hồi kết quả phê duyệt (duyệt/từ chối)
- Nhập danh mục đối tượng điểm từ file Excel với validation
- Lịch sử hình thành và biến động của mỗi đối tượng điểm
- Quản lý file đính kèm cho từng đối tượng điểm

## Out of Scope

- Chỉnh sửa hình ảnh/tọa độ trực tiếp trên bản đồ (map editing) — chỉ nhập tọa độ từ form
- Tự động phát hiện đối tượng điểm từ ảnh vệ tinh — không tích hợp AI/ML
- Cập nhật realtime vị trí GPS trên bản đồ — chỉ quản lý vị trí cố định
- Tích hợp trực tiếp publish layer vào GeoServer — chỉ lưu metadata trong DB
- Quản lý style layer (SLD/CSS) trong GeoServer — thuộc module M-012
- Quản lý coordinate reference system (CRS) — không thuộc phạm vi GIS module này
- Tạo đối tượng điểm hàng loạt tự động từ dữ liệu bên ngoài

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| system-admin | Full CRUD + Quản lý danh mục + Duyệt L2 | Toàn quyền tạo/sửa/xóa đối tượng điểm, quản lý danh mục MapIcon, gán/ngắt liên kết biểu tượng, phê duyệt cấp Cục |
| admin (Cục chuyên viên) | CRUD + Gửi duyệt + Xem bản đồ | Tạo/sửa/xóa đối tượng điểm, gán biểu tượng, gửi cho phê duyệt L1; không có quyền phê duyệt |
| admin (Chi cục/Cảng vụ chuyên viên) | CRUD + Xem bản đồ + Phê duyệt L1 | Tạo/sửa/xóa đối tượng điểm trong đơn vị mình, phê duyệt L1, xem trên bản đồ |
| user (Doanh nghiệp cảng/Người dùng tại cảng) | Read-only + Tra cứu bản đồ | Chỉ có thể xem thông tin đối tượng điểm đã được phê duyệt, tra cứu và xem trên bản đồ |

## Entities

- **PointObject** (GIS Point): Bảng chính quản lý đối tượng điểm GIS (id, name, code, objectType, categoryId, iconId, longitude, latitude, description, status, unitId, createdBy, createdDate, updatedDate, approvalStatus, approvedBy, approvedDate)
- **ObjectCategory**: Danh mục đối tượng điểm (id, name, code, description, sortOrder, createdBy, createdDate)
- **MapIcon**: Bảng biểu tượng bản đồ đã có (id, name, code, category, iconUrl, size, status) — F-006
- **ObjectSymbolMapping**: Bảng ánh xạ biểu tượng vào đối tượng (id, symbolId, objectType, objectId, assignedBy, assignedDate, effectiveDate, expiryDate) — F-006
- **ApprovalWorkflow**: Lịch sử phê duyệt (id, objectId, objectType, currentLevel, status, submittedBy, submittedAt, level1Approver, level1Action, level1Date, level2Approver, level2Action, level2Date, rejectionReason)
- **PointAttachment**: File đính kèm đối tượng điểm (id, objectId, fileName, fileUrl, fileSize, mimeType, uploadedBy, uploadedAt)
- **PointHistory**: Nhật ký biến động (id, objectId, actionType, previousValue, newValue, changedBy, changedAt, reason)

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-136-01 | Mã đối tượng điểm phải là duy nhất trong toàn hệ thống; định dạng gợi ý: `{loại}-{Mã đơn vị}-{STT}` | Tạo/Sửa đối tượng | Dữ liệu master |
| BR-136-02 | Tọa độ (longitude, latitude) phải trong hệ thống WGS84; kinh độ -180°~180°, vĩ độ -90°~90° | Tạo/Sửa đối tượng | Tech Brief §6 |
| BR-136-03 | Đối tượng điểm mới tạo có trạng thái `PENDING_APPROVAL`; sau khi phê duyệt L1 → `APPROVED_L1`; sau phê duyệt L2 → `PUBLISHED` | Workflow | URD §3.3 |
| BR-136-04 | Chỉ đối tượng có trạng thái `PUBLISHED` mới hiển thị trên bản đồ GIS cho người dùng xem | Hiển thị bản đồ | Nghiệp vụ |
| BR-136-05 | Từ chối phê duyệt ở bất kỳ cấp nào: đối tượng quay lại trạng thái `DRAFT`, chuyên viên sửa lại và gửi lại | Phê duyệt | URD §3.4 |
| BR-136-06 | Khi xóa đối tượng điểm, không xóa vật lý (soft delete) — giữ trạng thái `DELETED` và ghi vào lịch sử | Xóa đối tượng | RAW §3.1 |
| BR-136-07 | Mỗi đối tượng điểm phải được gán ít nhất một MapIcon theo đúng category tương ứng | Gán biểu tượng | F-006 |
| BR-136-08 | File đính kèm chỉ chấp nhận PDF, DOC, JPG, PNG; tối đa 10MB/file; không quá 5 file | Đính kèm | Validation |
| BR-136-09 | Nhập từ Excel: validate từng dòng trước khi import; báo lỗi chi tiết theo dòng sai | Import Excel | RAW §3.2 |
| BR-136-10 | Chỉ lãnh đạo Cảng vụ/Chi cục mới được phê duyệt cấp L1; lãnh đạo Cục mới được phê duyệt cấp L2 | Phê duyệt | URD §5, Survey §6 |

## Testing Strategy

- **Unit Testing (Backend)**:
  - Kiểm tra unique constraint trên code đối tượng điểm (BR-136-01)
  - Kiểm tra tọa độ WGS84 validation: kinh độ -180~180, vĩ độ -90~90 (BR-136-02)
  - Kiểm tra workflow approval state machine: PENDING → L1 → L2 → PUBLISHED (BR-136-03)
  - Kiểm tra soft delete: không xóa vật lý, chỉ cập nhật status (BR-136-06)
  - Kiểm tra file upload validation: MIME type, size ≤ 10MB, max 5 files (BR-136-08)
  - Kiểm tra MapIcon category mapping đúng loại đối tượng (BR-136-07)

- **Integration Testing (Backend)**:
  - Test flow đầy đủ: tạo đối tượng → gán icon → gửi duyệt L1 → duyệt L1 → gửi duyệt L2 → duyệt L2 → publish
  - Test từ chối ở L1: đối tượng quay về DRAFT, ghi rejectionReason
  - Test từ chối ở L2: đối tượng quay về DRAFT, ghi rejectionReason
  - Test DB constraints: duplicate code, WGS84 bounds, foreign key integrity
  - Test Excel import với dữ liệu hợp lệ và không hợp lệ (BR-136-09)

- **E2E Testing (Frontend + Backend)**:
  - Test đầy đủ CRUD flow trên giao diện ReactJS
  - Test tạo đối tượng điểm với form: chọn loại, nhập mã tự động/tự điền, chọn MapIcon, nhập tọa độ
  - Test xem trước vị trí trên bản đồ trước khi lưu
  - Test gửi duyệt với modal xác nhận
  - Test xem kết quả phê duyệt (duyệt/từ chối) và lịch sử phê duyệt
  - Test tìm kiếm/lọc theo tên, mã, danh mục, trạng thái, tọa độ
  - Test permission UI: user doanh nghiệp không thấy nút "Thêm/Sửa/Xóa"

- **Security Testing**:
  - Kiểm tra RBAC: không cho phép cấp L1 phê duyệt nếu không phải Cảng vụ/Chi cục (BR-136-10)
  - Kiểm tra file upload vulnerability: validate MIME type server-side
  - Kiểm tra SQL injection/XSS qua tên/mô tả đối tượng
  - Kiểm tra path traversal prevention trong file upload naming

- **UI/UX Testing**:
  - Responsive form tạo đối tượng trên mobile
  - Data table với sticky header, pagination, search/filter toolbar
  - Loading skeleton, empty state, error state với retry
  - Form validation realtime (tọa độ, mã, tên)
  - Toast notification cho action thành công/thất bại
  - Confirmation modal cho xóa đối tượng
