---
name: kcht-infra-screen-refactor
description: >-
  Quy chuẩn toàn diện thiết kế và kiểm thử màn hình Quản lý Kết cấu hạ tầng giao thông (KCHT) Hàng hải.
  Hướng dẫn phòng chống triệt để các lỗi về Breadcrumb/Title, ma trận cột audit phê duyệt trên bảng danh sách,
  xử lý trim space & đồng bộ tham số tìm kiếm, giá trị mặc định & validation bắt buộc trên Form, và chuẩn hóa hiển thị Drawer Xem chi tiết.
---

# Quy Chuẩn Quản Lý & Rà Soát Màn Hình KCHT Hàng Hải (KCHT Screen Standard)

## 1. Mục đích & Phạm vi áp dụng
Skill này đóng vai trò là kim chỉ nam bắt buộc áp dụng khi **tạo mới**, **chỉnh sửa**, hoặc **refactor** bất kỳ màn hình quản lý KCHT hàng hải nào (Bến cảng, Khu neo đậu, Khu chuyển tải, Đóng mới - sửa chữa tàu biển, Hệ thống VTS, Đài TTXLTT Hà Nội, Đài Duyên hải, Đài LRIT, Đài INMARSAT, Báo hiệu hàng hải, Tuyến luồng...).

Mục tiêu cốt lõi: **Đảm bảo 100% không tái phạm 5 nhóm lỗi giao diện và logic dữ liệu thường gặp**:
1. Lệch tên màn hình, breadcrumb hoặc placeholder giữa các phân hệ do copy-paste.
2. Thiếu các cột audit & cán bộ phê duyệt trên bảng danh sách (`DataTable`) hoặc tiêu đề cột bị cắt chữ.
3. Không trim space 2 đầu ô tìm kiếm hoặc truyền thiếu tham số `code` giữa Frontend Service và Backend API.
4. Sai giá trị mặc định của Tình trạng hoạt động hoặc thiếu validate bắt buộc cho Tỉnh/Thành phố.
5. Hiển thị sai nhãn tình trạng trong Drawer xem chi tiết hoặc thiếu thông tin cán bộ/ngày cập nhật trong mục Thông tin phê duyệt.

---

## 2. Quy chuẩn 1: Breadcrumb, Tiêu đề & Nhãn hiển thị chính xác

### Nguyên tắc
Khi phát triển màn hình cho bất kỳ loại tài sản/đài trạm nào, phải đồng bộ chính xác 100% tên gọi của thực thể đó trên toàn bộ các thành phần giao diện. Tuyệt đối không để sót tên cũ từ màn hình làm mẫu.

### Bảng kiểm tra đồng bộ chuỗi (Checklist)
| Vị trí | Ví dụ chuẩn (Đài TTXLTT Hà Nội) | Lỗi cấm mắc phải |
|---|---|---|
| **ScreenHeader Breadcrumb cấp 2** | `Đài TTXLTT Hà Nội` | `Đài TTXLTT Hàng hải` hoặc tên phân hệ khác |
| **Sidebar Label ô tìm kiếm Tên** | `Tên đài TTXLTT Hà Nội` | `Tên đài TTXLTT Hàng hải` |
| **Sidebar Placeholder ô Tên** | `Tìm theo tên đài TTXLTT Hà Nội...` | `Tìm theo tên đài TTXLTT...` |
| **Sidebar Label ô tìm kiếm Mã** | `Mã đài TTXLTT Hà Nội` | `Mã đài TTXLTT Hàng hải` |
| **Sidebar Placeholder ô Mã** | `Tìm theo mã đài TTXLTT Hà Nội...` | `Tìm theo mã đài...` |
| **Tiêu đề Form Thêm mới** | `Thêm mới Đài TTXLTT Hà Nội` | `Thêm mới Đài TTXLTT Hàng hải` |
| **Tiêu đề Drawer Chỉnh sửa** | `Chỉnh sửa thông tin — [Tên]` | Thiếu tên hoặc để sai tên loại đài |
| **Tiêu đề Drawer Xem chi tiết** | `Chi tiết Đài TTXLTT Hà Nội - [Tên]` | `Chi tiết Đài TTXLTT Hàng hải - [Tên]` |
| **Modal Từ chối phê duyệt** | `Từ chối phê duyệt Đài TTXLTT Hà Nội` | `Từ chối phê duyệt Đài TTXLTT Hàng hải` |
| **Modal Xác nhận Xóa** | `itemType="Đài TTXLTT Hà Nội"` | Để nhầm tên thực thể khác |
| **Toast thông báo thành công** | `Xóa Đài TTXLTT Hà Nội thành công` | `Xóa thành công` chung chung |

