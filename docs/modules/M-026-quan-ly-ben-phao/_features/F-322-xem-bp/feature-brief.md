---
id: F-322
name: "Xem danh sách & Chi tiết Bến phao"
slug: xem-bp
module-id: M-026
status: proposed
classification: local
priority: medium
created: "2026-08-28"
last-updated: "2026-08-28"
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Xem danh sách & Chi tiết Bến phao

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-322
**Module:** M-026 — Quản lý Bến phao
**Loại:** chức năng thường (không có bước phê duyệt)
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (bắt buộc đọc trước) + `docs/conventions/list-screen-ui-standard.md` + `docs/conventions/form-and-list-patterns.md` + tài liệu yêu cầu gốc (TKCT)

> **Trước khi viết:** đọc tài liệu nền của module (`ba/00-lean-spec.md`) để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

> **⚠️ BẮT BUỘC KHAI BÁO PHẠM VI DỮ LIỆU THEO ĐƠN VỊ (Data Scope):** danh sách và chi tiết lọc theo DataScope (đơn vị nào xem dữ liệu đơn vị đó; cha xem subtree; Cục xem full); filter `orgUnitId` dạng cây. Khai báo đầy đủ ở mục 5, dòng 3 — SA chốt khi duyệt.

---

## 1. Mô tả ngắn

Màn hình Danh sách (route `/buoy-berth`, menu "Quản lý bến phao") hiển thị tất cả hồ sơ bến phao trong phạm vi đơn vị với bộ lọc đầy đủ, StatusTabs trạng thái phê duyệt, phân trang. Chi tiết hồ sơ mở trong **AppDrawer 7 tab**: Thông tin chung · Thông tin vị trí (GIS) · File đính kèm · **Kết cấu hạ tầng** · **Vận hành & bảo trì** · **Xử lý & theo dõi** (approval-audit columns) · Phê duyệt/Lịch sử. Từ drawer chi tiết có thể mở chi tiết KCHT con (Khu neo đậu, Khu tránh, trú bão). Không có thao tác ghi dữ liệu trong chức năng này (chỉ xem).

## 2. Trường dữ liệu

Cột danh sách (List=TRUE theo CSV) và trường chi tiết (Detail=TRUE) — đầy đủ tại `ba/00-lean-spec.md` mục 4:

| Khu vực | Trường |
|---|---|
| Cột danh sách | STT · Tên bến phao + Mã (2 dòng, cố định trái) · Đơn vị quản lý · Thuộc cảng biển · Địa điểm (Tỉnh/TP) · Phân cấp công trình · Tình trạng (pill) · Trạng thái (pill) · Cán bộ cập nhật (Tên + Ngày 2 dòng) · Thao tác (rowActions) |
| Bộ lọc (Filter=TRUE) | `orgUnitId` (OrgUnitTreeSelect) · từ khóa Mã+Tên (không dấu) · `portId` (cascading theo orgUnit) · `waterwayId` · `classification` · `provinceId` · `operationalStatus` · `approvalStatus` (StatusTabs) · khoảng `updatedAt` (RangePicker) |
| Drawer chi tiết | Toàn bộ 57 trường: 26 trường nhập + GIS (27–31) + File (32) + KCHT (33–34) + Vận hành/Bảo trì/Sự cố (35–46) + Xử lý & theo dõi (47–57) |
| Tab Kết cấu hạ tầng | Bảng: STT · Loại KCHT (pill: Khu neo đậu xanh / Khu tránh, trú bão vàng) · Tên KCHT (clickable) · Thao tác (👁 Xem chi tiết); filter "Chọn loại kết cấu hạ tầng" (ANCHORAGE/STORM_SHELTER) |
| Tab Vận hành & bảo trì | Thông tin vận hành khai thác (Mã/Tên kế hoạch, ngày bắt đầu/kết thúc) · Thông tin bảo trì · Thông tin sự cố — read-only |
| Tab Xử lý & theo dõi | Trạng thái · Ngày/Cán bộ cập nhật · Ngày/Cán bộ gửi PD · Ngày/Cán bộ duyệt C1 (Cảng vụ/Chi cục) + nội dung · Ngày/Cán bộ duyệt C2 (Cục) + nội dung — read-only |

## 3. Trạng thái và phê duyệt

