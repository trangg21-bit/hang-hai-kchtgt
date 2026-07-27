---
id: F-006
name: Quan ly bieu tuong ban do
slug: quan-ly-bieu-tuong-ban-do
module-id: M-001
status: proposed
classification: local
priority: medium
created: 2026-07-27T00:00:00Z
last-updated: 2026-07-27T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý biểu tượng trên bản đồ

**Tài liệu:** BA Feature Brief
**Feature:** F-006
**Module:** M-001 — Quản trị hệ thống
**Người viết:** Business Analyst
**Ngày tạo:** 27/07/2026

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Quản lý biểu tượng trên bản đồ là tính năng cho phép người quản trị hệ thống tạo và duy trì một **thư viện biểu tượng** dùng chung cho toàn bộ hệ thống. Mỗi biểu tượng là một hình ảnh nhỏ (icon) được dùng để hiển thị các đối tượng hạ tầng hàng hải trên bản đồ GIS — như cảng biển, bến cảng, phao báo hiệu, đèn biển, trạm radar, hệ thống VTS, luồng hàng hải...

Nói cách khác: đây là "kho icon" trung tâm — nơi admin upload và quản lý toàn bộ biểu tượng, còn các module nghiệp vụ khác (GIS Bản đồ, Cảng biển, Báo hiệu, Nhà trạm...) chỉ việc gọi API để lấy danh sách biểu tượng về gán cho đối tượng của mình.

### 1.2. Tại sao cần tính năng này?

Có 3 lý do chính:

1. **Đồng bộ hiển thị trên bản đồ:** Khi một cảng biển được hiển thị trên bản đồ GIS, nó cần một biểu tượng để người dùng nhận biết. Nếu không có thư viện biểu tượng tập trung, mỗi module sẽ tự chế icon riêng — dẫn đến cùng một loại đối tượng nhưng hiển thị khác nhau giữa các màn hình.

2. **Quản lý tập trung, dùng lại được:** Một biểu tượng được tạo một lần, sau đó 11 module khác nhau cùng dùng. Khi cần thay đổi hình ảnh (ví dụ: cập nhật theo quy chuẩn mới của Cục Hàng hải), admin chỉ cần sửa một chỗ.

3. **Kiểm soát trạng thái:** Admin có thể đánh dấu biểu tượng đang "Sử dụng" hoặc "Không sử dụng". Các module chỉ load biểu tượng đang hoạt động, tránh hiển thị icon lỗi thời trên bản đồ.

### 1.3. Ai dùng biểu tượng này?

Các module sau trong hệ thống phụ thuộc vào thư viện biểu tượng:

- **GIS Bản đồ** (M-007): gán biểu tượng cho đối tượng điểm/đường/vùng trên bản đồ
- **Cảng biển** (M-002): hiển thị icon cảng biển, bến cảng, cầu cảng, cảng cạn, vùng nước
- **Báo hiệu hàng hải** (M-013): hiển thị icon phao, đèn biển
- **Nhà trạm** (M-014): hiển thị icon đài duyên hải, trạm vệ tinh
- **Trạm Radar, Hệ thống VTS, Cơ sở sửa chữa, Đê kè, Luồng hàng hải...**

### 1.4. Luồng hoạt động chính

Người quản trị đăng nhập vào hệ thống, từ thanh menu bên trái chọn mục "Quản lý biểu tượng trên bản đồ". Hệ thống hiển thị danh sách biểu tượng dạng bảng với các cột: STT, Tên biểu tượng, Hình ảnh, Trạng thái, Thao tác (Xem chi tiết / Sửa / Xóa).

Người quản trị có thể tìm kiếm theo tên biểu tượng, lọc theo trạng thái (Sử dụng / Không sử dụng). Để thêm biểu tượng mới, admin bấm nút "Thêm mới", hệ thống mở popup "Thêm mới thông tin biểu tượng trên bản đồ" bao gồm các trường: Tên biểu tượng, chọn hình ảnh, trạng thái (mặc định Sử dụng) và Ghi chú.

Popup Sửa và popup Xem chi tiết có cấu trúc giống hệt popup Thêm mới. Khi sửa, dữ liệu hiện tại được điền sẵn vào form. Khi xem chi tiết, toàn bộ trường ở chế độ chỉ đọc. Khi xóa, hệ thống hiển thị popup xác nhận trước khi thực hiện.

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. system-admin (Quản trị viên cấp cao)

