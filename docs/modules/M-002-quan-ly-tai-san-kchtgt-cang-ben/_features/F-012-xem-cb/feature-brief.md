---
id: F-012
name: Xem danh sách & Chi tiết Cảng biển
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
# Đặc tả nghiệp vụ: Xem danh sách & Chi tiết Cảng biển

**Tài liệu:** BA Feature Brief
**Feature:** F-012 — Xem danh sách & Chi tiết Cảng biển
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-07-29

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Tính năng cho phép người dùng tra cứu, lọc và xem danh sách Cảng biển trong hệ thống, sau đó nhấp vào một cảng để xem thông tin chi tiết đầy đủ. Tính năng gồm 2 màn hình:

- **Màn hình Danh sách (CangBienListPage):** hiển thị danh sách Cảng biển với đầy đủ chức năng tìm kiếm, lọc, sắp xếp và phân trang. Mỗi dòng có các hành động phù hợp với phân quyền người dùng.
- **Màn hình Chi tiết (CangBienDetailPage):** hiển thị toàn bộ thông tin của một Cảng biển được chọn, tổ chức theo dạng tab. Tab mặc định "Thông tin chung" hiển thị đầy đủ các trường từ form Tạo mới (F-008). Các tab còn lại (Kết cấu hạ tầng khác, Quy hoạch, Vận hành khai thác, Bảo trì, Sự cố) là placeholder — dữ liệu thuộc các bảng khác, sẽ được bổ sung trong các giai đoạn sau.

F-012 đóng vai trò **màn hình trung tâm (hub)** của toàn bộ module Quản lý Cảng biển. Tất cả các thao tác nghiệp vụ khác — Tạo mới (F-008), Cập nhật (F-009), Xóa (F-010), Phê duyệt (F-011) — đều được khởi tạo từ màn hình Danh sách hoặc Chi tiết của F-012, và sau khi hoàn thành đều điều hướng quay về F-012.

### 1.2. Tại sao cần tính năng này?

- Danh sách tập trung giúp quản lý toàn bộ Cảng biển trên một màn hình duy nhất với khả năng lọc và tìm kiếm linh hoạt
- Trang chi tiết cung cấp cái nhìn toàn diện về một cảng, làm cơ sở cho các thao tác tiếp theo (chỉnh sửa, phê duyệt, xóa)

### 1.3. Luồng hoạt động chính

F-012 là điểm vào (entry point) của module Quản lý Cảng biển. Luồng happy case diễn ra như sau:

1. Người dùng đăng nhập, từ menu chọn "Quản lý Cảng biển" → hệ thống hiển thị màn hình Danh sách Cảng biển.
2. Người dùng tìm kiếm theo tên cảng biển hoặc lọc theo Đơn vị quản lý, Phân cấp cảng biển và các bộ lọc nâng cao → hệ thống trả về danh sách kết quả phù hợp.
3. Người dùng nhấp vào một dòng trong bảng → hệ thống điều hướng đến màn hình Chi tiết Cảng biển, hiển thị tab "Thông tin chung" với toàn bộ thông tin từ F-008. Người dùng có thể chuyển qua các tab khác để xem thêm nhóm thông tin (sẽ bổ sung sau).
4. Từ màn hình Danh sách, người dùng nhấn "Thêm mới" → hệ thống mở form Tạo mới (F-008). Sau khi lưu thành công → hệ thống điều hướng quay về Danh sách, bản ghi mới xuất hiện trong bảng.
5. Từ màn hình Danh sách hoặc Chi tiết, người dùng thực hiện Cập nhật (F-009), Xóa (F-010), hoặc Phê duyệt (F-011) → sau khi hoàn thành, hệ thống đều điều hướng quay về màn hình Danh sách F-012.

---

## 2. Ai dùng? Dùng như thế nào?

Quyền thao tác và xem tính năng được áp dụng theo hệ thống phân quyền tập trung của hệ thống. Mỗi vai trò người dùng sẽ có phạm vi truy cập và thao tác khác nhau trên tính năng này, được kiểm soát bởi cơ chế RBAC (Role-Based Access Control).

### 2.2. Logic phân quyền đặc biệt cho tài khoản Admin Cục

Đối với tài khoản **Admin Cục**, áp dụng logic phân quyền đặc biệt sau:

- **Xem full dữ liệu:** Admin Cục có quyền xem toàn bộ Cảng biển trên hệ thống, không giới hạn phạm vi đơn vị.
- **Xem thông tin người chỉnh sửa:** Với mỗi bản ghi, Admin Cục thấy được thông tin người chỉnh sửa cuối cùng (họ tên, tên đăng nhập).
- **Xem thời gian cập nhật:** Admin Cục thấy được thời gian cập nhật cuối cùng của dữ liệu (timestamp).
- **Xem người tạo mới:** Admin Cục thấy được thông tin người tạo mới bản ghi (họ tên, tên đăng nhập).
- **Xem thời gian tạo mới:** Admin Cục thấy được thời gian tạo mới dữ liệu (timestamp).

> **Ghi chú:** Các trường `createdBy`, `createdAt`, `updatedBy`, `updatedAt` cần được bổ sung vào bảng dữ liệu tương ứng và chỉ hiển thị đối với tài khoản Admin Cục. Với các vai trò khác, các trường này bị ẩn khỏi giao diện.

---

## 3. User Stories

Dưới đây là các câu chuyện người dùng, sắp xếp theo mức độ ưu tiên (Must > Should > Could):

### Mức Must (bắt buộc có)

