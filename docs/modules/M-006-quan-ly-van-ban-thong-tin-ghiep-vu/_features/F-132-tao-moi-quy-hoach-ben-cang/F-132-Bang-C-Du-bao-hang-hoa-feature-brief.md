---
id: F-132-Bang-C-Du-bao-hang-hoa
name: Dự báo hàng hóa thông qua cảng (Bảng C)
slug: du-bao-hang-hoa-thong-qua-cang
module-id: M-006
status: proposed
classification: local
priority: medium
created: 2026-08-13T00:00:00Z
last-updated: 2026-08-13T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Dự báo hàng hóa thông qua cảng (Bảng C)

**Tài liệu:** BA Feature Brief
**Feature:** F-132-Bang-C-Du-bao-hang-hoa
**Module:** M-006 — Quản lý văn bản & Thông tin nghiệp vụ
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-13

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Bảng C — **Dự báo hàng hóa thông qua cảng** (`zlstDuBaoHhQuaCang`) là danh sách con nằm trong form Tạo mới quy hoạch bến cảng (F-132). Mỗi dòng dự báo khối lượng hàng hóa của một cảng/bến/cầu cụ thể, gồm 3 loại hàng (container, tổng hợp-rời, lỏng-khí) với giá trị min/max + tổng cộng. Bảng hỗ trợ 5 thao tác:

1. **Thêm mới:** nhập thủ công từng dòng qua form
2. **Tải file mẫu:** tải file mẫu (Excel/CSV) để nhập liệu
3. **Thêm mới từ file:** import file tạo mới hàng loạt
4. **Cập nhật từ file:** import file cập nhật dòng đã tồn tại
5. **Xóa:** xóa từng dòng đã tạo

> ⚠ **Quan trọng:** Mọi thao tác trên bảng C chỉ thao tác trên **dữ liệu trong bảng (in-memory, chưa lưu DB)**. Dữ liệu chỉ được lưu vào DB khi người dùng nhấn nút **"Lưu"** ở form Tạo mới quy hoạch bến cảng (F-132) — lúc đó toàn bộ `zlstDuBaoHhQuaCang` được gửi cùng `POST /api/v1/port-planning`.

### 1.2. Tại sao cần tính năng này?

Dự báo hàng hóa thông qua cảng là chỉ tiêu quan trọng trong quy hoạch bến cảng, phản ánh năng lực thông qua của từng cảng/bến/cầu. Việc hỗ trợ nhập liệu thủ công + import file giúp nhập nhanh dữ liệu dự báo với nhiều loại hàng và nhiều cảng/bến/cầu.

### 1.3. Luồng hoạt động chính

1. Người dùng mở form Tạo mới quy hoạch bến cảng (F-132).
2. Tại bảng C — Dự báo hàng hóa, người dùng chọn thao tác:
   - **Thêm mới** → form nhập → Lưu → hiển thị trong bảng
   - **Tải file mẫu** → tải file mẫu → **Thêm mới từ file** hoặc **Cập nhật từ file**
   - **Xóa** → popup xác nhận → xóa khỏi bảng
3. Khi hoàn tất, nhấn "Lưu" ở form quy hoạch chính để lưu toàn bộ vào DB.

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Logic phân quyền chung

Các thao tác trong bảng C được bảo vệ bởi quyền `portplanning:create` (thừa hưởng từ form Tạo mới quy hoạch F-132).

### 2.2. Logic phân quyền đặc biệt

Không có phân quyền riêng cho bảng C.

---

## 3. User Stories

### Mức Must (bắt buộc có)

- **US-C-01:** Là Planner, tôi muốn thêm mới dòng dự báo hàng hóa thủ công để nhập dự báo cho từng cảng/bến/cầu.
- **US-C-02:** Là Planner, tôi muốn tải file mẫu để biết cấu trúc file cần điền khi nhập hàng loạt.
- **US-C-03:** Là Planner, tôi muốn thêm mới từ file để tạo hàng loạt dòng dự báo nhanh chóng.
- **US-C-04:** Là Planner, tôi muốn cập nhật từ file để sửa hàng loạt dòng đã tồn tại.
- **US-C-05:** Là Planner, tôi muốn xóa dòng đã tạo mới để dọn dẹp dữ liệu nhập sai.

### Mức Should (nên có)

- **US-C-06:** Là Planner, tôi muốn hệ thống hiển thị thông báo rõ ràng khi import thành công/thất bại.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### 4.1. Thêm mới (thủ công)

