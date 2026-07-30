---
id: F-012
name: Xem chi tiết Cảng biển
slug: xem-cb
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:19Z
last-updated: 2026-07-29
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Xem chi tiết Cảng biển

**Tài liệu:** BA Feature Brief
**Feature:** F-012
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-07-29

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Tính năng này phục vụ việc **tra cứu và xem thông tin Cảng biển**, bao gồm hai màn hình chính trong cùng một luồng nghiệp vụ:

- **Màn hình Danh sách Cảng biển:** Hiển thị bảng danh sách tất cả Cảng biển với phân trang (20 bản ghi/trang), thanh tìm kiếm và bộ lọc theo mã cảng, tên cảng, tỉnh/thành phố, trạng thái phê duyệt và trạng thái hoạt động. Mỗi dòng có các hành động: Xem chi tiết, Chỉnh sửa, Xóa, Lịch sử.
- **Màn hình Chi tiết Cảng biển:** Hiển thị đầy đủ 15 trường thông tin của một Cảng biển bao gồm dữ liệu cơ bản, tọa độ GPS (định dạng ±XX.XXXXXX), trạng thái hiện tại, thông tin người tạo và người cập nhật cuối, danh sách tệp đính kèm. Hỗ trợ breadcrumb điều hướng và các hành động Phê duyệt/Từ chối (dành riêng cho Lãnh đạo).

Tính năng này được tổng hợp từ hai UI feature trước đây: F-068 (CangBienListPage) và F-069 (CangBienDetailPage), nay gộp thành một feature duy nhất vì luồng người dùng "xem danh sách → click vào xem chi tiết" là một quy trình liền mạch.

### 1.2. Tại sao cần tính năng này?

Việc cung cấp thông tin chi tiết về Cảng biển giúp các bên liên quan — từ cán bộ quản lý đến đối tác logistics — có thể tra cứu nhanh chóng, chính xác và đầy đủ các thông tin kỹ thuật, pháp lý về cảng. Cảng biển là tài sản kết cấu hạ tầng giao thông trọng yếu; việc có một giao diện tra cứu thống nhất giúp:

- Cán bộ quản lý nhà nước kiểm tra thông tin cảng trực thuộc đơn vị mình.
- Lãnh đạo ra quyết định phê duyệt dựa trên dữ liệu đầy đủ.
- Doanh nghiệp cảng và nhân viên vận hành tra cứu thông tin phục vụ tác nghiệp hàng ngày.

### 1.3. Luồng hoạt động chính

**Luồng Danh sách:**
1. Người dùng truy cập mục "Quản lý cảng biển" → hệ thống gọi `GET /api/v1/cang-bien` với tham số mặc định (page=0, size=20, sort=updatedAt,desc).
2. Hệ thống hiển thị bảng `CangBienListPage` với các cột: maCang, tenCang, tinhThanhPho, trangThaiPheDuyet (badge màu), trangThaiHoatDong, updatedAt.
3. Người dùng có thể nhập từ khóa tìm kiếm (mã/tên cảng) → live search với debounce 300ms → gọi lại API với `search` param.
4. Người dùng có thể chọn bộ lọc: tỉnh/thành phố (`tinhThanhPho`), trạng thái phê duyệt (`trangThaiPheDuyet`), trạng thái hoạt động (`trangThaiHoatDong`) → gọi lại API với các filter params.
5. Kết quả trả về trong vòng 3 giây.

**Luồng Chi tiết:**
1. Từ danh sách, người dùng click "Xem chi tiết" trên một dòng → chuyển hướng sang trang chi tiết với `id` của cảng.
2. Hệ thống gọi `GET /api/v1/cang-bien/:id` → hiển thị `CangBienDetailPage` với breadcrumb "Quản lý cảng biển > Chi tiết cảng [maCang]".
3. Trang chi tiết hiển thị 15 trường dữ liệu, tọa độ GPS định dạng ±XX.XXXXXX, badge trạng thái màu, danh sách đính kèm với nút Download/Print.
4. Nếu người dùng có vai trò Lãnh đạo, hiển thị thêm nút "Phê duyệt" / "Từ chối".
5. Responsive: desktop ≥1024px, tablet ≥768px.

> **Lưu ý:** Các thao tác Tạo mới (F-008), Cập nhật (F-009), Xóa (F-010), Phê duyệt (F-011) và Lịch sử thay đổi (F-013) là các feature riêng, không nằm trong phạm vi của feature này.

---

## 2. Ai dùng? Dùng như thế nào?