- **US-012-01:** Là Cán bộ/admin-operation/system-admin, tôi muốn xem danh sách Cảng biển với đầy đủ các cột (STT, Đơn vị quản lý, Tên cảng biển, Nhóm cảng biển, Địa điểm, Phân cấp cảng biển, Ngày cập nhật, Cán bộ cập nhật, Trạng thái, Thao tác) để nắm bắt tổng quan tình trạng các cảng.
- **US-012-02:** Là Cán bộ/admin-operation/system-admin, tôi muốn tìm kiếm Cảng biển theo tên cảng để nhanh chóng định vị cảng cần xem.
- **US-012-03:** Là Cán bộ/admin-operation/system-admin, tôi muốn lọc danh sách Cảng biển theo Đơn vị quản lý, Phân cấp cảng biển, và các bộ lọc nâng cao (Nhóm cảng biển, Địa điểm, Ngày cập nhật, Trạng thái) để thu hẹp phạm vi tra cứu.
- **US-012-04:** Là Cán bộ/admin-operation/system-admin, tôi muốn nhấp vào một Cảng biển từ danh sách để xem đầy đủ thông tin chi tiết.
- **US-012-05:** Là Cán bộ/admin-operation, tôi muốn xem badge trạng thái màu sắc trên danh sách để nhận diện nhanh tình trạng của từng cảng.
- **US-012-06:** Là Admin Cục, tôi muốn xem thông tin người tạo, người chỉnh sửa và thời gian cập nhật của từng Cảng biển để phục vụ công tác kiểm toán.

### Mức Should (nên có)

- **US-012-07:** Là Cán bộ/admin-operation, tôi muốn sắp xếp danh sách theo từng cột (Tên cảng biển, Ngày cập nhật) để tổ chức dữ liệu theo nhu cầu.
- **US-012-08:** Là Cán bộ/admin-operation, tôi muốn thấy breadcrumb "Quản lý cảng biển > Chi tiết cảng [maCang]" trên trang chi tiết để dễ dàng điều hướng quay lại danh sách.

### Mức Could (có thể có sau)

- **US-012-09:** Là Cán bộ/admin-operation, tôi muốn xem trước thông tin tóm tắt khi di chuột qua một dòng trong danh sách (tooltip preview).
- **US-012-10:** Là Cán bộ/admin-operation, tôi muốn xuất danh sách Cảng biển đang lọc ra file Excel để báo cáo.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

Mỗi yêu cầu dưới đây mô tả một điều hệ thống phải làm được, kèm theo cách xử lý khi có lỗi hoặc dữ liệu không như mong đợi.

**AC-012-01 — Hiển thị danh sách Cảng biển:** Hệ thống hiển thị bảng danh sách Cảng biển với các cột: STT, Đơn vị quản lý, Tên cảng biển, Nhóm cảng biển, Địa điểm, Phân cấp cảng biển, Ngày cập nhật, Cán bộ cập nhật, Trạng thái (badge màu), Thao tác. Mặc định hiển thị `pageSize` dòng/trang, lọc theo Đơn vị quản lý của người dùng đang đăng nhập. Nếu không có dữ liệu, hiển thị empty state với hướng dẫn "Chưa có Cảng biển nào được tạo".

**AC-012-02 — Tìm kiếm theo tên cảng biển:** Người dùng nhập từ khóa vào ô "Tên cảng biển", hệ thống lọc danh sách theo tên cảng chứa từ khóa (không phân biệt hoa/thường, tự động trim khoảng trắng thừa). Kết quả được cập nhật với debounce 300ms. Nếu không tìm thấy kết quả, hiển thị thông báo "Không tìm thấy Cảng biển nào phù hợp".

**AC-012-03 — Bộ lọc danh sách:** Người dùng chọn Đơn vị quản lý (*bắt buộc, mặc định theo đơn vị đang đăng nhập), Phân cấp cảng biển từ dropdown Select — hệ thống lọc tương ứng. Bộ lọc nâng cao (có thể gập/mở) cho phép lọc thêm theo Nhóm cảng biển, Địa điểm (Tỉnh/Thành phố), Ngày cập nhật (Từ ngày - Đến ngày), và Trạng thái. Có thể kết hợp nhiều bộ lọc. Khi thay đổi bất kỳ bộ lọc nào, hệ thống reset về page=1. Khi không có kết quả sau lọc, hiển thị empty state.

**AC-012-04 — Phân trang và sắp xếp:** Danh sách hiển thị tối đa `pageSize` dòng/trang với thanh điều hướng trang ở cuối bảng. Người dùng có thể sắp xếp theo cột bằng cách nhấp vào tiêu đề cột (Tên cảng biển, Ngày cập nhật). Trang hiện tại và tổng số trang được hiển thị rõ ràng.

**AC-012-05 — Hành động trên mỗi dòng:** Mỗi dòng trong danh sách hiển thị dropdown Thao tác với các lựa chọn phù hợp phân quyền: "Xem chi tiết" (mọi role có `port:read`), "Sửa" (role có `port:update`). Nút "Thêm mới" trên ScreenHeader chỉ hiển thị khi role có `port:create`.

**AC-012-06 — Xem chi tiết Cảng biển:** Người dùng nhấp vào "Xem chi tiết" từ danh sách, hệ thống gọi `GET /api/v1/cang-bien/:id` và hiển thị trang CangBienDetailPage với giao diện dạng tab. Tab mặc định "Thông tin chung" hiển thị đầy đủ các nhóm: Thông tin chung (8 trường), Chỉ số tổng hợp (14 trường), Thông tin GIS (4 trường), Tọa độ GPS (bảng danh sách), Công trình KCHT trực thuộc (bảng danh sách), File đính kèm, Ghi chú, Trạng thái (badge màu), và Thông tin kiểm toán. Tọa độ GPS hiển thị định dạng ±XX.XXXXXX. Các tab còn lại (Kết cấu hạ tầng khác, Quy hoạch, Vận hành khai thác, Bảo trì, Sự cố) hiển thị placeholder "Đang phát triển". Nếu API trả lỗi 404, hiển thị thông báo "Không tìm thấy Cảng biển này".

**AC-012-07 — Hiển thị đính kèm:** Nếu Cảng biển có file đính kèm, trang chi tiết hiển thị danh sách file với tên, định dạng, dung lượng. Mỗi file có nút Download và Print. Hỗ trợ định dạng PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF, tối đa 20MB/file, tối đa 10 files. Nếu không có đính kèm, hiển thị "Không có tài liệu đính kèm".

**AC-012-08 — Breadcrumb điều hướng:** Trang chi tiết hiển thị breadcrumb "Quản lý cảng biển > Chi tiết cảng [maCang]". Người dùng có thể nhấp vào "Quản lý cảng biển" để quay lại danh sách. Nếu truy cập trực tiếp URL chi tiết, breadcrumb vẫn hiển thị đầy đủ.

