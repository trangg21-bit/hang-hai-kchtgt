# Chuẩn giao diện màn hình danh sách

Tài liệu này là contract dùng chung cho các màn hình quản lý như Người dùng, Vai trò, Đơn vị, VTS và các module tương tự.

## Nguyên tắc bắt buộc

- Dùng `ScreenHeader`, `FilterTableLayout`, `StatusTabs`, `DataTable` và `Pagination` từ `frontend/src/components/list-view/`.
- Dùng `frontend/src/pages/UsersPage.tsx` làm reference implementation.
- Không tạo layout, table hoặc pagination riêng cho màn hình quản lý.
- Không ghi đè chiều cao bảng bằng giá trị riêng trong từng màn hình. `DataTable` đã có kích thước chuẩn từ `frontend/src/theme.ts`.
- Không hardcode màu, font-size, spacing hoặc border-radius; dùng token từ `theme.ts` và `tokens.ts`.

## Bộ lọc đơn vị dạng cây

Mọi bộ lọc có trường `Đơn vị`, `Đơn vị quản lý`, `Đơn vị chủ quản` hoặc tương đương phải hiển thị theo cây khi dữ liệu có quan hệ cha–con:

- Response đơn vị phải có tối thiểu `id`, `name`, `code`, `parentId`; dùng `parentId` để dựng cây, không dùng `path` ở frontend.
- Dùng `TreeSelect` hoặc `Cascader` có tìm kiếm; không dùng `Select` dạng danh sách phẳng cho dữ liệu phân cấp.
- Nhãn hiển thị theo dạng `MÃ - Tên đơn vị`; đơn vị con phải thụt vào dưới đơn vị cha.
- Giá trị chọn vẫn là `id` và request vẫn truyền `orgUnitId`; không truyền tên, nhãn hoặc `path`.
- Chỉ dựng cây từ danh sách đã được backend giới hạn theo quyền. Nếu đơn vị cha không có trong response thì coi đơn vị đó là node gốc của danh sách hiện tại.
- Dùng preset `selectStyle` từ `frontend/src/tokens.ts`; tìm kiếm của `TreeSelect` dùng `treeNodeFilterProp="title"`.

## Quy chuẩn Ma trận trường dữ liệu CRUD & Bộ lọc (Field CRUD & Filter Matrix Standard)

Nguồn gốc duy nhất của các trường dữ liệu trên Bảng danh sách, Sidebar bộ lọc, Drawer Xem chi tiết, Form Tạo mới và Chỉnh sửa **BẮT BUỘC** phải lấy chính xác từ bảng **Ma trận trường dữ liệu nghiệp vụ (CRUD & Filter Matrix)** trong tài liệu thiết kế chi tiết (TKCT) của BA:

- **Danh sách (`List = TRUE`)**: Cột hiển thị trên bảng dữ liệu `DataTable`.
- **Bộ lọc (`Filter = TRUE`)**: Trường lọc hiển thị trên Sidebar của `FilterTableLayout` (hoặc `StatusTabs` cho trạng thái phê duyệt `approvalStatus`, ô tìm kiếm cho `code`/`name`).
- **Xem chi tiết (`Detail = TRUE`)**: Trường hiển thị trong Drawer chi tiết (`drawerMode === 'view'`).
- **Tạo mới (`Create = TRUE`)**: Trường nhập liệu trong Form Tạo mới (`drawerMode === 'create'`).
- **Sửa (`Edit = TRUE`)**: Trường nhập liệu trong Form Chỉnh sửa (`drawerMode === 'edit'`).

### Quy chuẩn hiển thị các trường trên Sidebar bộ lọc (`Filter = TRUE`):
1. `Đơn vị quản lý`: `OrgUnitTreeSelect` dạng cây theo DataScope phân quyền.
2. `Trạng thái phê duyệt`: Dãy `StatusTabs` 6 tab màu semantic trên đầu bảng danh sách.
3. `Mã` + `Tên`: Ô `Input` "Tìm kiếm từ khóa".
4. `Địa điểm (Tỉnh/TP)`: Dropdown chọn Tỉnh/Thành phố có hỗ trợ tìm kiếm tiếng Việt không dấu.
5. `Ngày cập nhật`: Ô `RangePicker` "Khoảng ngày cập nhật" (`DD/MM/YYYY`).
6. `Tình trạng hoạt động`: Dropdown chọn trạng thái vận hành (`ConditionStatus`).
7. `Các trường đặc thù` (Năm hoạt động, Đơn vị khai thác, Phân loại...): Hiển thị trực tiếp trên Sidebar theo đúng ma trận nghiệp vụ của đối tượng.
8. **Cấu hình Sidebar `FilterTableLayout`**: Bắt buộc đặt `hideFilterToggle={true}` để ẩn nút phễu; toàn bộ các trường lọc được hiển thị trực tiếp trên thanh cuộn dọc 280px (`overflowY: 'auto'`), dưới đáy chỉ giữ 2 nút: **Reload** + **Tìm kiếm**.

