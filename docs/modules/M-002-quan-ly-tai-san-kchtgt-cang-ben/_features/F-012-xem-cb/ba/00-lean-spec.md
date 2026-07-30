---
id: F-012
name: Xem danh sách & Chi tiết Cảng biển
slug: xem-cb
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:19Z
last-updated: 2026-07-30
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Xem danh sách & Chi tiết Cảng biển

**Tài liệu:** BA Feature Brief (source of truth)
**Feature:** F-012 — Xem danh sách & Chi tiết Cảng biển
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-07-30

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

F-012 là **màn hình trung tâm (HUB)** của toàn bộ module Quản lý Cảng biển. Mọi feature khác — Tạo mới (F-008), Cập nhật (F-009), Xóa (F-010), Phê duyệt (F-011) — đều được khởi tạo từ F-012 và quay về F-012 sau khi hoàn thành.

Tính năng gồm 2 màn hình:

- **PortListPage — Màn hình Danh sách:** Hiển thị bảng danh sách Cảng biển với 10 cột (STT, Đơn vị quản lý, Tên cảng biển, Nhóm cảng biển, Địa điểm, Phân cấp cảng biển, Ngày cập nhật, Cán bộ cập nhật, Trạng thái badge màu, Thao tác dropdown). FilterBar 2 nhóm: cơ bản (Đơn vị QL *bắt buộc + Tên cảng + Phân cấp) và nâng cao có thể gập/mở (Nhóm cảng, Tỉnh/TP, Ngày cập nhật, Trạng thái). StatusTabs 7 tab (Tất cả + 6 trạng thái). DataTable sticky header, hover row. ScreenHeader có nút "Thêm mới" (chỉ khi `port:create`).

- **PortDetailPage — Màn hình Chi tiết:** Giao diện **tab-based** với 6 tab. Tab "Thông tin chung" mặc định hiển thị 35 trường chia 7 nhóm: Thông tin chung (8 trường), Chỉ số tổng hợp (14 trường), Thông tin GIS (4 trường), Tọa độ GPS (bảng), Công trình KCHT (bảng), File đính kèm, Ghi chú & Trạng thái & Audit (5 trường). 5 tab còn lại hiển thị placeholder "Đang phát triển".

F-012 được tổng hợp từ F-068 (PortListPage) và F-069 (PortDetailPage).

### 1.2. Tại sao cần tính năng này?

- Màn hình trung tâm tập trung toàn bộ Cảng biển trên một giao diện, làm điểm xuất phát cho mọi thao tác nghiệp vụ.
- Trang chi tiết toàn diện cung cấp đầy đủ thông tin (35 trường, tọa độ GPS, công trình KCHT, file đính kèm) phục vụ tra cứu, phê duyệt, kiểm toán.

### 1.3. Luồng hoạt động chính

1. Người dùng truy cập module → `GET /api/v1/ports` với `managingUnitId` (bắt buộc), page=1, size=pageSize → hiển thị PortListPage.
2. Người dùng tìm kiếm/lọc (tên cảng, phân cấp, nhóm cảng, tỉnh/TP, ngày cập nhật, trạng thái) → hệ thống reset page=1, gọi lại API.
3. Người dùng nhấp vào một dòng → điều hướng đến PortDetailPage với `GET /api/v1/ports/:id`, mặc định tab "Thông tin chung".
4. Từ Danh sách, người dùng nhấn "Thêm mới" → mở form F-008 → sau khi lưu → quay về Danh sách (refresh).
5. Từ Danh sách hoặc Chi tiết, người dùng thực hiện Sửa (F-009), Xóa (F-010), Phê duyệt/Từ chối (F-011) → sau hoàn tất → quay về Danh sách (refresh).

---

## 2. Ai dùng? Dùng như thế nào?

Quyền thao tác và xem tính năng được áp dụng theo hệ thống phân quyền tập trung của hệ thống. Mỗi vai trò người dùng sẽ có phạm vi truy cập và thao tác khác nhau trên tính năng này, được kiểm soát bởi cơ chế RBAC (Role-Based Access Control).

### 2.1. Logic phân quyền chung

Các thao tác trong tính năng được bảo vệ bởi các quyền (permissions) tương ứng. Người dùng chỉ có thể thực hiện những thao tác mà vai trò của họ được cấp quyền:

| Vai trò | Quyền xem | Quyền thao tác | Phạm vi dữ liệu | Ghi chú |
|---|---|---|---|---|
| system-admin | Toàn bộ dữ liệu + audit fields | Thêm mới, Xem chi tiết, Sửa, Xóa, Phê duyệt/Từ chối, Lịch sử | Toàn bộ hệ thống | Full quyền + thấy createdBy/At, updatedBy/At |
| admin (Security) | Toàn bộ dữ liệu | Thêm mới, Xem chi tiết, Sửa, Xóa, Phê duyệt/Từ chối, Lịch sử | Toàn bộ hệ thống | Full quyền |
| admin-operation | Toàn bộ dữ liệu | Thêm mới, Xem chi tiết, Sửa, Lịch sử | Toàn bộ hệ thống | Không Xóa, không Phê duyệt/Từ chối |
| admin | Dữ liệu trong đơn vị quản lý | Thêm mới, Xem chi tiết, Sửa, Lịch sử | Theo orgUnit | Không Xóa, không Phê duyệt/Từ chối |
| Lãnh đạo | Toàn bộ dữ liệu | Xem chi tiết, Phê duyệt/Từ chối, Lịch sử | Toàn bộ hệ thống | Không Thêm mới, Sửa, Xóa |
| Cán bộ | Dữ liệu trong đơn vị quản lý | Xem chi tiết | Theo orgUnit | Chỉ xem |
| Doanh nghiệp cảng | Cảng biển của đơn vị mình | Xem chi tiết | Theo orgUnit | Chỉ xem |
| Nhân viên vận hành | Xem hạn chế (một số trường nhạy cảm bị ẩn) | Xem chi tiết (hạn chế) | Theo orgUnit | Một số trường bị ẩn |

