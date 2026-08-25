# QUY CHUẨN KIẾN TRÚC VÀ XÂY DỰNG MÀN HÌNH CHỨC NĂNG KẾT CẤU HẠ TẦNG (KCHTGT)

> **Tài liệu tham chiếu chuẩn (Single Source of Truth) cho toàn bộ 28 phân hệ quản lý tài sản kết cấu hạ tầng hàng hải.**
> Áp dụng bắt buộc cho mọi Agent / Developer khi phát triển hoặc chuẩn hóa bất kỳ màn hình danh mục hạ tầng nào (VTS, AIS, Trạm Radar, Tuyến luồng, Cầu bến, Đê kè, Phao tiêu báo hiệu...).

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

### 4.2. Form Drawer (`AppDrawer`)
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
- Mọi Input / Select trong Form đều dùng `style={{ borderRadius: radiusPill, height: 40 }}` và `Form.Item style={{ marginBottom: spaceFormField }}`.

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
### 4.5. Cấu hình Cột Bảng và Cột Thao tác (DataTable Columns & Action Column)
1. **Cột thao tác (Action Column):**
   - **BẮT BUỘC** truyền qua prop `rowActions={rowActions}` của `<DataTable rowActions={rowActions} />`.
   - **CẤM** tự định nghĩa thêm cột `{ title: 'Thao tác', key: 'action', ... }` vào trong mảng `columns`. Component dùng chung `DataTable` sẽ tự động render icon 3 gạch ngang (`UnorderedListOutlined`) và cố định bên phải chuẩn 60px đồng bộ toàn hệ thống.
2. **Tiêu đề cột (Column Labels):**
   - **BẮT BUỘC** dùng `label: '...'` (không dùng `title`).
   - Thiết lập `ellipsis: false` và cấp đủ bề rộng (`width`) cho từng cột để tiêu đề hiển thị trọn vẹn 100%.
   - **CẤM** để tiêu đề cột bị cắt chữ hiển thị dấu ba chấm `...` (như `THA...`, `ĐỊA ĐI...`, `TÊN TRUNG TÂM...`).

### 4.6. Chuẩn hóa Tìm kiếm Tiếng Việt không dấu (Vietnamese Unaccented Search)
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
- **TUYỆT ĐỐI CẤM** dùng so sánh chuỗi thô `(option?.label ?? '').toLowerCase().includes(input.toLowerCase())` vì không thể tìm kiếm khi người dùng gõ từ khóa tiếng Việt không dấu (ví dụ: gõ `cang` tìm `Cảng`, `hai phong` tìm `Hải Phòng`).

---

## 5. CHECKLIST TRƯỚC KHI HOÀN TẤT BẤT KỲ MÀN HÌNH NÀO

- [ ] Entity & DTO có `@FieldNameConstants`, không hardcode chuỗi tên trường hay chuỗi Enum.
- [ ] Service có `resolveEffectiveScope` và `validateAllowedOrgUnit`.
- [ ] Xóa mềm dùng `ApprovalHistoryUtils.recordSoftDelete`.
- [ ] Cập nhật dùng `EntityUpdateUtils.copyPropertiesIfPresent`.
- [ ] Permission đã được khai báo trong `PermissionSeeder.java` và `@PreAuthorize`.
- [ ] Endpoint `/options` đã được mở và frontend service có `getOptions()`, chỉ trả về các bản ghi đã duyệt (`ApprovalStatus.APPROVED` / `APPROVED_LEVEL2`).
- [ ] UI List dùng `FilterTableLayout`, `OrgUnitTreeSelect` chuẩn và không lệch so với màn VTS.
- [ ] Cột bảng dùng `label` + `ellipsis: false` (hiển thị trọn vẹn chữ không bị `...`), cột thao tác truyền qua `rowActions` (không tự chế cột Thao tác).
- [ ] Cascading Filters: Dropdown con tự động lọc theo `orgUnitId` và tự động reset giá trị khi đổi đơn vị cha (áp dụng cả ở sidebar lọc và form drawer).
- [ ] Tìm kiếm tiếng Việt không dấu: Mọi `Select` có `showSearch` đều dùng `filterOption={(input, option) => normalizeSearchText(option?.label).includes(normalizeSearchText(input))}`.
- [ ] Drawer dùng `AppDrawer` với `size="50%"` và Pill radius.
- [ ] `mvn compile -DskipTests` và `npx tsc --noEmit` đều vượt qua 0 lỗi.