**AC-C-01 — Hiển thị form thêm mới:** Người dùng nhấn "Thêm mới", hệ thống hiển thị form với các trường: Phân loại (CB/BC/CC), Cảng/bến/cầu cụ thể, Hàng container (min/max), Hàng tổng hợp-rời (min/max), Hàng lỏng-khí (min/max), Tổng cộng (min/max), Ghi chú.

**AC-C-02 — Validation bắt buộc:** Trường "Phân loại (CB/BC/CC)" và "Cảng, bến, cầu cụ thể" là bắt buộc. Bỏ trống → lỗi "Trường này là bắt buộc", chặn submit.

**AC-C-03 — Trùng dòng:** Cặp "Phân loại + Cảng, bến, cầu cụ thể" phải duy nhất trong bảng C. Trùng → lỗi "Cảng, bến, cầu cụ thể đã tồn tại", chặn submit.

**AC-C-04 — Lưu dòng:** Nhấn "Lưu", dòng được thêm vào cuối bảng C (chỉ hiển thị, **không lưu DB**). Thông báo "Đã thêm dự báo hàng hóa".

**AC-C-05 — Hủy:** Nhấn "Hủy" đóng form, không thêm dòng.

### 4.2. Tải file mẫu

**AC-C-06 — Tải file mẫu:** Nhấn "Tải file mẫu", hệ thống tải về file Excel/CSV với header đúng các cột của bảng C (xem mục 9.2).

### 4.3. Thêm mới từ file

**AC-C-07 — Chọn file:** Nhấn "Thêm mới từ file", mở hộp thoại chọn file. Chỉ chấp nhận `.xlsx`, `.xls`, `.csv`.

**AC-C-08 — Đọc và validate:** Hệ thống đọc dữ liệu, validate từng dòng (header đúng, Phân loại và Cảng/bến/cầu không rỗng, không trùng, giá trị min/max là số hợp lệ).

**AC-C-09 — Tạo mới hàng loạt:** Validate hợp lệ → tạo mới các dòng trong bảng C. Thông báo "Đã thêm N dòng từ file".

**AC-C-10 — Không sửa dòng đang có:** File "thêm mới từ file" không ghi đè dòng đang có. Dòng trùng "Cảng, bến, cầu cụ thể" bị bỏ qua kèm cảnh báo.

### 4.4. Cập nhật từ file

**AC-C-11 — Xác định dòng qua Cảng, bến, cầu cụ thể:** Khi "cập nhật từ file", hệ thống dùng "Cảng, bến, cầu cụ thể" để xác định dòng cần cập nhật.

**AC-C-12 — Cập nhật dòng tồn tại:** Nếu "Cảng, bến, cầu cụ thể" đã tồn tại trong bảng, hệ thống cập nhật các trường còn lại.

**AC-C-13 — Không tạo dòng mới:** Nếu "Cảng, bến, cầu cụ thể" không tồn tại, hệ thống **không tạo dòng mới** — bỏ qua kèm cảnh báo "Không tìm thấy dòng có Cảng, bến, cầu cụ thể [X]".

### 4.5. Xóa

**AC-C-14 — Popup xác nhận:** Nhấn "Xóa" trên dòng, hiển thị popup "Bạn có chắc chắn muốn xóa dòng [Cảng, bến, cầu cụ thể]? Thao tác này không thể hoàn tác."

**AC-C-15 — Xóa dòng:** Nhấn "Xóa" trong popup, dòng được xóa khỏi bảng C (chưa lưu DB). Nhấn "Hủy" đóng popup.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

**BR-C-01 — Dữ liệu in-memory:** Mọi thao tác trên bảng C chỉ thay đổi dữ liệu trong bảng, **không ghi DB**. Chỉ lưu khi nhấn "Lưu" ở form Tạo mới quy hoạch bến cảng (F-132).

**BR-C-02 — Cảng, bến, cầu cụ thể là khóa định danh:** Trường "Cảng, bến, cầu cụ thể" (kết hợp "Phân loại") đóng vai trò khóa định danh trong bảng C — dùng để xác định dòng khi cập nhật từ file.

**BR-C-03 — Thêm mới từ file không ghi đè:** File "thêm mới từ file" chỉ tạo mới, không ghi đè dòng đang có.

**BR-C-04 — Cập nhật từ file không tạo mới:** File "cập nhật từ file" chỉ cập nhật dòng đã tồn tại, không tạo dòng mới.

