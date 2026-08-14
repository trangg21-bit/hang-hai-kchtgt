---
id: F-049
name: Quản lý Đê/kè - Lịch sử
slug: quan-ly-de-ke-lich-su
module-id: M-003
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-11T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Đê/kè - Lịch sử

**Tài liệu:** BA Feature Brief
**Feature:** F-049
**Module:** M-003 — Quản lý tài sản KCHTGT - Khu nước & VTS
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-11

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Hiển thị toàn bộ lịch sử thay đổi của một công trình đê/kè, bao gồm mọi thao tác: tạo mới (F-044), cập nhật (F-045), gửi duyệt, phê duyệt C1/C2, từ chối (F-047), xóa mềm (F-046). Mỗi lần thay đổi được hiển thị dưới dạng **card box** riêng biệt, dễ đọc và truy vết.

### 1.2. Tại sao cần tính năng này?

Cung cấp khả năng kiểm toán (audit trail) cho mọi thay đổi đối với công trình đê/kè, cho phép Chuyên viên, Trưởng phòng, Cục trưởng và Admin xem lại ai đã thay đổi thông tin gì, khi nào, và từ giá trị nào sang giá trị nào — đảm bảo tính minh bạch, trách nhiệm giải trình và khả năng truy vết lỗi dữ liệu. Đây là yêu cầu bắt buộc trong quản lý hạ tầng hàng hải.

### 1.3. Luồng hoạt động chính

1. Người dùng truy cập trang chi tiết Đê/kè (F-048) → click tab "Lịch sử".
2. Hệ thống gọi GET `/api/v1/dike-revetment/{id}/history`.
3. Hệ thống hiển thị danh sách các lần thay đổi theo thứ tự thời gian giảm dần (mới nhất lên đầu).
4. Mỗi lần thay đổi được hiển thị thành một **card box** gồm 2 phần:
   - **Phần metadata:** thời gian cập nhật, người cập nhật.
   - **Phần nội dung thay đổi:** danh sách các trường bị thay đổi, mỗi trường hiển thị giá trị cũ → giá trị mới, được phân biệt màu sắc rõ ràng.
5. Người dùng có thể lọc theo khoảng thời gian, người thực hiện, hoặc loại hành động.

---

## 2. Ai dùng? Dùng như thế nào?

Quyền thao tác và xem tính năng được áp dụng theo hệ thống phân quyền tập trung của hệ thống. Mỗi vai trò người dùng sẽ có phạm vi truy cập và thao tác khác nhau trên tính năng này, được kiểm soát bởi cơ chế RBAC (Role-Based Access Control).

### 2.1. Logic phân quyền chung

Các thao tác trong tính năng được bảo vệ bởi các quyền (permissions) tương ứng. Người dùng chỉ có thể thực hiện những thao tác mà vai trò của họ được cấp quyền (xem chi tiết tại tính năng Phân quyền). Tất cả người dùng đã đăng nhập đều có quyền xem lịch sử trong phạm vi đơn vị quản lý.

### 2.2. Logic phân quyền đặc biệt cho tài khoản Admin Cục

Đối với tài khoản **Admin Cục**, áp dụng logic phân quyền đặc biệt sau:

- **Xem full dữ liệu:** Admin Cục có quyền xem toàn bộ dữ liệu trên hệ thống, không giới hạn phạm vi đơn vị hay khu vực.
- **Xem thông tin người chỉnh sửa:** Với mỗi bản ghi, Admin Cục thấy được thông tin người chỉnh sửa cuối cùng (họ tên, tên đăng nhập).
- **Xem thời gian cập nhật:** Admin Cục thấy được thời gian cập nhật cuối cùng của dữ liệu (timestamp).
- **Xem người tạo mới:** Admin Cục thấy được thông tin người tạo mới bản ghi (họ tên, tên đăng nhập).
- **Xem thời gian tạo mới:** Admin Cục thấy được thời gian tạo mới dữ liệu (timestamp).

---

## 3. User Stories

### Mức Must (bắt buộc có)

- **US-049-01:** Là Chuyên viên, tôi muốn xem toàn bộ lịch sử thay đổi của một công trình đê/kè để biết ai đã thay đổi gì và khi nào.
- **US-049-02:** Là Trưởng phòng, tôi muốn xem lịch sử phê duyệt/từ chối để kiểm tra quy trình đã được thực hiện đúng chưa.
- **US-049-03:** Là Kiểm toán viên, tôi muốn truy vết mọi thay đổi của công trình để phục vụ công tác kiểm toán.

