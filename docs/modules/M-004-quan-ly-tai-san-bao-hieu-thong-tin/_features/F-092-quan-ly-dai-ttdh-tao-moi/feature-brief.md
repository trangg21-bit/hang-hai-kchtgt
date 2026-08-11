---
id: F-092
name: Quản lý Đài TTDH - Tạo mới
slug: quan-ly-dai-ttdh-tao-moi
module-id: M-004
status: proposed
classification: local
priority: medium
created: 2026-07-07T03:32:57Z
last-updated: 2026-08-11
locked-fields: []
consumed_by_modules: []
x-legacy:
  source-paths:
    - src/main/java/com/hanghai/kchtg/station/
---
# Đặc tả nghiệp vụ: Quản lý Đài TTDH - Tạo mới

**Tài liệu:** BA Feature Brief
**Feature:** F-092
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Mã chức năng:** QLKC-078
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-11

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Cho phép cán bộ nghiệp vụ tạo mới một Đài Thông tin Duyên hải (TTDH) trong hệ thống. Form tạo mới bao gồm các nhóm thông tin:

**Nhóm A — Thông tin chung (hành chính):**
- **Đơn vị quản lý (unitId):** mặc định theo đơn vị của user đăng nhập (R4), bắt buộc.
- **Đơn vị khai thác (operatingUnitId):** có thể khác đơn vị quản lý, không bắt buộc (R6).
- **Mã đài (code):** hệ thống tự sinh format `DTTDH-xxxxx`, không cho người dùng nhập, immutable (R1, R2, R3).
- **Tên đài (name):** bắt buộc, tối đa 255 ký tự.
- **Phân loại đài (stationLevel):** dropdown Loại I → Loại V, bắt buộc.
- **Địa điểm — Tỉnh/TP (provinceId):** bắt buộc.
- **Địa điểm chi tiết (detailedLocation):** bắt buộc, tối đa 500 ký tự.
- **Vùng phủ sóng (coverageArea):** không bắt buộc, mô tả phạm vi hoạt động.
- **Dịch vụ cung cấp (servicesProvided):** chọn nhiều từ 9 dịch vụ cố định (xem 2.2 trong handoff), không bắt buộc.
- **Tình trạng (usageStatus):** Đang sử dụng / Không sử dụng, mặc định Đang sử dụng. **Đây là tình trạng vận hành thực tế, KHÔNG phải trạng thái phê duyệt.**
- **Ghi chú (remarks):** tối đa 2000 ký tự.

**Nhóm B — GIS & Bản đồ:**
- **Loại đối tượng (geometryType):** Điểm / Đường / Vùng.
- **Biểu tượng (mapSymbolId):** icon hiển thị trên bản đồ.
- **Hệ quy chiếu (coordinateSystem):** hệ tọa độ.
- **Quy tắc hiển thị (displayRule):** cách hiển thị trên bản đồ.
- **Bảng tọa độ (coordinates):** bảng động thêm/xóa dòng, mỗi dòng gồm Vĩ độ N* + Kinh độ E* (WGS84), tối thiểu 1 dòng.

**Nhóm C — File đính kèm:**
- Upload nhiều file (quyết định thành lập, hồ sơ kỹ thuật, ảnh hiện trạng...).

**Các trường bị ẩn:** Tần số liên lạc, transmitPower, equipmentType — không hiển thị trên form Đài TTDH.

Form có 3 nút Lưu: **Lưu tạm** (status = Lưu tạm), **Lưu và gửi phê duyệt** (status = Chờ duyệt cấp Cảng vụ/Chi cục), **Lưu và phê duyệt** (status = Đã phê duyệt, chỉ Cấp Cục — R14).

### 1.2. Tại sao cần tính năng này?

Số hóa quy trình đăng ký Đài TTDH thuộc nhóm Mạng viễn thông hàng hải, do Cục Hàng hải Việt Nam quản lý. Mỗi đài được khởi tạo với đầy đủ thông tin hành chính, GIS, dịch vụ và tình trạng vận hành. Mã đài tự sinh đảm bảo tính duy nhất. Phân loại đài (Loại I→V) giúp phân cấp quản lý.

