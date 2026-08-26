# QUY CHUẨN KIẾN TRÚC VÀ XÂY DỰNG MÀN HÌNH CHỨC NĂNG KẾT CẤU HẠ TẦNG (KCHTGT)

> **MÀN HÌNH MẪU CHUẨN DUY NHẤT TOÀN HỆ THỐNG (GOLDEN STANDARD BENCHMARK):**
> 🌟 **Quản lý Cảng biển (`/port` — `frontend/src/services/port/PortListPage.tsx`)**
> 
> **Tài liệu tham chiếu chuẩn (Single Source of Truth) cho toàn bộ 28 phân hệ quản lý tài sản kết cấu hạ tầng hàng hải.**
> Áp dụng bắt buộc cho mọi Agent / Developer khi phát triển hoặc chuẩn hóa bất kỳ màn hình danh mục hạ tầng nào (VTS, AIS, Trạm Radar, Tuyến luồng, Cầu bến, Đê kè, Phao tiêu báo hiệu...). Toàn bộ bố cục, căn lề, cỡ chữ, bảng danh sách, Drawer 5 tab, GIS, tệp đính kèm và lịch sử đều lấy màn hình `/port` làm chuẩn.

---

## 1. KIẾN TRÚC CHUẨN 3 TẦNG

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TẦNG 1: ENTITY & REPOSITORY (CSDL & Data Access)                                       │
│  - Kế thừa BaseEntity & BaseApprovableEntity (hoặc implements ApprovableEntity)        │
│  - Khai báo @FieldNameConstants trên Entity và Request/Response DTO                    │
│  - JPQL tìm kiếm tích hợp DataScope:                                                   │
│    WHERE t.deletedAt IS NULL                                                           │
│      AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)                    │
│      AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)                              │
│      AND (:keyword IS NULL OR LOWER(t.name) LIKE :keyword OR LOWER(t.code) LIKE :keyword)│
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TẦNG 2: SERVICE & CONTROLLER (Business Logic & Security)                               │
│  - Phân quyền động: @PreAuthorize("<resource>:<action>")                               │
│  - Seed quyền vào PermissionSeeder.java: seedPermission(definitions, res, action)       │
│  - DataScope phân cấp: Inject OrgUnitScopeService                                      │
│    + resolveEffectiveScope(selectedOrgUnitId): Giao thoa cây con với userScope         │
│    + validateAllowedOrgUnit(orgUnitId): Chặn thao tác ngoài phạm vi (403 AccessDenied) │
│  - Cập nhật & Audit: Tái sử dụng EntityUpdateUtils.copyPropertiesIfPresent             │
│  - Xóa mềm & Audit: Tái sử dụng ApprovalHistoryUtils.recordSoftDelete                  │
│  - Quy trình duyệt 2 cấp: Tích hợp InfrastructureApprovalService (submit/C1/C2/reject) │
│  - Endpoint danh mục nhẹ: GET /api/v1/<res>/options (id, code, name, orgUnitId)        │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TẦNG 3: FRONTEND UI & INTEGRATION (Giao diện & Trải nghiệm người dùng)                 │
│  - Danh sách chuẩn: FilterTableLayout + ScreenHeader + DataTable + StatusTabs          │
│  - Cây đơn vị lọc: OrgUnitTreeSelect                                                   │
│    + placeholder="Tất cả", allowClear, listHeight={256}, treeDefaultExpandAll={true}   │
│    + KHÔNG dùng allLabel="Tất cả", KHÔNG dùng showPath ở filter sidebar               │
│  - Form & Chi tiết: AppDrawer (size="50%", tabs phân nhóm, responsive trên mobile)     │
│  - Form Controls: Border-radius pill (radiusPill / 999px), height: 40px               │
│  - Nạp dropdown quan hệ: Gọi <res>CRUD.getOptions() (KHÔNG gọi API phân trang size=200)│
│  - Kiểm soát nút phê duyệt: Chống tự duyệt (4-eyes principle) & phân quyền nút bấm     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. CHI TIẾT TẦNG 1: ENTITY, DTO & REPOSITORY