Quyền thao tác và xem tính năng được áp dụng theo hệ thống phân quyền tập trung của hệ thống. Mỗi vai trò người dùng sẽ có phạm vi truy cập và thao tác khác nhau trên tính năng này, được kiểm soát bởi cơ chế RBAC (Role-Based Access Control).

### 2.1. Logic phân quyền chung

Các thao tác trong tính năng được bảo vệ bởi các quyền (permissions) tương ứng. Người dùng chỉ có thể thực hiện những thao tác mà vai trò của họ được cấp quyền:

| Vai trò | Quyền xem | Quyền thao tác | Phạm vi dữ liệu | Ghi chú |
|---|---|---|---|---|
| Admin | Xem toàn bộ dữ liệu | Xem chi tiết, Chỉnh sửa, Xóa, Xem lịch sử | Toàn bộ hệ thống | Có thể thao tác mọi hành động |
| Lãnh đạo | Xem toàn bộ dữ liệu | Xem chi tiết, Phê duyệt/Từ chối | Toàn bộ hệ thống | Chỉ Lãnh đạo mới thấy nút Phê duyệt/Từ chối |
| Chuyên viên Cục | Xem Cảng biển của Cục mình | Xem chi tiết | Cảng biển thuộc orgUnit Cục | Có thể xem thông tin tạo/sửa nếu là Admin Cục |
| Chuyên viên Cảng vụ | Xem Cảng biển của Cảng vụ mình | Xem chi tiết | Cảng biển thuộc orgUnit Cảng vụ | Phạm vi dữ liệu theo đơn vị |
| Doanh nghiệp cảng | Xem Cảng biển của đơn vị mình | Xem chi tiết | Cảng biển thuộc orgUnit doanh nghiệp | Chỉ xem được cảng của đơn vị mình |
| Nhân viên vận hành | Xem hạn chế | Xem chi tiết (một số trường bị ẩn) | Cảng biển thuộc đơn vị mình | Một số trường nhạy cảm bị ẩn |

### 2.2. Logic phân quyền đặc biệt cho tài khoản Admin Cục

Đối với tài khoản **Admin Cục**, áp dụng logic phân quyền đặc biệt sau:

- **Xem full dữ liệu:** Admin Cục có quyền xem toàn bộ dữ liệu trên hệ thống, không giới hạn phạm vi đơn vị hay khu vực.
- **Xem thông tin người chỉnh sửa:** Với mỗi bản ghi, Admin Cục thấy được thông tin người chỉnh sửa cuối cùng (họ tên, tên đăng nhập).
- **Xem thời gian cập nhật:** Admin Cục thấy được thời gian cập nhật cuối cùng của dữ liệu (timestamp).
- **Xem người tạo mới:** Admin Cục thấy được thông tin người tạo mới bản ghi (họ tên, tên đăng nhập).
- **Xem thời gian tạo mới:** Admin Cục thấy được thời gian tạo mới dữ liệu (timestamp).

> **Ghi chú:** Các trường `người tạo mới`, `thời gian tạo mới`, `người chỉnh sửa`, `thời gian cập nhật` cần được bổ sung vào bảng dữ liệu tương ứng và chỉ hiển thị đối với tài khoản Admin Cục. Với các vai trò khác, các trường này bị ẩn khỏi giao diện.

---

## 3. User Stories

Dưới đây là các câu chuyện người dùng, sắp xếp theo mức độ ưu tiên (Must > Should > Could):

### Mức Must (bắt buộc có)

- **US-012-01:** Là người dùng có quyền xem, tôi muốn xem danh sách Cảng biển với phân trang để tra cứu nhanh các cảng hiện có.
- **US-012-02:** Là người dùng, tôi muốn tìm kiếm Cảng biển theo mã cảng, tên cảng hoặc tỉnh/thành phố để tìm đúng cảng mình cần.
- **US-012-03:** Là người dùng, tôi muốn lọc Cảng biển theo trạng thái phê duyệt và trạng thái hoạt động để thu hẹp kết quả tìm kiếm.
- **US-012-04:** Là người dùng, tôi muốn click vào một Cảng biển để xem thông tin chi tiết đầy đủ của cảng đó.
- **US-012-05:** Là Lãnh đạo, tôi muốn thấy nút Phê duyệt/Từ chối trên trang chi tiết để thực hiện phê duyệt ngay khi xem thông tin.

### Mức Should (nên có)

- **US-012-06:** Là người dùng, tôi muốn xem badge trạng thái phê duyệt với màu sắc tương ứng (vàng/xanh lá/đỏ) để nhận biết trạng thái trực quan.
- **US-012-07:** Là người dùng, tôi muốn tải xuống hoặc in tệp đính kèm từ trang chi tiết để lưu trữ hồ sơ cảng.

