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

## Checklist trước khi hoàn tất

- [ ] Đã đọc `AGENTS.md`, `frontend/src/theme.ts` và tài liệu này.
- [ ] Màn hình dùng đúng component dùng chung.
- [ ] Status tabs, bảng và phân trang nằm trong cùng `FilterTableLayout`.
- [ ] Bảng dùng kích thước mặc định của `DataTable`.
- [ ] Có đủ trạng thái loading, error, empty và data.
- [ ] Cột có `width`, `ellipsis` và sort dùng đúng cơ chế của `DataTable`.
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
