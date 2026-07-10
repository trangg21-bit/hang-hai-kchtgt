# F-138: Quản lý danh mục đối tượng vùng — BA Complete

> **Status:** in_design (BA stage complete, ready for SA/design)

## In Scope

- Tạo mới đối tượng vùng (CRUD) cho các loại: Vùng nước, Khu neo đậu, Khu tránh trú bão, Khu vực cấm, Vùng hạn chế
- Cập nhật thông tin đối tượng vùng (tên, mã, tọa độ polygon, mô tả, trạng thái)
- Xóa đối tượng vùng (soft delete, giữ lịch sử)
- Phân loại đối tượng vùng theo danh mục (Vùng nước, Khu neo đậu, Khu tránh trú bão, Khu vực cấm, Vùng hạn chế)
- Gán biểu tượng vùng (polygon fill symbol) cho từng loại đối tượng
- Xem trước vị trí đối tượng vùng trên bản đồ GIS trước khi lưu
- Tìm kiếm và lọc đối tượng vùng theo tên, mã, danh mục, trạng thái
- Gửi đối tượng vùng mới/sửa cho phê duyệt 2 cấp (Cảng vụ/Chi cục → Cục)
- Xem và phản hồi kết quả phê duyệt (duyệt/từ chối)
- Nhập danh mục đối tượng vùng từ file Excel với validation
- Lịch sử hình thành và biến động của mỗi đối tượng vùng
- Quản lý file đính kèm cho từng đối tượng vùng
- Tính toán diện tích polygon tự động; cho phép ghi đè thủ công (có đánh dấu nguồn)
- Kiểm tra giao cắt giữa các vùng (overlap detection)

## Out of Scope

- Chỉnh sửa shape/polygon trực tiếp trên bản đồ (map digitizing/editing) — chỉ nhập tọa độ từ form hoặc file
- Tự động trích xuất ranh giới vùng từ ảnh vệ tinh — không tích hợp AI/ML
- Cập nhật realtime ranh giới vùng — chỉ quản lý dữ liệu tĩnh
- Tích hợp trực tiếp publish layer vào GeoServer — chỉ lưu metadata trong DB
- Quản lý style layer (SLD/CSS) trong GeoServer — thuộc module M-012
- Quản lý coordinate reference system (CRS) — không thuộc phạm vi GIS module này
- Phân tích không gian phức tạp (spatial overlay, buffer analysis) — thuộc module M-012

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| system-admin | Full CRUD + Quản lý danh mục + Duyệt L2 | Toàn quyền tạo/sửa/xóa đối tượng vùng, quản lý danh mục, gán biểu tượng vùng, phê duyệt cấp Cục |
| admin (Cục chuyên viên) | CRUD + Gửi duyệt + Xem bản đồ | Tạo/sửa/xóa đối tượng vùng, gán biểu tượng, gửi cho phê duyệt L1; không có quyền phê duyệt |
| admin (Chi cục/Cảng vụ chuyên viên) | CRUD + Xem bản đồ + Phê duyệt L1 | Tạo/sửa/xóa đối tượng vùng trong đơn vị mình, phê duyệt L1, xem trên bản đồ |
| user (Doanh nghiệp cảng/Người dùng tại cảng) | Read-only + Tra cứu bản đồ | Chỉ có thể xem thông tin đối tượng vùng đã được phê duyệt, tra cứu và xem trên bản đồ |

## Entities