**AC-012-09 — Hành động trên trang chi tiết:** Trang chi tiết hiển thị các nút hành động theo phân quyền: "Chỉnh sửa" (điều hướng đến F-009), "Xóa" (mở dialog xác nhận F-010), "Lịch sử" (điều hướng đến F-013 nếu có), "Phê duyệt"/"Từ chối" (chỉ hiển thị cho Lãnh đạo, điều hướng đến F-011).

**AC-012-10 — Responsive:** Giao diện danh sách và chi tiết responsive trên desktop (≥1024px) và tablet (≥768px). Trên mobile, bảng chuyển thành dạng thẻ (card), breadcrumb giữ nguyên.

**AC-012-11 — Empty state và loading:** Khi đang tải dữ liệu, hiển thị spinner/skeleton. Khi không có dữ liệu, hiển thị empty state với icon và hướng dẫn phù hợp. Khi lỗi tải dữ liệu, hiển thị thông báo lỗi và nút "Thử lại".

---

## 5. Quy tắc nghiệp vụ (Business Rules)

Các quy tắc này là "luật chơi" mà mọi thành phần trong hệ thống phải tuân thủ:

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-012-01 | Tìm kiếm theo tên cảng biển, không phân biệt hoa/thường, tự động trim khoảng trắng thừa, debounce 300ms trước khi gọi API | Search | F-012 |
| BR-012-02 | Đơn vị quản lý là bộ lọc bắt buộc (*), mặc định theo đơn vị của người dùng đang đăng nhập; người dùng có thể chọn đơn vị khác trong phạm vi được phân quyền | Filter | F-012 |
| BR-012-03 | Badge trạng thái hiển thị trên danh sách và chi tiết: Nháp = vàng (`statusAttention`), Chờ phê duyệt = vàng (`statusAttention`), Được phê duyệt = xanh lá (`statusOperational`), Từ chối = đỏ (`statusCritical`), Tạm ngừng = vàng (`statusAttention`), Đã xóa = đỏ (`statusCritical`) | UI | F-008 |
| BR-012-04 | Tọa độ GPS hiển thị định dạng ±XX.XXXXXX (5 chữ số thập phân), vĩ độ [-90, 90], kinh độ [-180, 180] | Detail | Entity spec |
| BR-012-05 | Đính kèm hỗ trợ PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF, tối đa 20MB/file, tối đa 10 files; các định dạng khác bị từ chối khi upload | Attachments | F-008 |
| BR-012-06 | Nút hành động trên danh sách và trang chi tiết được kiểm soát bởi RBAC: chỉ hiển thị khi người dùng có permission tương ứng | UI | F-012 |
| BR-012-07 | Các trường `createdBy`, `createdAt`, `updatedBy`, `updatedAt` chỉ hiển thị với tài khoản Admin Cục; các vai trò khác không thấy các trường này. Riêng cột "Cán bộ cập nhật" trên danh sách hiển thị họ tên từ `updated_by` cho mọi role | UI | Template, Section 2.2 |

---

## 6. Mô hình dữ liệu

Tính năng này tạo ra/sửa đổi các bảng dữ liệu sau trong cơ sở dữ liệu:

> **Quy ước đánh dấu:**
> - 🔴 **Chữ màu đỏ** = trường mới cần thêm vào bảng hiện có.
> - ~~Chữ gạch ngang~~ = trường không cần thiết, cần loại bỏ.
> - Các trường không đánh dấu là trường hiện có, được giữ nguyên.

### 6.1. Bảng `port` — Cảng biển

Đây là bảng chính lưu thông tin Cảng biển. Tính năng F-012 chỉ đọc dữ liệu, không tạo/sửa cấu trúc bảng. Các trường được đồng bộ từ F-008 (Tạo mới).

**Thông tin chung:**
- **id:** UUID, khóa chính
- **port_code:** VARCHAR(20), UNIQUE, NOT NULL — Mã tự sinh CB-XXXXXX
- **port_name:** NVARCHAR(255), NOT NULL — Tên cảng biển
- **managing_unit:** UUID, FK → org_unit — Đơn vị quản lý
- 🔴 **port_group:** NVARCHAR(100) — Nhóm cảng biển
- **province_city:** NVARCHAR(100) — Tỉnh/Thành phố
- 🔴 **detailed_address:** NVARCHAR(500) — Địa điểm chi tiết
- 🔴 **port_classification:** NVARCHAR(100) — Phân cấp cảng biển
- 🔴 **water_area_scope:** NVARCHAR(500) — Phạm vi vùng nước

**Chỉ số tổng hợp (14 trường, DEFAULT 0, ≥ 0):**
- 🔴 **total_berths:** INT — Tổng số bến cảng
- 🔴 **total_anchorage_transshipment_zones:** INT — Tổng số khu neo đậu, khu chuyển tải
- 🔴 **total_public_channels:** INT — Tổng số tuyến luồng HH công cộng
- 🔴 **total_dedicated_channels:** INT — Tổng số tuyến luồng HH chuyên dùng
- 🔴 **total_public_channel_length_km:** DECIMAL(10,2) — Tổng chiều dài luồng HH công cộng (km)
- 🔴 **total_dedicated_channel_length_km:** DECIMAL(10,2) — Tổng chiều dài luồng HH chuyên dùng (km)
- 🔴 **total_buoys_beacons:** INT — Tổng số phao tiêu, báo hiệu HH trên luồng
- 🔴 **total_dikes_revetments:** INT — Tổng số đê, kè
- 🔴 **total_dike_revetment_length_km:** DECIMAL(10,2) — Tổng chiều dài hệ thống đê, kè (km)
- 🔴 **total_lighthouses:** INT — Tổng số đèn biển, đăng, tiêu độc lập
- 🔴 **total_buoy_berths:** INT — Số lượng bến phao
- 🔴 **total_anchorages:** INT — Số lượng khu neo đậu
- 🔴 **total_transshipment_zones:** INT — Số lượng khu chuyển tải
- 🔴 **other_water_zones:** NVARCHAR(500) — Các khu nước, vùng nước khác