**BR-C-05 — Định dạng file:** Chỉ chấp nhận `.xlsx`, `.xls`, `.csv`. Header file mẫu phải khớp đúng các cột của bảng C.

---

## 6. Vòng đời và liên kết với các tính năng khác

### 6.1. Quan hệ với F-132

Bảng C là **danh sách con** của form Tạo mới quy hoạch bến cảng (F-132). Dữ liệu được gom vào `zlstDuBaoHhQuaCang` khi lưu quy hoạch chính.

### 6.2. Các bảng con khác

Bảng C cùng cấp với:
- Bảng B — Kế hoạch quy hoạch (`zlstKeHoach`)
- Bảng D — Danh mục quy hoạch chi tiết (`zlstDanhMucChiTiet`)
- Bảng E — File đính kèm (`zlstFileDk`)

---

## 7. Mô hình dữ liệu

### 7.1. Bảng `zlstDuBaoHhQuaCang` — Dự báo hàng hóa thông qua cảng

Mỗi dòng = một loại cảng/bến/cầu + dự báo 3 loại hàng (min/max) + tổng cộng:

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `phanLoaiCangBenCangCauCang` | ENUM (CB/BC/CC) | Có | Phân loại: Cảng biển / Bến cảng / Cầu cảng |
| `cangBenCangCauCang` | TEXT | Có | Cảng, bến, cầu cụ thể — **khóa định danh** |
| `hangContainerTrongLuongToiThieu` | DECIMAL(20,4) | Không | Hàng container — trọng lượng tối thiểu |
| `hangContainerTrongLuongToiDa` | DECIMAL(20,4) | Không | Hàng container — trọng lượng tối đa |
| `hangTongHopRoiTrongLuongToiThieu` | DECIMAL(20,4) | Không | Hàng tổng hợp, rời — tối thiểu |
| `hangTongHopRoiTrongLuongToiDa` | DECIMAL(20,4) | Không | Hàng tổng hợp, rời — tối đa |
| `hangLongKhiTrongLuongToiThieu` | DECIMAL(20,4) | Không | Hàng lỏng, khí — tối thiểu |
| `hangLongKhiTrongLuongToiDa` | DECIMAL(20,4) | Không | Hàng lỏng, khí — tối đa |
| `tongCongTrongLuongToiThieu` | DECIMAL(20,4) | Không | Tổng cộng — tối thiểu (tự động tính từ 3 loại hàng) |
| `tongCongTrongLuongToiDa` | DECIMAL(20,4) | Không | Tổng cộng — tối đa (tự động tính từ 3 loại hàng) |
| `ghiChu` | TEXT | Không | Ghi chú |

> **Ghi chú:** Dữ liệu được quản lý dạng danh sách in-memory. Khi lưu quy hoạch chính, danh sách này serialize thành mảng `zlstDuBaoHhQuaCang` gửi trong request body.

---

## 8. API Endpoints

Bảng C không có API riêng. Dữ liệu `zlstDuBaoHhQuaCang` gửi kèm trong request body của API tạo quy hoạch chính:

```json
{
  "fkDonViQl": "...",
  "fkCangBien": "...",
  "quyetDinhSo": "174/QĐ-BGTVT",
  "quyetDinhNgay": "2024-03-20",
  "zlstDuBaoHhQuaCang": [
    {
      "phanLoaiCangBenCangCauCang": "CB",
      "cangBenCangCauCang": "G17.43.000001",
      "hangContainerTrongLuongToiThieu": 100.0,
      "hangContainerTrongLuongToiDa": 200.0,
      "hangTongHopRoiTrongLuongToiThieu": 50.0,
      "hangTongHopRoiTrongLuongToiDa": 80.0,
      "hangLongKhiTrongLuongToiThieu": 30.0,
      "hangLongKhiTrongLuongToiDa": 60.0,
      "tongCongTrongLuongToiThieu": 180.0,
      "tongCongTrongLuongToiDa": 340.0,
      "ghiChu": "Dự báo giai đoạn 2025-2030"
    }
  ]
}
```

---

## 9. Chi tiết nghiệp vụ từng phần

### 9.1. Thêm mới (thủ công)

**Form thêm mới** gồm các trường với loại điều khiển tương ứng:

| STT | Tên trường | Loại điều khiển | Bắt buộc | Mô tả |
| --- | --- | --- | --- | --- |
| 1 | Phân loại (CB/BC/CC) | Select | Có | Chọn: Cảng biển / Bến cảng / Cầu cảng |
| 2 | Cảng, bến, cầu cụ thể | SelectKcht | Có | Chọn cảng/bến/cầu cụ thể. Là khóa định danh, duy nhất trong bảng. |
| 3 | Hàng container (min/max) | Number Input ×2 | Không | Nhập trọng lượng tối thiểu/tối đa |
| 4 | Hàng tổng hợp, rời (min/max) | Number Input ×2 | Không | Nhập trọng lượng tối thiểu/tối đa |
| 5 | Hàng lỏng, khí (min/max) | Number Input ×2 | Không | Nhập trọng lượng tối thiểu/tối đa |
| 6 | Tổng cộng (min/max) | Text (read-only — tự động tính) | Không | Hệ thống tự cộng từ 3 loại hàng (container + tổng hợp rời + lỏng khí). Không cho phép chỉnh sửa. |
| 7 | Ghi chú | Textarea | Không | Nhập ghi chú |

**Nút hành động:**

| Nút | Hành động |
| --- | --- |
| **Lưu** | Validate → thêm dòng vào cuối bảng C (chỉ hiển thị, không lưu DB). Thông báo "Đã thêm dự báo hàng hóa". |
| **Hủy** | Đóng form, không thêm dòng. |

### 9.2. Tải file mẫu

Nhấn "Tải file mẫu" → tải file Excel/CSV về máy. File mẫu có **header các cột** tương ứng:

| # | Cột trong file | Tương ứng trường | Bắt buộc |
| --- | --- | --- | --- |
| 1 | Phân loại (CB/BC/CC) | `phanLoaiCangBenCangCauCang` | Có |
| 2 | Cảng, bến, cầu cụ thể | `cangBenCangCauCang` | Có |
| 3 | Hàng container - tối thiểu | `hangContainerTrongLuongToiThieu` | Không |
| 4 | Hàng container - tối đa | `hangContainerTrongLuongToiDa` | Không |
| 5 | Hàng tổng hợp rời - tối thiểu | `hangTongHopRoiTrongLuongToiThieu` | Không |
| 6 | Hàng tổng hợp rời - tối đa | `hangTongHopRoiTrongLuongToiDa` | Không |
| 7 | Hàng lỏng khí - tối thiểu | `hangLongKhiTrongLuongToiThieu` | Không |
| 8 | Hàng lỏng khí - tối đa | `hangLongKhiTrongLuongToiDa` | Không |
| 9 | Ghi chú | `ghiChu` | Không |

> **Ghi chú:** File mẫu không có cột "Tổng cộng". Khi import, hệ thống tự động tính tổng cộng = container + tổng hợp rời + lỏng khí.

### 9.3. Thêm mới từ file

**Quy trình:**

1. Nhấn "Thêm mới từ file" → mở hộp thoại chọn file (`.xlsx`, `.xls`, `.csv`).
2. Chọn file → hệ thống đọc dữ liệu.
3. Validate từng dòng theo bảng lỗi dưới đây.
4. Tạo mới các dòng hợp lệ vào bảng C.
5. Hiển thị thông báo kết quả.

**Các case và exception:**

| Tình huống | Xử lý |
| --- | --- |
| File rỗng (0 dòng dữ liệu) | Lỗi "File rỗng, không có dữ liệu để thêm" |
| File sai định dạng (không phải xlsx/xls/csv) | Lỗi "Định dạng file không được hỗ trợ" |
| Header không khớp các cột mẫu | Lỗi "Cấu trúc file không đúng với file mẫu" |
| "Phân loại (CB/BC/CC)" trống hoặc sai giá trị (khác CB/BC/CC) | Dòng bị bỏ qua, cảnh báo "Dòng [N]: Phân loại không hợp lệ" |
| "Cảng, bến, cầu cụ thể" trống | Dòng bị bỏ qua, cảnh báo "Dòng [N]: Cảng, bến, cầu cụ thể không được để trống" |
| "Cảng, bến, cầu cụ thể" trùng dòng đã có trong bảng | Dòng bị bỏ qua (không ghi đè), cảnh báo "Dòng [N]: Cảng, bến, cầu cụ thể đã tồn tại" |
| Giá trị min/max không phải số hợp lệ hoặc âm | Dòng bị bỏ qua, cảnh báo "Dòng [N]: Trọng lượng không hợp lệ" |
| Giá trị min > max | Dòng bị bỏ qua, cảnh báo "Dòng [N]: Trọng lượng tối thiểu lớn hơn tối đa" |
| Tất cả dòng hợp lệ | Thêm toàn bộ, thông báo "Đã thêm N dòng từ file" |
| Có dòng lỗi + dòng hợp lệ | Thêm dòng hợp lệ, cảnh báo danh sách dòng bị bỏ qua |