### 1.3. Luồng hoạt động chính

**Bước 1: Mở form tạo mới**
- Người dùng truy cập màn hình danh sách Đài TTDH → Chọn "Thêm mới".
- Hệ thống: hiển thị modal form với các nhóm A→C. Mã đài hiển thị read-only "Mã đài sẽ được tự sinh khi lưu". Đơn vị quản lý mặc định theo user. Nút "Lưu và phê duyệt" chỉ hiển thị cho Cấp Cục.

**Bước 2: Nhập dữ liệu**
- Người dùng: điền các trường, chọn dịch vụ (multi-select), thêm dòng tọa độ, upload file.
- Hệ thống: validate real-time (trim(), độ dài, range tọa độ).

**Bước 3a: Nhấn "Lưu tạm"**
- Hệ thống: tự sinh mã `DTTDH-xxxxx`. Validate: name không rỗng, stationLevel đã chọn, provinceId đã chọn. Tình trạng mặc định Đang sử dụng. Lưu status = Lưu tạm. HTTP 200.
- Khi lỗi: HTTP 400 + thông báo tiếng Việt.

**Bước 3b: Nhấn "Lưu và gửi phê duyệt"**
- Hệ thống: tự sinh mã. Validate đầy đủ: name, stationLevel, unitId, provinceId, detailedLocation bắt buộc. Tọa độ tối thiểu 1 dòng. File ≤ 10MB, định dạng pdf/jpg/png/docx/xlsx. Lưu status = Chờ duyệt cấp Cảng vụ/Chi cục. HTTP 200.

**Bước 3c: Nhấn "Lưu và phê duyệt" (chỉ Cấp Cục)**
- Hệ thống: tự sinh mã. Validate đầy đủ như 3b. Lưu status = Đã phê duyệt. HTTP 200.

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Logic phân quyền chung

| Vai trò | Quyền xem | Quyền thao tác | Phạm vi dữ liệu | Ghi chú |
|---|---|---|---|---|
| system-admin | Toàn bộ | Tạo mới | Toàn bộ | |
| admin (Security) | Toàn bộ | Tạo mới | Toàn bộ | |
| Cấp Cục | Toàn bộ | Tạo mới + Lưu và phê duyệt | Toàn bộ | R13, R14 |
| Cấp Cảng vụ/Chi cục | Đơn vị mình | Tạo mới | Đơn vị mình | R12 |
| Cán bộ | Đơn vị mình | Tạo mới | Đơn vị mình | |
| Cá nhân | Không | Không | Không | |

### 2.2. Logic phân quyền đặc biệt cho tài khoản Admin Cục

- **Xem full dữ liệu:** toàn bộ đơn vị, không giới hạn.
- **Xem thông tin người tạo, thời gian tạo, người sửa, thời gian sửa.**
- **Xem thông tin người chỉnh sửa cuối cùng.**

---

## 3. User Stories

### Mức Must

- **US-092-01:** Là Cán bộ, tôi muốn tạo mới Đài TTDH với đầy đủ thông tin hành chính, GIS và dịch vụ.
- **US-092-02:** Là Cán bộ, tôi muốn hệ thống tự sinh mã đài `DTTDH-xxxxx` để đảm bảo mã duy nhất.
- **US-092-03:** Là Cán bộ, tôi muốn chọn Phân loại đài (Loại I→V) từ dropdown.
- **US-092-04:** Là Cán bộ, tôi muốn Đơn vị quản lý được điền sẵn theo user đăng nhập.
- **US-092-05:** Là Cán bộ, tôi muốn chọn Tình trạng (Đang sử dụng / Không sử dụng), mặc định Đang sử dụng.
- **US-092-06:** Là Cán bộ, tôi muốn chọn nhiều dịch vụ từ danh sách 9 dịch vụ cố định.
- **US-092-07:** Là Cán bộ, tôi muốn thêm nhiều dòng tọa độ vào bảng động và upload file đính kèm.