Có toàn quyền với thư viện biểu tượng:
- Xem toàn bộ danh sách biểu tượng
- Tạo biểu tượng mới (quyền `symbol.create`)
- Sửa thông tin biểu tượng (quyền `symbol.edit`)
- Xóa biểu tượng (quyền `symbol.delete`)
- Xem chi tiết biểu tượng

### 2.2. Các vai trò khác

Các vai trò admin, admin-operation, cán bộ, người dùng thông thường **không có quyền truy cập vào màn hình quản lý biểu tượng**. Tuy nhiên, họ vẫn **thấy biểu tượng trên bản đồ** khi sử dụng các module nghiệp vụ — đây là quyền đọc dữ liệu, không phải quyền quản lý.

Menu "Quản lý biểu tượng trên bản đồ" trên sidebar được kiểm soát bởi quyền `data:read` — mặc định chỉ system-admin và admin mới thấy.

---

## 3. User Stories

### Mức Must (bắt buộc có)

- **US-006-01:** Là system-admin, tôi muốn xem danh sách tất cả biểu tượng bản đồ đã tạo để nắm được thư viện icon hiện có.
- **US-006-02:** Là system-admin, tôi muốn tạo biểu tượng mới (tên, hình ảnh) để bổ sung vào thư viện dùng chung.
- **US-006-03:** Là system-admin, tôi muốn sửa thông tin biểu tượng (tên, hình ảnh, trạng thái) khi cần cập nhật.
- **US-006-04:** Là system-admin, tôi muốn xóa biểu tượng không còn dùng đến để giữ thư viện gọn gàng.

### Mức Should (nên có)

- **US-006-05:** Là system-admin, tôi muốn tìm kiếm biểu tượng theo tên để nhanh chóng tìm thấy cái cần sửa.
- **US-006-06:** Là system-admin, tôi muốn lọc biểu tượng theo trạng thái (Sử dụng / Không sử dụng) để tập trung vào nhóm cần xử lý.
- **US-006-07:** Là system-admin, tôi muốn xem chi tiết biểu tượng (hình ảnh phóng to, thông tin đầy đủ) trước khi quyết định sửa hay xóa.

### Mức Could (có thể có sau)

- **US-006-08:** Là system-admin, tôi muốn biết biểu tượng nào đang được bao nhiêu module sử dụng để tránh xóa nhầm biểu tượng đang dùng.
- **US-006-09:** Là developer module GIS, tôi muốn gọi API lấy danh sách biểu tượng đang hoạt động để gán vào đối tượng trên bản đồ.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

**AC-006-01 — Hiển thị danh sách biểu tượng:** Khi người dùng mở màn hình, hệ thống hiển thị danh sách biểu tượng dạng bảng phân trang với các cột: STT, Tên biểu tượng, Hình ảnh, Trạng thái, Thao tác (Xem chi tiết / Sửa / Xóa). Nếu chưa có biểu tượng nào, hiển thị thông báo "Chưa có biểu tượng nào".

**AC-006-02 — Tạo biểu tượng mới:** Admin bấm "Thêm mới", popup "Thêm mới thông tin biểu tượng trên bản đồ" hiển thị form với các trường: Tên biểu tượng (bắt buộc, tối đa 255 ký tự), Hình ảnh (bắt buộc, tuân thủ quy tắc validate tại BR-006-05), Trạng thái (dropdown, mặc định "Sử dụng"), Ghi chú (không bắt buộc, tối đa 500 ký tự). Khi tạo thành công, hiển thị toast "Đã tạo biểu tượng" và danh sách tự động cập nhật.

**AC-006-03 — Sửa biểu tượng:** Admin bấm nút Sửa, popup hiển thị form giống popup Thêm mới với dữ liệu hiện tại được điền sẵn. Có thể sửa: Tên biểu tượng, Hình ảnh, Trạng thái, Ghi chú. Khi cập nhật thành công, hiển thị toast "Đã cập nhật biểu tượng".

**AC-006-04 — Xóa biểu tượng:** Admin bấm nút Xóa, hệ thống hiển thị popup xác nhận "Bạn có chắc chắn muốn xóa biểu tượng [Tên]?" Nếu xác nhận, biểu tượng bị xóa khỏi database và hiển thị toast "Đã xóa biểu tượng".