**Reference implementation chuẩn mẫu**: `frontend/src/services/port/PortListPage.tsx` (Màn hình Quản lý Cảng biển `/port`).
- Các bảng con trong form/detail có thể khai báo `scroll` riêng vì đó không phải bảng danh sách chính.

### Quy chuẩn cấu trúc và thứ tự cột trên Bảng danh sách (Unified Column Standards):

0. **Tiêu đề Bảng Danh sách vs Nội dung ô bản ghi (Column Headers vs Cell Content)**:
   - **Tiêu đề cột (`<th>`)**:
     - **BẮT BUỘC hiển thị đầy đủ 100% chữ**, thiết lập `label: '...'` và cấp đủ bề rộng (`width`) cho từng cột. **TUYỆT ĐỐI CẤM** để tiêu đề cột bị cắt chữ hoặc hiển thị dấu ba chấm `...` (như `THA...`, `ĐỊA ĐI...`, `TÊN TRUNG TÂM...`).
     - Chiều cao Header cố định `40px` - `42px` chuẩn xác theo màn Cảng biển (`/port`).
     - Padding ô tiêu đề: `padding: 10px 12px !important;`.
     - Màu chữ tiêu đề: Xanh Navy thương hiệu (`#12468C` / `colors.sidebarBg`), in hoa (`text-transform: uppercase`), cỡ chữ `13px` (`fontSizeMd`), độ đậm `600` (`fontWeightBold`).
     - Màu nền tiêu đề: `tableHeaderBg` (`#F5F8FA` / `colors.bodyBg`).
   - **Nội dung ô bản ghi (`<td>`)**:
     - Nếu nội dung văn bản trong bản ghi quá dài (như tên KCHT, địa chỉ chi tiết, đơn vị quản lý, ghi chú...), **BẮT BUỘC hiển thị dấu ba chấm `...`** (`overflow: hidden; text-overflow: ellipsis; white-space: nowrap;` kèm `title` hoặc Tooltip khi hover để xem đầy đủ), **TUYỆT ĐỐI CẤM** để chữ dài tràn/chờm đè sang cột bên cạnh.

1. **Cột STT (Số thứ tự)**:
   - Cố định bên trái (`fixed: 'left'`), chiều rộng `60px`, căn giữa (`align: 'center'`).
   - Công thức tính: `(page - 1) * pageSize + index + 1`.

2. **Cột Tên / Mã KCHT (Fixed Left)**:
   - Cố định bên trái (`fixed: 'left'`) ngay sau cột STT, chiều rộng từ `220px` - `260px`, căn trái (`align: 'left'`).
   - Cấu trúc 2 dòng:
     - **Dòng 1 (Tên KCHT)**: Cỡ chữ `13px` (`fontSizeMd`), `fontWeightBold`, màu `textPrimary` hoặc `colors.sidebarBg` (click để mở xem chi tiết).
     - **Dòng 2 (Mã KCHT)**: Cỡ chữ `13px` (`fontSizeMd`), `fontWeightMedium`, màu `textSecondary`. **BẮT BUỘC dùng `fontSizeMd` (13px)**, tuyệt đối không dùng `fontSizeSm` (10px) để đảm bảo chữ to rõ, dễ nhìn và đồng bộ toàn hệ thống.

3. **Cột Cán bộ cập nhật (Gộp Tên cán bộ + Ngày giờ cập nhật)**:
   - Chiều rộng `190px` - `220px`, `ellipsis: false`, căn trái (`align: 'left'`).
   - Cấu trúc 2 dòng:
     - **Dòng 1 (Họ và tên cán bộ)**: Cỡ chữ `13px` (`fontSizeMd`), `fontWeightBold`, màu đậm `#0F172A`.
     - **Dòng 2 (Ngày giờ cập nhật)**: Cỡ chữ `13px` (`fontSizeMd`), màu `textSecondary`, định dạng `DD/MM/YYYY HH:mm:ss` bằng `dayjs`.
   - **Quy tắc Họ và tên (Full Name)**: Cả Backend và Frontend **BẮT BUỘC** hiển thị **Họ và tên** (`fullName`), tuyệt đối không hiển thị email (như `admin@hh.gov.vn`) hay mã UUID làm tên cán bộ.