### Mức Should

- **US-092-08:** Là Cán bộ, tôi muốn nút "Lưu tạm" để lưu chưa cần validate đầy đủ.
- **US-092-09:** Là Cán bộ, tôi muốn nút "Lưu và gửi phê duyệt" để gửi thẳng lên cấp Cảng vụ/Chi cục.
- **US-092-10:** Là Cấp Cục, tôi muốn nút "Lưu và phê duyệt" để duyệt thẳng.

### Mức Could

- **US-092-11:** Là Admin, tôi muốn import hàng loạt từ Excel.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

**AC-092-01 — Tạo mới thành công:** Nhập đủ thông tin bắt buộc → hệ thống tự sinh mã `DTTDH-xxxxx`, lưu status Lưu tạm, HTTP 200. Lỗi: HTTP 400 + tiếng Việt.

**AC-092-02 — Mã đài tự sinh đúng format:** Format `DTTDH-xxxxx`, sequential, unique toàn hệ thống, immutable.

**AC-092-03 — Từ chối thiếu trường bắt buộc (Lưu tạm):** Thiếu name → "Tên đài không được để trống". Thiếu stationLevel → "Vui lòng chọn Phân loại đài".

**AC-092-04 — Từ chối thiếu trường (Lưu và gửi phê duyệt):** Thiếu name, stationLevel, unitId, provinceId, detailedLocation, hoặc bảng tọa độ < 1 dòng → HTTP 400.

**AC-092-05 — Từ chối name > 255 ký tự:** "Tên đài không được vượt quá 255 ký tự".

**AC-092-06 — Từ chối tọa độ ngoài range:** Vĩ độ ngoài [-90,90] hoặc kinh độ ngoài [-180,180] → lỗi kèm số dòng.

**AC-092-07 — Từ chối file sai định dạng:** File không phải pdf/jpg/png/docx/xlsx → "Định dạng file không được hỗ trợ".

**AC-092-08 — Từ chối file > 10MB:** "Dung lượng file không được vượt quá 10MB".

**AC-092-09 — Tình trạng mặc định:** Không chọn → mặc định "Đang sử dụng".

**AC-092-10 — Dịch vụ multi-select:** Chọn được nhiều dịch vụ, lưu dạng mảng/bitmask.

**AC-092-11 — XSS/Injection:** Escape HTML, parameterized queries. Trim() tất cả text input.

**AC-092-12 — 3 nút Lưu:** "Lưu tạm" (outlined), "Lưu và gửi phê duyệt" (primary), "Lưu và phê duyệt" (primary xanh lá, chỉ Cấp Cục).

**AC-092-13 — Lưu và gửi phê duyệt:** Validate đầy đủ, lưu status = Chờ duyệt cấp Cảng vụ/Chi cục.

**AC-092-14 — Lưu và phê duyệt:** Chỉ Cấp Cục, validate đầy đủ, lưu status = Đã phê duyệt. Role khác → HTTP 403.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-092-01 | Mã đài tự sinh `DTTDH-xxxxx`, sequential, unique, immutable | code | R1, R2, R3 |
| BR-092-02 | Name bắt buộc, max 255, trim() | name | @NotBlank, @Size(max=255) |
| BR-092-03 | stationLevel bắt buộc, Loại I→V | stationLevel | @NotNull |
| BR-092-04 | Đơn vị quản lý mặc định theo user đăng nhập | unitId | R4 |
| BR-092-05 | Đơn vị khai thác có thể khác đơn vị quản lý | operatingUnitId | R6 |
| BR-092-06 | Tình trạng mặc định "Đang sử dụng" (2 giá trị: Đang sử dụng / Không sử dụng) | usageStatus | Handoff 2.1#10 |
| BR-092-07 | Dịch vụ cung cấp: chọn nhiều từ 9 dịch vụ cố định (INMARSAT, COSPAS-SARSAT, DSC, RTP, MSI RTP, MSI NAVTEX, MSI EGC, LRIT, Kết nối TT hàng hải) | servicesProvided | Handoff 2.2 |
| BR-092-08 | Ghi chú max 2000 ký tự | remarks | Handoff 2.1#11 |
| BR-092-09 | Địa điểm chi tiết bắt buộc khi gửi duyệt, max 500 | detailedLocation | Handoff 2.1#7 |
| BR-092-10 | provinceId bắt buộc khi gửi duyệt | provinceId | Handoff 2.1#6 |
| BR-092-11 | Tọa độ tối thiểu 1 dòng khi gửi duyệt, WGS84 | coordinates | |
| BR-092-12 | File đính kèm: pdf/jpg/png/docx/xlsx, ≤10MB | attachments | |
| BR-092-13 | Các trường tần số liên lạc, transmitPower, equipmentType bị ẩn | — | Handoff 2.5 |
| BR-092-14 | Chỉ Cấp Cục được "Lưu và phê duyệt" | — | R14 |