> **Nguyên tắc:** "Thêm mới từ file" **chỉ tạo mới**, không sửa dòng đang có.

### 9.4. Cập nhật từ file

**Quy trình:**

1. Nhấn "Cập nhật từ file" → mở hộp thoại chọn file.
2. Chọn file → hệ thống đọc dữ liệu.
3. Với mỗi dòng, xác định dòng qua trường "Cảng, bến, cầu cụ thể".
4. Nếu tìm thấy → cập nhật thông tin dòng đó.
5. Nếu không tìm thấy → bỏ qua (không tạo mới).

**Các case và exception:**

| Tình huống | Xử lý |
| --- | --- |
| File rỗng | Lỗi "File rỗng, không có dữ liệu để cập nhật" |
| File sai định dạng | Lỗi "Định dạng file không được hỗ trợ" |
| Header không khớp | Lỗi "Cấu trúc file không đúng với file mẫu" |
| "Cảng, bến, cầu cụ thể" tồn tại trong bảng | Cập nhật các trường còn lại của dòng đó |
| "Cảng, bến, cầu cụ thể" **không** tồn tại trong bảng | Bỏ qua dòng, cảnh báo "Không tìm thấy dòng có Cảng, bến, cầu cụ thể [X]" — **không tạo mới** |
| "Phân loại (CB/BC/CC)" sai giá trị | Bỏ qua, cảnh báo "Dòng [N]: Phân loại không hợp lệ" |
| Giá trị min/max không hợp lệ hoặc min > max | Bỏ qua, cảnh báo "Dòng [N]: Trọng lượng không hợp lệ" |
| Tất cả dòng hợp lệ | Cập nhật toàn bộ, thông báo "Đã cập nhật N dòng từ file" |

> **Nguyên tắc:** "Cập nhật từ file" **chỉ cập nhật dòng đã tồn tại**, không tạo dòng mới.

### 9.5. Xóa

**Quy trình:**

1. Nhấn nút "Xóa" trên dòng.
2. Hiển thị popup: "Bạn có chắc chắn muốn xóa dòng **[Cảng, bến, cầu cụ thể]**? Thao tác này không thể hoàn tác."
3. Nhấn "Xóa" → xóa dòng khỏi bảng C (chưa lưu DB). Thông báo "Đã xóa dự báo hàng hóa".
4. Nhấn "Hủy" → đóng popup, giữ nguyên dòng.

---

## 10. Yêu cầu phi chức năng

### 10.1. Hiệu năng

- Mở form thêm mới ≤ 300ms
- Import file ≤ 2 giây cho file ≤ 1000 dòng
- Tải file mẫu ≤ 1 giây

### 10.2. Bảo mật

- Quyền `portplanning:create` được kiểm tra trước khi thao tác trên bảng C
- File import không được chứa macro/script

### 10.3. Độ tin cậy

- Import file validate từng dòng, không làm hỏng toàn bộ nếu 1 dòng lỗi
- Dữ liệu in-memory không bị mất nếu chưa nhấn "Lưu" form chính

### 10.4. Trải nghiệm người dùng

- Form thêm mới có loading skeleton
- Thông báo kết quả import rõ ràng (số dòng thành công + danh sách dòng bị bỏ qua)
- Popup xóa có màu cảnh báo đỏ

---

## 11. Yêu cầu giao diện người dùng

### 11.1. Bố cục

Bảng C nằm trong form Tạo mới quy hoạch, là một section có tiêu đề "Dự báo hàng hóa thông qua cảng".

### 11.2. Thành phần

1. **Thanh công cụ:** nút "Thêm mới", "Tải file mẫu", "Thêm mới từ file", "Cập nhật từ file".
2. **DataTable:** cột: STT, Phân loại, Cảng/bến/cầu cụ thể, Hàng container (min/max), Hàng tổng hợp rời (min/max), Hàng lỏng khí (min/max), Tổng cộng (min/max), Ghi chú, Thao tác (Xóa).
3. **Phân trang:** 10/20/50 dòng/trang.

### 11.3. Trạng thái giao diện

- **Đang import:** spinner "Đang đọc file..."
- **Bảng trống:** empty state "Chưa có dự báo hàng hóa nào"
- **Import lỗi:** cảnh báo đỏ + danh sách dòng bị bỏ qua