### 2.2. Logic phân quyền đặc biệt cho tài khoản Admin Cục

Đối với tài khoản **Admin Cục**, áp dụng logic phân quyền đặc biệt sau:

- **Xem full dữ liệu:** Admin Cục có quyền xem toàn bộ Cảng biển trên hệ thống, không giới hạn phạm vi đơn vị.
- **Xem thông tin người chỉnh sửa:** Với mỗi bản ghi, Admin Cục thấy được thông tin người chỉnh sửa cuối cùng (họ tên, tên đăng nhập).
- **Xem thời gian cập nhật:** Admin Cục thấy được thời gian cập nhật cuối cùng của dữ liệu (timestamp).
- **Xem người tạo mới:** Admin Cục thấy được thông tin người tạo mới bản ghi (họ tên, tên đăng nhập).
- **Xem thời gian tạo mới:** Admin Cục thấy được thời gian tạo mới dữ liệu (timestamp).

> **Ghi chú:** Các trường `createdBy`, `createdAt`, `updatedBy`, `updatedAt` cần được bổ sung vào bảng dữ liệu tương ứng và chỉ hiển thị đối với tài khoản Admin Cục. Với các vai trò khác, các trường này bị ẩn khỏi giao diện. Riêng cột "Cán bộ cập nhật" trên danh sách hiển thị họ tên từ `updated_by` cho mọi role.

---

## 3. User Stories

Dưới đây là các câu chuyện người dùng, sắp xếp theo mức độ ưu tiên (Must > Should > Could):

### Mức Must (bắt buộc có)

- **US-012-01:** Là Cán bộ/admin-operation/system-admin, tôi muốn xem danh sách Cảng biển với đầy đủ 10 cột (STT, Đơn vị quản lý, Tên cảng biển, Nhóm cảng biển, Địa điểm, Phân cấp cảng biển, Ngày cập nhật, Cán bộ cập nhật, Trạng thái badge màu, Thao tác dropdown) để nắm bắt tổng quan.
- **US-012-02:** Là Cán bộ/admin-operation/system-admin, tôi muốn tìm kiếm Cảng biển theo tên cảng (debounce 300ms, trim) để nhanh chóng định vị cảng cần xem.
- **US-012-03:** Là Cán bộ/admin-operation/system-admin, tôi muốn lọc danh sách theo Đơn vị quản lý (bắt buộc), Phân cấp cảng biển, và các bộ lọc nâng cao (Nhóm cảng, Tỉnh/TP, Ngày cập nhật, Trạng thái) để thu hẹp phạm vi tra cứu.
- **US-012-04:** Là Cán bộ/admin-operation/system-admin, tôi muốn nhấp vào một Cảng biển từ danh sách để xem chi tiết tab-based với 35 trường trong 7 nhóm.
- **US-012-05:** Là Cán bộ/admin-operation, tôi muốn xem badge trạng thái màu sắc (vàng/xanh lá/đỏ/xám) trên danh sách để nhận diện nhanh tình trạng của từng cảng.
- **US-012-06:** Là Admin Cục, tôi muốn xem thông tin createdBy, createdAt, updatedBy, updatedAt của từng Cảng biển để phục vụ kiểm toán.

### Mức Should (nên có)

- **US-012-07:** Là Cán bộ/admin-operation, tôi muốn sắp xếp danh sách theo từng cột (Tên cảng biển, Ngày cập nhật) để tổ chức dữ liệu theo nhu cầu.
- **US-012-08:** Là Cán bộ/admin-operation, tôi muốn thấy breadcrumb "Quản lý cảng biển > Chi tiết cảng [port_code]" trên trang chi tiết để dễ dàng điều hướng quay lại danh sách.

### Mức Could (có thể có sau)

- **US-012-09:** Là Cán bộ/admin-operation, tôi muốn xem trước thông tin tóm tắt khi di chuột qua một dòng trong danh sách (tooltip preview).
- **US-012-10:** Là Cán bộ/admin-operation, tôi muốn xuất danh sách Cảng biển đang lọc ra file Excel để báo cáo.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

Mỗi yêu cầu dưới đây mô tả một điều hệ thống phải làm được, kèm theo cách xử lý khi có lỗi hoặc dữ liệu không như mong đợi.

**AC-012-01 — Hiển thị danh sách 10 cột:** Hệ thống hiển thị bảng DataTable với 10 cột: (1) STT (tự động đánh số), (2) Đơn vị quản lý, (3) Tên cảng biển, (4) Nhóm cảng biển, (5) Địa điểm, (6) Phân cấp cảng biển, (7) Ngày cập nhật (DD/MM/YYYY HH:mm, dùng `metaStyle`), (8) Cán bộ cập nhật, (9) Trạng thái (badge màu dùng `badgeBaseStyle`), (10) Thao tác (dropdown phù hợp RBAC). Mặc định page=1, size=`pageSize`, sort theo updatedAt desc. Nếu không có dữ liệu, hiển thị empty state "Chưa có Cảng biển nào được tạo".