### Mức Could (có thể có sau)

- **US-012-08:** Là người dùng, tôi muốn sắp xếp danh sách theo từng cột để dễ dàng tìm kiếm theo thứ tự mong muốn.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

Mỗi yêu cầu dưới đây mô tả một điều hệ thống phải làm được, kèm theo cách xử lý khi có lỗi hoặc dữ liệu không như mong đợi.

**AC-012-01 — Hiển thị danh sách Cảng biển khi tải trang:** Khi người dùng truy cập trang danh sách, hệ thống gọi GET /api/v1/cang-bien với tham số mặc định (page=0, size=20, sort=updatedAt,desc) và hiển thị bảng kết quả. Nếu API lỗi (mạng, server 5xx), hiển thị thông báo lỗi kèm nút "Thử lại".

**AC-012-02 — Tìm kiếm Cảng biển với debounce:** Khi người dùng nhập từ khóa tìm kiếm (mã/tên cảng), hệ thống chờ 300ms sau lần gõ cuối cùng rồi gọi API với tham số search. Nếu kết quả trả về rỗng, hiển thị trạng thái "Không có dữ liệu" với hướng dẫn thử lại bộ lọc khác.

**AC-012-03 — Lọc danh sách theo tỉnh/thành phố và trạng thái:** Khi người dùng chọn bộ lọc (tỉnh/thành phố, trạng thái phê duyệt, trạng thái hoạt động), hệ thống gọi lại API với các tham số tương ứng. Nếu không có kết quả nào khớp bộ lọc, hiển thị trạng thái rỗng.

**AC-012-04 — Phân trang danh sách:** Hệ thống hiển thị tối đa 20 bản ghi mỗi trang, kèm thanh phân trang ở cuối bảng hiển thị tổng số bản ghi và số trang. Khi chuyển trang, hệ thống gọi lại API với tham số page tương ứng. Nếu không có dữ liệu, thanh phân trang ẩn đi.

**AC-012-05 — Hiển thị thông tin chi tiết Cảng biển:** Khi người dùng click "Xem chi tiết" trên một dòng, hệ thống gọi GET /api/v1/cang-bien/:id và hiển thị trang chi tiết với đầy đủ 15 trường. Nếu id không tồn tại (404), hiển thị thông báo "Cảng biển không tồn tại hoặc đã bị xóa".

**AC-012-06 — Định dạng tọa độ GPS:** Trên trang chi tiết, tọa độ GPS (viDo, kinhDo) được hiển thị với định dạng ±XX.XXXXXX (6 chữ số thập phân). Nếu giá trị null, hiển thị "—".

**AC-012-07 — Hiển thị badge trạng thái phê duyệt với màu sắc:** Badge trạng thái phê duyệt hiển thị với màu: CHỜ_PHÊ_DUYỆT = vàng (statusAttention), ĐƯỢC_PHÊ_DUYỆT = xanh lá (statusOperational), TỪ_CHỐI = đỏ (statusCritical). Badge có dạng pill. Các giá trị khác hiển thị với màu mặc định xám (statusDraft).

**AC-012-08 — Hiển thị danh sách tệp đính kèm:** Trên trang chi tiết, nếu cảng có tệp đính kèm, hiển thị danh sách file (PDF/DOCX/JPEG, tối đa 10MB mỗi file) kèm nút Download và Print. Nếu không có tệp đính kèm, hiển thị "Không có tệp đính kèm".

**AC-012-09 — Điều hướng breadcrumb:** Trên trang chi tiết, breadcrumb hiển thị "Quản lý cảng biển > Chi tiết cảng [maCang]". Khi click vào "Quản lý cảng biển", quay lại trang danh sách. Nếu maCang null, hiển thị "Chi tiết cảng" thay vì "Chi tiết cảng null".

**AC-012-10 — Giao diện responsive:** Trên desktop (≥1024px), hiển thị bảng đầy đủ cột. Trên tablet (≥768px), bảng thu gọn một số cột phụ. Trên mobile (<768px), bảng chuyển thành dạng thẻ (card view). Nếu responsive breakpoint không khớp, giữ nguyên layout desktop làm mặc định.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