---

## 3. Quy chuẩn 2: Ma trận Cột Bảng Danh Sách & Bộ 4 Cột Audit Phê Duyệt

### Quy định cột bắt buộc
Mọi phân hệ KCHT có luồng phê duyệt 2 cấp (Cảng vụ/Chi cục -> Cục) **BẮT BUỘC** hiển thị đầy đủ 4 cặp cột audit/phê duyệt trên `DataTable` theo đúng ma trận thiết kế chi tiết (TKCT dòng 29–36):

1. **Cán bộ gửi phê duyệt**:
   - DataIndex: `submittedByName`
   - Dòng 1: Tên cán bộ gửi (`record.submittedByName`), bold `#0F172A`, fontSize 13.5px.
   - Dòng 2: Ngày gửi phê duyệt (`record.submittedAt`), format `DD/MM/YYYY HH:mm:ss`, màu `textSecondary`.
   - Width chuẩn: **`220px`**.
2. **Cán bộ phê duyệt cấp Cảng vụ/Chi cục**:
   - DataIndex: `approverLevel1Name`
   - Dòng 1: Tên cán bộ duyệt C1 (`record.approverLevel1Name`), bold `#0F172A`.
   - Dòng 2: Ngày duyệt C1 (`record.approvedDateLevel1`), format `DD/MM/YYYY HH:mm:ss`.
   - Width chuẩn: **`260px`**.
3. **Cán bộ phê duyệt cấp Cục**:
   - DataIndex: `approverLevel2Name`
   - Dòng 1: Tên cán bộ duyệt C2 (`record.approverLevel2Name`), bold `#0F172A`.
   - Dòng 2: Ngày duyệt C2 (`record.approvedDateLevel2`), format `DD/MM/YYYY HH:mm:ss`.
   - Width chuẩn: **`220px`**.
4. **Cán bộ cập nhật**:
   - DataIndex: `updatedByName`
   - Dòng 1: Tên người cập nhật (`record.updatedByName || record.createdByName`), bold `#0F172A`.
   - Dòng 2: Ngày cập nhật (`record.updatedAt || record.createdAt`), format `DD/MM/YYYY HH:mm:ss`.
   - Width chuẩn: **`220px`**.

### Bảng thứ tự cột chuẩn trên DataTable
```ts
const columns = [
  { key: 'stt', label: 'STT', width: 60, fixed: 'left', align: 'center' },
  { key: 'name', label: 'Tên/Mã đài TTXLTT', width: 260, fixed: 'left' },
  { key: 'orgUnitName', label: 'Đơn vị quản lý', width: 220 },
  { key: 'operatingOrgName', label: 'Đơn vị khai thác', width: 200 },
  { key: 'provinceId', label: 'Địa điểm (Tỉnh/TP)', width: 180 },
  { key: 'conditionStatus', label: 'Tình trạng', width: 200 },
  { key: 'approvalStatus', label: 'Trạng thái', width: 200 },
  { key: 'submittedByName', label: 'Cán bộ gửi phê duyệt', width: 220 },
  { key: 'approverLevel1Name', label: 'Cán bộ phê duyệt cấp Cảng vụ/Chi cục', width: 260 },
  { key: 'approverLevel2Name', label: 'Cán bộ phê duyệt cấp Cục', width: 220 },
  { key: 'updatedByName', label: 'Cán bộ cập nhật', width: 220 },
  // Cột Lý do từ chối (chỉ hiện khi tab từ chối active)
  ...(isRejectionTabActive ? [{ key: 'rejectionReason', label: 'Lý do từ chối', width: 260 }] : []),
];
```