### 2.1. Khai báo Entity & DTO
- **Entity**: Bắt buộc có `@FieldNameConstants`, kế thừa `BaseEntity` (chứa `id`, `createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `deletedAt`, `deletedBy`) và implements `ApprovableEntity`.
- **DTO**: Request và Response đều có `@FieldNameConstants`, validation đầy đủ (`@NotBlank`, `@NotNull`, `@Size`).
- **Option DTO**: DTO siêu nhẹ phục vụ dropdown cho các phân hệ khác liên kết tới:
  ```java
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public class ResourceOptionResponse {
      private UUID id;
      private String code;
      private String name;
      private UUID orgUnitId;
  }
  ```

### 2.2. Query Repository
```java
@Query("SELECT t FROM EntityName t WHERE t.deletedAt IS NULL " +
       "AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds) " +
       "AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId) " +
       "AND (:filterId IS NULL OR t.filterId = :filterId) " +
       "AND (:status IS NULL OR t.conditionStatus = :status) " +
       "AND (:approvalStatus IS NULL OR t.approvalStatus = :approvalStatus) " +
       "AND (:keyword IS NULL OR LOWER(t.name) LIKE :keyword OR LOWER(t.code) LIKE :keyword)")
Page<EntityName> search(
        @Param("scopeEnabled") boolean scopeEnabled,
        @Param("scopeOrgUnitIds") List<UUID> scopeOrgUnitIds,
        @Param("orgUnitId") UUID orgUnitId,
        @Param("filterId") UUID filterId,
        @Param("status") ConditionStatus status,
        @Param("approvalStatus") ApprovalStatus approvalStatus,
        @Param("keyword") String keyword,
        Pageable pageable);
```

---

## 3. CHI TIẾT TẦNG 2: SERVICE & CONTROLLER

### 3.1. Cấu hình DataScope chuẩn trong Service
```java
private Scope resolveEffectiveScope(UUID selectedOrgUnitId) {
    Scope userScope = orgUnitScopeService.currentUserScope();
    if (selectedOrgUnitId == null) {
        return userScope;
    }
    if (!userScope.unrestricted() && !userScope.allows(selectedOrgUnitId)) {
        return Scope.restricted(List.of());
    }
    List<UUID> selectedSubtree = orgUnitScopeService.resolveSubtreeIds(selectedOrgUnitId);
    if (userScope.unrestricted()) {
        return Scope.restricted(selectedSubtree);
    }
    List<UUID> intersected = selectedSubtree.stream()
            .filter(userScope::allows)
            .toList();
    return Scope.restricted(intersected);
}

private void validateAllowedOrgUnit(UUID orgUnitId) {
    Scope userScope = orgUnitScopeService.currentUserScope();
    if (!userScope.unrestricted() && (orgUnitId == null || !userScope.allows(orgUnitId))) {
        throw new AccessDeniedException("Bạn không có quyền thao tác trên đơn vị quản lý này");
    }
}
```

### 3.2. Cập nhật và Xóa mềm tuân thủ Quy ước
```java
// Cập nhật (Sử dụng EntityUpdateUtils + Lombok Constants):
Map<String, String> previousValues = new LinkedHashMap<>();
EntityUpdateUtils.copyPropertiesIfPresent(request, entity, previousValues, ...);

// Xóa mềm (Sử dụng ApprovalHistoryUtils):
entity.setDeletedAt(LocalDateTime.now());
entity.setDeletedBy(userId);
repository.save(entity);
ApprovalHistoryUtils.recordSoftDelete(
        historyRepository,
        id,
        InfrastructureType.RESOURCE_TYPE,
        userId,
        "Xóa: " + entity.getName());
```

### 3.3. Đăng ký quyền trong `PermissionSeeder.java`
Mỗi khi thêm resource mới, bắt buộc seed đủ các quyền:
- `<resource>:read`
- `<resource>:create`
- `<resource>:update`
- `<resource>:delete`
- `<resource>:history`
- `<resource>:approveC1`
- `<resource>:approveC2`

### 3.4. Đồng bộ Tọa độ Không gian GIS tập trung (`GisSpatialObjectService`)
Toàn bộ 28 phân hệ KCHT lưu chung dữ liệu tọa độ không gian vào bảng `public.gis_spatial_objects` qua dịch vụ tập trung `GisSpatialObjectService`:
- **Tạo mới / Cập nhật**:
  ```java
  UUID spatialId = gisSpatialObjectService.syncSpatialObject(
          entity.getSpatialId(), // null nếu tạo mới, truyền ID cũ nếu cập nhật
          "Tên đối tượng " + entity.getName(),
          "PREFIX_" + entity.getId(),
          request.getGeometryType(),
          request.getCoordinates(),
          entity.getId(),
          InfrastructureType.RESOURCE_TYPE);
  entity.setSpatialId(spatialId);
  ```
- **Xóa mềm KCHT**:
  ```java
  if (entity.getSpatialId() != null) {
      gisSpatialObjectService.delete(entity.getSpatialId());
      entity.setSpatialId(null);
  }
  ```
- **Tải chi tiết (toResponse)**:
  ```java
  if (entity.getSpatialId() != null) {
      gisSpatialObjectService.findById(entity.getSpatialId()).ifPresent(spatial -> {
          // Gán coordinates & geometryType trả về client
      });
  }
  ```

---

## 4. CHI TIẾT TẦNG 3: FRONTEND UI & INTEGRATION

### 4.1. Cấu hình Dropdown Cây Đơn vị (OrgUnitTreeSelect)
Khi dùng trong filter sidebar:
```tsx
<OrgUnitTreeSelect
  organizations={orgUnits}
  placeholder="Tất cả"
  allowClear
  listHeight={256}
  value={orgUnitId}
  onChange={setOrgUnitId}
  style={{ width: '100%', borderRadius: radiusPill, height: 40 }}
/>
```
> **Lưu ý:**
> - KHÔNG truyền `allLabel="Tất cả"` (tránh tạo node giả có đường kẻ).
> - KHÔNG truyền `treeDefaultExpandAll={false}` (để mặc định mở rộng toàn bộ nhánh).
> - KHÔNG bật `showPath` trong sidebar lọc.

### 4.2. Form Drawer (`AppDrawer`) & Quy chuẩn Bo tròn (Pill & Rounded Design System)
- Sử dụng `AppDrawer` thay vì modal hay Drawer tự tạo:
```tsx
<AppDrawer
  title={isEdit ? "Cập nhật hồ sơ" : "Thêm mới hồ sơ"}
  open={open}
  onClose={onClose}
  size="50%"
  footer={...}
>
  <Form layout="vertical">...</Form>
</AppDrawer>
```
- **Quy chuẩn Bo tròn đồng bộ (Pill & Rounded Inputs)**:
  - **Ô nhập 1 dòng (`Input`, `Select`, `TreeSelect`, `DatePicker`, `InputNumber`)**: Bắt buộc dùng `style={{ borderRadius: radiusPill, height: 40 }}` (bo tròn viên thuốc 2 đầu `999px`).
  - **Ô nhập nhiều dòng (`Input.TextArea` — Phạm vi, Thông báo hàng hải, Ghi chú, Lý do...)**: Bắt buộc dùng `style={textAreaStyle}` hoặc `style={{ borderRadius: 20, padding: '10px 16px' }}` (bo cong mềm mại góc lớn `20px` đồng điệu 100% với ô Input viên thuốc, đệm lề trong để văn bản không bị lẹm góc).
  - **Khoảng cách và Bố cục Lưới Form**:
    - Sử dụng `<Row gutter={[24, 0]}>` với `spaceFormField: 12px` ở `Form.Item`.
    - Ô 1 dòng: `<Col span={12}>` (chiếm 50% dòng).
    - Ô `TextArea` nhiều dòng, bảng con hoặc upload file: `<Col span={24}>` (chiếm 100% chiều ngang).
  - **Nút bấm Footer**: Tất cả nút (Lưu tạm, Lưu và gửi duyệt, Lưu và phê duyệt, Hủy...) đều dùng `borderRadius: radiusPill` và `height: 40`.
  - **Tab Lịch sử**: Bắt buộc ẩn khi Thêm mới (`drawerMode === 'create'`), chỉ hiện khi Xem chi tiết (`view`) hoặc Sửa (`edit`).

### 4.3. Nạp danh mục liên kết không giới hạn (`/options`) và Trạng thái Phê duyệt
- Không gọi `get(page=0, size=200)` để fill Select dropdown.
- Bắt buộc gọi `resourceCRUD.getOptions()` (Endpoint `GET /api/v1/<res>/options`).
- **QUY TẮC APPROVED ONLY**: Mọi API/dịch vụ lấy danh sách options cho dropdown **BẮT BUỘC CHỈ TRẢ VỀ** các bản ghi có trạng thái phê duyệt cao nhất (`ApprovalStatus.APPROVED` hoặc `ApprovalStatus.APPROVED_LEVEL2` đối với dữ liệu legacy) và trạng thái hoạt động hợp lệ (`ConditionStatus.OPERATIONAL` / không bị xóa mềm hay vô hiệu hóa). Tuyệt đối không hiển thị các bản ghi đang Lưu tạm (`DRAFT`), Đang đề xuất (`PROPOSED`), Chờ duyệt (`PENDING_APPROVAL`, `APPROVED_LEVEL1`), Bị trả về (`REJECTED_LEVEL1`, `REJECTED_LEVEL2`), hoặc Đã xóa/lưu trữ (`ARCHIVED`).

### 4.4. Bộ lọc và Form phân cấp liên hoàn (Cascading Filter & Form Dependency)
Khi màn hình danh sách hoặc form nhập liệu có các quan hệ thứ bậc (Ví dụ: `orgUnitId` $\rightarrow$ `portId`, `vtsSystemId`, `vtsOperationCenterId`, v.v.):
1. **Dropdown phụ thuộc BẮT BUỘC lọc theo Đơn vị quản lý đã chọn:**
   ```tsx
   const filteredPortOptions = useMemo(() => {
     if (!orgUnitId) return portOptions;
     return portOptions.filter((p) => !p.orgUnitId || p.orgUnitId === orgUnitId);
   }, [portOptions, orgUnitId]);
   ```
2. **Tự động Reset khi đổi đơn vị cha:**
   Khi người dùng chọn đơn vị quản lý mới, nếu giá trị con đang chọn không còn nằm trong danh sách đơn vị mới thì **bắt buộc tự động xóa chọn (reset về undefined)**:
   ```tsx
   const handleOrgUnitChange = (val?: string) => {
     setOrgUnitId(val);
     if (val) {
       if (portId && !portOptions.some((p) => p.id === portId && (!p.orgUnitId || p.orgUnitId === val))) {
         setPortId(undefined);
       }
       if (vtsSystemId && !vtsSystems.some((v) => v.id === vtsSystemId && (!v.orgUnitId || v.orgUnitId === val))) {
         setVtsSystemId(undefined);
       }
     }
   };
   ```
### 4.5. Cấu hình Cột Bảng, Cố định Cột và Cỡ chữ (DataTable Columns & Action Column)
1. **Cột STT (Cố định trái, 60px, căn giữa):**
   - Tính theo `(page - 1) * pageSize + index + 1`.
2. **Cột Tên / Mã KCHT (Cố định trái, 220px - 260px, căn trái):**
   - **Dòng 1 (Tên KCHT)**: Cỡ chữ `13px` (`fontSizeMd`), `fontWeightBold`, màu `textPrimary` hoặc `colors.sidebarBg`.
   - **Dòng 2 (Mã KCHT)**: Cỡ chữ `13px` (`fontSizeMd`), `fontWeightMedium`, màu `textSecondary`. **BẮT BUỘC dùng `fontSizeMd` (13px)**, tuyệt đối không dùng `fontSizeSm` (10px).
3. **Cột Cán bộ cập nhật (190px - 220px, `ellipsis: false`, căn trái):**
   - **Dòng 1 (Họ và tên cán bộ)**: `fontSizeMd` (13px), `fontWeightBold`, màu đậm `#0F172A`.
   - **Dòng 2 (Ngày giờ cập nhật)**: `fontSizeMd` (13px), màu `textSecondary`, định dạng `DD/MM/YYYY HH:mm:ss`.
   - **Bắt buộc hiển thị Họ và tên (`fullName`)**: Tuyệt đối không hiển thị email hoặc UUID làm tên cán bộ.
4. **Cột Tình trạng & Trạng thái phê duyệt (Căn trái, Pill Badge Standard, `ellipsis: false`):**
   - **Cột Tình trạng (`conditionStatus`)**: Chiều rộng `160px`, căn trái (`align: 'left'`). Dùng màu: `Đang hoạt động` (`#1BAF7A`), `Đang bảo trì` (`#EDA100`), `Dừng hoạt động` (`#E34948`), `Đang xây dựng` (`#0E6FD6`).
   - **Cột Trạng thái (`approvalStatus`)**: Chiều rộng `180px`, căn trái (`align: 'left'`). Dùng màu: `Lưu tạm` (`#93A3B3`), `Chờ Cảng vụ duyệt` (`#EDA100`), `Chờ Cục duyệt` (`#0284C7`), `Đã duyệt` (`#1BAF7A`), `Từ chối/Trả về` (`#E34948`).
   - **Quy chuẩn Style Badge**: Dạng viên thuốc tròn 2 đầu (`borderRadius: radiusPill` / `999px`, `padding: '2px 10px'`, `fontSizeMd` / 13px, `fontWeightMedium` / 500, `background: ${color}15`, `border: 1px solid ${color}40`, `color: ${color}`). **TUYỆT ĐỐI CẤM** dùng thẻ `<Tag color="processing">` của Ant Design gây lỗi màu tím/xanh tím và vuông góc.
   - Mọi ô trên bảng (`.ant-table-cell`) bắt buộc có `overflow: hidden !important;` và `white-space: nowrap !important;` để ngăn chặn 100% tình trạng chữ dài tràn/chờm đè sang cột bên cạnh. Cột văn bản tự động áp dụng `textOverflow: 'ellipsis'` (hiển thị `...`), còn cột chứa Badge (`ellipsis: false`) áp dụng `textOverflow: 'clip'` để không bị xuất hiện dấu ba chấm `...` thừa.
5. **Cột thao tác (Action Column):**
   - **BẮT BUỘC** truyền qua prop `rowActions={rowActions}` của `<DataTable rowActions={rowActions} />`.
   - **CẤM** tự định nghĩa thêm cột `{ title: 'Thao tác', key: 'action', ... }` vào trong mảng `columns`. Component dùng chung `DataTable` sẽ tự động render icon 3 gạch ngang (`UnorderedListOutlined`) và cố định bên phải chuẩn 60px đồng bộ toàn hệ thống.
6. **Tiêu đề cột (Column Labels) vs Nội dung ô bản ghi (Cell Content):**
   - **Tiêu đề cột**: **BẮT BUỘC** dùng `label: '...'` (không dùng `title`), thiết lập `ellipsis: false` và cấp đủ bề rộng (`width`) cho từng cột để tiêu đề hiển thị **trọn vẹn 100% chữ**. **TUYỆT ĐỐI CẤM** để tiêu đề cột bị cắt chữ hiển thị dấu ba chấm `...` (như `THA...`, `ĐỊA ĐI...`, `TÊN TRUNG TÂM...`).
   - **Nội dung ô bản ghi**: Nếu nội dung văn bản quá dài (như tên hệ thống, địa chỉ, đơn vị, ghi chú...) thì **BẮT BUỘC** áp dụng `overflow: hidden`, `text-overflow: ellipsis`, `white-space: nowrap` (cắt ngắn và hiển thị `...`) kèm thuộc tính `title` hoặc Tooltip khi hover để xem đầy đủ, **TUYỆT ĐỐI CẤM** để chữ dài tràn/chờm đè sang cột bên cạnh.

### 4.6. Tab Vị trí & Tọa độ GIS (GIS Spatial - UI & Backend Architecture)
1. **Frontend UI**:
   - Sử dụng component dùng chung `<GisLocationSelector />`.
   - **Loại đối tượng GIS**: Dropdown chọn Đối tượng điểm (`POINT`), Đối tượng đường (`LINE`), Đối tượng vùng (`POLYGON`).
   - **Biểu tượng bản đồ**: Dropdown hiển thị icon ảnh bản đồ trực quan từ `SymbolList` kèm mã biểu tượng.
   - **Hệ quy chiếu & Quy tắc hiển thị**: Dạng pill `WGS 84 / VN-2000` & `Độ, phút, giây (DMS)`.
   - **Bảng Tọa độ**: Sử dụng Compact DMS Inputs (Độ `°`, Phút `'`, Giây `"`) kèm nút *"Chọn vị trí trên bản đồ"* mở Map Picker.
2. **Backend Logic & CSDL**:
   - **Entity**: `InfrastructureSpatial` (hoặc `SpatialPoint`, lưu `refId`, `refType`, `geometryType`, `coordinates` WKT/GeoJSON, `symbolId`, `spatialReference`).
   - **Endpoints**: `GET /api/v1/<res>/{id}/spatial` và `PUT /api/v1/<res>/{id}/spatial`.

### 4.7. Tab Tệp đính kèm (File Attachments - UI & Backend Architecture)
1. **Frontend UI**:
   - Khu vực tải lên kéo thả `Upload.Dragger` hỗ trợ PDF, DOCX, XLSX, PNG, JPG, CAD $\le 10\text{MB}$.
   - Bảng danh sách tệp đính kèm gồm: Tên tài liệu, Loại tệp, Dung lượng (KB/MB), Cán bộ tải lên (`fullName`), Ngày tải lên (`DD/MM/YYYY HH:mm`), Nút Tải về (`DownloadOutlined`) và Nút Xóa (`DeleteOutlined`).
2. **Backend Logic & CSDL**:
   - **Entity**: `InfrastructureAttachment` (lưu `id`, `refId`, `refType`, `fileName`, `filePath`, `fileSize`, `fileType`, `uploadedBy`, `createdAt`).
   - **Validation**: Bắt buộc kiểm tra kích thước $\le 10\text{MB}$ và kiểm tra MIME type an toàn.
   - **Endpoints**: `GET/POST /api/v1/<res>/{id}/attachments`, `GET .../download`, `DELETE .../{attachmentId}`.

### 4.8. Drawer Lịch sử thay đổi & Phê duyệt (Audit Timeline - UI & Backend Architecture)
1. **Phân biệt 2 loại Lịch sử trong hệ thống**:
   - **(A) Tab Lịch sử Phê duyệt trong Drawer Form (`AppDrawer`)**:
     - Nằm ở **Tab cuối cùng** trong Drawer Form, hiển thị tóm tắt tiến trình 2 cấp: Người tạo & ngày tạo, Người gửi duyệt & ngày gửi, Cảng vụ duyệt C1 & ngày duyệt, Cục duyệt C2 & ngày duyệt, Lý do từ chối nếu có.
     - **QUY TẮC BẮT BUỘC**: **Khi Thêm mới (`drawerMode === 'create'`), BẮT BUỘC ẨN tab này** (dùng `...(drawerMode !== 'create' ? [{ key: '5', label: FORM_TAB_LABEL.HISTORY, ... }] : [])`) vì bản ghi chưa được tạo trong CSDL. Tab này CHỈ hiển thị khi Xem chi tiết (`view`) hoặc Chỉnh sửa (`edit`).
   - **(B) Drawer / Modal Lịch sử biến động dữ liệu chi tiết (Change Audit Trail)**:
     - Mở từ **Menu thao tác trên dòng (`rowActions`)** $\rightarrow$ nút **"Lịch sử" / "Lịch sử thay đổi"** (`<HistoryOutlined />`).
     - **Bộ lọc trong Drawer**: Ô tìm kiếm từ khóa + Lọc theo khoảng ngày (`Từ ngày` - `Đến ngày`).
     - **Bố cục lưới 2 cột**: `gridTemplateColumns: 'minmax(310px, 0.38fr) minmax(0, 1fr)'`, gap: `16px`.
     - **Cột trái (Metadata)**: Thời gian `HH:mm DD/MM/YYYY` + Badge hành động (`borderRadius: 999`, `flexWrap: 'wrap'`) + Người cập nhật (**Họ và tên**) + Đơn vị quản lý.
     - **Cột phải (Card chi tiết)**: Viền trái màu gradient theo hành động, tiêu đề `Thông tin thêm mới:` / `Thông tin thay đổi:`, danh sách trường tiếng Việt + diff `<Giá trị cũ> → <Giá trị mới>`, khung Lý do từ chối / ghi chú.
     - **Làm sạch dữ liệu**: Tự động gom nhóm thay đổi cùng giây/người, lọc bỏ dòng rỗng hoặc không thay đổi (`ov === nv`).
2. **Backend Logic & CSDL**:
   - **Bảng CSDL duy nhất**: `infrastructure_history` (Entity: `InfrastructureHistory`, Repository: `InfrastructureHistoryRepository`). **Tuyệt đối không dùng các bảng phân mảnh cũ như `change_logs`, `approval_logs`, `beacon_history`, `station_history`** (các bảng này đã bị DROP hoàn toàn).
   - **Xóa mềm**: Tái sử dụng `ApprovalHistoryUtils.recordSoftDelete(...)`.
   - **Endpoint**: `GET /api/v1/<res>/{id}/history` trả về danh sách lịch sử có `fullName` của người thao tác.

### 4.9. Chuẩn hóa Tìm kiếm Tiếng Việt không dấu (Vietnamese Unaccented Search)
Mọi ô chọn tìm kiếm dropdown (`Select` có `showSearch`), ô tìm kiếm cây đơn vị (`OrgUnitTreeSelect`), và thanh tìm kiếm từ khóa trên toàn bộ màn hình **BẮT BUỘC** hỗ trợ tìm kiếm tiếng Việt không dấu:
- **Với Ant Design `Select` có `showSearch`**:
  ```tsx
  import { normalizeSearchText } from '../../components/org-unit';

  <Select
    showSearch
    allowClear
    filterOption={(input, option) =>
      normalizeSearchText(option?.label).includes(normalizeSearchText(input))
    }
    ...
  />
  ```
### 4.10. Quy chuẩn Status Tabs & Bảng màu Semantic Tokens (Status Tabs & Semantic Badge Colors)
1. **Tập 7 Trạng thái chuẩn & Bảng màu Semantic Tokens**:
   - **Tất cả (`ALL`)**: `actionPrimary` (`#0E6FD6` - Xanh thương hiệu).
   - **Lưu tạm (`DRAFT`)**: `statusDraft` / `textTertiary` (`#93A3B3` - Xám trung tính). Mặc định khi tạo mới.
   - **Chờ Cảng vụ duyệt (`PENDING_APPROVAL`)**: `statusAttention` (`#EDA100` - Vàng cam Amber).
   - **Chờ Cục duyệt (`APPROVED_LEVEL1`)**: `#0284C7` (Xanh da trời Sky Cyan).
   - **Đã duyệt (`APPROVED`)**: `statusOperational` (`#1BAF7A` - Xanh lá Emerald).
   - **Từ chối (`REJECTED_LEVEL1`, `REJECTED_LEVEL2`)**: `statusCritical` (`#E34948` - Đỏ tươi Rose).
2. **Khớp tổng số lượng trên Status Tabs**:
   - Số lượng trên tab "Tất cả" **BẮT BUỘC** bằng tổng số lượng của các tab trạng thái con:
     $$\text{Tất cả} = \text{Lưu tạm} + \text{Chờ Cảng vụ duyệt} + \text{Chờ Cục duyệt} + \text{Đã duyệt} + \text{Từ chối}$$
   - Tab "Từ chối" trên Frontend hiển thị tổng số của `REJECTED_LEVEL1` + `REJECTED_LEVEL2`.
   - Backend `countByApprovalStatus` trả về số lượng chính xác theo từng trạng thái chuẩn.
3. **Dọn sạch trạng thái legacy trong DB và Code**:
   - Trong quá trình phát triển, tuyệt đối không giữ các mã fallback legacy (`PROPOSED (1)`, `APPROVED_LEVEL2 (4)`, `REJECTED (6)`).
   - CSDL được chuẩn hóa hoàn toàn qua Flyway script: `1 -> 2`, `4 -> 5`, `6 -> 8`.
4. **QUY TẮC CHỈNH SỬA THEO TRẠNG THÁI (quy tắc 12 — BẮT BUỘC)**:
   - Ma trận chuẩn duy nhất: `docs/conventions/approval-2-level-spec.md` mục **3.9**. Tóm tắt:
     `DRAFT` / `REJECTED_LEVEL1` / `REJECTED_LEVEL2` → **cho sửa** (quyền `<resource>:update`);
     `PENDING_APPROVAL` / `APPROVED_LEVEL1` / `ARCHIVED` → **cấm sửa** (ẩn nút + backend trả 403);
     `APPROVED` → **cho sửa qua "Lưu và phê duyệt"**, chỉ người có quyền `<resource>:approvec2`,
     hồ sơ **giữ nguyên `APPROVED`**, bản cũ ghi vào nhật ký thay đổi (T12).
   - Frontend dùng `canEditApprovalRecord()` (`frontend/src/utils/approvalEditPolicy.ts`);
     backend dùng `InfrastructureApprovalService.assertEditable()`. **CẤM** tự viết lại điều kiện ở từng màn/từng service.
   - Lý do cấm sửa khi đang chờ duyệt: nếu cho sửa, người nhập có thể đổi nội dung sau khi cán bộ đã đọc,
     khiến cán bộ ký duyệt vào nội dung mình chưa từng xem. Đồng bộ với ràng buộc chỉ được xóa tệp đính kèm
     khi hồ sơ ở `DRAFT`/`REJECTED_*`.
   - Lý do cấm hạ `APPROVED` về `DRAFT` khi sửa: xem **QUY TẮC APPROVED ONLY** ở mục 4.x — hồ sơ đang khai thác
     sẽ biến mất khỏi mọi dropdown `/options` của các màn hình khác.
5. **Quy chuẩn Style Badge**:
   - `borderRadius: radiusPill` (`999px`), `fontSize: fontSizeMd` (`13px`), `fontWeight: 500`, `background: ${color}15`, `border: 1px solid ${color}40`, `color: ${color}`, `whiteSpace: 'nowrap'`, `padding: '2px 10px'`.

### 4.11. Quy chuẩn Ma trận trường dữ liệu CRUD & Bộ lọc (Field CRUD & Filter Matrix Standard)
Nguồn gốc duy nhất của các trường dữ liệu trên Bảng danh sách, Sidebar bộ lọc, Drawer Xem chi tiết, Form Tạo mới và Chỉnh sửa **BẮT BUỘC** phải lấy chính xác từ bảng **Ma trận trường dữ liệu nghiệp vụ (CRUD & Filter Matrix)** trong tài liệu thiết kế chi tiết (TKCT) của BA:
- **Danh sách (`List = TRUE`)**: Cột hiển thị trên bảng dữ liệu `DataTable`.
- **Bộ lọc (`Filter = TRUE`)**: Trường lọc hiển thị trên Sidebar của `FilterTableLayout` (hoặc `StatusTabs` cho trạng thái phê duyệt `approvalStatus`, ô tìm kiếm cho `code`/`name`).
- **Xem chi tiết (`Detail = TRUE`)**: Trường hiển thị trong Drawer chi tiết (`drawerMode === 'view'`).
- **Tạo mới (`Create = TRUE`)**: Trường nhập liệu trong Form Tạo mới (`drawerMode === 'create'`).
- **Sửa (`Edit = TRUE`)**: Trường nhập liệu trong Form Chỉnh sửa (`drawerMode === 'edit'`).

#### Quy chuẩn hiển thị các trường trên Sidebar bộ lọc (`Filter = TRUE`):
1. `Đơn vị quản lý`: `OrgUnitTreeSelect` dạng cây theo DataScope phân quyền.
2. `Trạng thái phê duyệt`: Dãy `StatusTabs` 6 tab màu semantic trên đầu bảng danh sách.
3. `Mã` + `Tên`: Ô `Input` "Tìm kiếm từ khóa".
4. `Địa điểm (Tỉnh/TP)`: Dropdown chọn Tỉnh/Thành phố có hỗ trợ tìm kiếm tiếng Việt không dấu.
5. `Ngày cập nhật`: Ô `RangePicker` "Khoảng ngày cập nhật" (`DD/MM/YYYY`).
6. `Tình trạng hoạt động`: Dropdown chọn trạng thái vận hành (`ConditionStatus`).
7. `Các trường đặc thù` (Năm hoạt động, Đơn vị khai thác, Phân loại...): Hiển thị trực tiếp trên Sidebar theo đúng ma trận nghiệp vụ của đối tượng.
8. **Cấu hình Sidebar `FilterTableLayout`**: Bắt buộc đặt `hideFilterToggle={true}` để ẩn nút phễu; toàn bộ các trường lọc được hiển thị trực tiếp trên thanh cuộn dọc 280px (`overflowY: 'auto'`), dưới đáy chỉ giữ 2 nút: **Reload** + **Tìm kiếm**.

---

## 5. CHECKLIST TRƯỚC KHI HOÀN TẤT BẤT KỲ MÀN HÌNH NÀO

- [ ] Entity & DTO có `@FieldNameConstants`, không hardcode chuỗi tên trường hay chuỗi Enum.
- [ ] Service có `resolveEffectiveScope` và `validateAllowedOrgUnit`.
- [ ] Hiển thị thông tin người dùng: Luôn ưu tiên Họ và tên (`fullName`), không hiển thị email hoặc UUID.
- [ ] Xóa mềm dùng `ApprovalHistoryUtils.recordSoftDelete`.
- [ ] Cập nhật dùng `EntityUpdateUtils.copyPropertiesIfPresent`.
- [ ] Permission đã được khai báo trong `PermissionSeeder.java` và `@PreAuthorize`.
- [ ] Endpoint `/options` đã được mở và frontend service có `getOptions()`, chỉ trả về các bản ghi đã duyệt (`ApprovalStatus.APPROVED` / `APPROVED_LEVEL2`).
- [ ] UI List dùng `FilterTableLayout`, `OrgUnitTreeSelect` chuẩn và không lệch so với màn VTS.
- [ ] Cột bảng: STT cố định trái (60px), Tên/Mã cố định trái (220-260px, dòng 2 font 13px), Cán bộ cập nhật (dòng 1 Tên đậm 13px, dòng 2 Ngày 13px), Badge Trạng thái & Tình trạng độc lập (không hiện `...`), Thao tác qua `rowActions`.
- [ ] Cascading Filters: Dropdown con tự động lọc theo `orgUnitId` và tự động reset giá trị khi đổi đơn vị cha (áp dụng cả ở sidebar lọc và form drawer).
- [ ] Tìm kiếm tiếng Việt không dấu: Mọi `Select` có `showSearch` đều dùng `filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}`.
- [ ] Drawer 5 Tab: Dùng `AppDrawer` với `size="50%"`, Tab 3 GIS (DMS compact + symbol preview), Tab 4 Tệp đính kèm ($\le 10\text{MB}$), Tab 5 Lịch sử 2 cột (`minmax(310px, 0.38fr)`).
- [ ] `mvn compile -DskipTests` và `npx tsc --noEmit` đều vượt qua 0 lỗi.