- **PolygonObject** (GIS Polygon): Bảng chính quản lý đối tượng vùng GIS (id, name, code, objectType, categoryId, fillSymbolId, coordinates, description, status, unitId, area, purpose, restrictionLevel, createdBy, createdDate, updatedDate, approvalStatus, approvedBy, approvedDate)
- **PolygonCategory**: Danh mục đối tượng vùng (id, name, code, description, sortOrder, createdBy, createdDate)
- **PolygonSymbol**: Bảng biểu tượng vùng (id, name, code, category, fillColor, strokeColor, strokeWidth, opacity, status)
- **ApprovalWorkflow**: Lịch sử phê duyệt (id, objectId, objectType, currentLevel, status, submittedBy, submittedAt, level1Approver, level1Action, level1Date, level2Approver, level2Action, level2Date, rejectionReason)
- **PolygonAttachment**: File đính kèm đối tượng vùng (id, objectId, fileName, fileUrl, fileSize, mimeType, uploadedBy, uploadedAt)
- **PolygonHistory**: Nhật ký biến động (id, objectId, actionType, previousValue, newValue, changedBy, changedAt, reason)
- **PolygonOverlap**: Ghi nhận giao cắt giữa các vùng (id, polygonIdA, polygonIdB, overlapArea, detectedAt)

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-138-01 | Mã đối tượng vùng phải là duy nhất trong toàn hệ thống; định dạng gợi ý: `{loại}-{Mã đơn vị}-{STT}` | Tạo/Sửa đối tượng | Dữ liệu master |
| BR-138-02 | Tọa độ (coordinates) là chuỗi WKT/GeoJSON polygon; hệ thống WGS84; kinh độ -180°~180°, vĩ độ -90°~90° | Tạo/Sửa đối tượng | Tech Brief §6 |
| BR-138-03 | Đối tượng vùng mới tạo có trạng thái `PENDING_APPROVAL`; sau phê duyệt L1 → `APPROVED_L1`; sau phê duyệt L2 → `PUBLISHED` | Workflow | URD §3.3 |
| BR-138-04 | Chỉ đối tượng có trạng thái `PUBLISHED` mới hiển thị trên bản đồ GIS cho người dùng xem | Hiển thị bản đồ | Nghiệp vụ |
| BR-138-05 | Từ chối phê duyệt ở bất kỳ cấp nào: đối tượng quay lại trạng thái `DRAFT`, chuyên viên sửa lại và gửi lại | Phê duyệt | URD §3.4 |
| BR-138-06 | Khi xóa đối tượng vùng, không xóa vật lý (soft delete) — giữ trạng thái `DELETED` và ghi vào lịch sử | Xóa đối tượng | RAW §3.1 |
| BR-138-07 | Kiểm tra giao cắt giữa các vùng: cảnh báo khi polygon giao nhau; không block tạo nhưng ghi vào PolygonOverlap | Validation | Nghiệp vụ |
| BR-138-08 | Diện tích tính toán tự động từ polygon coordinates; cho phép ghi đè thủ công (có đánh dấu nguồn gốc) | Tính toán diện tích | Nghiệp vụ |
| BR-138-09 | File đính kèm chỉ chấp nhận PDF, DOC, JPG, PNG; tối đa 10MB/file; không quá 5 file | Đính kèm | Validation |
| BR-138-10 | Chỉ lãnh đạo Cảng vụ/Chi cục mới được phê duyệt cấp L1; lãnh đạo Cục mới được phê duyệt cấp L2 | Phê duyệt | URD §5, Survey §6 |

## Testing Strategy

- **Unit Testing (Backend)**:
  - Kiểm tra unique constraint trên code đối tượng vùng (BR-138-01)
  - Kiểm tra WKT/GeoJSON polygon parsing và WGS84 bounds validation (BR-138-02)
  - Kiểm tra workflow approval state machine: PENDING → L1 → L2 → PUBLISHED (BR-138-03)
  - Kiểm tra overlap detection: polygon giao nhau → ghi vào PolygonOverlap (BR-138-07)
  - Kiểm tra tự động tính diện tích từ polygon (BR-138-08)
  - Kiểm tra soft delete: không xóa vật lý, chỉ cập nhật status (BR-138-06)

- **Integration Testing (Backend)**:
  - Test flow đầy đủ: tạo đối tượng → gán fill symbol → gửi duyệt L1 → duyệt L1 → gửi duyệt L2 → duyệt L2 → publish
  - Test từ chối ở L1/L2: đối tượng quay về DRAFT, ghi rejectionReason
  - Test DB constraints: duplicate code, WKT format, foreign key integrity
  - Test polygon geometry validation: phải có tối thiểu 3 điểm, đóng polygon, không self-intersect
  - Test overlap detection với 2+ vùng giao nhau

- **E2E Testing (Frontend + Backend)**:
  - Test đầy đủ CRUD flow trên giao diện ReactJS
  - Test tạo đối tượng vùng với form: chọn loại, nhập mã tự động, nhập coordinates, chọn fill symbol
  - Test xem trước polygon trên bản đồ trước khi lưu
  - Test cảnh báo giao cắt vùng trong form tạo/sửa
  - Test gửi duyệt với modal xác nhận
  - Test tìm kiếm/lọc theo tên, mã, danh mục, trạng thái
  - Test permission UI: user doanh nghiệp không thấy nút "Thêm/Sửa/Xóa"

- **Security Testing**:
  - Kiểm tra RBAC: không cho phép cấp L1 phê duyệt nếu không phải Cảng vụ/Chi cục (BR-138-10)
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
  - Warning banner khi polygon giao cắt với vùng khác