---

## 6. Mô hình dữ liệu

> **Quy ước:** 🔴 = trường mới, ~~gạch ngang~~ = loại bỏ.

### 6.1. Bảng coastal_station_vts

- **id:** UUID, PK
- 🔴 **code:** tự sinh `DTTDH-xxxxx`, unique, not null, max 50
- **name:** not null, max 255
- **description:** (đổi thành remarks), max 2000
- 🔴 **stationLevel:** PhanLoaiDai enum (LOAI_I→V), not null, ORDINAL
- 🔴 **provinceId:** not null
- 🔴 **detailedLocation:** max 500
- **unitId:** UUID đơn vị quản lý
- 🔴 **operatingUnitId:** UUID đơn vị khai thác
- 🔴 **coverageArea:** max 500
- 🔴 **servicesProvided:** multi-select, lưu dạng JSON array / bitmask
- 🔴 **usageStatus:** 0=Không sử dụng, 1=Đang sử dụng, default 1
- 🔴 **geometryType:** GisGeometryType enum (POINT/LINE/POLYGON), ORDINAL
- 🔴 **mapSymbolId:** UUID
- 🔴 **coordinateSystem:** Integer
- 🔴 **displayRule:** Integer
- **spatialId:** UUID
- ~~**frequencyBand, transmitPower, equipmentType:** bị ẩn~~
- **status:** 7 trạng thái (Lưu tạm, Chờ duyệt CC, Từ chối CC, Chờ duyệt Cục, Từ chối Cục, Đã phê duyệt, Lịch sử). Lịch sử = read-only, đến từ DRAFT delete (F-094).
- **approvalStatus, approvalLevel, approvedBy, approvedDate, rejectionReason:** (giữ nguyên pattern)
- **createdAt, updatedAt:** auto

### 6.2. Bảng coastal_station_vts_coordinates (🔴 mới)

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | UUID | PK |
| station_id | UUID | FK |
| latitude | DOUBLE | Vĩ độ N* |
| longitude | DOUBLE | Kinh độ E* |
| sort_order | INTEGER | Thứ tự |

### 6.3. Bảng coastal_station_vts_attachments (🔴 mới)

Pattern: PortAttachment (UUID PK, fileName, filePath, fileSize, contentType, uploadedBy, uploadedAt).

---

## 7. API Endpoints

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| POST | `/api/v1/stations/coastal` | Tạo mới (multipart) | Cấp Cục, Cảng vụ/Chi cục, Cán bộ |
| POST | `/api/v1/stations/coastal/{id}/attachments` | Upload thêm file | Như trên |

---

## 8. Chi tiết nghiệp vụ từng phần

### 8.1. Form tạo mới (Nhóm A — Thông tin chung)

