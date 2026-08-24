---
id: F-061
name: "Quản lý Trạm radar - Lịch sử"
slug: quan-ly-tram-radar-lich-su
module-id: M-003
status: proposed
classification: local
priority: P1
created: "2026-06-30T00:00:00Z"
last-updated: "2026-08-07T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Trạm radar - Lịch sử

**Tài liệu:** BA Feature Brief
**Feature:** F-061
**Module:** M-003 — Quản lý tài sản KCHTGT - Khu nước & VTS
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-07

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Hiển thị toàn bộ lịch sử thay đổi của một Trạm radar, bao gồm mọi thao tác: tạo mới (F-056), cập nhật (F-057), phê duyệt cấp 1/cấp 2/từ chối (F-059), xóa mềm (F-058). Mỗi lần thay đổi được hiển thị dưới dạng **card box** riêng biệt, dễ đọc và truy vết.

### 1.2. Tại sao cần tính năng này?

Cung cấp khả năng kiểm toán (audit trail) cho mọi thay đổi đối với trạm radar, cho phép quản lý viên và lãnh đạo xem lại ai đã thay đổi thông tin gì, khi nào, và từ giá trị nào sang giá trị nào — đảm bảo tính minh bạch, trách nhiệm giải trình và khả năng truy vết lỗi dữ liệu. Đây là yêu cầu bắt buộc trong quản lý hạ tầng hàng hải.

### 1.3. Luồng hoạt động chính

1. Người dùng truy cập trang chi tiết Trạm radar (F-060) → click nút "Lịch sử".
2. Hệ thống gọi GET `/api/v1/radar-station/:id/history`.
3. Hệ thống hiển thị danh sách các lần thay đổi theo thứ tự thời gian giảm dần (mới nhất lên đầu).
4. Mỗi lần thay đổi được hiển thị thành một **card box** gồm 2 phần:
   - **Phần metadata:** thời gian cập nhật, người cập nhật, nguồn (CSDL).
   - **Phần nội dung thay đổi:** danh sách các trường bị thay đổi, mỗi trường hiển thị giá trị cũ → giá trị mới, được phân biệt màu sắc rõ ràng.
5. Người dùng có thể lọc theo khoảng thời gian, người thực hiện, hoặc loại hành động.

---

## 2. Ai dùng? Dùng như thế nào?

Quyền thao tác và xem tính năng được áp dụng theo hệ thống phân quyền tập trung của hệ thống. Mỗi vai trò người dùng sẽ có phạm vi truy cập và thao tác khác nhau trên tính năng này, được kiểm soát bởi cơ chế RBAC (Role-Based Access Control).

### 2.1. Logic phân quyền chung

Các thao tác trong tính năng được bảo vệ bởi các quyền (permissions) tương ứng. Người dùng chỉ có thể thực hiện những thao tác mà vai trò của họ được cấp quyền (xem chi tiết tại tính năng Phân quyền). Tất cả người dùng đã đăng nhập đều có quyền xem lịch sử.

### 2.2. Logic phân quyền đặc biệt cho tài khoản Admin Cục

Đối với tài khoản **Admin Cục**, áp dụng logic phân quyền đặc biệt sau:

- **Xem full dữ liệu:** Admin Cục có quyền xem toàn bộ dữ liệu trên hệ thống, không giới hạn phạm vi đơn vị hay khu vực.
- **Xem thông tin người chỉnh sửa:** Với mỗi bản ghi, Admin Cục thấy được thông tin người chỉnh sửa cuối cùng (họ tên, tên đăng nhập).
- **Xem thời gian cập nhật:** Admin Cục thấy được thời gian cập nhật cuối cùng của dữ liệu (timestamp).
- **Xem người tạo mới:** Admin Cục thấy được thông tin người tạo mới bản ghi (họ tên, tên đăng nhập).
- **Xem thời gian tạo mới:** Admin Cục thấy được thời gian tạo mới dữ liệu (timestamp).

