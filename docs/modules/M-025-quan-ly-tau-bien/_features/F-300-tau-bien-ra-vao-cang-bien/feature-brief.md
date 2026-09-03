---
id: F-300
name: Tàu biển ra vào cảng biển
slug: tau-bien-ra-vao-cang-bien
module-id: M-025
status: proposed
classification: local
priority: medium
created: 2026-09-02
last-updated: 2026-09-02
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Tàu biển ra vào cảng biển

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu 7-section)
**Chức năng:** F-XXX (chờ scaffold gán ID)
**Module:** M-025 — Quản lý tàu biển
**Loại:** chức năng thường (không có bước phê duyệt)
**Tham chiếu:** tài liệu nền `ba/00-lean-spec.md` (module M-025) + Excel root sheet `30->43` cụm #30

> **Trước khi viết:** đọc tài liệu nền `ba/00-lean-spec.md` để biết phần CHUNG (domain model, data scope, liên thông). File này CHỈ ghi phần RIÊNG của chức năng.
>
> **⚠️ Lưu ý trung thực với Excel:** (1) Excel nguồn KHÔNG khai báo cột "Bắt buộc" → bảng §2 không có cột bắt buộc, BA/SA chốt sau. (2) 2 trường "Hành khách đến/rời cảng" có toàn bộ cờ = false; 2 ô "Sửa" (Mã doanh nghiệp, Trạng thái) = "?" → đều đánh dấu **UNRESOLVED**, không bịa giá trị.

---

## 1. Mô tả ngắn

Chức năng **Tàu biển ra vào cảng biển** là sổ ghi chép định kỳ: cho phép chuyên viên/cán bộ đơn vị **tạo mới bản ghi** ghi nhận một lượt tàu biển ra/vào cảng biển (thông tin tàu, khối lượng hàng hóa theo 7 nhóm luồng, hành khách, cảng đi/đến, ngày đến/rời), và **xem danh sách** các bản ghi theo phạm vi đơn vị (DataScope). Không có luồng phê duyệt, không có sửa/xem chi tiết độc lập (theo ma trận Excel). Dữ liệu tàu kế thừa từ M-020; số liệu sổ nuôi M-017.

## 2. Trường dữ liệu

Ma trận trường khớp 100% Excel cụm #30 (✓ = true, — = false, ⚠️ = UNRESOLVED):