### Mức Should (nên có)

- **US-049-04:** Là Chuyên viên, tôi muốn lọc lịch sử theo khoảng thời gian hoặc người thực hiện để nhanh chóng tìm được thay đổi cần xem.

### Mức Could (có thể có sau)

- **US-049-05:** Là Admin, tôi muốn xuất báo cáo lịch sử thay đổi ra file Excel/PDF.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

**AC-049-01 — Hiển thị danh sách các lần thay đổi:** Danh sách hiển thị theo thứ tự thời gian giảm dần (mới nhất lên đầu). Mỗi lần thay đổi là một card box riêng biệt. Nếu không có lịch sử, hiển thị "Không có lịch sử thay đổi".

**AC-049-02 — Hiển thị metadata của mỗi lần thay đổi:** Mỗi card box hiển thị: thời gian cập nhật (định dạng `HH:mm:ss dd/MM/yyyy`), người cập nhật (họ tên).

**AC-049-03 — Hiển thị nội dung thay đổi:** Mỗi card box liệt kê danh sách các trường bị thay đổi. Mỗi trường hiển thị: tên trường → giá trị cũ → giá trị mới. Giá trị cũ và giá trị mới có màu sắc khác nhau để dễ phân biệt:
- Nếu là thao tác **tạo mới**: hiển thị "Tạo mới" thay vì giá trị cũ, kèm danh sách tất cả giá trị ban đầu.
- Nếu là thao tác **xóa mềm**: hiển thị "Công trình đã bị xóa mềm".
- Nếu là thao tác **gửi duyệt**: hiển thị "Gửi yêu cầu phê duyệt".
- Nếu là thao tác **phê duyệt**: hiển thị "Phê duyệt cấp 1" hoặc "Phê duyệt cấp 2".
- Nếu là thao tác **từ chối**: hiển thị "Từ chối" kèm lý do từ chối.

**AC-049-04 — Lọc và tìm kiếm:** Người dùng có thể lọc theo khoảng thời gian (từ ngày → đến ngày), người thực hiện (dropdown), và loại hành động (TAO_MOI, CAP_NHAT, GUI_DUYET, PHE_DUYET_C1, PHE_DUYET_C2, TU_CHOI, XOA_MEM).

**AC-049-05 — Dữ liệu read-only:** Lịch sử là read-only, không thể chỉnh sửa hoặc xóa.

**AC-049-06 — Badge loại hành động:** Mỗi card box có badge màu phân biệt loại hành động: Tạo mới (xanh lá), Cập nhật (xanh dương), Gửi duyệt (vàng), Phê duyệt C1/C2 (xanh dương đậm), Từ chối (đỏ), Xóa mềm (xám).

---

## 5. Quy tắc nghiệp vụ (Business Rules)

**BR-049-01 — Ghi nhận tự động mọi thay đổi:** Mọi thao tác trên đê/kè (tạo mới, cập nhật, gửi duyệt, phê duyệt, từ chối, xóa mềm) đều tự động tạo bản ghi lịch sử. Không có thay đổi nào bị bỏ qua.

**BR-049-02 — Lịch sử bất biến:** Dữ liệu lịch sử là read-only, không thể chỉnh sửa hoặc xóa bởi bất kỳ ai. Chỉ được bổ sung thêm.

**BR-049-03 — Lưu trữ vĩnh viễn:** Dữ liệu lịch sử được lưu trữ vĩnh viễn, phục vụ mục đích kiểm toán và tham khảo.

**BR-049-04 — Thông tin người thực hiện:** Tên người thực hiện được tự động lấy từ tài khoản đăng nhập, không thể giả mạo.

**BR-049-05 — Thay đổi quan trọng được làm nổi bật:** Các thay đổi quan trọng (phê duyệt, từ chối, thay đổi trạng thái) được đánh dấu nổi bật bằng badge màu riêng.

**BR-049-06 — Ghi nhận atomic:** Ghi nhận lịch sử là atomic — nếu thao tác thất bại, không có bản ghi lịch sử nào được tạo.

---

## 6. Mô hình dữ liệu

### 6.1. Bảng `dike_revetment_approval_history` — Nhật ký thay đổi

Bảng chính lưu toàn bộ lịch sử thay đổi của đê/kè.

| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | Định danh bản ghi |
| `dikeRevetmentId` | UUID (FK → dike_revetment) | Công trình bị thay đổi |
| `fieldChanged` | String | Tên trường bị thay đổi (hiển thị tiếng Việt) |
| `oldValue` | Text | Giá trị cũ (NULL nếu là tạo mới) |
| `newValue` | Text | Giá trị mới |
| `changedBy` | UUID (FK → User) | Người thực hiện thay đổi |
| `changedAt` | Timestamp | Thời gian thay đổi (tự động) |
| `actionType` | Enum | TAO_MOI / CAP_NHAT / GUI_DUYET / PHE_DUYET_C1 / PHE_DUYET_C2 / TU_CHOI / XOA_MEM |

**Các trường `fieldChanged` có thể xuất hiện** (toàn bộ trường có thể chỉnh sửa của đê/kè — tham khảo F-044, F-045):

- Mã đê kè, Tên đê kè, Đơn vị quản lý, Thuộc cảng biển, Đơn vị vận hành
- Địa điểm, Địa điểm chi tiết, Loại kết cấu công trình, Tình trạng
- Chiều dài, Chiều cao, Cao trình đỉnh
- Thời điểm xây dựng, Thời điểm đưa vào khai thác, Năm bảo trì gần nhất
- Trạng thái phê duyệt, Ghi chú
- Tọa độ GIS, File đính kèm

---

## 7. API Endpoints

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| GET | `/api/v1/dike-revetment/{id}/history` | Lấy danh sách lịch sử thay đổi của đê/kè | Tất cả người dùng đã đăng nhập |

**Tham số query:**

| Tham số | Mô tả |
|---|---|
| `tuNgay` | Lọc từ ngày (định dạng yyyy-MM-dd) |
| `denNgay` | Lọc đến ngày (định dạng yyyy-MM-dd) |
| `changedBy` | Lọc theo UUID người thực hiện |
| `actionType` | Lọc theo loại hành động |

---

## 8. Chi tiết nghiệp vụ từng phần

### 8.1. Thiết kế card box — mỗi lần thay đổi

Mỗi lần thay đổi được hiển thị thành một **card box** độc lập, bố cục ngang gồm 2 phần:

```
┌─────────────────────────────────────────────────────────┐
│  🔵 Cập nhật                                            │
│                                                         │
│  ┌──────────────────┐  ┌──────────────────────────────┐ │
│  │ 14:34:08         │  │ Thông tin thay đổi:          │ │
│  │ 17/07/2026       │  │                              │ │
│  │ Người cập nhật:  │  │   Tên đê kè:                 │ │
│  │ Nguyễn Văn A    │  │   Đê chắn sóng cảng HP  →    │ │
│  │                  │  │   Đê chắn sóng cảng HP (mới) │ │
│  │                  │  │                              │ │
│  │                  │  │   Chiều dài:                 │ │
│  │                  │  │   850.0m  →  920.0m          │ │
│  └──────────────────┘  │                              │ │
│                         │   Trạng thái phê duyệt:      │ │
│                         │   Đã phê duyệt  →  Chờ       │ │
│                         │   phê duyệt                  │ │
│                         └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Quy tắc hiển thị:**

- Mỗi card box có badge màu ở góc trên bên trái hiển thị loại hành động.
- **Cột trái (metadata):** thời gian, người cập nhật — nền màu nhẹ (`surfacePage`).
- **Cột phải (nội dung):** danh sách trường thay đổi.
  - Giá trị cũ: nền `#FFF0F0` (đỏ nhạt), chữ `#C62828` → thể hiện "trước thay đổi".
  - Giá trị mới: nền `#E8F5E9` (xanh nhạt), chữ `#2E7D32` → thể hiện "sau thay đổi".
  - Mũi tên `→` phân cách giữa cũ và mới.
- Nếu là thao tác **Tạo mới**: cột phải hiển thị "Tạo mới công trình đê/kè" + danh sách tất cả giá trị ban đầu.
- Nếu là thao tác **Gửi duyệt**: cột phải hiển thị "Gửi yêu cầu phê duyệt".
- Nếu là thao tác **Phê duyệt C1/C2**: cột phải hiển thị "Phê duyệt cấp 1/2" + tên người duyệt.
- Nếu là thao tác **Từ chối**: cột phải hiển thị "Từ chối" + lý do từ chối.
- Nếu là thao tác **Xóa mềm**: cột phải hiển thị "Công trình đã bị xóa mềm".

### 8.2. Bộ lọc