**AC-012-02 — FilterBar 2 nhóm (cơ bản + nâng cao):** FilterBar gồm bộ lọc cơ bản (Select Đơn vị quản lý *bắt buộc, mặc định theo đơn vị đang đăng nhập; Input tìm kiếm Tên cảng biển, debounce 300ms, trim; Select Phân cấp cảng biển) và bộ lọc nâng cao có thể gập/mở (Select Nhóm cảng biển; Select Tỉnh/Thành phố; DateRange Ngày cập nhật Từ-Đến; Select Trạng thái). Khi thay đổi bất kỳ bộ lọc, reset page=1 và gọi lại API. Nếu không tìm thấy kết quả, hiển thị "Không tìm thấy Cảng biển nào phù hợp".

**AC-012-03 — StatusTabs 7 tab:** StatusTabs hiển thị 7 tab: Tất cả, Nháp, Chờ phê duyệt, Được phê duyệt, Từ chối, Tạm ngừng, Đã xóa — mỗi tab kèm số lượng bản ghi. Tab đang chọn có gạch chân màu `actionPrimary`. Chọn tab → gọi API với status param.

**AC-012-04 — Phân trang server-side:** DataTable hiển thị max 20 bản ghi/trang. Thanh Pagination ở cuối bảng hiển thị tổng số bản ghi và số trang. Ẩn khi ≤ 20 bản ghi. Chuyển trang → gọi API với page param.

**AC-012-05 — Hành động mỗi dòng và nút Thêm mới:** Dropdown Thao tác mỗi dòng gồm các lựa chọn phù hợp RBAC: "Xem chi tiết" (mọi role `port:read`), "Sửa" (role `port:update`). Nút "Thêm mới" trên ScreenHeader chỉ hiển thị khi role có `port:create`.

**AC-012-06 — Xem chi tiết tab-based 6 tab:** Người dùng nhấp "Xem chi tiết" → hệ thống gọi `GET /api/v1/ports/:id` → hiển thị PortDetailPage với 6 tab. Tab "Thông tin chung" mặc định hiển thị 35 trường trong 7 nhóm. Các tab còn lại (Kết cấu hạ tầng khác, Thông tin quy hoạch, Thông tin vận hành khai thác, Thông tin bảo trì, Thông tin sự cố) hiển thị placeholder "Đang phát triển". Nếu id không tồn tại, hiển thị "Không tìm thấy Cảng biển này".

**AC-012-07 — 35 trường chi tiết chia 7 nhóm:** Tab "Thông tin chung" hiển thị đầy đủ: (A) Thông tin chung 8 trường: Mã cảng, Đơn vị quản lý, Nhóm cảng biển, Tên cảng biển, Tỉnh/Thành phố, Địa điểm chi tiết, Phân cấp cảng biển, Phạm vi vùng nước. (B) Chỉ số tổng hợp 14 trường: tổng số bến cảng, khu neo đậu/khu chuyển tải, tuyến luồng HH công cộng/chuyên dùng, chiều dài luồng công cộng/chuyên dùng, phao tiêu báo hiệu, đê kè, chiều dài đê kè, đèn biển, bến phao, khu neo đậu, khu chuyển tải, khu nước khác. (C) Thông tin GIS 4 trường: Loại đối tượng, Biểu tượng, Hệ quy chiếu, Quy tắc hiển thị. (D) Tọa độ GPS: bảng danh sách điểm (Vĩ độ, Kinh độ, định dạng ±XX.XXXXXX). (E) Công trình KCHT: bảng (STT, Tên, Số lượng). (F) File đính kèm: danh sách file với Download/Print. (G) Ghi chú, Trạng thái badge màu, Audit (chỉ Admin Cục).

**AC-012-08 — Breadcrumb:** Trang chi tiết hiển thị breadcrumb "Quản lý cảng biển > Chi tiết cảng [port_code]". Nhấp "Quản lý cảng biển" quay lại danh sách. Nếu port_code null, hiển thị "Chi tiết cảng".

**AC-012-09 — Hành động trên trang chi tiết:** Trang chi tiết hiển thị các nút: "Chỉnh sửa" (→ F-009), "Xóa" (dialog xác nhận F-010), "Lịch sử" (→ F-013 nếu có), "Phê duyệt"/"Từ chối" (chỉ Lãnh đạo, → F-011) — tất cả kiểm soát RBAC.

**AC-012-10 — File đính kèm:** Hỗ trợ PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF, tối đa 20MB/file, tối đa 10 files. Mỗi file có nút Download và Print. Nếu không có đính kèm, hiển thị "Không có tài liệu đính kèm".

**AC-012-11 — Responsive:** Desktop ≥1024px bảng đầy đủ. Tablet ≥768px thu gọn cột phụ. Mobile <768px bảng chuyển card view. Trang chi tiết cột đơn.

**AC-012-12 — Loading & Lỗi:** Đang tải hiển thị Skeleton. Lỗi hiển thị thông báo + nút "Thử lại". Empty state icon + hướng dẫn.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