**AC-006-05 — Xem chi tiết:** Admin bấm nút Xem chi tiết, popup hiển thị form giống popup Thêm mới nhưng tất cả trường ở chế độ chỉ đọc. Hiển thị đầy đủ: Tên biểu tượng, Hình ảnh (phóng to), Trạng thái (dạng tag màu), Ghi chú.

**AC-006-06 — Tìm kiếm:** Có ô tìm kiếm trên đầu danh sách. Khi gõ từ khóa, hệ thống tìm trong tên biểu tượng. Kết quả phân trang chính xác. Nếu không có kết quả, hiển thị "Không tìm thấy biểu tượng".

**AC-006-07 — Lọc theo trạng thái:** Có dropdown lọc với 2 lựa chọn: Sử dụng, Không sử dụng. Khi chọn một trạng thái, danh sách chỉ hiển thị biểu tượng ở trạng thái đó. Có thể bỏ lọc để xem tất cả.

**AC-006-08 — Phân quyền nút:** Nút "Thêm mới" chỉ hiển thị nếu người dùng có quyền `symbol.create`. Nút "Sửa" chỉ hiển thị nếu có `symbol.edit`. Nút "Xóa" chỉ hiển thị nếu có `symbol.delete`. Menu sidebar chỉ hiển thị nếu có quyền `data:read`.

**AC-006-09 — Validate ảnh khi upload:** Khi người dùng chọn file ảnh, hệ thống kiểm tra: định dạng (chỉ chấp nhận PNG, JPEG, JPG), kích thước file (tối đa 500KB), kích thước ảnh (tối đa 128x128px). Nếu vi phạm, hiển thị thông báo lỗi cụ thể ngay dưới trường upload, không cho phép lưu.

**AC-006-10 — API cho module khác:** API `GET /api/symbols?status=ACTIVE` trả về danh sách biểu tượng đang sử dụng cho các module nghiệp vụ. Không yêu cầu quyền admin.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

**BR-006-01 — Không dùng mã code:** Biểu tượng được định danh bằng ID (UUID) do hệ thống tự sinh. Không có trường "mã ký hiệu" cho người dùng nhập. Điều này giúp đơn giản hóa form, tránh trùng lặp mã, và không cần lo lắng về việc module khác tham chiếu bằng mã.

**BR-006-02 — Hai trạng thái:** Biểu tượng có 2 trạng thái: ACTIVE (Sử dụng) — hiển thị trên bản đồ và trong dropdown chọn; INACTIVE (Không sử dụng) — không hiển thị nhưng vẫn tồn tại trong database.

**BR-006-03 — Không xóa biểu tượng đang được tham chiếu:** Trước khi cho phép xóa, hệ thống nên kiểm tra xem biểu tượng có đang được module nào sử dụng không. Nếu có, hiển thị cảnh báo thay vì xóa ngay. (Hiện tại tính năng này chưa có — thuộc phạm vi US-006-08 Could.)

**BR-006-04 — Hình ảnh lưu dạng base64:** Hình ảnh biểu tượng được lưu trực tiếp vào database dưới dạng chuỗi base64 trong cột `image` (TEXT). Không lưu file ra ổ đĩa. Cách này đơn giản, không cần cấu hình thư mục upload, và dữ liệu được backup cùng database.

**BR-006-05 — Quy tắc validate ảnh icon:** Ảnh tải lên phải đáp ứng tất cả điều kiện sau:

| Điều kiện | Giá trị | Thông báo lỗi |
|---|---|---|
| Định dạng file | PNG, JPEG, JPG | "Ảnh biểu tượng phải có định dạng PNG hoặc JPG" |
| Kích thước file | ≤ 500KB | "Ảnh biểu tượng không được vượt quá 500KB" |
| Kích thước ảnh (rộng × cao) | ≤ 128×128px | "Ảnh biểu tượng không được vượt quá 128×128 pixels" |
| Tỉ lệ khung hình | Hình vuông (1:1) | "Ảnh biểu tượng phải có tỉ lệ 1:1 (hình vuông)" |

Nếu người dùng chọn file không hợp lệ, hệ thống từ chối upload và hiển thị thông báo lỗi đỏ ngay dưới trường chọn ảnh, không đợi đến khi bấm Lưu mới báo lỗi.

---

## 6. Mô hình dữ liệu

