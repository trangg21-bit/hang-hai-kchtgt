# F-137: Quản lý danh mục đối tượng đường — BA Complete

> **Status:** in_design (BA stage complete, ready for SA/design)

## In Scope

- Tạo mới đối tượng đường (CRUD) cho các loại: Đường bờ biển, Tuyến hàng hải, Tuyến đường thủy
- Cập nhật thông tin đối tượng đường (tên, mã, tọa độ polyline, mô tả, trạng thái)
- Xóa đối tượng đường (soft delete, giữ lịch sử)
- Phân loại đối tượng đường theo danh mục (Đường bờ biển, Tuyến hàng hải, Tuyến đường thủy)
- Gán biểu tượng đường (line symbol) cho từng loại đối tượng
- Xem trước vị trí đối tượng đường trên bản đồ GIS trước khi lưu
- Tìm kiếm và lọc đối tượng đường theo tên, mã, danh mục, trạng thái
- Gửi đối tượng đường mới/sửa cho phê duyệt 2 cấp (Cảng vụ/Chi cục → Cục)
- Xem và phản hồi kết quả phê duyệt (duyệt/từ chối)
- Nhập danh mục đối tượng đường từ file Excel với validation
- Lịch sử hình thành và biến động của mỗi đối tượng đường
- Quản lý file đính kèm cho từng đối tượng đường
- Quản lý các属性 thuộc tính đường: chiều dài, chiều rộng, vật liệu, niên thiế

## Out of Scope

- Chỉnh sửa shape/geometry trực tiếp trên bản đồ (map digitizing/editing) — chỉ nhập tọa độ từ form hoặc file
- Tự động trích xuất đường bờ biển từ ảnh vệ tinh — không tích hợp AI/ML
- Cập nhật realtime vị trí đường (real-time tracking) — chỉ quản lý dữ liệu tĩnh
- Tích hợp trực tiếp publish layer vào GeoServer — chỉ lưu metadata trong DB
- Quản lý style layer (SLD/CSS) trong GeoServer — thuộc module M-012
- Quản lý coordinate reference system (CRS) — không thuộc phạm vi GIS module này
- Tính toán khoảng cách/tính năng GIS phức tạp (buffer, overlay) — thuộc module M-012

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| system-admin | Full CRUD + Quản lý danh mục + Duyệt L2 | Toàn quyền tạo/sửa/xóa đối tượng đường, quản lý danh mục, gán biểu tượng đường, phê duyệt cấp Cục |
| admin (Cục chuyên viên) | CRUD + Gửi duyệt + Xem bản đồ | Tạo/sửa/xóa đối tượng đường, gán biểu tượng, gửi cho phê duyệt L1; không có quyền phê duyệt |
| admin (Chi cục/Cảng vụ chuyên viên) | CRUD + Xem bản đồ + Phê duyệt L1 | Tạo/sửa/xóa đối tượng đường trong đơn vị mình, phê duyệt L1, xem trên bản đồ |
| user (Doanh nghiệp cảng/Người dùng tại cảng) | Read-only + Tra cứu bản đồ | Chỉ có thể xem thông tin đối tượng đường đã được phê duyệt, tra cứu và xem trên bản đồ |

## Entities