**Thông tin GIS:**
- 🔴 **object_type:** NVARCHAR(50) — Loại đối tượng (Point/Polygon)
- 🔴 **symbol_id:** BIGINT, FK → map_symbol — Biểu tượng bản đồ
- 🔴 **coordinate_system:** NVARCHAR(50) — Hệ quy chiếu (VN-2000/WGS-84)
- 🔴 **display_rule:** NVARCHAR(255) — Quy tắc hiển thị

**Trạng thái & Audit:**
- **status:** SMALLINT — Trạng thái (0=nhap, 1=cho_phe_duyet, 2=da_phe_duyet, 3=tu_choi, 4=tam_ngung, 5=da_xoa)
- 🔴 **notes:** NVARCHAR(1000) — Ghi chú
- **created_by:** UUID — Người tạo (chỉ hiển thị với Admin Cục)
- **created_at:** TIMESTAMP — Thời gian tạo (chỉ hiển thị với Admin Cục)
- **updated_by:** UUID — Người cập nhật cuối
- **updated_at:** TIMESTAMP — Thời gian cập nhật cuối
- **deleted_at:** TIMESTAMP — Thời gian xóa mềm (nullable)

### 6.2. 🔴 Bảng `port_coordinate` — Tọa độ GPS

- 🔴 **id:** BIGINT, PK, AUTO_INCREMENT
- 🔴 **port_id:** BIGINT, NOT NULL, FK → port.id
- 🔴 **latitude:** DECIMAL(9,6), NOT NULL — Vĩ độ [-90, 90]
- 🔴 **longitude:** DECIMAL(9,6), NOT NULL — Kinh độ [-180, 180]
- 🔴 **sort_order:** INT, DEFAULT 0 — Thứ tự hiển thị
- 🔴 **created_at:** TIMESTAMP, DEFAULT NOW()

### 6.3. 🔴 Bảng `port_infrastructure` — Công trình KCHT trực thuộc

- 🔴 **id:** BIGINT, PK, AUTO_INCREMENT
- 🔴 **port_id:** BIGINT, NOT NULL, FK → port.id
- 🔴 **stt:** INT, NOT NULL — Số thứ tự
- 🔴 **infra_name:** NVARCHAR(255), NOT NULL — Tên công trình
- 🔴 **quantity:** INT, NOT NULL, > 0 — Số lượng
- 🔴 **created_at:** TIMESTAMP, DEFAULT NOW()

### 6.4. 🔴 Bảng `port_attachment` — File đính kèm

- 🔴 **id:** BIGINT, PK, AUTO_INCREMENT
- 🔴 **port_id:** BIGINT, NOT NULL, FK → port.id
- 🔴 **file_name:** NVARCHAR(255), NOT NULL
- 🔴 **file_path:** NVARCHAR(500), NOT NULL
- 🔴 **file_size:** BIGINT, NOT NULL (≤ 20MB)
- 🔴 **content_type:** NVARCHAR(100)
- 🔴 **uploaded_by:** BIGINT, FK → user_account
- 🔴 **uploaded_at:** TIMESTAMP, DEFAULT NOW()

---

## 7. API Endpoints

Hệ thống cung cấp các API để phục vụ các thao tác liên quan đến tính năng:

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| GET | `/api/v1/cang-bien` | Lấy danh sách Cảng biển có phân trang, hỗ trợ query: `managingUnitId` (đơn vị quản lý — bắt buộc), `portName` (tên cảng), `portClassification` (phân cấp), `portGroup` (nhóm cảng — lọc nâng cao), `provinceCity` (tỉnh/thành phố — lọc nâng cao), `updatedFrom`/`updatedTo` (ngày cập nhật — lọc nâng cao), `status` (trạng thái — lọc nâng cao), `page`, `size`, `sort` | `port:read` |
| GET | `/api/v1/cang-bien/:id` | Lấy thông tin chi tiết một Cảng biển theo ID, bao gồm danh sách tọa độ GPS và file đính kèm | `port:read` |

---

## 8. Chi tiết nghiệp vụ từng phần

### 8.1. Luồng Danh sách Cảng biển

Người dùng truy cập `/Port`, hệ thống gọi `GET /api/v1/cang-bien` với tham số mặc định (page=1, size=`pageSize`, `managingUnitId` theo đơn vị của người dùng). Dữ liệu trả về được hiển thị trong bảng DataTable với các cột: STT, Đơn vị quản lý, Tên cảng biển, Nhóm cảng biển, Địa điểm, Phân cấp cảng biển, Ngày cập nhật, Cán bộ cập nhật, Trạng thái, Thao tác.

FilterBar phía trên bảng gồm 2 nhóm:

**Bộ lọc cơ bản:**
- Select Đơn vị quản lý (*bắt buộc): danh sách lấy từ danh mục đơn vị, mặc định theo đơn vị của người dùng đang đăng nhập
- Ô tìm kiếm Tên cảng biển: tìm theo tên cảng, debounce 300ms
- Select Phân cấp cảng biển: danh sách lấy từ danh mục phân cấp

**Bộ lọc nâng cao (có thể gập/mở):**
- Select Nhóm cảng biển: danh sách lấy từ danh mục nhóm cảng
- Select Địa điểm (Tỉnh/Thành phố): danh sách lấy từ danh mục tỉnh/thành
- DateRange Ngày cập nhật: chọn khoảng Từ ngày - Đến ngày
- Select Trạng thái: Tất cả / Nháp / Chờ phê duyệt / Được phê duyệt / Từ chối / Tạm ngừng / Đã xóa

Khi người dùng thay đổi bất kỳ bộ lọc nào, hệ thống reset về page=1 và gọi lại API. Kết quả tìm kiếm không phân biệt hoa/thường, tự động trim khoảng trắng thừa.

Mỗi dòng có dropdown hành động với các lựa chọn được kiểm soát bởi RBAC. Nút "Thêm mới" trên ScreenHeader chỉ hiển thị với role có `port:create`. Khi người dùng nhấn "Thêm mới", hệ thống mở form Tạo mới Cảng biển (F-008). Sau khi tạo mới thành công, hệ thống tự động điều hướng quay về màn hình Danh sách F-012, danh sách được làm mới (refresh) và bản ghi vừa tạo xuất hiện trong bảng.