4. **Cột Tình trạng & Trạng thái phê duyệt (Badge Columns)**:
   - Hai cột độc lập, căn giữa (`align: 'center'`), `ellipsis: false`:
     - **Cột Tình trạng hoạt động (`conditionStatus`)**: Chiều rộng `160px`.
     - **Cột Trạng thái phê duyệt (`approvalStatus`)**: Chiều rộng `180px`.
   - Mọi ô trên bảng danh sách (`.ant-table-cell`) bắt buộc có `overflow: hidden !important;` và `white-space: nowrap !important;` để nội dung dài (như tên đơn vị, hệ thống) tự động cắt ngắn và **tuyệt đối không bao giờ bị tràn/chờm đè sang cột bên cạnh**.
   - Cột văn bản thông thường tự động áp dụng `textOverflow: 'ellipsis'` (hiển thị `...` khi bị cắt).
   - Cột chứa Badge (`ellipsis: false`) áp dụng `textOverflow: 'clip'` kết hợp chiều rộng đủ lớn (`160px` - `180px`) để Badge luôn hiển thị trọn vẹn và không bao giờ xuất hiện dấu ba chấm `...` thừa phía sau.

5. **Cột Thao tác (Action Column)**:
   - Cố định bên phải (`fixed: 'right'`), chiều rộng `60px`, căn giữa (`align: 'center'`).
   - **BẮT BUỘC** truyền qua prop `rowActions={rowActions}` của `<DataTable rowActions={rowActions} />`. CẤM tự thêm cột Thao tác thủ công vào mảng `columns`.

### Quy chuẩn Status Tabs & Bảng màu Semantic Tokens (Status Tabs & Semantic Badge Colors):

1. **Bảng màu Semantic Tokens chuẩn cho Trạng thái Phê duyệt (`ApprovalStatus`)**:
   - **Tất cả (`ALL`)**: `actionPrimary` (`#0E6FD6` - Xanh thương hiệu).
   - **Lưu tạm (`DRAFT`)**: `statusDraft` / `textTertiary` (`#93A3B3` - Xám trung tính). Mặc định khi tạo mới.
   - **Chờ Cảng vụ duyệt (`PENDING_APPROVAL`)**: `statusAttention` (`#EDA100` - Vàng cam Amber).
   - **Chờ Cục duyệt (`APPROVED_LEVEL1`)**: `#0284C7` (Xanh da trời Sky Cyan).
   - **Đã duyệt (`APPROVED`)**: `statusOperational` (`#1BAF7A` - Xanh lá Emerald).
   - **Từ chối (`REJECTED_LEVEL1`, `REJECTED_LEVEL2`)**: `statusCritical` (`#E34948` - Đỏ tươi Rose).

2. **Bảng màu Semantic Tokens chuẩn cho Tình trạng Hoạt động (`ConditionStatus`)**:
   - **Đang hoạt động (`OPERATIONAL`)**: `statusOperational` (`#1BAF7A` - Xanh lá Emerald).
   - **Đang bảo trì (`MAINTENANCE`)**: `statusAttention` (`#EDA100` - Vàng cam Amber).
   - **Dừng hoạt động (`STOPPED`)**: `statusCritical` (`#E34948` - Đỏ tươi Rose).
   - **Đang xây dựng (`UNDER_CONSTRUCTION`)**: `actionPrimary` (`#0E6FD6` - Xanh dương).

3. **Quy tắc khớp tổng số lượng trên Status Tabs (Status Count Consistency)**:
   - Số lượng trên tab "Tất cả" **BẮT BUỘC** bằng tổng số lượng của các tab trạng thái con:
     $$\text{Tất cả} = \text{Lưu tạm} + \text{Chờ Cảng vụ duyệt} + \text{Chờ Cục duyệt} + \text{Đã duyệt} + \text{Từ chối}$$
   - Tab "Từ chối" trên Frontend tự động gom tổng: `REJECTED_LEVEL1` + `REJECTED_LEVEL2`.
   - Backend `countByApprovalStatus` trả về số lượng chính xác theo từng trạng thái chuẩn.

4. **Dọn sạch trạng thái legacy trong DB và Code**:
   - Trong quá trình phát triển, tuyệt đối không giữ các mã fallback legacy (`PROPOSED (1)`, `APPROVED_LEVEL2 (4)`, `REJECTED (6)`).
   - Dữ liệu trong CSDL được chuẩn hóa hoàn toàn qua Flyway script: `1 -> 2 (PENDING_APPROVAL)`, `4 -> 5 (APPROVED)`, `6 -> 8 (REJECTED_LEVEL1)`.