| # | Trường | Loại điều khiển | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| — | *Thông tin chung* | section | — | — | — | — | — | — |
| 1 | Đơn vị báo cáo | SelectOrgCode | ✓ | ✓ | — | ✓ | — | `orgUnitId` — trường DataScope |
| 2 | Ngày báo cáo | DatePicker | ✓ | ✓ | — | ✓ | — | `reportDate` |
| 3 | Mã báo cáo | Text | ✓ | — | — | — | — | `reportCode` — hiển thị, không nhập |
| 4 | Tên báo cáo | Text | ✓ | — | — | — | — | `reportName` |
| 5 | Kỳ báo cáo | Text | ✓ | — | — | — | — | `reportPeriod` |
| — | *Thông tin tàu* | section | — | — | — | — | — | — |
| 7 | Tên tàu | Input Text | — | — | — | ✓ | — | `shipName` |
| 8 | Hô hiệu | Input Text | — | — | — | ✓ | — | `callSign` |
| 9 | Số IMO | Input Text | — | — | — | ✓ | — | `imoNumber` |
| 10 | Quốc tịch | Select | — | — | — | ✓ | — | `nationality` |
| 11 | Loại tàu | Input Text | — | — | — | ✓ | — | `shipType` |
| 12 | Chiều dài | InputNumber | — | — | — | ✓ | — | `length` (m) |
| 13 | Mớn nước đến/rời cảng | InputNumber | — | — | — | ✓ | — | `draftArrivalDeparture` |
| 14 | DWT | InputNumber | — | — | — | ✓ | — | `dwt` |
| 15 | GT | InputNumber | — | — | — | ✓ | — | `gt` |
| 16 | Chiều cao tĩnh không thực tế vào, rời cảng | InputNumber | — | — | — | ✓ | — | `airDraftActual` |
| — | *Hàng hóa — Xuất khẩu* | section | — | — | — | — | — | — |
| 17 | Hàng hóa xuất khẩu — Tấn | InputNumber | — | — | — | ✓ | — | `exportTons` |
| 18 | Hàng hóa xuất khẩu — Teus | InputNumber | — | — | — | ✓ | — | `exportTeus` |
| 19 | Hàng hóa xuất khẩu — Teus rỗng | InputNumber | — | — | — | ✓ | — | `exportEmptyTeus` |
| — | *Hàng hóa — Nhập khẩu* | section | — | — | — | — | — | — |
| 20 | Hàng hóa nhập khẩu — Tấn | InputNumber | — | — | — | ✓ | — | `importTons` |
| 21 | Hàng hóa nhập khẩu — Teus | InputNumber | — | — | — | ✓ | — | `importTeus` |
| 22 | Hàng hóa nhập khẩu — Teus rỗng | InputNumber | — | — | — | ✓ | — | `importEmptyTeus` |
| — | *Hàng hóa — Nội địa đến* | section | — | — | — | — | — | — |
| 23 | Hàng hóa nội địa đến — Tấn | InputNumber | — | — | — | ✓ | — | `domesticInTons` |
| 24 | Hàng hóa nội địa đến — Teus | InputNumber | — | — | — | ✓ | — | `domesticInTeus` |
| 25 | Hàng hóa nội địa đến — Teus rỗng | InputNumber | — | — | — | ✓ | — | `domesticInEmptyTeus` |
| — | *Hàng hóa — Nội địa rời* | section | — | — | — | — | — | — |
| 26 | Hàng hóa nội địa rời — Tấn | InputNumber | — | — | — | ✓ | — | `domesticOutTons` |
| 27 | Hàng hóa nội địa rời — Teus | InputNumber | — | — | — | ✓ | — | `domesticOutTeus` |
| 28 | Hàng hóa nội địa rời — Teus rỗng | InputNumber | — | — | — | ✓ | — | `domesticOutEmptyTeus` |
| — | *Hàng hóa — Chuyển tải* | section | — | — | — | — | — | — |
| 29 | Hàng hóa chuyển tải — Tấn | InputNumber | — | — | — | ✓ | — | `transshipmentTons` |
| 30 | Hàng hóa chuyển tải — Teus | InputNumber | — | — | — | ✓ | — | `transshipmentTeus` (KHÔNG có Teus rỗng) |
| — | *Hàng hóa — Quá cảnh (bốc dỡ)* | section | — | — | — | — | — | — |
| 31 | Hàng hóa quá cảnh bốc dỡ — Tấn | InputNumber | — | — | — | ✓ | — | `transitHandlingTons` |
| 32 | Hàng hóa quá cảnh bốc dỡ — Teus | InputNumber | — | — | — | ✓ | — | `transitHandlingTeus` (KHÔNG có Teus rỗng) |
| — | *Hàng hóa — Quá cảnh (không bốc dỡ)* | section | — | — | — | ✓ | — | section Tạo mới=✓ |
| 33 | Hàng hóa quá cảnh không bốc dỡ — Tấn | InputNumber | — | — | — | ✓ | — | `transitNoHandlingTons` |
| 34 | Hàng hóa quá cảnh không bốc dỡ — Teus | InputNumber | — | — | — | ✓ | — | `transitNoHandlingTeus` (KHÔNG có Teus rỗng) |
| — | *Hành khách* | section | — | — | — | ✓ | — | section Tạo mới=✓ |
| 35 | Hành khách đến cảng | InputNumber | — | — | — | — | — | ⚠️ `passengersArrival` — Excel all-false |
| 36 | Hành khách rời cảng | InputNumber | — | — | — | — | — | ⚠️ `passengersDeparture` — Excel all-false |
| — | *Thông tin hàng hóa chi tiết* | section | — | — | — | — | — | — |
| 37 | Nhóm hàng | Select | — | — | — | ✓ | — | `cargoGroup` |
| 38 | Loại hàng | Select | — | — | — | ✓ | — | `cargoType` |
| 39 | Tên hàng | Input Text | — | — | — | ✓ | — | `cargoName` |
| — | *Thông tin cảng* | section | — | — | — | — | — | — |
| 40 | Cảng rời cuối cùng | Input Text | — | — | — | ✓ | — | `lastPortOfCall` |
| 41 | Tên cảng đến (Cảng dỡ hàng) | Input Text | — | — | — | ✓ | — | `arrivalPortName` |
| 42 | Mã cảng đến (Cảng dỡ hàng) | Input Text | — | — | — | ✓ | — | `arrivalPortCode` (STT merge cell) |
| 43 | Tên cảng đi (Cảng xếp hàng) | Input Text | — | — | — | ✓ | — | `departurePortName` |
| 44 | Mã cảng đi (Cảng xếp hàng) | Input Text | — | — | — | ✓ | — | `departurePortCode` (STT merge cell) |
| 45 | Cảng đích | Input Text | — | — | — | ✓ | — | `destinationPort` |
| — | *Ngày tháng* | section | — | — | — | — | — | — |
| 46 | Ngày đến cảng | DatePicker | — | ✓ | — | ✓ | — | `arrivalDate` — Bộ lọc |
| 47 | Ngày rời cảng | DatePicker | — | ✓ | — | ✓ | — | `departureDate` — Bộ lọc |
| — | *Thông tin khác* | section | — | — | — | — | — | — |
| 48 | Tuyến từ bờ ra đảo | Select | — | — | — | ✓ | — | `islandRoute` |
| 49 | Hàng nguy hiểm | Select | — | — | — | ✓ | — | `dangerousGoods` |
| 50 | Đại lý tàu biển | Input Text | — | — | — | ✓ | — | `shipAgent` |
| 51 | Mã doanh nghiệp | Select | — | — | — | ✓ | ⚠️ | `enterpriseCode` — Sửa="?" |
| — | *Trạng thái* | section | — | — | — | — | — | — |
| 52 | Trạng thái | Select | — | — | — | — | ⚠️ | ⚠️ `status` — all-false + Sửa="?" |

