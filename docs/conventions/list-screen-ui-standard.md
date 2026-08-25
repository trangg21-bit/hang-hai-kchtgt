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

Reference implementation: `frontend/src/pages/vtssystem/VtsSystemList.tsx` — biến `orgUnitTreeOptions` và bộ lọc `TreeSelect`.
- Các bảng con trong form/detail có thể khai báo `scroll` riêng vì đó không phải bảng danh sách chính.

### Thứ tự cột chuẩn màn hình Hệ thống VTS (VtsSystemList):
1. `STT` (Cố định trái, 60px)
2. `Đơn vị quản lý` (220px)
3. `Trạng thái phê duyệt` (220px)
4. `Ngày cập nhật` (180px)
5. `Cán bộ cập nhật` (220px)
6. `Đơn vị chủ quản` (220px)
7. `Đơn vị vận hành` (220px)
8. `Thuộc cảng biển` (200px)
9. `Mã hệ thống VTS` (180px)
10. `Tên hệ thống VTS` (260px)
11. `Địa điểm` (240px)
### Quy chuẩn căn lề cột và hiển thị Badge (Alignment Standards):
- **Cột STT**: `align: 'center'` (Cố định trái, 60px).
- **Cột Văn bản / Tên / Mã / Địa điểm / Đơn vị**: Mặc định căn trái (`align: 'left'`).
- **Cột Trạng thái / Tình trạng (Badge/Tag)**: Đặt `align: 'center'`. Hệ thống tự động áp dụng quy tắc toàn cục từ `theme.ts` (`minWidth: 125px`, `margin: 0`, căn giữa tuyệt đối cả tiêu đề và nội dung) để loại bỏ hiện tượng thụt thò, lệch tâm.
- **Cột Thao tác (Action)**: `align: 'center'` (Cố định phải, 60px).

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