### Quy chuẩn Chiều rộng Cố định Cột Tên / Mã KCHT (Width Standard = 260px)
- **Chuẩn hóa kích thước duy nhất**: Mọi màn hình danh sách KCHT hàng hải (Bến cảng, Khu neo đậu, Khu chuyển tải, Tuyến luồng, Đê kè, Đèn biển, Phao tiêu, Trạm radar, Nhà trạm, Hệ thống VTS, Đài duyên hải, CCTV/SCADA/VHF...) và màn hình Biến động tài sản (`*AssetList`) **BẮT BUỘC khóa cứng độ rộng cột Tên/Mã KCHT ở đúng kích thước duy nhất: `width: 260` (`260px`)**.
- **Tuyệt đối cấm sai lệch**: Nghiêm cấm đặt kích thước tùy tiện (210, 220, 240, 280, 300, 350, 400) làm bảng danh sách bị giật chiều rộng và mất đồng bộ thị giác giữa các phân hệ.
- **Quy cách hiển thị**:
  - Cố định bên trái: `fixed: 'left'`.
  - Căn lề: Căn trái (`align: 'left'`).
  - Cấu trúc 2 dòng:
    - Dòng 1: Tên KCHT (`fontSizeMd`, `fontWeightBold`, màu `textPrimary` hoặc `colors.sidebarBg`, click mở Drawer chi tiết).
    - Dòng 2: Mã KCHT (`fontSizeMd`, `fontWeightMedium`, màu `textSecondary`).
  - Chống tràn: Cấp cấu hình cột đặt `ellipsis: false`, bên trong ô render bọc `div` hoặc `a` có `overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'` kèm `title` hoặc Tooltip khi hover để xem trọn vẹn văn bản.

### Chống cắt chữ tiêu đề cột (Anti-Truncation Rule)
- Tiêu đề cột **BẮT BUỘC hiển thị 100% đầy đủ chữ** (ví dụ: `TRẠNG THÁI`, tuyệt đối không để bị cắt chữ thành `TRẠNG` hoặc `...`).
- Cột `approvalStatus` (`Trạng thái`) phải có `width >= 200px` và `ellipsis: false`.
- Khử chuỗi UUID trần: Nếu trường người dùng trả về UUID (`/^[0-9a-fA-F]{8}-/`), helper hiển thị phải fallback sang `—` hoặc tên người tạo, không hiển thị chuỗi mã hash khó hiểu cho người dùng.

### Quy chuẩn Tiêu đề cột KHÔNG ĐƯỢC XUỐNG DÒNG (Anti-Header-Wrapping Standard)
- **Tuyệt đối cấm chèn `\n` vào nhãn cột (`label`)**:
  - ❌ **CẤM**: `label: "Địa điểm\n(Tỉnh/Thành phố)"`
  - ✅ **ĐÚNG**: `label: "Địa điểm (Tỉnh/Thành phố)"`
- **Tiêu đề cột phải luôn hiển thị trên 1 dòng duy nhất**: Toàn bộ tiêu đề cột trong bảng danh sách phải giữ thẳng hàng trên 1 dòng ngang (`whiteSpace: 'nowrap'`), không được ngắt dòng hoặc xuống dòng làm lệch layout giữa các phân hệ.
- **Cấp bề rộng cột an toàn**: Cột có tiêu đề dài kèm biểu tượng sắp xếp (như `Địa điểm (Tỉnh/Thành phố)`) **BẮT BUỘC** có độ rộng tối thiểu `width: 250` (hoặc tối thiểu `240px`), kết hợp cơ chế `headerMinWidth` tự động tính toán để không bao giờ bị ép hẹp.

---

## 4. Quy chuẩn 3: Xử lý Tìm kiếm, Lọc, Auto-Trim trên UI & Sắp Xếp Dữ Liệu (Server-Side Sorting)

### Bắt buộc Auto-Trim Space 2 đầu cả trên Logic và UI
1. **Trim ngay khi rời ô nhập (`onBlur`)**:
   Khi người dùng nhập dấu cách đầu/cuối hoặc dán chuỗi có khoảng trắng, ngay khi rời chuột (`onBlur`), giá trị trên ô nhập giao diện phải được trim tự động:
   ```tsx
   <Input
     placeholder="Tìm theo tên..."
     value={(filterValues.keyword as string) || ''}
     onChange={(e) => setFilterValues((prev) => ({ ...prev, keyword: e.target.value }))}
     onBlur={() => setFilterValues((prev) => ({
       ...prev,
       keyword: typeof prev.keyword === 'string' ? prev.keyword.trim() : prev.keyword,
     }))}
     onPressEnter={() => {
       const trimmed = typeof filterValues.keyword === 'string' ? filterValues.keyword.trim() : filterValues.keyword;
       const nextVals = { ...filterValues, keyword: trimmed };
       setFilterValues(nextVals);
       handleFilterSearch(nextVals);
     }}
   />
   ```