---

## 3. User Stories

Dưới đây là các câu chuyện người dùng, sắp xếp theo mức độ ưu tiên (Must > Should > Could):

### Mức Must (bắt buộc có)

- **US-061-01:** Là Quản lý tài sản, tôi muốn xem toàn bộ lịch sử thay đổi của một trạm radar để biết ai đã thay đổi gì và khi nào.
- **US-061-02:** Là Lãnh đạo, tôi muốn xem lịch sử phê duyệt/từ chối để kiểm tra quy trình đã được thực hiện đúng chưa.
- **US-061-03:** Là Kiểm toán viên, tôi muốn truy vết mọi thay đổi của trạm radar để phục vụ công tác kiểm toán.

### Mức Should (nên có)

- **US-061-04:** Là Quản lý tài sản, tôi muốn lọc lịch sử theo khoảng thời gian hoặc người thực hiện để nhanh chóng tìm được thay đổi cần xem.

### Mức Could (có thể có sau)

- **US-061-05:** Là Admin, tôi muốn xuất báo cáo lịch sử thay đổi ra file Excel/PDF.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

Mỗi yêu cầu dưới đây mô tả một điều hệ thống phải làm được, kèm theo cách xử lý khi có lỗi hoặc dữ liệu không như mong đợi.

**AC-061-01 — Hiển thị danh sách các lần thay đổi:** Danh sách hiển thị theo thứ tự thời gian giảm dần (mới nhất lên đầu). Mỗi lần thay đổi là một card box riêng biệt. Nếu không có lịch sử, hiển thị "Không có lịch sử thay đổi".

**AC-061-02 — Hiển thị metadata của mỗi lần thay đổi:** Mỗi card box hiển thị: thời gian cập nhật (định dạng `HH:mm:ss dd/MM/yyyy`), người cập nhật (họ tên), nguồn (CSDL).

**AC-061-03 — Hiển thị nội dung thay đổi:** Mỗi card box liệt kê danh sách các trường bị thay đổi. Mỗi trường hiển thị: tên trường → giá trị cũ → giá trị mới. Giá trị cũ và giá trị mới có màu sắc khác nhau để dễ phân biệt. Nếu là thao tác tạo mới, hiển thị "Tạo mới" thay vì giá trị cũ. Nếu là thao tác xóa mềm, hiển thị "Xóa mềm".

**AC-061-04 — Lọc và tìm kiếm:** Người dùng có thể lọc theo khoảng thời gian (từ ngày → đến ngày), người thực hiện (dropdown), và loại hành động (TAO_MOI, CAP_NHAT, PHE_DUYET_C1, PHE_DUYET_C2, TU_CHOI, XOA_MEM).

**AC-061-05 — Dữ liệu read-only:** Lịch sử là read-only, không thể chỉnh sửa hoặc xóa.

**AC-061-06 — Badge loại hành động:** Mỗi card box có badge màu phân biệt loại hành động: Tạo mới (xanh lá), Cập nhật (xanh dương), Phê duyệt C1/C2 (xanh dương đậm), Từ chối (đỏ), Xóa mềm (xám).

---

## 5. Quy tắc nghiệp vụ (Business Rules)

Các quy tắc này là "luật chơi" mà mọi thành phần trong hệ thống phải tuân thủ:

**BR-061-01 — Ghi nhận tự động mọi thay đổi:** Mọi thao tác trên Trạm radar (tạo mới, cập nhật, phê duyệt, từ chối, xóa mềm) đều tự động tạo bản ghi ApprovalHistory. Không có thay đổi nào bị bỏ qua.

**BR-061-02 — Lịch sử bất biến:** Dữ liệu lịch sử là read-only, không thể chỉnh sửa hoặc xóa bởi bất kỳ ai. Chỉ được bổ sung thêm.

