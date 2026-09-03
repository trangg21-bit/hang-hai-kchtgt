---
module-id: M-025
document: lean-spec
output-mode: lean
last-updated: 2026-09-02
source-of-truth: "HH_Tính năng & danh sách các trường thông tin_2.9.xlsx — sheet '30->43', cụm #30 'Tàu biển (Tàu biển ra, vào cảng biển)'"
---

# Lean Spec: Quản lý tàu biển (M-025)

> ⚠️ **DRAFT** — chờ duyệt trước khi scaffold live. Đây là **BA lean spec cấp module**, đặc tả nghiệp vụ sổ "Tàu biển ra, vào cảng biển". Phần kỹ thuật (tên bảng, endpoint, migration) là **đề xuất của BA, SA chốt**.

## 1. Summary

M-025 quản lý **Sổ tàu biển ra, vào cảng biển** — một sổ ghi chép định kỳ: mỗi bản ghi = **một lượt tàu biển vào/rời một cảng biển** trong phạm vi đơn vị báo cáo. Người dùng (chuyên viên / cán bộ đơn vị) tạo mới bản ghi theo từng lượt tàu, ghi nhận thông tin tàu + khối lượng hàng hóa + hành khách + cảng đi/đến + ngày đến/rời.

Đây **không phải** module quản lý tài sản KCHT có phê duyệt: ma trận Excel cho thấy **chỉ Danh sách + Tạo mới**, không có Sửa/Xem chi tiết, không có luồng phê duyệt. Dữ liệu tàu được kế thừa từ **M-020 (Tích hợp dữ liệu nghiệp vụ)**; số liệu sổ nuôi **M-017 (Thống kê chuyên đề)**.

## 2. Scope

### In scope

- Sổ tàu biển ra/vào cảng: Danh sách (routed page) + popup Tạo mới.
- 52 dòng trường ma trận Excel cụm #30 (đầy đủ tại mục 4 — Domain Model).
- Bộ lọc: `Đơn vị báo cáo`, `Ngày báo cáo`, `Ngày đến cảng`, `Ngày rời cảng`.
- Data scope theo đơn vị (`Đơn vị báo cáo` = `orgUnitId`).

### Out of scope

- Không có luồng phê duyệt 2 cấp (tham chiếu M-1006 KHÔNG áp dụng cho sổ này).
- Không có chỉnh sửa/xem chi tiết độc lập (Excel: `Sửa = false`, `Xem chi tiết = false` toàn bộ).
- Không tạo nguồn dữ liệu tàu (M-020 cung cấp); không vẽ thống kê (M-017 tiêu thụ).
- Không quản lý tài sản (đây KHÔNG phải entity tài sản KCHT).

## 3. Use Cases

| UC | Tên | Actor | Mô tả ngắn |
|---|---|---|---|
| UC-01 | Xem danh sách sổ tàu biển | Chuyên viên / Cán bộ đơn vị / Admin Cục | Truy cập menu, xem danh sách bản ghi theo DataScope; lọc theo đơn vị báo cáo, ngày báo cáo, ngày đến/rời cảng |
| UC-02 | Tạo mới bản ghi tàu biển ra/vào cảng | Chuyên viên / Cán bộ đơn vị | Mở popup, điền thông tin chung + tàu + hàng hóa + hành khách + cảng + ngày, lưu |
| UC-03 | (đề xuất) Tra cứu/autofill thông tin tàu từ M-020 | Chuyên viên | Chọn tàu đã tích hợp để tự điền tên/hô hiệu/IMO/quốc tịch/GT/DWT… — BA đề xuất, SA chốt |

## 4. Domain Model

### 4.1. Entity (đề xuất — SA chốt tên)

- **Entity đề xuất:** `ShipPortCall` — mỗi bản ghi = 1 lượt tàu biển ra/vào cảng biển.
- **Bảng đề xuất:** `ship_port_call`.
- **Resource đề xuất:** `ship-port-call` (prefix cho API + permission).

### 4.2. Ma trận trường (khớp 100% Excel cụm #30)

Ký hiệu: ✓ = true, — = false, ⚠️ = UNRESOLVED (ô "?" hoặc bất nhất trong Excel).