Các quy tắc này là "luật chơi" mà mọi thành phần trong hệ thống phải tuân thủ:

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-012-01 | Tìm kiếm live search sử dụng debounce 300ms kể từ lần gõ cuối cùng của người dùng. | Search | UI spec F-068 |
| BR-012-02 | Mặc định danh sách chỉ hiển thị Cảng biển có trạng thái hoạt động "Hiện hành" hoặc "Tạm ngừng", trừ khi người dùng chọn bộ lọc khác. | Filter | Entity spec |
| BR-012-03 | Badge trạng thái phê duyệt sử dụng màu sắc: CHỜ_PHÊ_DUYỆT = vàng (statusAttention), ĐƯỢC_PHÊ_DUYỆT = xanh lá (statusOperational), TỪ_CHỐI = đỏ (statusCritical). Các giá trị ngoài 3 trạng thái trên hiển thị màu xám mặc định. | UI | F-069 |
| BR-012-04 | Tọa độ GPS (viDo, kinhDo) hiển thị với 6 chữ số thập phân, định dạng ±XX.XXXXXX. Giá trị null hiển thị "—". | UI | Entity spec |
| BR-012-05 | Phân trang mặc định 20 bản ghi mỗi trang. Khi danh sách có ≤ 20 bản ghi, không hiển thị thanh phân trang. | Pagination | UI spec F-068 |
| BR-012-06 | Hành động Phê duyệt/Từ chối trên trang chi tiết chỉ hiển thị cho người dùng có vai trò Lãnh đạo (hoặc Admin). Các vai trò khác không thấy 2 nút này. | UI | F-069 |
| BR-012-07 | Kết quả tìm kiếm và lọc phải trả về trong vòng 3 giây. Nếu quá thời gian, hiển thị thông báo lỗi timeout. | Performance | NFR spec |

---

## 6. Mô hình dữ liệu

Tính năng này sử dụng bảng dữ liệu sau trong cơ sở dữ liệu:

> **Quy ước đánh dấu:**
> - <span style="color:red;font-weight:bold">🔴 Chữ màu đỏ</span> = **trường mới cần thêm** vào bảng hiện có.
> - ~~Chữ gạch ngang~~ = **trường không cần thiết**, cần loại bỏ khỏi bảng.
> - Các trường không được đánh dấu là các trường hiện có, được giữ nguyên.

### 6.1. Bảng CangBien — Thông tin Cảng biển

Đây là bảng chính, lưu thông tin chi tiết của từng Cảng biển trên hệ thống.

Các trường thông tin:

- **id:** UUID, khóa chính, duy nhất cho mỗi bản ghi
- **maCang:** string (unique), mã cảng biển, duy nhất toàn hệ thống
- **tenCang:** string, tên cảng biển
- **tinhThanhPho:** string, tỉnh/thành phố nơi cảng tọa lạc
- **viDo:** BigDecimal, vĩ độ (GPS), định dạng thập phân
- **kinhDo:** BigDecimal, kinh độ (GPS), định dạng thập phân
- **dienTich:** BigDecimal, diện tích cảng (m²)
- **khaNangTiepNhan:** BigDecimal, khả năng tiếp nhận (tấn/năm hoặc TEU/năm)
- **trangThaiHoatDong:** string, trạng thái hoạt động (Hiện hành / Tạm ngừng / Ngừng hoạt động)
- **trangThaiPheDuyet:** string, trạng thái phê duyệt (CHỜ_PHÊ_DUYỆT / ĐƯỢC_PHÊ_DUYỆT / TỪ_CHỐI)
- **orgUnitId:** UUID, ID đơn vị quản lý cảng
- **createdBy:** string, tên đăng nhập người tạo bản ghi
- **updatedBy:** string, tên đăng nhập người cập nhật cuối
- **createdAt:** timestamp, thời điểm tạo bản ghi
- **updatedAt:** timestamp, thời điểm cập nhật cuối

---

## 7. API Endpoints

Hệ thống cung cấp các API để phục vụ các thao tác liên quan đến tính năng:

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| GET | `/api/v1/cang-bien` | Lấy danh sách Cảng biển với phân trang và bộ lọc. Query params: search, trangThaiHoatDong, trangThaiPheDuyet, tinhThanhPho, page, size, sort | Tất cả các role có quyền `port:read` |
| GET | `/api/v1/cang-bien/:id` | Lấy thông tin chi tiết của một Cảng biển theo UUID | Tất cả các role có quyền `port:read` |

---

## 8. Chi tiết nghiệp vụ từng phần

### 8.1. Luồng Danh sách Cảng biển

Trang danh sách (`CangBienListPage`) là điểm vào chính của tính năng. Chi tiết luồng đã được mô tả tại mục 1.3 và 4. Dưới đây là các điểm bổ sung:

- **FilterBar:** Gồm ô tìm kiếm (mã/tên cảng) với debounce 300ms, Select tỉnh/thành phố, Select trạng thái phê duyệt, Select trạng thái hoạt động. Khi thay đổi bất kỳ bộ lọc nào, tự động gọi lại API.
- **StatusTabs:** Hiển thị các tab theo trạng thái phê duyệt (CHỜ_PHÊ_DUYỆT / ĐƯỢC_PHÊ_DUYỆT / TỪ_CHỐI / Tất cả), mỗi tab kèm số lượng bản ghi. Tab đang chọn có gạch chân màu actionPrimary.
- **DataTable columns:** maCang, tenCang, tinhThanhPho, trangThaiPheDuyet (badge màu dạng pill), trangThaiHoatDong, updatedAt. Sticky header, hover row highlight.
- **Hành động mỗi dòng:** Xem chi tiết, Chỉnh sửa (→ F-009), Xóa (→ F-010), Lịch sử (→ F-013).
- **Pagination:** 20 bản ghi/trang, hiển thị tổng số bản ghi. Ẩn khi ≤20 bản ghi.

### 8.2. Luồng Xem chi tiết Cảng biển

Trang chi tiết (`CangBienDetailPage`) hiển thị đầy đủ thông tin của một Cảng biển. Chi tiết luồng đã được mô tả tại mục 1.3 và 4. Dưới đây là các điểm bổ sung:

- **Breadcrumb:** "Quản lý cảng biển > Chi tiết cảng [maCang]". Click "Quản lý cảng biển" quay về trang danh sách.
- **15 trường hiển thị:** id, maCang, tenCang, tinhThanhPho, viDo, kinhDo, dienTich, khaNangTiepNhan, trangThaiHoatDong, trangThaiPheDuyet, orgUnitId, createdBy, updatedBy, createdAt, updatedAt.
- **Định dạng GPS:** ±XX.XXXXXX (6 chữ số thập phân). Giá trị null hiển thị "—".
- **Badge trạng thái:** CHỜ_PHÊ_DUYỆT = vàng (statusAttention), ĐƯỢC_PHÊ_DUYỆT = xanh lá (statusOperational), TỪ_CHỐI = đỏ (statusCritical). Dùng badgeBaseStyle.
- **Đính kèm:** Danh sách file (PDF/DOCX/JPEG, max 10MB) với nút Download và Print. Nếu không có, hiển thị "Không có tệp đính kèm".
- **Hành động:** Phê duyệt/Từ chối (chỉ cho Lãnh đạo và Admin). Các vai trò khác không thấy 2 nút này.
- **Responsive:** Desktop ≥1024px, tablet ≥768px, mobile <768px chuyển sang cột đơn.

---

## 9. Yêu cầu phi chức năng

### 9.1. Hiệu năng

- Kết quả tìm kiếm và lọc danh sách phải trả về trong vòng 3 giây với 1000 bản ghi.
- Live search sử dụng debounce 300ms để giảm số lượng request không cần thiết.
- Phân trang mặc định 20 bản ghi/trang để tối ưu thời gian tải.

### 9.2. Khả năng mở rộng

- Hệ thống phải xử lý được ít nhất 1000 bản ghi Cảng biển mà không suy giảm hiệu năng.
- API danh sách hỗ trợ phân trang và sort để xử lý số lượng lớn dữ liệu.

### 9.3. Bảo mật

- Phân quyền RBAC được áp dụng trên tất cả các API: chỉ người dùng có quyền `port:read` mới truy cập được.
- Admin Cục có quyền xem full dữ liệu + thông tin người tạo/người sửa/thời gian tạo/thời gian cập nhật — các vai trò khác không thấy các trường này.
- API danh sách phải lọc dữ liệu theo phạm vi đơn vị của người dùng (orgUnitId).

### 9.4. Độ tin cậy

- Khi API danh sách hoặc chi tiết bị lỗi (network error, server 5xx), hiển thị thông báo lỗi thân thiện và nút "Thử lại".
- Khi API trả về 404 (id không tồn tại), hiển thị thông báo "Cảng biển không tồn tại hoặc đã bị xóa".
- Timeout request: nếu quá 10 giây không có phản hồi, hiển thị thông báo timeout và nút "Thử lại".

### 9.5. Trải nghiệm người dùng

- Giao diện responsive: desktop ≥1024px, tablet ≥768px (bảng thu gọn cột phụ), mobile <768px (bảng chuyển thành dạng thẻ, thanh menu thu gọn hamburger).
- Có loading skeleton hoặc spinner khi đang tải dữ liệu (không hiển thị bảng trống).
- Có trạng thái rỗng (empty state) với thông báo "Không có dữ liệu" và hướng dẫn thử bộ lọc khác.
- Có trạng thái lỗi với thông báo lỗi và nút "Thử lại" màu actionPrimary.
- Badge trạng thái phê duyệt với màu sắc trực quan giúp người dùng nhận biết nhanh.