**BR-061-03 — Lưu trữ vĩnh viễn:** Dữ liệu lịch sử được lưu trữ vĩnh viễn, phục vụ mục đích kiểm toán và tham khảo.

**BR-061-04 — Thông tin người thực hiện:** Tên người thực hiện được tự động lấy từ tài khoản đăng nhập, không thể giả mạo.

**BR-061-05 — Thay đổi quan trọng được làm nổi bật:** Các thay đổi quan trọng (phê duyệt, từ chối, thay đổi trạng thái) được đánh dấu nổi bật bằng badge màu riêng.

---

## 6. Mô hình dữ liệu

### 6.1. Bảng `approval_history` — Nhật ký thay đổi

Bảng chính lưu toàn bộ lịch sử thay đổi của Trạm radar.

| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | Long | Định danh bản ghi (PK, IDENTITY) |
| `radarStationId` | UUID (FK → radar_station) | Trạm radar bị thay đổi |
| `approvalLevel` | Integer | Cấp phê duyệt: 1 (C1 - Trưởng phòng) hoặc 2 (C2 - Lãnh đạo Cục). NULL nếu là thao tác tạo mới/cập nhật/xóa |
| `status` | String | Loại sự kiện: CREATED / UPDATED / APPROVED / REJECTED_LEVEL1 / REJECTED_LEVEL2 / DELETED |
| `approvedBy` | UUID (FK → User) | Người thực hiện thay đổi |
| `approvedDate` | Timestamp | Thời gian thay đổi (tự động) |
| `reason` | String | Lý do (bắt buộc khi từ chối, tùy chọn với phê duyệt) |

**Các trường `fieldChanged` có thể xuất hiện** (toàn bộ trường có thể chỉnh sửa của RadarStation — tham khảo F-057):

- Tên trạm radar, Đơn vị quản lý, Thuộc cảng biển, Thuộc hệ thống VTS
- Thuộc trung tâm điều hành VTS, Đơn vị khai thác, Mã radar
- Địa điểm (Tỉnh/Thành phố), Địa điểm chi tiết, Đơn vị tính, Số lượng, Tình trạng
- Chiều cao tháp radar, Tầm hiệu lực radar, Ghi chú
- Kinh độ, Vĩ độ, Loại đối tượng GIS, Biểu tượng, Hệ quy chiếu, Quy tắc hiển thị, Tọa độ GIS
- Trạng thái phê duyệt, Phê duyệt C1, Người duyệt C1, Ngày duyệt C1
- Phê duyệt C2, Người duyệt C2, Ngày duyệt C2, Lý do từ chối

---

## 7. API Endpoints

Hệ thống cung cấp các API để phục vụ các thao tác liên quan đến tính năng:

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| GET | `/api/v1/radar-station/:id/history` | Lấy danh sách lịch sử thay đổi của trạm radar | Tất cả người dùng đã đăng nhập |

**Tham số query:**

| Tham số | Mô tả |
|---|---|
| `tuNgay` | Lọc từ ngày (định dạng yyyy-MM-dd) |
| `denNgay` | Lọc đến ngày (định dạng yyyy-MM-dd) |
| `approvedBy` | Lọc theo UUID người thực hiện |
| `status` | Lọc theo loại sự kiện: CREATED / UPDATED / APPROVED / REJECTED_LEVEL1 / REJECTED_LEVEL2 / DELETED |

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
│  │ Người cập nhật:  │  │   Tên trạm radar:            │ │
│  │ Nguyễn Văn A    │  │   Trạm radar cũ  →  Trạm     │ │
│  │                  │  │   radar Hải Phòng 1          │ │
│  │ Nguồn: CSDL      │  │                              │ │
│  │                  │  │ Chiều cao tháp:              │ │
│  │                  │  │   35.0m  →  45.5m            │ │
│  └──────────────────┘  │                              │ │
│                         │ Trạng thái phê duyệt:        │ │
│                         │   APPROVED  →  DRAFT         │ │
│                         └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Quy tắc hiển thị:**