| STT | Trường (Excel) | Loại điều khiển | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa | Tên field (đề xuất) |
|---|---|---|---|---|---|---|---|---|
| — | *Thông tin chung* | section | — | — | — | — | — | — |
| 1 | Đơn vị báo cáo | SelectOrgCode | ✓ | ✓ | — | ✓ | — | `orgUnitId` (DataScope) |
| 2 | Ngày báo cáo | DatePicker | ✓ | ✓ | — | ✓ | — | `reportDate` |
| 3 | Mã báo cáo | Text | ✓ | — | — | — | — | `reportCode` (tự sinh/đọc) |
| 4 | Tên báo cáo | Text | ✓ | — | — | — | — | `reportName` |
| 5 | Kỳ báo cáo | Text | ✓ | — | — | — | — | `reportPeriod` |
| 6 | *Thông tin tàu* | section | — | — | — | — | — | — |
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
| 30 | Hàng hóa chuyển tải — Teus | InputNumber | — | — | — | ✓ | — | `transshipmentTeus` |
| — | *Hàng hóa — Quá cảnh (bốc dỡ)* | section | — | — | — | — | — | — |
| 31 | Hàng hóa quá cảnh bốc dỡ — Tấn | InputNumber | — | — | — | ✓ | — | `transitHandlingTons` |
| 32 | Hàng hóa quá cảnh bốc dỡ — Teus | InputNumber | — | — | — | ✓ | — | `transitHandlingTeus` |
| — | *Hàng hóa — Quá cảnh (không bốc dỡ)* | section | — | — | — | ✓ | — | — |
| 33 | Hàng hóa quá cảnh không bốc dỡ — Tấn | InputNumber | — | — | — | ✓ | — | `transitNoHandlingTons` |
| 34 | Hàng hóa quá cảnh không bốc dỡ — Teus | InputNumber | — | — | — | ✓ | — | `transitNoHandlingTeus` |
| — | *Hành khách* | section | — | — | — | ✓ | — | — |
| 35 | Hành khách đến cảng | InputNumber | — | — | — | — | — | ⚠️ `passengersArrival` — Excel all-false |
| 36 | Hành khách rời cảng | InputNumber | — | — | — | — | — | ⚠️ `passengersDeparture` — Excel all-false |
| — | *Thông tin hàng hóa chi tiết* | section | — | — | — | — | — | — |
| 37 | Nhóm hàng | Select | — | — | — | ✓ | — | `cargoGroup` |
| 38 | Loại hàng | Select | — | — | — | ✓ | — | `cargoType` |
| 39 | Tên hàng | Input Text | — | — | — | ✓ | — | `cargoName` |
| — | *Thông tin cảng* | section | — | — | — | — | — | — |
| 40 | Cảng rời cuối cùng | Input Text | — | — | — | ✓ | — | `lastPortOfCall` |
| 41 | Tên cảng đến (Cảng dỡ hàng) | Input Text | — | — | — | ✓ | — | `arrivalPortName` |
| 42 | Mã cảng đến (Cảng dỡ hàng) | Input Text | — | — | — | ✓ | — | `arrivalPortCode` |
| 43 | Tên cảng đi (Cảng xếp hàng) | Input Text | — | — | — | ✓ | — | `departurePortName` |
| 44 | Mã cảng đi (Cảng xếp hàng) | Input Text | — | — | — | ✓ | — | `departurePortCode` |
| 45 | Cảng đích | Input Text | — | — | — | ✓ | — | `destinationPort` |
| — | *Ngày tháng* | section | — | — | — | — | — | — |
| 46 | Ngày đến cảng | DatePicker | — | ✓ | — | ✓ | — | `arrivalDate` |
| 47 | Ngày rời cảng | DatePicker | — | ✓ | — | ✓ | — | `departureDate` |
| — | *Thông tin khác* | section | — | — | — | — | — | — |
| 48 | Tuyến từ bờ ra đảo | Select | — | — | — | ✓ | — | `islandRoute` |
| 49 | Hàng nguy hiểm | Select | — | — | — | ✓ | — | `dangerousGoods` |
| 50 | Đại lý tàu biển | Input Text | — | — | — | ✓ | — | `shipAgent` |
| 51 | Mã doanh nghiệp | Select | — | — | — | ✓ | ⚠️ | `enterpriseCode` — Sửa="?" |
| — | *Trạng thái* | section | — | — | — | — | — | — |
| 52 | Trạng thái | Select | — | — | — | — | ⚠️ | ⚠️ `status` — all-false + Sửa="?" |

> **Ghi chú trung thực với Excel:** (1) STT 42 & 44 có ô STT trống do merge cell — tên trường lấy từ cột "Tên trường". (2) "Chuyển tải" và "Quá cảnh (bốc dỡ)/(không bốc dỡ)" **KHÔNG có** cột "Teus rỗng" (chỉ Tấn + Teus) — khác với Xuất khẩu/Nhập khẩu/Nội địa đến/Nội địa rời. (3) Cột "Bắt buộc" (required) KHÔNG được Excel khai báo → BA/SA phải chốt riêng.

## 5. Trạng thái

- **Không có bước phê duyệt.** Module là sổ nhập liệu, không có trường phê duyệt (so với các block khác có "Ngày gửi phê duyệt / Cán bộ phê duyệt cấp Cảng vụ/Cục").
- Trường `Trạng thái` (STT 52) tồn tại trong Excel nhưng toàn bộ cột = false và `Sửa = "?"` → **UNRESOLVED** — chưa chốt các trạng thái/chuyển trạng thái của sổ. Không tự bịa (vd: Lưu tạm/Hoàn thành).

## 6. Business Rules