2. **Cập nhật lại `filterValues` trong `handleFilterSearch`**:
   Khi nhấn nút "Tìm kiếm", hàm tìm kiếm **BẮT BUỘC** cập nhật ngược lại `filterValues` với chuỗi đã trim để ô nhập trên UI lập tức hiển thị sạch sẽ, không còn khoảng trắng thừa:
   ```ts
   const handleFilterSearch = (vals: Record<string, any>) => {
     const rawKeyword = typeof vals.keyword === 'string' ? vals.keyword.trim() : (vals.keyword || '');
     const rawStationCode = typeof vals.stationCode === 'string' ? vals.stationCode.trim() : (vals.stationCode || undefined);
     
     // Cập nhật lại filterValues để UI input được trim sạch sẽ ngay lập tức
     setFilterValues((prev) => ({
       ...prev,
       keyword: rawKeyword,
       stationCode: rawStationCode,
     }));
     setFilterKeyword(rawKeyword);
     setFilterStationCode(rawStationCode || undefined);
     // ... các filter khác
     setPage(1);
   };
   ```

### Quy Chuẩn Sắp Xếp Dữ Liệu Phân Trang (Issue #163 - Server-Side Sorting Standard)
Khi triển khai tính năng sắp xếp dữ liệu cho bảng danh sách phân trang:
1. **Frontend (`DataTable`)**:
   - **TUYỆT ĐỐI CẤM** dùng `dataSource={[...dataSource].sort(...)}` hoặc `sortedData = useMemo(() => [...dataSource].sort(...))` trên dữ liệu bảng danh sách phân trang! Vì khi phân trang (ví dụ trang 1 có 20 bản ghi, trang 2 có 20 bản ghi), việc sort trên mảng `dataSource` client chỉ đảo thứ tự 20 bản ghi của trang hiện tại, KHÔNG sắp xếp toàn bộ tập dữ liệu từ CSDL, dẫn đến sai lệch kết quả phân trang nghiêm trọng. Dữ liệu trả về từ server phải được đưa thẳng vào `dataSource={dataSource}`.
   - **TUYỆT ĐỐI CẤM** truyền hàm comparator giả `sorter: () => 0` vào column! Khi truyền function, Ant Design Table sẽ hiểu là client-side sorting và tự động reorder `dataSource` trên client gây sai lệch thứ tự trả về từ server.
   - **Khai báo Column chuẩn**: Chỉ cần khai báo `sortable: true` và `sortOrder: sortOrderFor(columnKey)`. Component `DataTable` dùng chung sẽ tự động gán `sorter: true` cho Ant Design Table để kích hoạt server-side sorting affordance.
   - **Bộ State & Handler chuẩn trong Component danh sách**:
     ```ts
     const [sortField, setSortField] = useState<string | null>(null);
     const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

     const handleSort = useCallback((field: string, order: 'asc' | 'desc' | null) => {
       setSortField(order ? field : null);
       setSortOrder(order);
       setPage(1);
     }, []);

     const sortOrderFor = useCallback(
       (key: string): 'ascend' | 'descend' | null =>
         sortField === key && sortOrder ? (sortOrder === 'asc' ? 'ascend' : 'descend') : null,
       [sortField, sortOrder]
     );
     ```
   - **Khai báo cột trong `columns`**:
     ```ts
     {
       key: 'pierName',
       label: 'Tên cầu cảng',
       dataIndex: 'pierName',
       sortable: true,
       sortOrder: sortOrderFor('pierName'),
       // ...
     }
     ```
   - Bảng truyền `onSort={handleSort}` vào `<DataTable />`.
   - Trong `fetchData`, truyền `sortBy: sortField || undefined` và `sortDir: sortOrder === 'asc' ? 'ASC' : (sortOrder === 'desc' ? 'DESC' : undefined)` vào hàm API `search`.