- Mỗi card box có badge màu ở góc trên bên trái hiển thị loại hành động.
- **Cột trái (metadata):** thời gian, người cập nhật, nguồn — nền màu nhẹ (`surfacePage`).
- **Cột phải (nội dung):** danh sách trường thay đổi.
  - Giá trị cũ: nền `#FFF0F0` (đỏ nhạt), chữ `#C62828` → thể hiện "trước thay đổi".
  - Giá trị mới: nền `#E8F5E9` (xanh nhạt), chữ `#2E7D32` → thể hiện "sau thay đổi".
  - Mũi tên `→` phân cách giữa cũ và mới.
- Nếu là thao tác **Tạo mới**: cột phải hiển thị "Tạo mới trạm radar" + danh sách tất cả giá trị ban đầu.
- Nếu là thao tác **Xóa mềm**: cột phải hiển thị "Trạm radar đã bị xóa mềm".
- Nếu là **Phê duyệt C1** (status = APPROVED, approvalLevel = 1): cột phải hiển thị "Phê duyệt cấp 1 (Trưởng phòng) — Trạng thái: PENDING_APPROVAL → APPROVED_LEVEL1" + lý do (nếu có).
- Nếu là **Phê duyệt C2** (status = APPROVED, approvalLevel = 2): cột phải hiển thị "Phê duyệt cấp 2 (Lãnh đạo Cục) — Trạng thái: APPROVED_LEVEL1 → APPROVED" + lý do (nếu có).
- Nếu là **Từ chối** (status = REJECTED_LEVEL1 hoặc REJECTED_LEVEL2): cột phải hiển thị "Từ chối — Lý do: [nội dung reason]".

### 8.2. Bộ lọc

| Bộ lọc | Loại | Mô tả |
|---|---|---|
| Từ ngày → Đến ngày | Date Range Picker | Lọc theo khoảng thời gian thay đổi |
| Người thực hiện | Dropdown | Chọn từ danh sách người dùng đã từng thay đổi trạm radar này |
| Loại hành động | Dropdown (multi-select) | Tạo mới / Cập nhật / Phê duyệt C1 / Phê duyệt C2 / Từ chối / Xóa mềm |

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
- Tuân thủ tiêu chuẩn trợ năng WCAG 2.1 AA

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
| Tạo mới (CREATED) | Xanh lá `#4CAF50` |
| Cập nhật (UPDATED) | Xanh dương `#2196F3` |
| Phê duyệt (APPROVED) | Xanh dương đậm `#1565C0` |
| Từ chối (REJECTED_LEVEL1/REJECTED_LEVEL2) | Đỏ `#F44336` |
| Xóa mềm (DELETED) | Xám `#9E9E9E` |

### 10.5. Màn hình Lịch sử Trạm radar

1. **ScreenHeader:** breadcrumb "Khu nước & VTS > Quản lý Trạm radar > [tên trạm radar] > Lịch sử".

2. **FilterBar:** thanh lọc ngang gồm: Date Range Picker (Từ ngày - Đến ngày) + Dropdown Người thực hiện + Dropdown Loại hành động (multi-select).

3. **Danh sách card box:** các card xếp dọc, mới nhất lên đầu, mỗi card là một lần thay đổi.

4. **Pagination:** phân trang khi > 20 card, tùy chọn 20/50/100.

### 10.6. Các trạng thái giao diện

- **Đang tải:** skeleton cho card box.
- **Không có dữ liệu:** "Không có lịch sử thay đổi".
- **Lỗi tải:** cảnh báo đỏ + nút "Thử lại".

### 10.7. Giao diện trên điện thoại

Khi màn hình nhỏ hơn 768px:

- Card box chuyển từ 2 cột ngang thành dọc: metadata ở trên, nội dung thay đổi ở dưới.
- Thanh lọc chuyển thành panel gập/mở.