- **code:** read-only "Mã đài sẽ được tự sinh khi lưu"
- **name:** text input, required
- **provinceId:** select Tỉnh/TP, required
- **stationLevel:** select Loại I→V, required
- **unitId:** select cây đơn vị, mặc định theo user, required khi gửi duyệt
- **operatingUnitId:** select cây đơn vị, optional
- **detailedLocation:** text input, max 500, required khi gửi duyệt
- **coverageArea:** text input, max 500
- **servicesProvided:** multi-select 9 dịch vụ
- **usageStatus:** select Đang sử dụng / Không sử dụng, default Đang sử dụng
- **remarks:** textarea, max 2000

### 8.2. Form tạo mới (Nhóm B — GIS)

- **geometryType:** select Điểm/Đường/Vùng
- **Bảng tọa độ:** table động, mỗi dòng: Vĩ độ N* + Kinh độ E* + nút Xóa. Nút "+ Thêm tọa độ".
- **mapSymbolId:** select biểu tượng
- **coordinateSystem:** number input
- **displayRule:** number input

### 8.3. Form tạo mới (Nhóm C — File đính kèm)

- Upload component, kéo thả, chọn nhiều file, max 10MB/file.

### 8.4. Validation

- name, stationLevel, provinceId: required (Lưu tạm)
- unitId, detailedLocation, tọa độ ≥ 1 dòng: required (Lưu và gửi duyệt)
- Tọa độ: range WGS84
- File: pdf/jpg/png/docx/xlsx, ≤10MB
- Trim() tất cả text input

---

## 9. Yêu cầu phi chức năng

| Area | Requirement |
|------|-------------|
| Performance | POST < 500ms; upload ≤10MB < 5s |
| Security | RBAC, XSS escape, SQL parameterized, file MIME validate |
| Reliability | Transaction atomic; code tự sinh thread-safe |
| UX | Loading spinner, progress bar upload, Vietnamese errors, WCAG 2.1 AA |
| Scalability | 10,000+ stations; index trên code, unit_id, province_id |
| Legal | WGS84, audit log, tài sản công |

---

## 10. Yêu cầu giao diện người dùng

> **Nguyên tắc:** Dùng token từ `theme.ts` và `tokens.ts`, không hardcode.

### 10.1. Bố cục

Sidebar 272px, header 64px, nền `surfacePage`. Dùng ScreenHeader, FilterBar, StatusTabs, DataTable, Pagination.

### 10.2. Màu sắc

| Token | Dùng cho |
|-------|----------|
| `textPrimary` | Tiêu đề, giá trị |
| `textSecondary` | Nhãn field |
| `textTertiary` | Code readonly, caption |
| `surfaceCard` | Nền card/modal |
| `actionPrimary` | Nút chính |
| `statusOperational` | Badge Đang sử dụng |
| `statusAttention` | Badge Không sử dụng |

### 10.3. DataTable

| Cột | Nội dung | Mặc định |
|-----|----------|----------|
| STT | Tự động | — |
| Mã đài | DTTDH-xxxxx | Tự sinh |
| Tên đài | name | — |
| Tỉnh/TP | provinceId → tên | — |
| Phân loại | Badge Loại I→V | — |
| Tình trạng | Badge Đang sử dụng/Không sử dụng | Đang sử dụng |
| Trạng thái | Badge 7 trạng thái (thêm Lịch sử) | Lưu tạm |

### 10.4. Modal Tạo mới

- Width: 800px, scrollable
- Form.Item marginBottom: `spaceFormField` (12px)
- Input/Select: `radiusPill` (999px), `height: 40`
- Dịch vụ: multi-select với 9 options
- Bảng tọa độ: table với InputNumber precision 6 + nút Xóa + nút "Thêm tọa độ"
- Upload: Ant Design Upload, multiple, accept pdf/jpg/png/docx/xlsx
- Footer: Hủy (outlined), Lưu tạm (outlined), Lưu và gửi phê duyệt (primary), Lưu và phê duyệt (primary xanh, chỉ Cấp Cục)
- Tất cả nút: `radiusPill`, `height: 40`

### 10.5. Responsive

≤768px: sidebar hamburger 80px, bảng → card, modal 90% width, form 1 cột.
