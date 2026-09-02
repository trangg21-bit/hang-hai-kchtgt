# Quy chuẩn Bố cục Tỷ lệ Cột cho Bảng con trong Drawer (Drawer Child Table Column Layout Standard)

> **MANDATORY**: Mọi bảng con nằm trong các Tab của Drawer (Xem chi tiết, Thêm mới, Chỉnh sửa) như: Vùng VTS, Tọa độ GIS, Phân loại/Trang thiết bị, Cổng/Bến/Kho... **BẮT BUỘC** tuân thủ quy chuẩn phân bổ tỷ trọng chiều rộng cột dưới đây để đảm bảo giao diện cân đối, không bị lệch hoặc dồn khoảng trắng sang một bên.

---

## 1. Nguyên tắc cốt lõi (Core Principles)

1. **Chiều rộng Drawer chuẩn**: Drawer nhập liệu và xem chi tiết có `size="50%"` (trên màn hình Full HD 1920px $\rightarrow$ chiều rộng Drawer khoảng `920px - 960px`).
2. **Cột Nội dung chính (Tên, Nội dung, Mô tả, Thông số)**: **BẮT BUỘC chiếm tỷ trọng lớn nhất (45% - 55% độ rộng bảng, tối thiểu 380px - 450px)**. Tuyệt đối không để cột Tên bị ép nhỏ ngang bằng với các cột mã ngắn hay cột trạng thái.
3. **Cột STT**: Luôn đặt `width: 60px`, `align: 'center'`.
4. **Cột Mã (code / mã định danh)**: `width: 180px - 200px` (khoảng `20%`), căn trái.
5. **Cột Trạng thái / Tình trạng (Pill Badge / Select)**: `width: 160px - 180px` (khoảng `20%`), căn trái hoặc căn giữa vừa khít Pill Badge.
6. **Cột Thao tác (Delete/Actions)**: `width: 60px - 80px`, `align: 'center'`.

---

## 2. Ma trận Tỷ lệ Bố cục theo Số lượng Cột (Column Layout Matrix)

### A. Bố cục 3 Cột Dữ liệu (STT + Mã + Tên + Tình trạng/Trạng thái + Action)

Áp dụng cho: Bảng Vùng VTS, Danh sách thiết bị, Danh mục phụ thuộc...

| # | Cột | Chiều rộng chuẩn (Width) | Tỷ trọng (% Bảng ~900px) | Căn lề (Align) | Ghi chú |
|---|---|---|---|---|---|
| 1 | **STT** | `60px` | ~7% | `center` | Đánh số tự động theo phân trang |
| 2 | **Mã** (Mã vùng, Mã trạm...) | `180px - 200px` | ~22% | `left` | Input viên thuốc hoặc text mã |
| 3 | **Tên** (Tên vùng, Tên đối tượng...) | **`420px - 460px`** | **~50%** | `left` | Chiếm phần lớn nhất, có tooltip |
| 4 | **Tình trạng / Trạng thái** | `160px - 180px` | ~20% | `left` | Pill Badge hoặc Dropdown chọn |
| 5 | **Thao tác** (Chế độ sửa/tạo) | `60px` | ~7% | `center` | Nút icon xóa dòng |

```tsx
// Ví dụ khai báo chuẩn trong React / TypeScript:
columns={[
  { title: 'STT', width: 60, align: 'center' },
  { title: 'Mã vùng', dataIndex: 'code', key: 'code', width: 200 },
  {
    title: 'Tên vùng VTS',
    dataIndex: 'name',
    key: 'name',
    width: 440,
    render: (v) => <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</span>,
  },
  {
    title: 'Tình trạng',
    key: 'conditionStatus',
    width: 180,
    render: (_v, r: any) => renderConditionStatusBadge(r.conditionStatus),
  },
  ...(isEdit ? [{ title: '', width: 60, align: 'center', render: ... }] : []),
]}
```

---

### B. Bố cục 2 Cột Dữ liệu (STT + Tên/Chỉ tiêu + Giá trị/Mô tả)

Áp dụng cho: Bảng thuộc tính kỹ thuật, Tham số mở rộng...

| # | Cột | Chiều rộng chuẩn (Width) | Tỷ trọng (%) | Căn lề | Ghi chú |
|---|---|---|---|---|---|
| 1 | **STT** | `60px` | ~7% | `center` | |
| 2 | **Tên thuộc tính / Chỉ tiêu** | `280px - 320px` | ~35% | `left` | Đậm, màu `textPrimary` |
| 3 | **Giá trị / Mô tả chi tiết** | `500px - 540px` | ~58% | `left` | Co giãn linh hoạt |

---

### C. Bố cục 4 Cột Dữ liệu (STT + Mã + Tên + Phân loại/Đơn vị + Tình trạng)

| # | Cột | Chiều rộng chuẩn (Width) | Tỷ trọng (%) | Căn lề | Ghi chú |
|---|---|---|---|---|---|
| 1 | **STT** | `60px` | ~7% | `center` | |
| 2 | **Mã đối tượng** | `160px` | ~18% | `left` | |
| 3 | **Tên đối tượng** | `360px - 400px` | ~42% | `left` | Cột chính |
| 4 | **Phân loại / Đơn vị** | `180px` | ~20% | `left` | |
| 5 | **Tình trạng** | `160px` | ~18% | `left` | |

---

### D. Bố cục Tọa độ GIS (STT + Kinh độ DMS + Vĩ độ DMS + Độ thập phân)

| # | Cột | Chiều rộng chuẩn (Width) | Tỷ trọng (%) | Căn lề | Ghi chú |
|---|---|---|---|---|---|
| 1 | **STT** | `60px` | ~7% | `center` | |
| 2 | **Kinh độ (DMS)** | `240px` | ~28% | `left` | 3 ô Độ, Phút, Giây |
| 3 | **Vĩ độ (DMS)** | `240px` | ~28% | `left` | 3 ô Độ, Phút, Giây |
| 4 | **Độ thập phân** | `180px` | ~21% | `left` | Format `106.123456, 20.123456` |
| 5 | **Thao tác** | `60px` | ~7% | `center` | Nút xóa điểm |

---

## 3. Tự động hóa qua `DetailTable`

Khi sử dụng `<DetailTable columns={...} />`, hệ thống tự động suy luận trọng số thông minh (`getSmartColumnWidth`):
- `STT`: `60px`
- `Mã / Code`: `200px`
- `Tên / Name / Mô tả / Thông số`: **`440px`**
- `Trạng thái / Tình trạng`: `180px`
- `Ngày / Giờ`: `160px`
- `Đơn vị / Cơ quan`: `220px`

Khi `DetailTable` render với `tableLayout: 'fixed'`, các cột sẽ tự động phân chia tỷ lệ vàng đẹp mắt, hài hòa với mọi độ rộng màn hình.