| Bộ lọc | Loại | Mô tả |
|---|---|---|
| Từ ngày → Đến ngày | Date Range Picker | Lọc theo khoảng thời gian thay đổi |
| Người thực hiện | Dropdown | Chọn từ danh sách người dùng đã từng thay đổi công trình này |
| Loại hành động | Dropdown (multi-select) | Tạo mới / Cập nhật / Gửi duyệt / Phê duyệt C1 / Phê duyệt C2 / Từ chối / Xóa mềm |

---

## 9. Yêu cầu phi chức năng

### 9.1. Hiệu năng

- Tải danh sách lịch sử ≤ 1 giây cho tối đa 100 bản ghi
- Hỗ trợ phân trang khi số lượng bản ghi > 100

### 9.2. Khả năng mở rộng

- Hỗ trợ thêm loại hành động mới mà không thay đổi cấu trúc bảng

### 9.3. Bảo mật

- Phân quyền RBAC trên API
- Dữ liệu lịch sử không thể bị xóa hoặc sửa bởi bất kỳ ai (kể cả Admin)

### 9.4. Độ tin cậy

- Ghi nhận lịch sử là atomic — nếu thao tác thất bại, không có bản ghi lịch sử nào được tạo

### 9.5. Trải nghiệm người dùng

- Card box dễ đọc, phân biệt rõ ràng trước/sau bằng màu sắc
- Badge màu giúp nhận diện nhanh loại hành động
- Giao diện responsive: trên điện thoại, 2 cột chuyển thành dọc
- Có loading skeleton khi đang tải
- Có trạng thái rỗng: "Không có lịch sử thay đổi"

---

## 10. Yêu cầu giao diện người dùng

> **Nguyên tắc cốt lõi:** Mọi giá trị màu sắc, khoảng cách, kích thước chữ trong giao diện đều được định nghĩa tập trung tại 2 file `frontend/src/theme.ts` và `frontend/src/tokens.ts`. Tuyệt đối không hardcode giá trị hex hay pixel trong component.

### 10.1. Bố cục chung

- **Thanh menu trái:** rộng 272px, nền `#12468C`.
- **Thanh tiêu đề:** cao 64px, nền trắng.
- **Vùng nội dung:** nền `#eaf0f6`.

### 10.2. Hệ thống màu sắc

| Vai trò | Token | Màu |
|---|---|---|
| Nền card | `surfaceCard` | `#FFFFFF` |
| Nền trang | `surfacePage` | `#eaf0f6` |
| Chữ chính | `textPrimary` | `#0c2438` |
| Chữ phụ | `textSecondary` | `#566a7c` |
| Nút chính | `actionPrimary` | `#0E6FD6` |

### 10.3. Màu sắc cho giá trị trước/sau

| Thành phần | Màu nền | Màu chữ |
|---|---|---|
| **Giá trị cũ** (trước thay đổi) | `#FFF0F0` | `#C62828` |
| **Giá trị mới** (sau thay đổi) | `#E8F5E9` | `#2E7D32` |

### 10.4. Badge màu cho loại hành động

| Loại hành động | Màu badge |
|---|---|
| Tạo mới (TAO_MOI) | Xanh lá `#4CAF50` |
| Cập nhật (CAP_NHAT) | Xanh dương `#2196F3` |
| Gửi duyệt (GUI_DUYET) | Vàng `#FF9800` |
| Phê duyệt C1/C2 (PHE_DUYET_C1, PHE_DUYET_C2) | Xanh dương đậm `#1565C0` |
| Từ chối (TU_CHOI) | Đỏ `#F44336` |
| Xóa mềm (XOA_MEM) | Xám `#9E9E9E` |

### 10.5. Màn hình Lịch sử Đê/kè

1. **ScreenHeader:** breadcrumb "Quản lý KCHTGT Khu nước & VTS > Đê/kè > [tên công trình] > Lịch sử".

2. **FilterBar:** thanh lọc ngang gồm: Date Range Picker (Từ ngày - Đến ngày) + Dropdown Người thực hiện + Dropdown Loại hành động (multi-select).

3. **Danh sách card box:** các card xếp dọc, mới nhất lên đầu, mỗi card là một lần thay đổi.

4. **Pagination:** phân trang khi > 20 card, tùy chọn 20/50/100.

### 10.6. Các trạng thái giao diện

- **Đang tải:** skeleton cho card box.
- **Không có dữ liệu:** "Không có lịch sử thay đổi".
- **Lỗi tải:** cảnh báo đỏ + nút "Thử lại".

### 10.7. Giao diện trên điện thoại

- Card box chuyển từ 2 cột ngang thành dọc: metadata ở trên, nội dung thay đổi ở dưới.
- Thanh lọc chuyển thành panel gập/mở.