Các quy tắc này là "luật chơi" mà mọi thành phần trong hệ thống phải tuân thủ:

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-012-01 | Tìm kiếm theo tên cảng biển: không phân biệt hoa/thường, tự động trim khoảng trắng thừa, debounce 300ms sau lần gõ cuối cùng trước khi gọi API | Search | F-012 |
| BR-012-02 | `managingUnitId` là tham số bắt buộc khi gọi `GET /api/v1/ports`. Mặc định theo đơn vị của người dùng đang đăng nhập | Filter | F-012 |
| BR-012-03 | Badge trạng thái: Nháp/Chờ phê duyệt/Tạm ngừng = vàng (`statusAttention`), Được phê duyệt = xanh lá (`statusOperational`), Từ chối/Đã xóa = đỏ (`statusCritical`). Dùng `badgeBaseStyle` + token màu tương ứng | UI | F-012 |
| BR-012-04 | Tọa độ GPS hiển thị định dạng ±XX.XXXXXX (6 chữ số thập phân). Vĩ độ [-90, 90], kinh độ [-180, 180]. Nếu null hiển thị "—" | Detail | Entity spec |
| BR-012-05 | Đính kèm: PDF/DOC/DOCX/XLS/XLSX/JPG/PNG/TIFF, ≤20MB/file, ≤10 files. Các định dạng khác từ chối khi upload | Attachments | F-008 |
| BR-012-06 | Nút hành động trên danh sách và trang chi tiết được kiểm soát RBAC: chỉ hiển thị khi người dùng có permission tương ứng | UI | F-012 |
| BR-012-07 | `createdBy`, `createdAt`, `updatedBy`, `updatedAt` chỉ hiển thị với Admin Cục. Riêng cột "Cán bộ cập nhật" trên danh sách hiển thị họ tên từ `updated_by` cho mọi role | UI | Template, Section 2.2 |

---

## 6. Mô hình dữ liệu

Tính năng này chỉ đọc dữ liệu, không tạo/sửa cấu trúc bảng. Các bảng được đồng bộ từ F-008 (Tạo mới).

> **Quy ước đánh dấu:**
> - 🔴 **Chữ màu đỏ** = trường mới cần thêm vào bảng hiện có.
> - ~~Chữ gạch ngang~~ = trường không cần thiết, cần loại bỏ.
> - Các trường không đánh dấu là trường hiện có, được giữ nguyên.

### 6.1. Bảng `port` — Cảng biển

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
| GET | `/api/v1/ports` | Lấy danh sách Cảng biển có phân trang. Query params: `managingUnitId` (bắt buộc), `portName`, `portClassification`, `portGroup`, `provinceCity`, `updatedFrom`/`updatedTo`, `status`, `page`, `size`, `sort` | `port:read` |
| GET | `/api/v1/ports/:id` | Lấy thông tin chi tiết một Cảng biển theo ID, bao gồm danh sách tọa độ GPS, công trình KCHT, file đính kèm | `port:read` |

---

## 8. Chi tiết nghiệp vụ từng phần

### 8.1. Luồng Danh sách Cảng biển (PortListPage)

Người dùng truy cập `/Port`, hệ thống gọi `GET /api/v1/ports` với tham số mặc định (page=1, size=pageSize, `managingUnitId` theo đơn vị người dùng). Dữ liệu hiển thị trong DataTable với 10 cột: STT, Đơn vị quản lý, Tên cảng biển, Nhóm cảng biển, Địa điểm, Phân cấp cảng biển, Ngày cập nhật, Cán bộ cập nhật, Trạng thái (badge màu), Thao tác (dropdown).

**ScreenHeader:** breadcrumb "Quản lý cảng biển", nút "Thêm mới" (chỉ hiện khi `port:create`). Khi nhấn "Thêm mới" → mở form F-008 → sau lưu → quay về Danh sách, refresh.

**FilterBar** chia 2 nhóm:
- *Bộ lọc cơ bản:* Select Đơn vị quản lý (*bắt buộc, mặc định theo đơn vị đang đăng nhập) + Input tìm kiếm Tên cảng biển (debounce 300ms, trim) + Select Phân cấp cảng biển + nút Tìm kiếm/Reload.
- *Bộ lọc nâng cao (gập/mở):* Select Nhóm cảng biển + Select Địa điểm (Tỉnh/Thành phố) + DateRange Ngày cập nhật + Select Trạng thái.

Thay đổi bất kỳ bộ lọc nào → reset page=1 → gọi lại API. Kết quả tìm kiếm không phân biệt hoa/thường, tự động trim.

**StatusTabs:** 7 tab (Tất cả + 6 trạng thái), mỗi tab kèm số lượng. Tab active có gạch chân `actionPrimary`.

**DataTable:** Sticky header, hover row highlight. Sort theo cột Tên cảng biển/Ngày cập nhật.

**Pagination:** Server-side, pageSize/trang, hiển thị tổng số bản ghi. Ẩn khi ≤ pageSize.

### 8.2. Luồng Xem chi tiết Cảng biển (PortDetailPage)

Người dùng nhấp "Xem chi tiết" → điều hướng `/Port/:id` → gọi `GET /api/v1/ports/:id` → hiển thị tab-based layout.

**Danh sách 6 tab:**