2. **Backend Controller & Service Layer**:
   - **Controller Endpoint**: `@GetMapping` search / list nhận `@RequestParam(required = false) String sortBy` và `@RequestParam(required = false) String sortDir` (hoặc `sortField`, `sortOrder`).
   - **Service `mapSortProperty`**: Ánh xạ tên trường từ frontend sang entity property name (ví dụ `stt` -> bỏ qua, `code`/`pierCode` -> `pierCode`, `name`/`pierName` -> `pierName`, `status` -> `operationalStatus`, `updatedByName`/`updatedAt` -> `updatedAt`, `createdAt` -> `createdAt`).
   - **Thứ tự mặc định (`defaultSort`)**: Khi không có `sortBy`/`sortDir`, luôn ưu tiên bản ghi mới cập nhật lên đầu:
     `Sort sort = Sort.by(Sort.Order.desc(EntityFields.UPDATED_AT), Sort.Order.desc(EntityFields.CREATED_AT), Sort.Order.asc(EntityFields.ID));`
   - **Áp dụng Sort động**:
     ```java
     if (sortBy != null && !sortBy.isBlank()) {
         String property = mapSortProperty(sortBy);
         if (property != null) {
             Sort.Direction direction = "ASC".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
             sort = Sort.by(direction, property).and(sort);
         }
     }
     Pageable pageable = PageRequest.of(page, pageSize, sort);
     ```
   - **Sắp xếp theo Tỉnh/TP (`provinceId`)**: Tỉnh/TP trong CSDL lưu dạng số nguyên (`Integer`), nếu `ORDER BY t.provinceId` sẽ sắp theo mã số (1, 2, 4... 89) làm sai lệch thứ tự bảng chữ cái tiếng Việt người dùng nhìn thấy trên màn hình. Khi cần sắp xếp nâng cao theo chữ cái Tỉnh/TP, dùng biểu thức `PROVINCE_ORDER_EXPR` (CASE WHEN 63 tỉnh theo đúng thứ tự A-Z).
   - **Sắp xếp không phân biệt hoa thường & Chuẩn hóa chữ cái tiếng Việt (`Đ`/`đ`)**:
     - Bọc `REPLACE(REPLACE(LOWER(COALESCE(t.name, '')), 'đ', 'dzz'), 'Đ', 'dzz')` trong query native/custom khi cần chữ `Đ`/`đ` được xếp đúng vị trí giữa `D` và `E` (`d` < `dzz` < `e`).
   - **Sắp xếp cột Cán bộ cập nhật (`updatedByName`)**: Phải fallback sang tên người tạo `COALESCE(uu.fullName, uc.fullName, '')` phòng trường hợp bản ghi mới tạo chưa từng cập nhật (`updatedBy` là null). Đồng thời query JPQL cần có `LEFT JOIN User uc ON uc.id = t.createdBy`.
   - **Kiểm tra độ ưu tiên tham số**: Kiểm tra `sort` -> `sortBy` & `sortDir` trước khi fallback sang `@PageableDefault` `requested.isSorted()`.

### Đồng bộ 100% Tham số `code` giữa Frontend & Backend
Khi giao diện Sidebar có riêng ô lọc "Mã đài / Mã tài sản":
1. **Frontend Service (`*Service.ts`)**:
   - Hàm `search` và `getCounts` **BẮT BUỘC** đưa `code: params?.code` vào `buildSearchParams`.
2. **Backend Controller**:
   - Phương thức `@GetMapping` search và `@GetMapping("/counts")` **BẮT BUỘC** nhận `@RequestParam(required = false) String code` và truyền vào service.
3. **Backend Service**:
   - Nhận `String code`, chuẩn hóa qua `toKeywordLike(code)`.
4. **Backend Repository (Spring Data JPA / JPQL)**:
   - Trong cả query `searchPaged` và `countByApprovalStatus`:
   ```sql
   AND (:code IS NULL OR CAST(function('immutable_unaccent', LOWER(COALESCE(t.code, ''))) AS string) LIKE CAST(:code AS string))
   ```
   *Lưu ý*: Không ghép chung `code` vào `keyword` nếu người dùng nhập riêng ô mã, vì tìm kiếm mã cần độ chính xác cao theo đúng trường `t.code`.

---

## 5. Quy chuẩn 4: Giá trị Mặc định & Validation Form Thêm mới / Sửa