- Trạng thái lưu dạng số, theo tài liệu nền mục 3.7.
- **Không có bước phê duyệt** — chức năng chỉ hiển thị; mọi trạng thái trong 7 trạng thái chuẩn đều hiển thị được (Lưu tạm/Chờ Cảng vụ/Chờ Cục/Đã duyệt/Từ chối C1/Từ chối C2/Đã xóa — trừ ARCHIVED không hiển thị ở danh sách).
- StatusTabs 6 tab: Tất cả · Lưu tạm · Chờ Cảng vụ duyệt · Chờ Cục duyệt · Đã duyệt · Từ chối (gộp C1+C2); số Tất cả = tổng các tab con.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền (phần chung đã nằm ở `ba/00-lean-spec.md`).

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-322-01 | Danh sách mặc định loại bản ghi `deletedAt IS NOT NULL` (ARCHIVED không hiển thị); phân trang mặc định size 20 | Read |
| BR-322-02 | Tìm kiếm từ khóa không dấu trên Mã + Tên (immutable_unaccent); filter `portId`/`waterwayId` cascading theo `orgUnitId` đã chọn, đổi đơn vị cha → reset giá trị con không còn hợp lệ | Read |
| BR-322-03 | Đơn vị quản lý lọc bằng OrgUnitTreeSelect dạng cây (giữ value `orgUnitId`); backend giới hạn phạm vi theo quyền (DataScope) | Read |
| BR-322-04 | Chi tiết chỉ xem được hồ sơ trong phạm vi DataScope; Cục xem full; bản ghi securityLevel RESTRICTED/CONFIDENTIAL cần `buoyberth:read:restricted`/`read:confidential` | Read |
| BR-322-05 | Tên hiển thị: đơn vị quản lý `orgUnitName` (OrgUnitCacheService), cảng `portName` (PortCacheService), đơn vị khai thác `operatingOrgName` (bảng `operating_units`) — response trả kèm tên, frontend không map ID→tên | Read |
| BR-322-06 | Tab "Kết cấu hạ tầng": load 2 loại KCHT con có tham chiếu (`anchorageCRUD.search({buoyStationId})`, `stormShelterCRUD.search({buoyStationId})`); mở chi tiết con qua drawer chồng `AppDrawer size={950}` (px cố định) | Read |
| BR-322-07 | Tiêu đề cột hiển thị đủ 100% chữ; nội dung ô dài cắt `...` + tooltip; Badge trạng thái/tình trạng dạng pill theo quy chuẩn | Read |
| BR-322-08 | Hiển thị đủ 4 trạng thái dữ liệu: loading · error · empty · data (EmptyState không phá chiều cao bảng; scrollLeft về 0 sau lọc) | Read |

### 4.2. Acceptance Criteria kế thừa (nếu có)

- **AC-322-01 — Lọc đúng:** Lọc theo đơn vị cha → chỉ thấy subtree; lọc theo trạng thái tab → số bản ghi khớp badge; tìm kiếm "hải phòng" không dấu ra được "Hải Phòng".
- **AC-322-02 — Chi tiết đủ tab:** Mở chi tiết hồ sơ APPROVED → 7 tab hiển thị đủ: Thông tin chung, GIS (DMS compact + symbol preview), File đính kèm, Kết cấu hạ tầng (2 loại KCHT + filter), Vận hành & bảo trì, Xử lý & theo dõi (approval-audit columns), Phê duyệt/Lịch sử.
- **AC-322-03 — DataScope:** User cấp đơn vị không thấy hồ sơ của đơn vị khác trong danh sách và khi truy cập trực tiếp `GET /{id}`.

### 4.3. User Stories kế thừa (nếu có)

- **US-322-01:** Là cán bộ Cảng vụ, tôi muốn lọc nhanh hồ sơ theo trạng thái/đơn vị/cảng để theo dõi tiến độ duyệt.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem danh sách / chi tiết | `buoyberth:read` |
| Xem bản ghi hạn chế | `buoyberth:read:restricted` |
| Xem bản ghi mật | `buoyberth:read:confidential` |
| Tải file đính kèm | `buoyberth:read` |

**Admin Cục:** full quyền `buoyberth:*` + xem thêm metadata (người tạo, người sửa cuối, thời gian tạo/cập nhật) — theo tài liệu nền mục 3.7/3.8, không có quyền riêng ngoài seed. **10 quyền `buoyberth:*` ĐÃ SEED — không seed lại.**

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không có — 7 trạng thái chuẩn; ARCHIVED không hiển thị |
| 2 | Có bước phê duyệt không | Không — chỉ xem |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị — `orgUnitId` cây + DataScope backend; Cục xem full; không ngoại lệ |
| 4 | Trường chỉ hiện trong điều kiện nào | Tab "Phê duyệt"/"Thay đổi" chỉ hiện khi không ở chế độ tạo; nút duyệt theo trạng thái (F-321) |
| 5 | Quyền riêng | `buoyberth:read`, `buoyberth:read:restricted`, `buoyberth:read:confidential` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không (chỉ xem/tải về file đính kèm) |
| 8 | Giao diện khác mẫu chung | Có một điểm riêng — drawer chi tiết 7 tab với tab **"Kết cấu hạ tầng"** (bảng 2 loại KCHT con + filter) và tab **"Vận hành & bảo trì"** (3 khối read-only); còn lại theo mẫu chung (list-view components, tokens) |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/buoy-berth?page&size&orgUnitId&search&buoyBerthCode&buoyBerthName&portId&waterwayId&classification&provinceId&operationalStatus&approvalStatus&updatedFrom&updatedTo` | Danh sách phân trang + lọc | `buoyberth:read` |
| GET | `/api/v1/buoy-berth/{id}` | Chi tiết hồ sơ (kèm orgUnitName/portName/operatingOrgName, GIS coordinates, approval-audit) | `buoyberth:read` |
| GET | `/api/v1/buoy-berth/{id}/attachments` | Danh sách file đính kèm | `buoyberth:read` |
| GET | `/api/v1/anchorage?buoyStationId={id}` / `/api/v1/storm-shelter?buoyStationId={id}` | KCHT con cho tab "Kết cấu hạ tầng" | `buoyberth:read` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ. *(Bảng `buoy_berths` đã có migration — không đề xuất thay đổi; liệt kê đầy đủ tại `ba/00-lean-spec.md` mục 7.)*

**Bảng `buoy_berths`:** toàn bộ cột dữ liệu + audit + approval-audit (liệt kê ở brief F-318 mục 7). Không có bảng con; danh sách KCHT con lấy từ bảng của module khác (anchorage/storm_shelter) qua tham chiếu `buoyStationId`, tọa độ GIS lấy từ `gis_spatial_objects` qua `spatial_id`, file đính kèm từ bảng `attachment` (refType `BUOY_BERTH`).