### 6.1. Bảng MapSymbol — thư viện biểu tượng

Đây là bảng chính, mỗi dòng là một biểu tượng trong thư viện:

- **id:** UUID khóa chính (hệ thống tự sinh)
- **name:** tên biểu tượng (bắt buộc, tối đa 255 ký tự)
- **description:** ghi chú (không bắt buộc)
- **image:** hình ảnh biểu tượng, lưu dạng base64 (TEXT, bắt buộc)
- **status:** trạng thái — ACTIVE (1), INACTIVE (0)
- **createdBy:** UUID của người tạo
- Kế thừa từ BaseEntity: createdAt, updatedAt

### 6.2. Bảng MapIcon — ánh xạ biểu tượng vào đối tượng GIS

Bảng này thuộc module GIS (M-007), không phải F-006. Nó lưu mối liên kết "đối tượng GIS nào dùng biểu tượng nào". Được nhắc ở đây để BA hiểu mối quan hệ: F-006 quản lý thư viện biểu tượng, F-136/F-137/F-138 (M-007) dùng biểu tượng đó để gán cho đối tượng điểm/đường/vùng.

---

## 7. API Endpoints

### 7.1. Xem danh sách biểu tượng

**`GET /api/symbols`** — Lấy danh sách biểu tượng có phân trang, hỗ trợ tìm kiếm (`?search=`) và lọc theo trạng thái (`?status=ACTIVE`). API này được dùng bởi cả màn hình quản lý (admin) và các module nghiệp vụ (để load danh sách biểu tượng vào dropdown chọn icon).

### 7.2. Xem chi tiết một biểu tượng

**`GET /api/symbols/{id}`** — Lấy toàn bộ thông tin của một biểu tượng theo UUID.

### 7.3. Tạo biểu tượng mới

**`POST /api/symbols`** — Tạo biểu tượng mới. Body gồm: name (bắt buộc), description, image (bắt buộc), status (mặc định ACTIVE). Yêu cầu quyền `symbol.create`.

### 7.4. Sửa biểu tượng

**`PUT /api/symbols/{id}`** — Cập nhật thông tin biểu tượng. Cho phép sửa: name, description, image, status. Yêu cầu quyền `symbol.edit`.

### 7.5. Xóa biểu tượng

**`DELETE /api/symbols/{id}`** — Xóa biểu tượng khỏi database. Yêu cầu quyền `symbol.delete`.

---

## 8. Yêu cầu giao diện người dùng

> **Nguyên tắc cốt lõi:** Mọi giá trị màu sắc, khoảng cách, kích thước chữ trong giao diện đều được định nghĩa tập trung tại 2 file `frontend/src/theme.ts` và `frontend/src/tokens.ts`. Tuyệt đối không hardcode giá trị hex hay pixel trong component.

### 8.1. Bố cục chung

Màn hình dùng chung layout toàn hệ thống từ `AppLayout.tsx`: sidebar `272px` nền `#12468C`, header `64px`, nền nội dung `#eaf0f6`.

### 8.2. Màn hình danh sách

Màn hình chính sử dụng 5 component share từ `frontend/src/components/list-view/`:

1. **ScreenHeader:** hiển thị đường dẫn "Quản trị hệ thống > Quản lý biểu tượng trên bản đồ".
2. **FilterBar:** thanh lọc với: ô tìm kiếm (tìm theo tên biểu tượng), dropdown trạng thái (Sử dụng / Không sử dụng), nút Tìm kiếm và Làm mới.
3. **DataTable:** bảng với các cột:

| Cột | Nội dung | Ghi chú |
|---|---|---|
| STT | Số thứ tự | Tự động đánh số |
| Tên biểu tượng | Tên hiển thị | In đậm |
| Hình ảnh | Thumbnail | Max cao 30px, object-fit contain |
| Trạng thái | Tag màu | Xanh lá = Sử dụng, Xám = Không sử dụng |
| Thao tác | Xem chi tiết / Sửa / Xóa | Icon, phân quyền theo `symbol.*` |

4. **Pagination:** phân trang với tổng số biểu tượng.

### 8.3. Popup (Thêm mới = Sửa = Xem chi tiết)

Cả 3 popup dùng chung một cấu trúc form, khác nhau ở chế độ:

| Popup | Tiêu đề | Chế độ form |
|---|---|---|
| Thêm mới | "Thêm mới thông tin biểu tượng trên bản đồ" | Trống, có thể nhập |
| Sửa | "Cập nhật thông tin biểu tượng trên bản đồ" | Điền sẵn dữ liệu, có thể sửa |
| Xem chi tiết | "Chi tiết biểu tượng trên bản đồ" | Điền sẵn dữ liệu, chỉ đọc |

Form gồm các trường:
- **Tên biểu tượng:** Input text, bắt buộc, tối đa 255 ký tự
- **Hình ảnh:** Khu vực upload + preview 60×60px. Chỉ chấp nhận PNG/JPEG/JPG. Validate ngay khi chọn file (BR-006-05). Bắt buộc.
- **Trạng thái:** Select 2 lựa chọn (Sử dụng / Không sử dụng). Mặc định "Sử dụng".
- **Ghi chú:** Textarea, không bắt buộc, tối đa 500 ký tự.

Footer:
- Thêm mới: nút Hủy (outlined) + nút "Thêm mới" (primary)
- Sửa: nút Hủy (outlined) + nút "Cập nhật" (primary)
- Xem chi tiết: nút "Đóng" (primary)

Tất cả nút dùng `borderRadius = radiusPill`, `height = 40`. Form.Item `marginBottom = spaceFormField` (12px).

### 8.4. Trạng thái giao diện

- **Đang tải:** spinner của AntD
- **Không có dữ liệu:** thông báo "Chưa có biểu tượng nào"
- **Không tìm thấy:** thông báo "Không tìm thấy biểu tượng"
- **Lỗi tải dữ liệu:** Alert đỏ + nút "Thử lại" (`actionPrimary`)
- **Thành công:** toast "Đã tạo biểu tượng" / "Đã cập nhật biểu tượng" / "Đã xóa biểu tượng"
- **Lỗi validate ảnh:** thông báo đỏ dưới trường upload

### 8.5. Token sử dụng

- Màu chữ chính: `textPrimary`, màu phụ: `textSecondary`
- Nút chính: `actionPrimary`, tối đa 1 lần/màn (nút "Thêm mới")
- Form spacing: `spaceFormField = 12px`
- Input/Select/Button: `radiusPill = 999px`, `height = 40`
- Tag trạng thái: Sử dụng = xanh lá, Không sử dụng = xám
- Tiêu đề popup: `fontSizeLg = 15px`, `fontWeightBold = 600`, màu `colors.sidebarBg`

---

## 9. Khoảng trống so với code hiện tại

Code BE và FE hiện tại có một số điểm khác biệt lớn so với đặc tả này:

| # | Vấn đề | Mức độ | Hành động |
|---|---|---|---|
| 1 | Entity MapSymbol có trường `code` — cần **xóa** | Cao | Xóa cột code khỏi entity, DTO, DB migration |
| 2 | FE có trường nhập "Mã ký hiệu" — cần **xóa** | Cao | Xóa khỏi form và bảng |
| 3 | FE dùng Card + Table thủ công thay vì shared list-view components | Cao | Refactor dùng ScreenHeader + FilterBar + DataTable + Pagination |
| 4 | FE hardcode màu (`#fafafa`, `#d9d9d9`, `#bfbfbf`) | Cao | Thay bằng token từ theme.ts/tokens.ts |
| 5 | FE có 3 trạng thái, cần giảm còn 2 | Trung bình | Bỏ DEPRECATED, sửa enum BE và Select FE |
| 6 | Menu sidebar ghi "Biểu tượng bản đồ", cần đổi thành "Quản lý biểu tượng trên bản đồ" | Trung bình | Sửa AppLayout.tsx |
| 7 | Chưa có validate ảnh (định dạng, kích thước, tỉ lệ) | Trung bình | Thêm validate client-side + server-side |
| 8 | Chưa kiểm tra tham chiếu trước khi xóa | Thấp (Could) | Để cho US-006-08 |

---

## 10. Môi trường kỹ thuật

- **Backend:** Spring Boot + Spring Security + JWT
- **Frontend:** ReactJS với Ant Design v5
- **Database:** MSSQL 2022
- **Lưu trữ hình ảnh:** base64 trong database (cột TEXT)
- **Phân quyền:** `symbol.create`, `symbol.edit`, `symbol.delete`, menu yêu cầu `data:read`