### 8.2. Luồng Xem chi tiết Cảng biển

Người dùng nhấp "Xem chi tiết" từ danh sách, hệ thống điều hướng đến `/Port/:id` và gọi `GET /api/v1/cang-bien/:id`. Dữ liệu trả về được hiển thị trong CangBienDetailPage với layout dạng tab:

**Tab "Thông tin chung" (mặc định, mở sẵn):** hiển thị toàn bộ dữ liệu từ form Tạo mới F-008, chia thành các nhóm:
- **Thông tin chung:** Mã cảng, Đơn vị quản lý, Nhóm cảng biển, Tên cảng biển, Tỉnh/Thành phố, Địa điểm chi tiết, Phân cấp cảng biển, Phạm vi vùng nước
- **Chỉ số tổng hợp:** 14 chỉ số
- **Thông tin GIS:** Loại đối tượng, Biểu tượng, Hệ quy chiếu, Quy tắc hiển thị
- **Tọa độ GPS:** Danh sách điểm (Vĩ độ, Kinh độ)
- **Công trình KCHT trực thuộc:** Bảng (STT, Tên, Số lượng)
- **File đính kèm:** Danh sách file với Download/Print
- **Ghi chú**
- **Trạng thái:** Badge màu
- **Thông tin kiểm toán:** Người tạo/Ngày tạo/Người cập nhật/Ngày cập nhật (chỉ Admin Cục)

**Các tab bổ sung (placeholder — sẽ phát triển sau):**

| Tab | Dữ liệu nguồn | Trạng thái |
|---|---|---|
| Kết cấu hạ tầng khác | Bảng `port_other_infrastructure` (tương lai) | 🔜 Sẽ bổ sung |
| Thông tin quy hoạch | Bảng `port_planning` (tương lai) | 🔜 Sẽ bổ sung |
| Thông tin vận hành khai thác | Bảng `port_operation` (tương lai) | 🔜 Sẽ bổ sung |
| Thông tin bảo trì | Bảng `port_maintenance` (tương lai) | 🔜 Sẽ bổ sung |
| Thông tin sự cố | Bảng `port_incident` (tương lai) | 🔜 Sẽ bổ sung |

> **Thiết kế mở rộng:** Mỗi tab là một component độc lập, có thể phát triển và deploy riêng. Khi cần bổ sung nhóm thông tin mới, chỉ cần thêm tab mới + API tương ứng, không ảnh hưởng đến các tab hiện có.

Breadcrumb "Quản lý cảng biển > Chi tiết cảng [maCang]" cho phép quay lại danh sách. Các nút hành động (Chỉnh sửa, Xóa, Phê duyệt/Từ chối, Lịch sử) hiển thị theo phân quyền. Sau khi hoàn thành thao tác tại các feature con (Chỉnh sửa F-009, Xóa F-010, Phê duyệt F-011), hệ thống tự động điều hướng quay về màn hình Danh sách F-012 và danh sách được làm mới để phản ánh thay đổi.

---

## 9. Yêu cầu phi chức năng

### 9.1. Hiệu năng

- API danh sách trả về kết quả trong vòng 500ms với dataset lên đến 1000 Cảng biển
- API chi tiết trả về trong vòng 300ms
- Live search có debounce 300ms, không gửi request khi người dùng đang gõ
- Phân trang server-side, không tải toàn bộ dữ liệu về client

### 9.2. Khả năng mở rộng

- Hỗ trợ tối đa 10,000 Cảng biển trong hệ thống mà không suy giảm hiệu năng
- Cấu trúc bảng danh sách dễ dàng thêm cột mới khi có yêu cầu

### 9.3. Bảo mật

- Phân quyền RBAC được áp dụng trên tất cả các API — người dùng chỉ thấy dữ liệu trong phạm vi được phân quyền
- Các trường kiểm toán (`createdBy`, `updatedBy`) chỉ hiển thị với Admin Cục
- Dữ liệu trả về được lọc theo `orgUnitId` đối với role bị giới hạn phạm vi đơn vị

### 9.4. Độ tin cậy

- Xử lý lỗi API gracefully: hiển thị thông báo lỗi rõ ràng, không crash giao diện
- Khi mất kết nối mạng, hiển thị thông báo và nút "Thử lại"
- Dữ liệu hiển thị nhất quán giữa danh sách và chi tiết (cùng một bản ghi)

### 9.5. Trải nghiệm người dùng

- Giao diện responsive: desktop ≥1024px, tablet ≥768px, mobile cột đơn/bố cục card
- Có loading skeleton khi đang tải dữ liệu
- Có trạng thái rỗng (empty state) với hướng dẫn thân thiện cho từng ngữ cảnh
- Breadcrumb điều hướng rõ ràng trên trang chi tiết
- Sử dụng badge màu cho trạng thái phê duyệt để nhận diện nhanh, tuân thủ tiêu chuẩn trợ năng WCAG 2.1 AA (màu sắc không phải là kênh thông tin duy nhất — luôn kèm text)

### 9.6. Tuân thủ pháp lý

- Dữ liệu Cảng biển hiển thị tuân thủ quy chuẩn kỹ thuật quốc gia về dữ liệu cảng biển
- Thông tin kiểm toán được lưu trữ và hiển thị đầy đủ theo quy định
- Không hiển thị dữ liệu cá nhân của người tạo/người sửa cho các role không có thẩm quyền

---

## 10. Yêu cầu giao diện người dùng

> **Nguyên tắc cốt lõi:** Mọi giá trị màu sắc, khoảng cách, kích thước chữ trong giao diện đều được định nghĩa tập trung tại 2 file `frontend/src/theme.ts` (layout, màu nền sidebar/header) và `frontend/src/tokens.ts` (màu chữ, màu trạng thái, thang số). Tuyệt đối không hardcode giá trị hex hay pixel trong component.

### 10.1. Bố cục chung

Màn hình Xem danh sách & Chi tiết Cảng biển dùng chung bố cục toàn hệ thống từ `AppLayout.tsx`:

- **Thanh menu trái (sidebar):** rộng `layout.sidebarWidth`, nền `colors.sidebarBg`. Mục đang chọn được tô màu `colors.sidebarActiveBg`.
- **Thanh tiêu đề trên cùng (header):** cao `layout.headerHeight`, nền trắng, chứa tên người dùng và avatar.
- **Vùng nội dung chính:** nền `surfacePage`, giúp các card trắng bên trong nổi bật hơn.

### 10.2. Hệ thống màu sắc

Mỗi màu sắc trong giao diện được gán một "vai trò" rõ ràng. Developer không được dùng màu theo cảm tính mà phải import đúng token:

| Khi cần... | Dùng token | Mô tả |
|---|---|---|
| Tiêu đề trang, số liệu quan trọng | `textPrimary` | Màu chữ chính |
| Nhãn field, mô tả | `textSecondary` | Màu chữ phụ |
| Thời gian, trạng thái phụ, caption | `textTertiary` | Màu chữ metadata |
| Nền card chi tiết, bảng | `surfaceCard` | Nền trắng |
| Nền vùng nội dung chính | `surfacePage` | Nền xám nhạt |
| Viền card, đường kẻ | `borderDefault` | Đường viền nhạt |
| Nút chính, link hành động | `actionPrimary` | Màu nhấn chính |
| Trạng thái chờ phê duyệt | `statusAttention` | Badge vàng |
| Trạng thái được phê duyệt | `statusOperational` | Badge xanh lá |
| Trạng thái từ chối | `statusCritical` | Badge đỏ |

### 10.3. Thang số — chỉ dùng giá trị cho phép

**Khoảng cách (spacing):** 4px (`spaceXs`), 8px (`spaceSm`), 12px (`spaceFormField`), 16px (`spaceMd`), 24px (`spaceLg`), 32px (`spaceXl`).

**Bo góc (radius):** 4px (`radiusSm`), 8px (`radiusMd`), 12px (`radiusLg` cho card), 999px (`radiusPill` cho input, select, button).

**Cỡ chữ (font size):** 10px (`fontSizeSm` — metadata, caption), 13px (`fontSizeMd` — nhãn, nội dung bảng), 15px (`fontSizeLg` — tiêu đề card), 18px (`fontSizeXl` — tiêu đề trang), 22px (`fontSizeHeading`).

**Độ đậm chữ (font weight):** 400 (`fontWeightNormal` — nội dung), 500 (`fontWeightMedium` — nhãn, nút), 600 (`fontWeightBold` — tiêu đề).

> **Cấm tuyệt đối:** giá trị nằm ngoài thang số trên (6px, 7px, 10px, 14px, 18px cho spacing; 6px, 10px cho radius; 12px, 14px, 16px, 24px cho font-size; 450, 550, 700+ cho font-weight).

### 10.4. Style có sẵn — dùng lại, đừng tự chế

Hệ thống đã định nghĩa sẵn các kiểu dáng phổ biến. Khi cần hiển thị:

- **Thời gian, caption:** dùng `metaStyle` (chữ nhỏ `fontSizeSm`, màu `textTertiary`, weight `fontWeightNormal`)
- **Card nội dung:** dùng `cardStyle` (nền `surfaceCard`, viền 0.5px `borderDefault`, bo góc `radiusLg`, padding `spaceMd`)
- **Tag trạng thái:** dùng `badgeBaseStyle` (chữ `fontSizeSm`, weight `fontWeightMedium`, padding 2px-`spaceSm`px, `radiusPill`)
- **Link, nút text:** dùng `actionStyle` (`radiusPill`, màu `actionPrimary`, weight `fontWeightMedium`)
- **Đường kẻ ngăn cách:** dùng `dividerStyle`

### 10.5. Giới hạn màu nhấn (accent budget ≤3)

Màu `actionPrimary` (`#0E6FD6`) là màu nhấn mạnh nhất, dùng cho các hành động chính. Để tránh giao diện bị "rối", màu này chỉ xuất hiện tối đa 3 lần trên toàn bộ màn hình:

1. Nút "Thêm mới" trên ScreenHeader (danh sách)
2. Nút "Xem chi tiết" trong dropdown Thao tác trên mỗi dòng (danh sách)
3. Nút "Chỉnh sửa" trên trang chi tiết

Các màu trạng thái (xanh lá cho thành công, vàng cho cảnh báo, đỏ cho lỗi) và màu chữ không tính vào giới hạn này.

### 10.6. Màn hình Danh sách (CangBienListPage)

Màn hình chính sử dụng các component dùng chung toàn hệ thống từ `frontend/src/components/list-view/` — không được tự tạo lại:

1. **ScreenHeader:** breadcrumb "Quản lý KCHT Hàng hải > Quản lý Cảng biển", nút "Thêm mới" (chỉ hiện khi có `port:create`). Khi nhấn "Thêm mới", hệ thống mở form Tạo mới Cảng biển (F-008); sau khi lưu thành công, tự động quay về màn hình Danh sách này.

2. **FilterBar:** thanh lọc nằm ngang phía trên bảng, chia làm 2 nhóm:

   - **Bộ lọc cơ bản:** Select Đơn vị quản lý (*bắt buộc) + Ô tìm kiếm Tên cảng biển + Select Phân cấp cảng biển + nút Tìm kiếm/Reload.
   - **Bộ lọc nâng cao (có thể gập/mở):** Select Nhóm cảng biển + Select Địa điểm (Tỉnh/Thành phố) + DateRange Ngày cập nhật (Từ ngày - Đến ngày) + Select Trạng thái.

3. **StatusTabs:** các tab lọc nhanh theo trạng thái kèm số lượng: Tất cả, Nháp, Chờ phê duyệt, Được phê duyệt, Từ chối, Tạm ngừng, Đã xóa.

4. **DataTable:** bảng dữ liệu với tiêu đề cột cố định khi cuộn (sticky header), dòng được tô sáng khi di chuột qua (hover row). Các cột hiển thị:

| STT | Tên trường | Nội dung | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
|---|---|---|---|---|---|---|---|
| 1 | STT | Số thứ tự dòng, tự động đánh số | Text (tự động) | Không | Có | Tự động | |
| 2 | Đơn vị quản lý | Tên đơn vị quản lý Cảng biển | Text | Không | Có | — | Hiển thị từ `managing_unit` → `org_unit.name` |
| 3 | Tên cảng biển | Tên chính thức của Cảng biển | Text | Không | Có | — | |
| 4 | Nhóm cảng biển | Nhóm phân loại cảng | Text | Không | Có | — | 🔴 Trường mới `port_group` |
| 5 | Địa điểm | Tỉnh/Thành phố nơi cảng tọa lạc | Text | Không | Có | — | |
| 6 | Phân cấp cảng biển | Phân cấp theo quy định | Text | Không | Có | — | |
| 7 | Ngày cập nhật | Định dạng DD/MM/YYYY HH:mm | Text (datetime) | Không | Không | — | Dùng `metaStyle` |
| 8 | Cán bộ cập nhật | Họ tên người cập nhật cuối | Text | Không | Không | — | Hiển thị từ `updated_by` → `user.full_name` |
| 9 | Trạng thái | Badge màu theo trạng thái | Badge | Không | Có | — | Dùng `badgeBaseStyle` + token: Nháp/Chờ duyệt/Tạm ngừng=`statusAttention`, Được duyệt=`statusOperational`, Từ chối/Đã xóa=`statusCritical` |
| 10 | Thao tác | Xem chi tiết, Sửa | Dropdown | — | — | — | Kiểm soát bởi RBAC; "Sửa" chỉ hiện khi có `port:update` |

**Giải thích các cột trong bảng màn hình:**

- **Loại điều khiển:** Xác định loại control UI hiển thị cho trường này trên form/dialog (ví dụ: Text, Select, DatePicker, TextArea, Number, Switch, Upload, ...).
- **Cho phép chỉnh sửa:** Trường này có được phép sửa sau khi tạo mới hay không (Có = editable, Không = read-only).
- **Bắt buộc:** Trường này có bắt buộc phải nhập khi tạo mới hay không (Có = required, Không = optional).
- **Giá trị mặc định:** Giá trị được điền sẵn khi mở form tạo mới (nếu có).

5. **Pagination:** thanh điều hướng trang ở cuối bảng, hiển thị tổng số dòng và số trang.

### 10.7. Màn hình Chi tiết (CangBienDetailPage)

Hiển thị thông tin dạng **tab**, mỗi tab là một nhóm thông tin độc lập. Tab "Thông tin chung" mở mặc định.

**Danh sách tab:**

| Tab | Nội dung | Trạng thái |
|---|---|---|
| Thông tin chung | Toàn bộ dữ liệu từ F-008 (Tạo mới) | ✅ Hiện tại |
| Kết cấu hạ tầng khác | Danh sách KCHT khác thuộc cảng biển (bảng `port_other_infrastructure`) | 🔜 Tương lai |
| Thông tin quy hoạch | Dữ liệu quy hoạch (bảng `port_planning`) | 🔜 Tương lai |
| Thông tin vận hành khai thác | Dữ liệu vận hành (bảng `port_operation`) | 🔜 Tương lai |
| Thông tin bảo trì | Lịch sử bảo trì (bảng `port_maintenance`) | 🔜 Tương lai |
| Thông tin sự cố | Lịch sử sự cố (bảng `port_incident`) | 🔜 Tương lai |

> **Nguyên tắc mở rộng:** Mỗi tab là một component React độc lập, gọi API riêng để lấy dữ liệu từ bảng tương ứng. Khi bổ sung tab mới, chỉ cần thêm 1 component + 1 API endpoint, không ảnh hưởng đến code các tab hiện có.

**Tab "Thông tin chung" — chi tiết các nhóm trường:**

**Nhóm Thông tin chung:**

| STT | Tên trường | Nội dung | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
|---|---|---|---|---|---|---|---|
| 1 | Mã cảng biển | Định dạng CB-XXXXXX | Text (readonly) | Không | Có | — | Tự động sinh |
| 2 | Đơn vị quản lý | Tên đơn vị | Text | Không | Có | — | Hiển thị từ `managing_unit` → `org_unit.name` |
| 3 | Nhóm cảng biển | Nhóm phân loại | Text | Không | Không | — | 🔴 |
| 4 | Tên cảng biển | Tên đầy đủ | Text | Không | Có | — | |
| 5 | Tỉnh/Thành phố | Địa điểm | Text | Không | Có | — | |
| 6 | Địa điểm chi tiết | Địa chỉ cụ thể | Text | Không | Không | — | 🔴 |
| 7 | Phân cấp cảng biển | Phân cấp (I, II, III...) | Text | Không | Có | — | 🔴 |
| 8 | Phạm vi vùng nước | Mô tả phạm vi | Text | Không | Không | — | 🔴 |

**Nhóm Chỉ số tổng hợp:**

| STT | Tên trường | Nội dung | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
|---|---|---|---|---|---|---|---|
| 9 | Tổng số bến cảng | Số lượng | Number | Không | Không | 0 | 🔴 |
| 10 | Tổng số khu neo đậu, khu chuyển tải | Số lượng | Number | Không | Không | 0 | 🔴 |
| 11 | Tổng số tuyến luồng HH công cộng | Số lượng | Number | Không | Không | 0 | 🔴 |
| 12 | Tổng số tuyến luồng HH chuyên dùng | Số lượng | Number | Không | Không | 0 | 🔴 |
| 13 | Tổng chiều dài luồng HH công cộng (km) | km | Number | Không | Không | 0 | 🔴 |
| 14 | Tổng chiều dài luồng HH chuyên dùng (km) | km | Number | Không | Không | 0 | 🔴 |
| 15 | Tổng số phao tiêu, báo hiệu HH trên luồng | Số lượng | Number | Không | Không | 0 | 🔴 |
| 16 | Tổng số đê, kè | Số lượng | Number | Không | Không | 0 | 🔴 |
| 17 | Tổng chiều dài hệ thống đê, kè (km) | km | Number | Không | Không | 0 | 🔴 |
| 18 | Tổng số đèn biển, đăng, tiêu độc lập | Số lượng | Number | Không | Không | 0 | 🔴 |
| 19 | Số lượng bến phao | Số lượng | Number | Không | Không | 0 | 🔴 |
| 20 | Số lượng khu neo đậu | Số lượng | Number | Không | Không | 0 | 🔴 |
| 21 | Số lượng khu chuyển tải | Số lượng | Number | Không | Không | 0 | 🔴 |
| 22 | Các khu nước, vùng nước khác | Mô tả | Text | Không | Không | — | 🔴 |