### Giá trị mặc định của Tình trạng hoạt động
- Khi mở Form Thêm mới (`mode === 'create'`), tình trạng hoạt động **BẮT BUỘC mặc định là "Chưa khai thác/vận hành"**:
  ```ts
  form.setFieldsValue({
    conditionStatus: ConditionStatus.NOT_YET_OPERATIONAL, // 'NOT_YET_OPERATIONAL'
    // ...
  });
  ```
- **TUYỆT ĐỐI CẤM** đặt mặc định là `OPERATIONAL` ("Đang khai thác/vận hành") đối với hồ sơ tài sản mới khởi tạo.

### Bắt buộc nhập Địa điểm (Tỉnh/TP)
- Trường `Địa điểm (Tỉnh/TP)` (`name="provinceId"`) là trường bắt buộc trong hồ sơ hạ tầng:
  ```tsx
  <Form.Item
    name="provinceId"
    label={<span style={{ color: sidebarBg, fontWeight: fontWeightBold, fontSize: fontSizeMd }}>Địa điểm (Tỉnh/TP)</span>}
    rules={[{ required: true, message: 'Vui lòng chọn Tỉnh/Thành phố' }]}
    style={{ marginBottom: spaceFormField }}
  >
    <Select
      placeholder="Chọn tỉnh / thành phố"
      options={VIETNAM_PROVINCE_OPTIONS}
      allowClear
      showSearch
      filterOption={(input, option) =>
        normalizeSearchText(option?.label as string).includes(normalizeSearchText(input))
      }
      style={{ ...selectStyle, width: '100%', borderRadius: radiusPill, height: 40 }}
    />
  </Form.Item>
  ```

---

## 6. Quy chuẩn 5: Hiển Thị Drawer Xem Chi Tiết & Thông Tin Phê Duyệt

### Nhãn Tình trạng hoạt động Semantic
Trong Drawer xem chi tiết, badge Tình trạng hoạt động **BẮT BUỘC** hiển thị đúng nhãn chuẩn 3 trạng thái:
- `OPERATIONAL` -> `"Đang khai thác/vận hành"`
- `NOT_YET_OPERATIONAL` -> `"Chưa khai thác/vận hành"`
- `STOPPED` / `SUSPENDED` -> `"Dừng khai thác/vận hành"`

*Cách triển khai chuẩn*: Dùng `getVtsConditionStatusLabel(status)` và `getVtsConditionStatusColor(status)` từ `themetokenchk.ts`. Tuyệt đối không dùng hàm trả về `"Đang hoạt động"` hay thẻ `<Tag color="green">` vuông vức.

### Cấu trúc Mục Thông tin phê duyệt
Thông tin phê duyệt phải nằm trong mục Collapsible (mặc định mở) tại Tab "Thông tin chung" và chia 2 cột cân xứng:

```tsx
<div className="chk-detail-grid">
  {/* Hàng 1: Full width - Trạng thái phê duyệt */}
  <div className="chk-detail-row chk-detail-row--full">
    <span className="chk-detail-label sec-col1-label">Trạng thái phê duyệt</span>
    <span className="chk-detail-value">
      <ApprovalStatusBadge status={record.approvalStatus} />
    </span>
  </div>

  {/* Hàng 2: Cán bộ cập nhật & Ngày cập nhật */}
  <div className="chk-detail-row">
    <span className="chk-detail-label sec-col1-label">Cán bộ cập nhật</span>
    <span className="chk-detail-value">
      {formatPersonDisplayName(record.updatedByName, record.updatedBy) || formatPersonDisplayName(record.createdByName, record.createdBy) || '—'}
    </span>
  </div>
  <div className="chk-detail-row">
    <span className="chk-detail-label sec-col2-label">Ngày cập nhật</span>
    <span className="chk-detail-value">
      {record.updatedAt ? dayjs(record.updatedAt).format('DD/MM/YYYY HH:mm:ss') : (record.createdAt ? dayjs(record.createdAt).format('DD/MM/YYYY HH:mm:ss') : '—')}
    </span>
  </div>

  {/* Hàng 3: Cán bộ gửi phê duyệt & Ngày gửi phê duyệt */}
  <div className="chk-detail-row">
    <span className="chk-detail-label sec-col1-label">Cán bộ gửi phê duyệt</span>
    <span className="chk-detail-value">
      {formatPersonDisplayName(record.submittedByName, record.submittedBy) || '—'}
    </span>
  </div>
  <div className="chk-detail-row">
    <span className="chk-detail-label sec-col2-label">Ngày gửi phê duyệt</span>
    <span className="chk-detail-value">
      {record.submittedAt ? dayjs(record.submittedAt).format('DD/MM/YYYY HH:mm:ss') : '—'}
    </span>
  </div>

  {/* Hàng 4: Cán bộ phê duyệt C1 & Ngày phê duyệt C1 */}
  <div className="chk-detail-row">
    <span className="chk-detail-label sec-col1-label">Cán bộ phê duyệt cấp Cảng vụ/Chi cục</span>
    <span className="chk-detail-value">
      {formatPersonDisplayName(record.approverLevel1Name, record.approverLevel1) || '—'}
    </span>
  </div>
  <div className="chk-detail-row">
    <span className="chk-detail-label sec-col2-label">Ngày phê duyệt cấp Cảng vụ/Chi cục</span>
    <span className="chk-detail-value">
      {record.approvedDateLevel1 ? dayjs(record.approvedDateLevel1).format('DD/MM/YYYY HH:mm:ss') : '—'}
    </span>
  </div>

  {/* Hàng 5: Cán bộ phê duyệt C2 & Ngày phê duyệt C2 */}
  <div className="chk-detail-row">
    <span className="chk-detail-label sec-col1-label">Cán bộ phê duyệt cấp Cục</span>
    <span className="chk-detail-value">
      {formatPersonDisplayName(record.approverLevel2Name, record.approverLevel2) || '—'}
    </span>
  </div>
  <div className="chk-detail-row">
    <span className="chk-detail-label sec-col2-label">Ngày phê duyệt cấp Cục</span>
    <span className="chk-detail-value">
      {record.approvedDateLevel2 ? dayjs(record.approvedDateLevel2).format('DD/MM/YYYY HH:mm:ss') : '—'}
    </span>
  </div>

  {/* Hàng 6: Lý do từ chối (chỉ hiện khi có nội dung từ chối) */}
  {record.rejectionReason && (
    <div className="chk-detail-row chk-detail-row--full">
      <span className="chk-detail-label sec-col1-label">Lý do từ chối</span>
      <span className="chk-detail-value" style={{ color: statusCritical, fontWeight: fontWeightMedium }}>
        {record.rejectionReason}
      </span>
    </div>
  )}
</div>
```

---

---

## 7. Quy chuẩn 6: Lịch Sử Thay Đổi & Mapping Dữ Liệu CommonHistoryDrawer

### Bản chất Dữ liệu Lịch sử Backend
- API `/history` của backend trả về danh sách phẳng các dòng thay đổi (`CoastalStation*HistoryResponse` hoặc `HistoryEntry`), trong đó mỗi dòng đại diện cho một trường dữ liệu bị thay đổi: `changedField`, `previousValue`, `newValue`, `changedBy`, `orgUnitName`, `changedAt`.
- Backend **KHÔNG** trả về cấu trúc lồng nhau dạng `changes: [...]`.

### Quy tắc Mapping Frontend (`loadHistoryPage`)
Khi map dữ liệu từ API vào `CommonHistoryEntry[]`, **BẮT BUỘC** tuân thủ:
1. **Người cập nhật (`actor`)**:
   - `CommonHistoryDrawer` tìm người cập nhật theo thứ tự: `r.changedByName || r.actor || r.approvedByName || r.changedBy || r.approvedBy`.
   - Frontend **BẮT BUỘC** gán đồng thời `actor`, `changedBy`, `changedByName`:
     ```ts
     const actor = raw.changedBy || raw.changedByName || raw.actor || raw.userName || 'Hệ thống';
     // gán: actor, changedBy: actor, changedByName: actor
     ```
2. **Đơn vị quản lý (`orgUnitName`, `unitName`)**:
   - Lấy `raw.orgUnitName || raw.unitName`, nếu rỗng thì fallback sang đơn vị của bản ghi đang chọn:
     ```ts
     const unit = (raw.orgUnitName && raw.orgUnitName !== '—')
       ? raw.orgUnitName
       : (raw.unitName && raw.unitName !== '—')
         ? raw.unitName
         : (selectedRecord?.orgUnitId ? resolveOrgUnitName(selectedRecord.orgUnitId, selectedRecord.orgUnitName) : '—');
     ```