| Tab | Nội dung | Trạng thái |
|---|---|---|
| Thông tin chung | 35 trường trong 7 nhóm (mặc định) | ✅ Hiện tại |
| Kết cấu hạ tầng khác | Dữ liệu các bảng khác (tương lai) | 🔜 Đang phát triển |
| Thông tin quy hoạch | Dữ liệu quy hoạch (tương lai) | 🔜 Đang phát triển |
| Thông tin vận hành khai thác | Dữ liệu vận hành (tương lai) | 🔜 Đang phát triển |
| Thông tin bảo trì | Lịch sử bảo trì (tương lai) | 🔜 Đang phát triển |
| Thông tin sự cố | Lịch sử sự cố (tương lai) | 🔜 Đang phát triển |

**Tab "Thông tin chung" — 7 nhóm chi tiết:**

1. **Thông tin chung (8 trường):** Mã cảng biển, Đơn vị quản lý, Nhóm cảng biển, Tên cảng biển, Tỉnh/Thành phố, Địa điểm chi tiết, Phân cấp cảng biển, Phạm vi vùng nước.
2. **Chỉ số tổng hợp (14 trường):** Tổng số bến cảng, khu neo đậu/khu chuyển tải, tuyến luồng HH công cộng, tuyến luồng HH chuyên dùng, chiều dài luồng HH công cộng (km), chiều dài luồng HH chuyên dùng (km), phao tiêu báo hiệu HH, đê kè, chiều dài đê kè (km), đèn biển/đăng/tiêu độc lập, bến phao, khu neo đậu, khu chuyển tải, khu nước/vùng nước khác.
3. **Thông tin GIS (4 trường):** Loại đối tượng, Biểu tượng, Hệ quy chiếu, Quy tắc hiển thị.
4. **Tọa độ GPS:** Bảng (STT, Vĩ độ, Kinh độ) — định dạng ±XX.XXXXXX.
5. **Công trình KCHT trực thuộc:** Bảng (STT, Tên công trình, Số lượng).
6. **File đính kèm:** Danh sách file với nút Download/Print. ≤10 files, ≤20MB/file.
7. **Ghi chú & Trạng thái & Audit:** Ghi chú + Badge trạng thái + createdBy/createdAt/updatedBy/updatedAt (chỉ Admin Cục).

**Breadcrumb:** "Quản lý cảng biển > Chi tiết cảng [port_code]". Nhấp "Quản lý cảng biển" quay lại danh sách.

**Hành động (kiểm soát RBAC):** Chỉnh sửa (F-009), Xóa (dialog F-010), Lịch sử (F-013), Phê duyệt/Từ chối (F-011, chỉ Lãnh đạo). Sau mỗi thao tác → quay về Danh sách, refresh.

---

## 9. Yêu cầu phi chức năng

### 9.1. Hiệu năng

- API danh sách trả về trong vòng 500ms với dataset lên đến 1000 Cảng biển
- API chi tiết trả về trong vòng 300ms
- Live search debounce 300ms, không gửi request khi người dùng đang gõ
- Phân trang server-side, không tải toàn bộ dữ liệu về client

### 9.2. Khả năng mở rộng

- Hỗ trợ tối đa 10,000 Cảng biển trong hệ thống mà không suy giảm hiệu năng
- Cấu trúc tab-based cho phép thêm tab mới mà không ảnh hưởng tab hiện có

### 9.3. Bảo mật

- Phân quyền RBAC áp dụng trên tất cả API — người dùng chỉ thấy dữ liệu trong phạm vi được phân quyền
- Các trường kiểm toán (`createdBy`, `createdAt`, `updatedBy`, `updatedAt`) chỉ hiển thị với Admin Cục
- Dữ liệu trả về được lọc theo `orgUnitId` đối với role bị giới hạn phạm vi đơn vị

### 9.4. Độ tin cậy

- Xử lý lỗi API gracefully: hiển thị thông báo lỗi rõ ràng, không crash giao diện
- Khi mất kết nối mạng, hiển thị thông báo và nút "Thử lại"
- Dữ liệu hiển thị nhất quán giữa danh sách và chi tiết

### 9.5. Trải nghiệm người dùng

- Giao diện responsive: desktop ≥1024px, tablet ≥768px, mobile <768px chuyển card view
- Có loading skeleton khi đang tải dữ liệu
- Có trạng thái rỗng (empty state) với hướng dẫn thân thiện
- Breadcrumb điều hướng rõ ràng trên trang chi tiết
- Badge trạng thái màu sắc kèm text (tuân thủ WCAG 2.1 AA)

### 9.6. Tuân thủ pháp lý

- Dữ liệu Cảng biển hiển thị tuân thủ quy chuẩn kỹ thuật quốc gia về dữ liệu cảng biển
- Thông tin kiểm toán được lưu trữ và hiển thị đầy đủ theo quy định
- Không hiển thị dữ liệu cá nhân của người tạo/người sửa cho các role không có thẩm quyền

---

## 10. Yêu cầu giao diện người dùng

> **Nguyên tắc cốt lõi:** Mọi giá trị màu sắc, khoảng cách, kích thước chữ trong giao diện đều được định nghĩa tập trung tại 2 file `frontend/src/theme.ts` (layout, màu nền sidebar/header) và `frontend/src/tokens.ts` (màu chữ, màu trạng thái, thang số). Tuyệt đối không hardcode giá trị hex hay pixel trong component.

### 10.1. Bố cục chung

Màn hình Xem danh sách & Chi tiết Cảng biển dùng chung bố cục toàn hệ thống từ `AppLayout.tsx`:

- **Thanh menu trái (sidebar):** rộng `layout.sidebarWidth`, nền `colors.sidebarBg`. Mục đang chọn tô màu `colors.sidebarActiveBg` dạng pill.
- **Thanh tiêu đề trên cùng (header):** cao `layout.headerHeight`, nền trắng `colors.containerBg`, chứa tên người dùng và avatar.
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
| Trạng thái chờ duyệt (badge) | `statusAttention` | `#EDA100` (vàng) |
| Trạng thái được duyệt (badge) | `statusOperational` | `#1BAF7A` (xanh lá) |
| Trạng thái từ chối (badge) | `statusCritical` | `#E34948` (đỏ) |
| Trạng thái mặc định (badge) | `statusDraft` | `#93a3b3` (xám) |

### 10.3. Thang số — chỉ dùng giá trị cho phép

**Khoảng cách (spacing):** 4px (`spaceXs`), 8px (`spaceSm`), 12px (`spaceFormField`), 16px (`spaceMd`), 24px (`spaceLg`), 32px (`spaceXl`).

**Bo góc (radius):** 4px (`radiusSm`), 8px (`radiusMd`), 12px (`radiusLg` cho card), 999px (`radiusPill` cho input, select, button, badge).

**Cỡ chữ (font size):** 10px (`fontSizeSm` — metadata, caption), 13px (`fontSizeMd` — nhãn, nội dung bảng), 15px (`fontSizeLg` — tiêu đề card), 18px (`fontSizeXl` — tiêu đề trang), 22px (`fontSizeHeading`), 28px (`fontSizeDisplay`), 34px (`fontSizeStat` — số KPI).

**Độ đậm chữ (font weight):** 400 (`fontWeightNormal` — nội dung), 500 (`fontWeightMedium` — nhãn, nút), 600 (`fontWeightBold` — tiêu đề, số liệu quan trọng).

**Font chữ:** `'Inter', -apple-system, BlinkMacSystemFont, sans-serif` cho toàn bộ văn bản.

> **Cấm tuyệt đối:** spacing 6, 10, 14, 18; radius 6, 7, 10; font-size 12, 14, 16, 24.

### 10.4. Style có sẵn — dùng lại, đừng tự chế

Hệ thống đã định nghĩa sẵn các kiểu dáng phổ biến. Khi cần hiển thị:

- **Thời gian, caption:** dùng `metaStyle` (chữ nhỏ `fontSizeSm`, màu `textTertiary`, weight `fontWeightNormal`)
- **Card nội dung:** dùng `cardStyle` (nền `surfaceCard`, viền 0.5px `borderDefault`, bo góc `radiusLg`, padding `spaceMd`)
- **Tag trạng thái:** dùng `badgeBaseStyle` (chữ `fontSizeSm`, weight `fontWeightMedium`, padding 2px-`spaceSm`, `radiusPill`) + token màu tương ứng
- **Link, nút text:** dùng `actionStyle` (`radiusPill`, màu `actionPrimary`, weight `fontWeightMedium`)
- **Đường kẻ ngăn cách:** dùng `dividerStyle`

### 10.5. Giới hạn màu nhấn — tối đa 3 lần mỗi màn

Màu `actionPrimary` (`#0E6FD6`) là màu nhấn mạnh nhất, dùng cho các hành động chính. Để tránh giao diện bị "rối", màu này chỉ xuất hiện tối đa 3 lần trên toàn bộ màn hình:

1. **Nút "Thêm mới"** trên ScreenHeader (danh sách).
2. **Nút "Xem chi tiết"** trong dropdown Thao tác mỗi dòng (danh sách).
3. **Nút "Chỉnh sửa"** trên trang chi tiết.

Các màu trạng thái (xanh lá `statusOperational`, vàng `statusAttention`, đỏ `statusCritical`) và màu chữ (`textPrimary`, `textSecondary`, `textTertiary`) không tính vào giới hạn này.

### 10.6. Màn hình Danh sách (PortListPage)

Màn hình chính sử dụng các component dùng chung toàn hệ thống từ `frontend/src/components/list-view/` — không được tự tạo lại:

1. **ScreenHeader:** breadcrumb "Quản lý cảng biển", nút "Thêm mới" (chỉ hiện khi `port:create`). Khi nhấn "Thêm mới", mở form Tạo mới (F-008); sau lưu, tự động quay về Danh sách, refresh.

2. **FilterBar:** thanh lọc nằm ngang phía trên bảng, chia 2 nhóm:
   - **Bộ lọc cơ bản:** Select Đơn vị quản lý (*bắt buộc) + Input tìm kiếm Tên cảng biển (debounce 300ms, trim) + Select Phân cấp cảng biển + nút Tìm kiếm/Reload.
   - **Bộ lọc nâng cao (gập/mở):** Select Nhóm cảng biển + Select Địa điểm (Tỉnh/Thành phố) + DateRange Ngày cập nhật (Từ-Đến) + Select Trạng thái.

3. **StatusTabs:** 7 tab: Tất cả, Nháp, Chờ phê duyệt, Được phê duyệt, Từ chối, Tạm ngừng, Đã xóa — mỗi tab kèm số lượng. Tab active gạch chân `actionPrimary`.

4. **DataTable:** sticky header, hover row highlight. Các cột:

| STT | Tên trường | Nội dung | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
|---|---|---|---|---|---|---|---|
| 1 | STT | Số thứ tự dòng | Text (tự động) | Không | Có | Tự động | |
| 2 | Đơn vị quản lý | Tên đơn vị QL cảng biển | Text | Không | Có | — | Hiển thị từ `managing_unit` → `org_unit.name` |
| 3 | Tên cảng biển | Tên chính thức | Text | Không | Có | — | |
| 4 | Nhóm cảng biển | Nhóm phân loại | Text | Không | Có | — | 🔴 `port_group` |
| 5 | Địa điểm | Tỉnh/Thành phố | Text | Không | Có | — | |
| 6 | Phân cấp cảng biển | Phân cấp theo quy định | Text | Không | Có | — | 🔴 `port_classification` |
| 7 | Ngày cập nhật | DD/MM/YYYY HH:mm | Text (datetime) | Không | Không | — | Dùng `metaStyle` |
| 8 | Cán bộ cập nhật | Họ tên người cập nhật | Text | Không | Không | — | Hiển thị từ `updated_by` → user.full_name |
| 9 | Trạng thái | Badge màu | Badge | Không | Có | — | `badgeBaseStyle` + token màu (BR-012-03) |
| 10 | Thao tác | Xem chi tiết, Sửa | Dropdown | — | — | — | RBAC; "Sửa" chỉ khi `port:update` |

5. **Pagination:** thanh điều hướng trang cuối bảng. Server-side. Ẩn khi ≤ pageSize.

### 10.7. Màn hình Chi tiết (PortDetailPage)

Breadcrumb: "Quản lý cảng biển > Chi tiết cảng [port_code]". Click "Quản lý cảng biển" quay về danh sách.

**Danh sách 6 tab (tab-based layout):**

| Tab | Trạng thái |
|---|---|
| Thông tin chung | ✅ Hiện tại, mặc định |
| Kết cấu hạ tầng khác | 🔜 Đang phát triển |
| Thông tin quy hoạch | 🔜 Đang phát triển |
| Thông tin vận hành khai thác | 🔜 Đang phát triển |
| Thông tin bảo trì | 🔜 Đang phát triển |
| Thông tin sự cố | 🔜 Đang phát triển |

**Tab "Thông tin chung" — 35 trường chia 7 nhóm:**

**Nhóm 1: Thông tin chung (8 trường)**

| STT | Tên trường | Loại ĐK | Edit | Bắt buộc | Default | Mô tả |
|---|---|---|---|---|---|---|
| 1 | Mã cảng biển | Text (readonly) | Không | Có | — | CB-XXXXXX, tự động sinh |
| 2 | Đơn vị quản lý | Text | Không | Có | — | `managing_unit` → org_unit.name |
| 3 | Nhóm cảng biển | Text | Không | Không | — | 🔴 |
| 4 | Tên cảng biển | Text | Không | Có | — | |
| 5 | Tỉnh/Thành phố | Text | Không | Có | — | |
| 6 | Địa điểm chi tiết | Text | Không | Không | — | 🔴 |
| 7 | Phân cấp cảng biển | Text | Không | Có | — | 🔴 |
| 8 | Phạm vi vùng nước | Text | Không | Không | — | 🔴 |

**Nhóm 2: Chỉ số tổng hợp (14 trường)**

| STT | Tên trường | Loại ĐK | Edit | Bắt buộc | Default | Mô tả |
|---|---|---|---|---|---|---|
| 9 | Tổng số bến cảng | Number | Không | Không | 0 | 🔴 |
| 10 | Tổng số khu neo đậu, khu chuyển tải | Number | Không | Không | 0 | 🔴 |
| 11 | Tổng số tuyến luồng HH công cộng | Number | Không | Không | 0 | 🔴 |
| 12 | Tổng số tuyến luồng HH chuyên dùng | Number | Không | Không | 0 | 🔴 |
| 13 | Tổng chiều dài luồng HH công cộng (km) | Number | Không | Không | 0 | 🔴 |
| 14 | Tổng chiều dài luồng HH chuyên dùng (km) | Number | Không | Không | 0 | 🔴 |
| 15 | Tổng số phao tiêu, báo hiệu HH trên luồng | Number | Không | Không | 0 | 🔴 |
| 16 | Tổng số đê, kè | Number | Không | Không | 0 | 🔴 |
| 17 | Tổng chiều dài hệ thống đê, kè (km) | Number | Không | Không | 0 | 🔴 |
| 18 | Tổng số đèn biển, đăng, tiêu độc lập | Number | Không | Không | 0 | 🔴 |
| 19 | Số lượng bến phao | Number | Không | Không | 0 | 🔴 |
| 20 | Số lượng khu neo đậu | Number | Không | Không | 0 | 🔴 |
| 21 | Số lượng khu chuyển tải | Number | Không | Không | 0 | 🔴 |
| 22 | Các khu nước, vùng nước khác | Text | Không | Không | — | 🔴 |

**Nhóm 3: Thông tin GIS (4 trường)**

| STT | Tên trường | Loại ĐK | Edit | Bắt buộc | Default | Mô tả |
|---|---|---|---|---|---|---|
| 23 | Loại đối tượng GIS | Text | Không | Không | Point | 🔴 |
| 24 | Biểu tượng bản đồ | Text | Không | Không | — | 🔴, từ `symbol_id` → map_symbol.name |
| 25 | Hệ quy chiếu | Text | Không | Không | WGS-84 | 🔴 |
| 26 | Quy tắc hiển thị | Text | Không | Không | — | 🔴 |