### 9.6. Tuân thủ pháp lý

- Dữ liệu Cảng biển hiển thị là thông tin công bố công khai về cảng biển phục vụ tra cứu, không chứa thông tin bí mật nhà nước hay bí mật kinh doanh.

---

## 10. Yêu cầu giao diện người dùng

> **Nguyên tắc cốt lõi:** Mọi giá trị màu sắc, khoảng cách, kích thước chữ trong giao diện đều được định nghĩa tập trung tại 2 file `frontend/src/theme.ts` (layout, màu nền sidebar/header) và `frontend/src/tokens.ts` (màu chữ, màu trạng thái, thang số). Tuyệt đối không hardcode giá trị hex hay pixel trong component.

### 10.1. Bố cục chung

Màn hình Xem chi tiết Cảng biển dùng chung bố cục toàn hệ thống, bao gồm:

- **Thanh menu trái (sidebar):** rộng `layout.sidebarWidth` (272px), nền màu `colors.sidebarBg` (#12468C). Mục đang chọn được tô màu xanh sáng `colors.sidebarActiveBg` (#1B84FF) dạng pill. Khi thu gọn (trên điện thoại), rộng còn `layout.sidebarCollapsedWidth` (80px) và chuyển thành nút hamburger.
- **Thanh tiêu đề trên cùng (header):** cao `layout.headerHeight` (64px), nền trắng `colors.containerBg`, chứa tên người dùng và avatar.
- **Vùng nội dung chính:** nền `colors.bodyBg` (#F5F8FA), giúp các card trắng bên trong nổi bật hơn.

### 10.2. Hệ thống màu sắc

Mỗi màu sắc trong giao diện được gán một "vai trò" rõ ràng. Developer không được dùng màu theo cảm tính mà phải import đúng token:

| Khi cần... | Dùng token | Màu thực tế |
|---|---|---|
| Tiêu đề trang, số liệu quan trọng | `textPrimary` | `#0c2438` |
| Nhãn field, mô tả | `textSecondary` | `#566a7c` |
| Thời gian, trạng thái phụ, caption | `textTertiary` | `#93a3b3` |
| Nền card, modal, bảng | `surfaceCard` | `#FFFFFF` |
| Nền vùng nội dung chính | `surfacePage` | `#eaf0f6` |
| Viền card, đường kẻ | `borderDefault` | `rgba(11,46,79,0.09)` |
| Nút chính, link | `actionPrimary` | `#0E6FD6` |
| Trạng thái CHỜ_PHÊ_DUYỆT (badge) | `statusAttention` | `#EDA100` (vàng) |
| Trạng thái ĐƯỢC_PHÊ_DUYỆT (badge) | `statusOperational` | `#1BAF7A` (xanh lá) |
| Trạng thái TỪ_CHỐI (badge) | `statusCritical` | `#E34948` (đỏ) |
| Trạng thái mặc định (badge) | `statusDraft` | `#93a3b3` (xám) |

### 10.3. Thang số — chỉ dùng giá trị cho phép

**Khoảng cách (spacing):** 4px (`spaceXs`), 8px (`spaceSm`), 12px (`spaceFormField`), 16px (`spaceMd`), 24px (`spaceLg`), 32px (`spaceXl`). Trong đó 12px là khoảng cách mặc định giữa các trường trong form, 16px là padding mặc định của card.

**Bo góc (radius):** 4px (`radiusSm` — cho ô textarea), 8px (`radiusMd`), 12px (`radiusLg` — cho card), 999px (`radiusPill` — dạng pill cho input, select, button, badge).

**Cỡ chữ (font size):** 10px (`fontSizeSm` — metadata, caption), 13px (`fontSizeMd` — nhãn, nội dung), 15px (`fontSizeLg` — tiêu đề card, tiêu đề section), 18px (`fontSizeXl` — tiêu đề trang), 22px (`fontSizeHeading`), 28px (`fontSizeDisplay`), 34px (`fontSizeStat` — số liệu KPI).

**Độ đậm chữ (font weight):** 400 (`fontWeightNormal` — nội dung), 500 (`fontWeightMedium` — nhãn, nút), 600 (`fontWeightBold` — số liệu quan trọng, tiêu đề).

**Font chữ:** `'Inter', -apple-system, BlinkMacSystemFont, sans-serif` cho toàn bộ văn bản.

> **Cấm tuyệt đối:** spacing 6, 10, 14, 18; radius 6, 7, 10; font-size 12, 14, 16, 24.

### 10.4. Style có sẵn — dùng lại, đừng tự chế

Hệ thống đã định nghĩa sẵn các kiểu dáng phổ biến. Khi cần hiển thị:

- **Thời gian, caption:** dùng `metaStyle` (chữ nhỏ 10px, màu xám nhạt, weight 400)
- **Card nội dung:** dùng `cardStyle` (nền trắng, viền 0.5px, bo góc 12px, padding 16px)
- **Tag trạng thái:** dùng `badgeBaseStyle` (chữ nhỏ, weight 500, padding 2px-8px, pill) — thêm màu tương ứng (statusOperational / statusAttention / statusCritical)
- **Link, nút text:** dùng `actionStyle` (pill, màu actionPrimary, weight 500)
- **Đường kẻ ngăn cách:** dùng `dividerStyle`

### 10.5. Giới hạn màu nhấn — tối đa 3 lần mỗi màn

Màu `actionPrimary` (`#0E6FD6`) là màu nhấn mạnh nhất, dùng cho các hành động chính. Để tránh giao diện bị "rối", màu này chỉ xuất hiện tối đa 3 lần trên toàn bộ màn hình Xem chi tiết Cảng biển:

1. **Nút "Xem chi tiết"** trên bảng danh sách (mỗi dòng) — màu chữ hoặc icon.
2. **Breadcrumb link** "Quản lý cảng biển" trên trang chi tiết — link màu actionPrimary.
3. **Nút "Thử lại"** khi có lỗi tải dữ liệu — nút primary.

Các màu trạng thái (xanh lá `statusOperational`, vàng `statusAttention`, đỏ `statusCritical`) và màu chữ (`textPrimary`, `textSecondary`, `textTertiary`) không tính vào giới hạn này.

### 10.6. Màn hình Danh sách

Màn hình chính sử dụng các component dùng chung toàn hệ thống từ `frontend/src/components/list-view/` — không được tự tạo lại:

1. **ScreenHeader:** hiển thị breadcrumb "Quản lý cảng biển".
2. **FilterBar:** thanh lọc nằm ngang phía trên bảng, gồm: ô tìm kiếm (mã/tên cảng), Select tỉnh/thành phố, Select trạng thái phê duyệt, Select trạng thái hoạt động.
3. **StatusTabs:** 4 tab nằm ngang: Tất cả, CHỜ_PHÊ_DUYỆT, ĐƯỢC_PHÊ_DUYỆT, TỪ_CHỐI. Mỗi tab hiển thị số lượng bản ghi trong nhóm đó. Tab đang chọn có đường gạch chân màu `actionPrimary` (dùng token `actionPrimary`).
4. **DataTable:** bảng dữ liệu với tiêu đề cột cố định khi cuộn (sticky header), dòng được tô sáng khi di chuột qua (hover row). Các cột hiển thị:

| STT | Tên trường | Loại ĐK | Edit | Bắt buộc | Default | Mô tả |
|---|---|---|---|---|---|---|
| 1 | STT | Text (tự động) | Không | Có | Tự động đánh số | Số thứ tự dòng |
| 2 | maCang | Text | Không | Có | — | Mã cảng biển |
| 3 | tenCang | Text | Không | Có | — | Tên cảng biển |
| 4 | tinhThanhPho | Text | Không | Có | — | Tỉnh/Thành phố |
| 5 | trangThaiPheDuyet | Badge (pill) | Không | Có | — | Trạng thái phê duyệt, badge màu theo quy tắc BR-012-03 |
| 6 | trangThaiHoatDong | Badge (pill) | Không | Có | — | Trạng thái hoạt động |
| 7 | updatedAt | Text | Không | Có | — | Ngày cập nhật cuối |

5. **Pagination:** thanh điều hướng trang ở cuối bảng (20/trang), hiển thị tổng số dòng và số trang. Ẩn khi ≤ 20 bản ghi.

### 10.7. Màn hình Chi tiết

Trang chi tiết (`CangBienDetailPage`) hiển thị đầy đủ thông tin của một Cảng biển với:

- **Breadcrumb:** "Quản lý cảng biển > Chi tiết cảng [maCang]" — sử dụng theme.ts breadcrumb tokens.
- **15 trường chi tiết:**

| STT | Tên trường | Loại ĐK | Edit | Bắt buộc | Default | Mô tả |
|---|---|---|---|---|---|---|
| 1 | maCang | Text | Không | Có | — | Mã cảng biển |
| 2 | tenCang | Text | Không | Có | — | Tên cảng biển |
| 3 | tinhThanhPho | Text | Không | Có | — | Tỉnh/Thành phố |
| 4 | viDo | Text (GPS) | Không | Có | — | Vĩ độ, định dạng ±XX.XXXXXX |
| 5 | kinhDo | Text (GPS) | Không | Có | — | Kinh độ, định dạng ±XX.XXXXXX |
| 6 | dienTich | Number | Không | Không | — | Diện tích cảng (m²) |
| 7 | khaNangTiepNhan | Number | Không | Không | — | Khả năng tiếp nhận |
| 8 | trangThaiHoatDong | Badge (pill) | Không | Có | — | Trạng thái hoạt động |
| 9 | trangThaiPheDuyet | Badge (pill) | Không | Có | — | Trạng thái phê duyệt, badge màu theo quy tắc BR-012-03 |
| 10 | orgUnitId | Text | Không | Có | — | ID đơn vị quản lý |
| 11 | createdBy | Text | Không | Không | — | Người tạo (chỉ Admin Cục thấy) |
| 12 | updatedBy | Text | Không | Không | — | Người cập nhật cuối (chỉ Admin Cục thấy) |
| 13 | createdAt | Text (datetime) | Không | Không | — | Thời gian tạo (chỉ Admin Cục thấy) |
| 14 | updatedAt | Text (datetime) | Không | Có | — | Thời gian cập nhật cuối |
| 15 | id | Text | Không | Có | — | UUID của cảng (ẩn mặc định, chỉ hiện debug) |

- **Badge trạng thái:** CHỜ_PHÊ_DUYỆT = vàng (dùng `statusAttention` + `badgeBaseStyle`), ĐƯỢC_PHÊ_DUYỆT = xanh lá (dùng `statusOperational` + `badgeBaseStyle`), TỪ_CHỐI = đỏ (dùng `statusCritical` + `badgeBaseStyle`).
- **Đính kèm:** Danh sách file (PDF/DOCX/JPEG, max 10MB) với nút Download và Print.
- **Hành động:** Phê duyệt/Từ chối (chỉ Lãnh đạo và Admin). Các vai trò khác không thấy 2 nút này.

### 10.8. Các trạng thái giao diện

Giao diện phải xử lý đầy đủ các trạng thái sau:

- **Đang tải:** hiển thị spinner của Ant Design hoặc khung xương (skeleton) — không hiển thị bảng trống gây hiểu nhầm là không có dữ liệu.
- **Không có dữ liệu:** hiển thị biểu tượng và dòng chữ "Không có dữ liệu" với màu chữ `textSecondary` và cỡ chữ `fontSizeMd` (13px).
- **Lỗi tải dữ liệu:** hiển thị cảnh báo đỏ và nút "Thử lại" màu `actionPrimary` dạng `actionStyle`.

### 10.9. Phân quyền hiển thị

Giao diện tự động ẩn/hiện các thành phần dựa trên vai trò người dùng:

| Vai trò | Thấy thành phần nào | Ghi chú |
|---|---|---|
| Admin | Toàn bộ giao diện: danh sách, chi tiết, badge, đính kèm, nút Phê duyệt/Từ chối, nút Chỉnh sửa/Xóa/Lịch sử | Full quyền |
| Lãnh đạo | Danh sách, chi tiết, badge, đính kèm, nút Phê duyệt/Từ chối | Không thấy nút Chỉnh sửa/Xóa |
| Chuyên viên Cục | Danh sách (theo orgUnit), chi tiết, badge, đính kèm | Không thấy nút Phê duyệt/Từ chối, Chỉnh sửa/Xóa |
| Chuyên viên Cảng vụ | Danh sách (theo orgUnit), chi tiết, badge, đính kèm | Không thấy nút Phê duyệt/Từ chối, Chỉnh sửa/Xóa |
| Doanh nghiệp cảng | Danh sách (theo orgUnit), chi tiết, badge, đính kèm | Không thấy nút Phê duyệt/Từ chối, Chỉnh sửa/Xóa |
| Nhân viên vận hành | Danh sách (theo orgUnit), chi tiết (hạn chế trường), badge | Một số trường bị ẩn |
| Admin Cục | Xem full dữ liệu + thông tin người tạo, người sửa, thời gian tạo, thời gian cập nhật | Logic đặc biệt (xem mục 2.2) |

### 10.10. Giao diện trên điện thoại

Khi màn hình nhỏ hơn 768px:

- Thanh menu trái thu gọn thành nút hamburger, rộng `layout.sidebarCollapsedWidth` (80px).
- Bảng dữ liệu chuyển thành dạng thẻ (card view) — mỗi bản ghi là một card.
- Thanh lọc (FilterBar) chuyển thành panel có thể gập/mở.
- Modal thu nhỏ còn 90% chiều rộng màn hình.