3. **Chi tiết thay đổi (`changes`)**:
   - **TUYỆT ĐỐI CẤM** chỉ kiểm tra `Array.isArray(raw.changes)`. Nếu backend trả `raw.changedField`, phải tạo phần tử trong `changes`:
     ```ts
     let changes: HistoryChangeItem[] = [];
     if (Array.isArray(raw.changes) && raw.changes.length > 0) {
       changes = raw.changes.map((c: any) => ({
         field: c.fieldName || c.field || '',
         oldValue: c.oldValue,
         newValue: c.newValue,
       }));
     } else if (field) {
       changes = [{
         field,
         oldValue: prevVal,
         newValue: nextVal,
       }];
     }
     ```
4. **Format & Dịch Nhãn Dữ Liệu (`formatValue` & `fieldLabelMap`)**:
   - Luôn truyền `fieldLabelMap` chứa toàn bộ từ điển trường tiếng Việt của phân hệ.
   - Hàm `formatHistoryValue`:
     - Dịch UUID `orgUnitId` / `operatingOrgId` sang Tên đơn vị tiếng Việt (khử sạch UUID trần).
     - Dịch mã Tỉnh/TP sang Tên Tỉnh/TP tiếng Việt qua `getProvinceNameById`.
     - Dịch mã tình trạng qua `CONDITION_STATUS_MAP` hoặc `getConditionStatusLabel`.
     - Dịch mã dịch vụ viễn thông hàng hải qua `resolveMaritimeServiceLabel`.
     - Định dạng ngày tháng (`licenseExpiry`, `lastInspectionDate`...) sang `DD/MM/YYYY`.

### Quy tắc Backend Service
- Trong `getHistory`: Luôn fallback `unitName` theo `orgUnitCacheService.getName(entity.getOrgUnitId())` nếu bản ghi audit chưa lưu sẵn tên đơn vị.
- Trong `getNewValueDisplay`: Phải bao phủ 100% các trường có trong `oldValues` (bao gồm giấy phép, hạn kiểm định, người kiểm định...), tránh `default -> "—"` gây mất vết cập nhật.

---

## 8. Checklist Tự Kiểm Tra Trước Khi Hoàn Thành Bàn Giao
1. [ ] Đã chạy `npx tsc --noEmit` ở thư mục `frontend` và đạt **0 lỗi TypeScript**.
2. [ ] Đã chạy `mvn test` hoặc `mvn compile -DskipTests` và đạt **BUILD SUCCESS**.
3. [ ] Đã kiểm tra tên thực thể trên Breadcrumb, filter label, placeholder, form title và modal confirm đồng nhất 100%.
4. [ ] Cột Tên / Mã KCHT trên bảng danh sách đã được khóa cứng đúng kích thước chuẩn `width: 260` (`260px`) và cố định bên trái (`fixed: 'left'`).
5. [ ] Bảng danh sách có đủ 4 cặp cột audit (Cán bộ cập nhật, Cán bộ gửi duyệt, Cán bộ duyệt C1, Cán bộ duyệt C2) và tiêu đề không bị cắt chữ.
6. [ ] Hàm `handleFilterSearch` đã có `.trim()` cho tất cả các trường input text.
7. [ ] Bộ lọc theo mã hoạt động chính xác cả ở Frontend service lẫn Backend API (có param `code`).
8. [ ] Form tạo mới có `conditionStatus = ConditionStatus.NOT_YET_OPERATIONAL` và trường `provinceId` có `required: true`.
9. [ ] Drawer xem chi tiết hiển thị đúng nhãn "Đang khai thác/vận hành" và có đủ cán bộ, ngày cập nhật trong Thông tin phê duyệt.
10. [ ] Drawer lịch sử thay đổi hiển thị đầy đủ Người cập nhật, Đơn vị, danh sách chi tiết thay đổi (không bị trống hoặc báo "Không có thông tin chi tiết thay đổi").
11. [ ] Tiêu đề cột trên bảng danh sách không chứa ký tự ngắt dòng \n và hiển thị trên 1 dòng duy nhất (whiteSpace: 'nowrap').
