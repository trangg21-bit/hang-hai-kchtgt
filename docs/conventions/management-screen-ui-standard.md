# Chuẩn giao diện màn hình quản lý

Tài liệu này là quy ước dùng chung cho các màn hình quản lý có danh sách, bộ lọc và form Drawer.

## 1. Cấu trúc màn hình

Mỗi màn hình dùng các component trong `frontend/src/components/list-view/`:

- `ScreenHeader`
- `FilterTableLayout`
- `StatusTabs`
- `DataTable`
- `Pagination`

`StatusTabs` chỉ quản lý hiển thị và phát ra `key`. Màn hình phải đồng bộ `key` vào state filter và truyền đúng tham số status cho API. Backend bắt buộc phải nhận, parse và áp dụng status vào query; không được chỉ đổi tab ở frontend.

## 2. Drawer quản lý

Dùng `ManagementDrawer`:

```tsx
<ManagementDrawer
  title="Thêm bản ghi mới"
  open={open}
  onClose={onClose}
  maskClosable={false}
  footer={
    <>
      <Button style={outlineButtonStyle}>Hủy</Button>
      <Button type="primary" style={primaryButtonStyle}>Tạo mới</Button>
    </>
  }
>
  {/* form */}
</ManagementDrawer>
```

Drawer đã chuẩn hóa header, nút đóng, body scroll và footer cố định. Drawer chi tiết không truyền `footer`.

## 3. Bố cục form

Dùng `ManagementFormGrid` và `ManagementFormField`:

```tsx
<ManagementFormGrid>
  <ManagementFormField><Form.Item>{/* trường 1 */}</Form.Item></ManagementFormField>
  <ManagementFormField><Form.Item>{/* trường 2 */}</Form.Item></ManagementFormField>
</ManagementFormGrid>
```

Form tự chuyển từ hai cột sang một cột trên màn hình hẹp. Các trường dài như mô tả dùng `span={24}`.

## 4. Đơn vị quản lý

Dùng `OrgUnitTreeSelect` và dữ liệu từ endpoint scoped options. Không gọi danh sách đơn vị toàn hệ thống để dựng dropdown. Giá trị gửi API là `orgUnitId`; chỉ hiển thị đơn vị người dùng quản lý và các đơn vị con.

## 5. Checklist trước khi hoàn tất màn hình

- Kiểm tra `all`, `active`, `inactive` đều lọc đúng dữ liệu ở backend.
- Kiểm tra `loading`, `error`, `empty`, `data`.
- Kiểm tra sau reset bảng về trang 1 và scroll ngang về vị trí đầu.
- Kiểm tra tên/mã được `.trim()` trước khi gửi API.
- Kiểm tra API trả lỗi trùng tên/mã đúng field.
- Kiểm tra mutation ghi lịch sử và truyền operator/audit đầy đủ.
- Chạy `npm.cmd run build` và `git diff --check` trước khi bàn giao.