## 3. Trạng thái và phê duyệt

- **Không có bước phê duyệt** (chức năng thường — sổ nhập liệu định kỳ).
- Không áp dụng quy trình phê duyệt 2 cấp M-1006 cho sổ này.
- Trường `Trạng thái` (STT 52) tồn tại trong Excel nhưng toàn bộ cờ = false và `Sửa = "?"` → **UNRESOLVED**, BA/SA chốt các trạng thái của sổ (nếu cần), không tự bịa.

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc CHƯA có trong tài liệu nền `ba/00-lean-spec.md`.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-XXX-01 | Khối lượng hàng hóa chỉ nhập theo đơn vị đo đúng nhóm: Xuất/Nhập/Nội địa đến/Nội địa rời = Tấn + Teus + Teus rỗng; Chuyển tải + Quá cảnh = Tấn + Teus | Create |
| BR-XXX-02 | Các ô text nhập liệu (tên tàu, tên hàng, tên cảng…) phải `.trim()` trước khi gửi API | Create |
| BR-XXX-03 | `Đơn vị báo cáo` chỉ chọn trong phạm vi DataScope của user (TreeSelect), không gán đơn vị ngoài phạm vi | Create |

### 4.2. Acceptance Criteria kế thừa

- **AC-XXX-01** — Xem danh sách: bản ghi hiển thị theo DataScope; Cục/Admin full. Khi lỗi: 403 hoặc rỗng đúng phạm vi.
- **AC-XXX-02** — Tạo mới: điền đủ trường → lưu, `orgUnitId` không NULL.
- **AC-XXX-03** — Lọc theo Đơn vị báo cáo / Ngày báo cáo / Ngày đến cảng / Ngày rời cảng cho kết quả đúng.
- **AC-XXX-04** — Input trim: text gửi API không thừa khoảng trắng đầu/cuối.