**Nhóm 4: Tọa độ GPS (bảng)**

| STT | Tên trường | Loại ĐK | Edit | Bắt buộc | Default | Mô tả |
|---|---|---|---|---|---|---|
| 27 | Tọa độ GPS | Bảng (Vĩ độ, Kinh độ) | Không | Có* | — | 🔴, ±XX.XXXXXX; từ `port_coordinate` |

**Nhóm 5: Công trình KCHT trực thuộc (bảng)**

| STT | Tên trường | Loại ĐK | Edit | Bắt buộc | Default | Mô tả |
|---|---|---|---|---|---|---|
| 28 | Công trình KCHT | Bảng (STT, Tên, SL) | Không | Không | — | 🔴; từ `port_infrastructure` |

**Nhóm 6: File đính kèm**

| STT | Tên trường | Loại ĐK | Edit | Bắt buộc | Default | Mô tả |
|---|---|---|---|---|---|---|
| 29 | File đính kèm | List + Download/Print | Không | Không | — | ≤20MB/file, ≤10 files; PDF/DOC/DOCX/XLS/XLSX/JPG/PNG/TIFF |

**Nhóm 7: Ghi chú & Trạng thái & Audit (5 trường)**

| STT | Tên trường | Loại ĐK | Edit | Bắt buộc | Default | Mô tả |
|---|---|---|---|---|---|---|
| 30 | Ghi chú | Text | Không | Không | — | 🔴 |
| 31 | Trạng thái | Badge (pill) | Không | Có | — | `badgeBaseStyle` + token màu (BR-012-03) |
| 32 | Người tạo | Text | Không | Không | — | Admin Cục mới thấy |
| 33 | Ngày tạo | Text (datetime) | Không | Không | — | Admin Cục mới thấy |
| 34 | Người cập nhật | Text | Không | Không | — | Admin Cục mới thấy |
| 35 | Ngày cập nhật | Text (datetime) | Không | Không | — | |

**Hành động:** Chỉnh sửa (F-009), Xóa (F-010), Lịch sử (F-013), Phê duyệt/Từ chối (F-011, chỉ Lãnh đạo). Tất cả kiểm soát RBAC. Sau khi hoàn thành → quay về Danh sách, refresh.

### 10.8. Các trạng thái giao diện

Giao diện phải xử lý đầy đủ các trạng thái sau:

- **Đang tải:** hiển thị Skeleton của Ant Design cho bảng danh sách và card chi tiết — không hiển thị bảng trống.
- **Không có dữ liệu:** hiển thị Empty của Ant Design với dòng chữ "Chưa có Cảng biển nào" màu `textSecondary`, cỡ chữ `fontSizeMd`.
- **Lỗi tải dữ liệu:** hiển thị cảnh báo với icon màu `statusCritical` và nút "Thử lại" màu `actionPrimary` dạng `actionStyle`.

### 10.9. Phân quyền hiển thị

Giao diện tự động ẩn/hiện các thành phần dựa trên vai trò người dùng:

| Vai trò | Thấy thành phần nào | Ghi chú |
|---|---|---|
| system-admin | Toàn bộ dữ liệu + Thêm mới, Xem chi tiết, Sửa trên danh sách + mọi hành động trên trang chi tiết + audit fields (createdBy/At, updatedBy/At) | Full quyền |
| admin (Security) | Toàn bộ dữ liệu + Thêm mới, Xem chi tiết, Sửa trên danh sách + mọi hành động trên trang chi tiết | Full quyền (không audit) |
| admin-operation | Toàn bộ dữ liệu + Thêm mới, Xem chi tiết, Sửa trên danh sách + Chỉnh sửa, Lịch sử trên trang chi tiết | Không Xóa, không Phê duyệt |
| admin | Dữ liệu trong đơn vị + Xem chi tiết, Sửa trên danh sách + Chỉnh sửa trên trang chi tiết | Phạm vi orgUnit |
| Lãnh đạo | Toàn bộ dữ liệu + Xem chi tiết trên danh sách + Phê duyệt/Từ chối, Lịch sử trên trang chi tiết | Không Thêm mới, Sửa, Xóa |
| Cán bộ | Dữ liệu trong đơn vị + Xem chi tiết trên danh sách + Xem chi tiết trên trang chi tiết | Chỉ xem |
| Doanh nghiệp cảng | Dữ liệu trong đơn vị + Xem chi tiết | Chỉ xem |
| Nhân viên vận hành | Dữ liệu trong đơn vị + Xem chi tiết (hạn chế trường) | Một số trường nhạy cảm bị ẩn |
| Admin Cục | Toàn bộ dữ liệu + tất cả nút + `createdBy`, `createdAt`, `updatedBy`, `updatedAt` | Logic đặc biệt (xem mục 2.2) |

### 10.10. Giao diện trên điện thoại

Khi màn hình nhỏ hơn 768px:

- Thanh menu trái thu gọn thành nút hamburger, rộng `layout.sidebarCollapsedWidth` (80px)
- Bảng danh sách chuyển thành dạng thẻ (card view)
- FilterBar chuyển thành panel có thể gập/mở
- Trang chi tiết hiển thị dạng cột đơn, card full-width
- Breadcrumb giữ nguyên, thu nhỏ font