5. **Quy chuẩn Style hiển thị Badge trong ô bảng (Badge Style)**:
   - `borderRadius: radiusPill` (`999px`) dạng viên thuốc tròn 2 đầu.
   - `fontSize: fontSizeMd` (`13px`), `fontWeight: fontWeightMedium` (`500`).
   - `padding: '2px 10px'`, `whiteSpace: 'nowrap'`, `display: 'inline-flex'`.
   - Màu nền `background: ${color}15` (15% opacity), viền `border: 1px solid ${color}40` (40% opacity), màu chữ `${color}`.

### Quy chuẩn căn lề cột và hiển thị Badge (Alignment Standards):
- **Cột STT / Thao tác**: Căn giữa (`align: 'center'`).
- **Cột Văn bản / Tên / Mã / Địa điểm / Đơn vị / Cán bộ cập nhật / Tình trạng / Trạng thái**: Mặc định **căn trái (`align: 'left'`)** để Badge và tiêu đề thẳng hàng đồng bộ với các cột nội dung.
- **Cột Số liệu / Chiều dài / Diện tích / Tải trọng / Công suất**: Căn phải (`align: 'right'`), có định dạng phân cách hàng nghìn (`#,###.##`).

## Kết cấu chuẩn

```text
ScreenHeader
└── FilterTableLayout
    ├── Filter panel
    └── Main content
        ├── StatusTabs
        └── DataTable
            └── Pagination
```

## Kích thước chuẩn

Các giá trị nằm trong `frontend/src/theme.ts`:

- Chiều rộng tối thiểu bảng danh sách: `layout.listTableMinWidth`.
- Chiều cao vùng cuộn bảng: `layout.listTableScrollY`.
- `DataTable` tự dùng các giá trị này khi màn hình không truyền `scroll` riêng.
- CSS dùng biến `--list-table-scroll-y`; không lặp lại biểu thức `calc(100vh - ...)` trong page.

## Bảng rỗng và thanh cuộn ngang

- Bảng phải giữ nguyên chiều cao vùng dữ liệu khi `dataSource` rỗng; không để EmptyState làm co thân bảng.
- Thanh cuộn ngang phải nằm ở đáy thân bảng, cùng vị trí với trạng thái có dữ liệu.
- `DataTable` dùng cơ chế dùng chung để reset `scrollLeft` về `0` sau khi đổi bộ lọc hoặc tải lại danh sách; không tự điều khiển vị trí cuộn trong từng page.
- Cột thao tác là cột cuối cùng và chỉ cột này được cố định bên phải; không đặt thêm cột dữ liệu sau cột thao tác.
- Nếu tổng chiều rộng cột thực tế nhỏ hơn chiều rộng tối thiểu chung, page có thể truyền `scroll={{ x: 'max-content' }}` để tránh vùng trống và tránh làm lệch cột đầu tiên.
- Khi kiểm tra trạng thái empty, phải xác nhận đồng thời: cột đầu tiên hiển thị từ mép trái, cột thao tác ở cuối, EmptyState nằm trong thân bảng và thanh cuộn ở đáy.

## Checklist trước khi hoàn tất

- [ ] Đã đọc `AGENTS.md`, `frontend/src/theme.ts` và tài liệu này.
- [ ] Màn hình dùng đúng component dùng chung.
- [ ] Status tabs, bảng và phân trang nằm trong cùng `FilterTableLayout`.
- [ ] Bảng dùng kích thước mặc định của `DataTable`.
- [ ] Có đủ trạng thái loading, error, empty và data.
- [ ] Cột có `width`, `ellipsis` và sort dùng đúng cơ chế của `DataTable`.
- [ ] Trạng thái empty giữ nguyên chiều cao bảng và thanh cuộn ngang nằm ở đáy.
- [ ] Sau khi lọc/reset, bảng bắt đầu từ scroll ngang `0`; cột đầu tiên không bị cuộn khuất.
- [ ] Cột thao tác là cột cuối cùng, không có nội dung/cột nào lộ ra phía sau.
- [ ] Không có CSS override riêng cho `.list-view-table` hoặc `.ant-table-body` trong page.
- [ ] Đã chạy `npm run build`.

## Prompt chuẩn cho AI

```text
Trước khi sửa màn hình danh sách, đọc AGENTS.md,
frontend/src/theme.ts và docs/conventions/list-screen-ui-standard.md.

Dùng UsersPage.tsx làm giao diện tham chiếu. Bắt buộc dùng
ScreenHeader, FilterTableLayout, StatusTabs, DataTable và Pagination.
Không tự tạo layout/table/pagination, không hardcode kích thước bảng,
không thêm CSS override riêng. Sau khi sửa phải chạy frontend build.
```