**Nhóm Thông tin GIS:**

| STT | Tên trường | Nội dung | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
|---|---|---|---|---|---|---|---|
| 23 | Loại đối tượng GIS | Point / Polygon | Text | Không | Không | Point | 🔴 |
| 24 | Biểu tượng | Tên biểu tượng bản đồ | Text | Không | Không | — | 🔴, hiển thị từ `symbol_id` → `map_symbol.name` |
| 25 | Hệ quy chiếu | VN-2000 / WGS-84 | Text | Không | Không | WGS-84 | 🔴 |
| 26 | Quy tắc hiển thị | Quy tắc trên bản đồ | Text | Không | Không | — | 🔴 |

**Nhóm Tọa độ GPS:**

| STT | Tên trường | Nội dung | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
|---|---|---|---|---|---|---|---|
| 27 | Tọa độ GPS | Danh sách điểm (Vĩ độ, Kinh độ) | Bảng con | Không | Có* | — | 🔴, định dạng ±XX.XXXXXX, đọc từ `port_coordinate` |

**Nhóm Công trình KCHT trực thuộc:**

| STT | Tên trường | Nội dung | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
|---|---|---|---|---|---|---|---|
| 28 | Công trình KCHT | Bảng (STT, Tên, Số lượng) | Bảng con | Không | Không | — | 🔴, đọc từ `port_infrastructure` |

**Nhóm File đính kèm:**

| STT | Tên trường | Nội dung | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
|---|---|---|---|---|---|---|---|
| 29 | File đính kèm | Danh sách file | List + Download/Print | Không | Không | — | PDF/DOC/DOCX/XLS/XLSX/JPG/PNG/TIFF; ≤20MB/file; ≤10 files |

**Nhóm Ghi chú & Trạng thái:**

| STT | Tên trường | Nội dung | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
|---|---|---|---|---|---|---|---|
| 30 | Ghi chú | Nội dung ghi chú | Text | Không | Không | — | 🔴 |
| 31 | Trạng thái | Badge màu | Badge | Không | Có | — | Dùng `badgeBaseStyle` + token: Nháp/Chờ duyệt/Tạm ngừng=`statusAttention`, Được duyệt=`statusOperational`, Từ chối/Đã xóa=`statusCritical` |

**Nhóm Thông tin kiểm toán (chỉ hiển thị với Admin Cục):**

| STT | Tên trường | Nội dung | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
|---|---|---|---|---|---|---|---|
| 32 | Người tạo | Họ tên | Text | Không | Không | — | Ẩn với role không phải Admin Cục |
| 33 | Ngày tạo | DD/MM/YYYY HH:mm | Text | Không | Không | — | Ẩn với role không phải Admin Cục |
| 34 | Người cập nhật | Họ tên | Text | Không | Không | — | Ẩn với role không phải Admin Cục |
| 35 | Ngày cập nhật | DD/MM/YYYY HH:mm | Text | Không | Không | — | |

### 10.8. Các trạng thái giao diện

Giao diện phải xử lý đầy đủ các trạng thái sau:

- **Đang tải:** hiển thị Skeleton của Ant Design cho bảng danh sách và card chi tiết — không hiển thị bảng trống gây hiểu nhầm là không có dữ liệu.
- **Không có dữ liệu:** hiển thị biểu tượng Empty của Ant Design với dòng chữ "Chưa có Cảng biển nào" màu `textSecondary`, cỡ chữ `fontSizeMd`.
- **Lỗi tải dữ liệu:** hiển thị cảnh báo với icon cảnh báo màu `statusCritical` và nút "Thử lại" màu `actionPrimary`.

### 10.9. Phân quyền hiển thị

Giao diện tự động ẩn/hiện các thành phần dựa trên vai trò người dùng:

| Vai trò | Thấy thành phần nào | Ghi chú |
|---|---|---|
| system-admin | Toàn bộ dữ liệu + Thêm mới, Xem chi tiết, Sửa trên danh sách + mọi hành động trên trang chi tiết + thông tin kiểm toán | Toàn quyền |
| admin (Security) | Toàn bộ dữ liệu + Thêm mới, Xem chi tiết, Sửa trên danh sách + mọi hành động trên trang chi tiết | |
| admin-operation | Toàn bộ dữ liệu + Thêm mới, Xem chi tiết, Sửa trên danh sách + Chỉnh sửa, Xem chi tiết, Lịch sử trên trang chi tiết | Không có Xóa, Phê duyệt |
| admin | Dữ liệu trong đơn vị + Xem chi tiết, Sửa trên danh sách + Chỉnh sửa, Xem chi tiết trên trang chi tiết | |
| Lãnh đạo | Toàn bộ dữ liệu + Xem chi tiết trên danh sách + Phê duyệt/Từ chối, Xem chi tiết, Lịch sử trên trang chi tiết | Không có Thêm mới, Sửa, Xóa |
| Cán bộ | Dữ liệu trong đơn vị + Xem chi tiết trên danh sách + Xem chi tiết trên trang chi tiết | Chỉ xem |
| Admin Cục | Toàn bộ dữ liệu + tất cả nút + `createdBy`, `createdAt`, `updatedBy`, `updatedAt` | Logic đặc biệt (xem mục 2.2) |

### 10.10. Giao diện trên điện thoại

Khi màn hình nhỏ hơn 768px:

- Bảng danh sách chuyển thành dạng thẻ (card)
- FilterBar chuyển thành panel có thể gập/mở
- Trang chi tiết hiển thị dạng cột đơn, card full-width
- Breadcrumb giữ nguyên, thu nhỏ font