### 4.3. User Stories kế thừa

- **US-XXX-01:** Là chuyên viên, tôi muốn tạo mới bản ghi tàu biển ra/vào cảng để ghi nhận lượt tàu trong kỳ.
- **US-XXX-02:** Là cán bộ đơn vị, tôi muốn lọc sổ theo đơn vị/ngày để tra cứu nhanh.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem danh sách sổ tàu biển | `ship-port-call:read` |
| Tạo mới bản ghi tàu biển | `ship-port-call:create` |

**Admin Cục:** full quyền + xem thêm metadata (người tạo, người sửa cuối, thời gian tạo/cập nhật).

## 5. Điểm khác biệt so với mẫu chung

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không chốt — trường `Trạng thái` (STT 52) all-false + Sửa="?" → UNRESOLVED |
| 2 | Có bước phê duyệt không | Không — sổ nhập liệu định kỳ |
| 3 | Lọc cha-con / theo đơn vị | Có — theo trường `Đơn vị báo cáo` (`orgUnitId`), DataScope subtree, Cục xem full (trường đơn vị bắt buộc, nguồn gán = user chọn trong phạm vi, chiều ghi validate `OrgUnitScopeService`) |
| 4 | Trường chỉ hiện trong điều kiện nào | Không (chưa có) |
| 5 | Quyền riêng | `ship-port-call:read`, `ship-port-call:create` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không (Excel không có trường Upload cho cụm #30) |
| 8 | Giao diện khác mẫu chung | Có — không có Drawer Xem chi tiết; chỉ Danh sách + popup Tạo mới (theo ma trận Excel Sửa/Xem chi tiết = false toàn bộ) |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/ship-port-call` | Danh sách sổ tàu biển (phân trang + lọc theo DataScope) | `ship-port-call:read` |
| POST | `/api/ship-port-call` | Tạo mới bản ghi tàu biển ra/vào cảng | `ship-port-call:create` |

> Không đề xuất PUT/DELETE vì Excel không bật `Sửa`; nếu nghiệp vụ cần hủy/sửa bản ghi nhập sai, BA/SA chốt thêm endpoint + permission (UNRESOLVED).

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `ship_port_call` (Sổ tàu biển ra, vào cảng biển)** — 🔴 bảng mới toàn bộ:

`id` (UUID PK) · `org_unit_id` (UUID FK → org unit, 🔴 DataScope, NOT NULL) · `report_date` · `report_code` · `report_name` · `report_period` · `ship_name` · `call_sign` · `imo_number` · `nationality` · `ship_type` · `length` · `draft_arrival_departure` · `dwt` · `gt` · `air_draft_actual` · `export_tons` / `export_teus` / `export_empty_teus` · `import_tons` / `import_teus` / `import_empty_teus` · `domestic_in_tons` / `domestic_in_teus` / `domestic_in_empty_teus` · `domestic_out_tons` / `domestic_out_teus` / `domestic_out_empty_teus` · `transshipment_tons` / `transshipment_teus` · `transit_handling_tons` / `transit_handling_teus` · `transit_no_handling_tons` / `transit_no_handling_teus` · `passengers_arrival` 🔴(UNRESOLVED) · `passengers_departure` 🔴(UNRESOLVED) · `cargo_group` / `cargo_type` / `cargo_name` · `last_port_of_call` · `arrival_port_name` / `arrival_port_code` · `departure_port_name` / `departure_port_code` · `destination_port` · `arrival_date` · `departure_date` · `island_route` · `dangerous_goods` · `ship_agent` · `enterprise_code` · `status` 🔴(UNRESOLVED) · audit (created_by / created_at / updated_by / updated_at / deleted_at).

> Cột enum (nếu có: `nationality`, `ship_type`, `cargo_group`, `dangerous_goods`, `island_route`, `status`) lưu số nguyên `@Enumerated(ORDINAL)` theo convention; các tên cột/bảng/field bằng tiếng Anh, message hiển thị tiếng Việt có dấu.