- **LineObject** (GIS Line): Bảng chính quản lý đối tượng đường GIS (id, name, code, objectType, categoryId, lineSymbolId, coordinates, description, status, unitId, length, material, yearBuilt, createdBy, createdDate, updatedDate, approvalStatus, approvedBy, approvedDate)
- **LineCategory**: Danh mục đối tượng đường (id, name, code, description, sortOrder, createdBy, createdDate)
- **LineSymbol**: Bảng biểu tượng đường (id, name, code, category, color, lineWidth, dashPattern, status)
- **ApprovalWorkflow**: Lịch sử phê duyệt (id, objectId, objectType, currentLevel, status, submittedBy, submittedAt, level1Approver, level1Action, level1Date, level2Approver, level2Action, level2Date, rejectionReason)
- **LineAttachment**: File đính kèm đối tượng đường (id, objectId, fileName, fileUrl, fileSize, mimeType, uploadedBy, uploadedAt)
- **LineHistory**: Nhật ký biến động (id, objectId, actionType, previousValue, newValue, changedBy, changedAt, reason)

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-137-01 | Mã đối tượng đường phải là duy nhất trong toàn hệ thống; định dạng gợi ý: `{loại}-{Mã đơn vị}-{STT}` | Tạo/Sửa đối tượng | Dữ liệu master |
| BR-137-02 | Tọa độ (coordinates) là chuỗi WKT/GeoJSON polyline; hệ thống WGS84; kinh độ -180°~180°, vĩ độ -90°~90° | Tạo/Sửa đối tượng | Tech Brief §6 |
| BR-137-03 | Đối tượng đường mới tạo có trạng thái `PENDING_APPROVAL`; sau phê duyệt L1 → `APPROVED_L1`; sau phê duyệt L2 → `PUBLISHED` | Workflow | URD §3.3 |
| BR-137-04 | Chỉ đối tượng có trạng thái `PUBLISHED` mới hiển thị trên bản đồ GIS cho người dùng xem | Hiển thị bản đồ | Nghiệp vụ |
| BR-137-05 | Từ chối phê duyệt ở bất kỳ cấp nào: đối tượng quay lại trạng thái `DRAFT`, chuyên viên sửa lại và gửi lại | Phê duyệt | URD §3.4 |
| BR-137-06 | Khi xóa đối tượng đường, không xóa vật lý (soft delete) — giữ trạng thái `DELETED` và ghi vào lịch sử | Xóa đối tượng | RAW §3.1 |
| BR-137-07 | Mỗi đối tượng đường phải được gán ít nhất một LineSymbol theo đúng category tương ứng | Gán biểu tượng | F-006 |
| BR-137-08 | File đính kèm chỉ chấp nhận PDF, DOC, JPG, PNG; tối đa 10MB/file; không quá 5 file | Đính kèm | Validation |
| BR-137-09 | Chiều dài tính toán tự động từ polyline coordinates; cho phép ghi đè thủ công (có đánh dấu nguồn) | Tính toán chiều dài | Nghiệp vụ |
| BR-137-10 | Chỉ lãnh đạo Cảng vụ/Chi cục mới được phê duyệt cấp L1; lãnh đạo Cục mới được phê duyệt cấp L2 | Phê duyệt | URD §5, Survey §6 |

## Testing Strategy

- **Unit Testing (Backend)**:
  - Kiểm tra unique constraint trên code đối tượng đường (BR-137-01)
  - Kiểm tra WKT/GeoJSON polyline parsing và WGS84 bounds validation (BR-137-02)
  - Kiểm tra workflow approval state machine: PENDING → L1 → L2 → PUBLISHED (BR-137-03)
  - Kiểm tra soft delete: không xóa vật lý, chỉ cập nhật status (BR-137-06)
  - Kiểm tra file upload validation: MIME type, size ≤ 10MB, max 5 files (BR-137-08)
  - Kiểm tra tự động tính chiều dài từ polyline (BR-137-09)

- **Integration Testing (Backend)**:
  - Test flow đầy đủ: tạo đối tượng → gán line symbol → gửi duyệt L1 → duyệt L1 → gửi duyệt L2 → duyệt L2 → publish
  - Test từ chối ở L1/L2: đối tượng quay về DRAFT, ghi rejectionReason
  - Test DB constraints: duplicate code, WKT format, foreign key integrity
  - Test polyline geometry validation: phải có tối thiểu 2 điểm, không self-intersect

- **E2E Testing (Frontend + Backend)**:
  - Test đầy đủ CRUD flow trên giao diện ReactJS
  - Test tạo đối tượng đường với form: chọn loại, nhập mã tự động, nhập coordinates (WKT/GeoJSON), chọn line symbol
  - Test xem trước polyline trên bản đồ trước khi lưu
  - Test gửi duyệt với modal xác nhận
  - Test tìm kiếm/lọc theo tên, mã, danh mục, trạng thái
  - Test permission UI: user doanh nghiệp không thấy nút "Thêm/Sửa/Xóa"

- **Security Testing**:
  - Kiểm tra RBAC: không cho phép cấp L1 phê duyệt nếu không phải Cảng vụ/Chi cục (BR-137-10)
  - Kiểm tra file upload vulnerability: validate MIME type server-side
  - Kiểm tra SQL injection/XSS qua tên/mô tả đối tượng
  - Kiểm tra path traversal prevention trong file upload naming

- **UI/UX Testing**:
  - Responsive form tạo đối tượng trên mobile
  - Data table với sticky header, pagination, search/filter toolbar
  - Loading skeleton, empty state, error state với retry
  - Form validation realtime (coordinates format, mã, tên)
  - Toast notification cho action thành công/thất bại
  - Confirmation modal cho xóa đối tượng