| BR-ID | Quy tắc | Áp dụng | Nguồn |
|---|---|---|---|
| BR-001 | Mỗi bản ghi là một lượt tàu biển ra/vào cảng, gắn với đúng một `Đơn vị báo cáo` (`orgUnitId`) | Create | Excel trường 1 + DataScope |
| BR-002 | Bản ghi thuộc đơn vị nào thì chỉ đơn vị đó (và cấp cha/subtree) xem được; Cục xem full | Read (DataScope) | DataScope Convention |
| BR-003 | Thông tin tàu (tên/hô hiệu/IMO/quốc tịch/loại tàu/GT/DWT…) kế thừa từ M-020; không nhập tay trùng lặp nguồn | Create | Liên thông M-020 (đề xuất BA) |
| BR-004 | Khối lượng hàng hóa nhập theo đơn vị đo của từng nhóm: Xuất/Nhập/Nội địa đến/Nội địa rời có Tấn+Teus+Teus rỗng; Chuyển tải & Quá cảnh chỉ Tấn+Teus | Create | Excel STT 17–34 |
| BR-005 | `Ngày đến cảng` / `Ngày rời cảng` là tiêu chí lọc (Bộ lọc = true) | Read | Excel STT 46–47 |
| BR-006 | Không cho ghi dữ liệu vào đơn vị ngoài phạm vi user (`OrgUnitScopeService` validate chiều ghi) | Create | DataScope Convention |

## 7. Data Scope & Phân quyền

### 7.1. Data Scope

- Trường đơn vị: `Đơn vị báo cáo` (`orgUnitId`, UUID) — **bắt buộc, không NULL**.
- Entity `ship_port_call` khai `@Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")`; controller `@DataScope` (class-level).
- Nguồn gán đơn vị khi tạo: từ trường `Đơn vị báo cáo` do user chọn (TreeSelect trong phạm vi DataScope) hoặc fallback đơn vị của user.
- Chiều ghi: validate `OrgUnitScopeService.Scope.allows(...)`.

### 7.2. Phân quyền (đề xuất)

| Thao tác | Quyền `<resource>:<action>` |
|---|---|
| Xem danh sách sổ tàu biển | `ship-port-call:read` |
| Tạo mới bản ghi tàu biển | `ship-port-call:create` |

- **Admin Cục:** full quyền + xem thêm metadata (người tạo, người sửa cuối, thời gian tạo/cập nhật).
- Khi scaffold, Dev PHẢI seed 2 permission trên vào `PermissionSeeder.java` (`seedPermission(definitions, "ship-port-call", action)`).
- Lưu ý: Excel không bật `Sửa` → chưa đề xuất `update`/`delete`; nếu nghiệp vụ cần hủy/xóa bản ghi nhập sai, BA/SA phải chốt (UNRESOLVED).

## 8. Liên thông (Integration)

| Hướng | Module | Feature | Dữ liệu |
|---|---|---|---|
| Đầu vào | M-020 Tích hợp dữ liệu nghiệp vụ | F-254 `tich-hop-kchtgt-tau-bien-ra-vao-cang` | Thông tin tàu (tên, hô hiệu, IMO, quốc tịch, loại tàu, GT, DWT…) |
| Đầu ra | M-017 Thống kê chuyên đề | F-161 (Bieu 11-T), F-163, F-164, F-167 | Số liệu lượt tàu + hàng hóa + hành khách để tổng hợp |

## 9. Acceptance Criteria (kế thừa mẫu chung)

- **AC-025-01** — Xem danh sách: user thấy các bản ghi thuộc phạm vi DataScope của mình; Cục/Admin thấy full. Khi lỗi: 403 hoặc rỗng đúng phạm vi.
- **AC-025-02** — Tạo mới: điền đủ các trường theo ma trận → lưu thành công, bản ghi có `orgUnitId` = đơn vị báo cáo đã chọn, không NULL.
- **AC-025-03** — Lọc: lọc theo `Đơn vị báo cáo` (cây), `Ngày báo cáo`, `Ngày đến cảng`, `Ngày rời cảng` cho kết quả đúng.
- **AC-025-04** — Input trim: các ô text (tên tàu, tên hàng, tên cảng…) được `.trim()` trước khi gửi API.
- **AC-025-05** — Gán đơn vị ngoài phạm vi user → bị chặn (validate `OrgUnitScopeService`).

## 10. Pipeline Triage

| Câu hỏi | Trả lời | Lý do |
|---|---|---|
| Domain model affected? | Có — entity mới | `ShipPortCall` chưa tồn tại; cần entity + bảng + lifecycle |
| Architecture affected? | Có | REST endpoint mới, DB table `ship_port_call`, seed 2 permission, `@DataScope` |
| Implementation clear? | Chưa | Cần SA: resource naming, cơ chế autofill từ M-020, xử lý 2 ô UNRESOLVED (hành khách, trạng thái) |
| **Verdict** | `Ready for solution architecture` | Domain đã formalized; SA chốt endpoint, schema, permission seed, và 3 điểm UNRESOLVED |
