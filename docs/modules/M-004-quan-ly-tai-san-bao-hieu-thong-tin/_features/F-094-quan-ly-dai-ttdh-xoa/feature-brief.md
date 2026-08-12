---
id: F-094
name: Quản lý Đài TTDH - Xóa
slug: quan-ly-dai-ttdh-xoa
module-id: M-004
status: proposed
classification: local
priority: medium
created: 2026-07-07T03:32:57Z
last-updated: 2026-08-11
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Đài TTDH - Xóa

**Tài liệu:** BA Feature Brief
**Feature:** F-094
**Module:** M-004 — Quản lý tài sản Báo hiệu & Thông tin
**Mã chức năng:** QLKC-078
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-11

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Cho phép xóa Đài TTDH bằng cách chuyển trạng thái từ "Lưu tạm" sang "Lịch sử". **Đây không phải soft-delete** — bản ghi vẫn tồn tại trong database, vẫn hiển thị trong danh sách (không `@SQLRestriction`, không `deletedAt`), nhưng ở trạng thái read-only hoàn toàn. Mục đích là giữ lại dấu vết dữ liệu phục vụ kiểm toán và tra cứu lịch sử.

**7 trạng thái tổng thể:**
1. Lưu tạm — edit✅, delete✅, submit✅
2. Chờ duyệt cấp Cảng vụ/Chi cục — all❌
3. Từ chối cấp Cảng vụ/Chi cục — edit✅, delete❌, submit✅
4. Chờ duyệt cấp Cục — all❌
5. Từ chối cấp Cục — edit✅, delete❌, submit✅
6. Đã phê duyệt — edit✅(→Lưu tạm), delete❌, submit❌
7. **Lịch sử** — all❌ (read-only, đến từ DRAFT delete only)

### 1.2. Tại sao cần tính năng này?

Ngăn chặn mất dữ liệu vĩnh viễn — các đài bị xóa (dù chưa gửi duyệt) vẫn được giữ lại trong hệ thống ở trạng thái Lịch sử để phục vụ kiểm toán. Không dùng soft-delete với `deletedAt` vì:
- Bản ghi cần tiếp tục hiển thị trong danh sách (không ẩn)
- Không cần cơ chế khôi phục (restore) — Lịch sử là trạng thái cuối cùng
- Đơn giản hóa truy vấn: không cần `@SQLRestriction`

### 1.3. Luồng hoạt động chính

**Bước 1: Chọn "Xóa"**
- Người dùng: tại màn hình danh sách, chọn "Xóa" từ dropdown hành động của một bản ghi.
- Hệ thống:
  - Nút "Xóa" chỉ hiển thị khi trạng thái bản ghi = "Lưu tạm" (R8).
  - Nếu trạng thái ≠ "Lưu tạm": ẩn nút Xóa.
  - Nếu trạng thái = "Lịch sử": ẩn nút Xóa (không thể xóa lại).

**Bước 2: Xác nhận xóa**
- Người dùng: hệ thống hiển thị hộp thoại xác nhận "Bạn có chắc chắn muốn xóa Đài TTDH [Tên đài]? Bản ghi sẽ được chuyển sang trạng thái Lịch sử."
- Hệ thống: chờ người dùng xác nhận hoặc hủy.

**Bước 3: Thực hiện xóa**
- Hệ thống:
  - Kiểm tra lại status = Lưu tạm (double-check).
  - Cập nhật status → "Lịch sử".
  - **Không đặt `deletedAt`**, **không `@SQLRestriction`**.
  - Ghi lịch sử DELETE vào `station_history` (actionType = DELETE).
  - HTTP 200.
- Khi lỗi:
  - Status không phải Lưu tạm → HTTP 400 "Chỉ có thể xóa Đài TTDH ở trạng thái Lưu tạm".
  - Bản ghi không tồn tại → HTTP 404 "Không tìm thấy Đài TTDH".
  - Không có quyền → HTTP 403 "Bạn không có quyền xóa Đài TTDH này".

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Cơ chế phân quyền

Xóa Đài TTDH dùng chung cơ chế `PermissionMiddleware` — kiểm tra permission `data:delete` theo từng tài khoản người dùng. Backend chỉ kiểm tra một điều kiện: bản ghi phải ở trạng thái "Lưu tạm" — không phân biệt ai là người tạo hay cấp nào.

| Vai trò | Permission | Quyền xóa |
|---|---|---|
| ROLE_SYSTEM_ADMIN | *(bypass)* | Mọi bản ghi Lưu tạm, toàn quốc |
| ROLE_ADMIN | `data:delete` | Mọi bản ghi Lưu tạm, toàn quốc |
| ROLE_SPECIALIST | `data:delete` | Bản ghi Lưu tạm, đơn vị mình |

- Data scoping lọc theo `orgUnitId`. SYSTEM_ADMIN bypass.
- Admin Cục (ROLE_ADMIN, ROLE_SYSTEM_ADMIN): xem thông tin người thực hiện xóa, thời gian xóa, thông tin chỉnh sửa cuối cùng.

> Xem F-092 section 2.1 để biết đầy đủ cơ chế PermissionMiddleware và ánh xạ vai trò → permission.

---

## 3. User Stories

### Mức Must

- **US-094-01:** Là Cán bộ, tôi muốn xóa Đài TTDH ở trạng thái Lưu tạm để loại bỏ các bản nháp không cần thiết.
- **US-094-02:** Là Quản lý, tôi muốn bản ghi đã xóa vẫn hiển thị trong danh sách ở trạng thái "Lịch sử" để phục vụ kiểm toán.
- **US-094-03:** Là Kiểm toán, tôi muốn xem được ai đã xóa bản ghi và thời điểm xóa trong lịch sử thay đổi.

### Mức Should

- **US-094-04:** Là Cán bộ, tôi muốn hệ thống ngăn chặn xóa nhầm bằng hộp thoại xác nhận.
- **US-094-05:** Là Cán bộ, tôi muốn không thể xóa bản ghi đã ở trạng thái Lịch sử.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

**AC-094-01 — Xóa thành công (DRAFT → Lịch sử):** Khi bản ghi ở trạng thái Lưu tạm, người dùng có quyền chọn Xóa → xác nhận → hệ thống cập nhật status = "Lịch sử", ghi lịch sử DELETE, HTTP 200. Bản ghi vẫn hiển thị trong danh sách với badge "Lịch sử".

**AC-094-02 — Từ chối xóa không phải Lưu tạm:** Status ≠ "Lưu tạm" → HTTP 400 "Chỉ có thể xóa Đài TTDH ở trạng thái Lưu tạm". Nút Xóa bị ẩn trên UI khi status ≠ Lưu tạm.

**AC-094-03 — Từ chối xóa khi đã là Lịch sử:** Status = "Lịch sử" → nút Xóa bị ẩn. Nếu gọi API trực tiếp → HTTP 400 "Đài TTDH này đã ở trạng thái Lịch sử, không thể xóa lại".

**AC-094-04 — Xác nhận trước khi xóa:** Hộp thoại hiển thị "Bạn có chắc chắn muốn xóa Đài TTDH [Tên đài]? Bản ghi sẽ được chuyển sang trạng thái Lịch sử." với nút Hủy và Xóa.

**AC-094-05 — Không soft-delete:** Bản ghi sau khi xóa KHÔNG có `deletedAt`. Bản ghi vẫn hiển thị trong danh sách thông thường (không `@SQLRestriction`). Truy vấn danh sách trả về cả bản ghi Lịch sử.

**AC-094-06 — Ghi lịch sử DELETE:** Hệ thống tự động ghi vào `station_history` với actionType = DELETE, changedBy = người thực hiện, changedAt = thời điểm xóa.

**AC-094-07 — RBAC:** Người dùng không có quyền → HTTP 403 "Bạn không có quyền xóa Đài TTDH này". Người dùng không thuộc đơn vị quản lý của bản ghi → HTTP 403.

**AC-094-08 — XSS/Injection:** Nội dung xác nhận được escape, API dùng parameterized queries.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-094-01 | Chỉ xóa khi status = Lưu tạm | DELETE action | R8 |
| BR-094-02 | Xóa = chuyển status → Lịch sử (KHÔNG soft-delete, KHÔNG deletedAt) | DELETE action | F-094 design |
| BR-094-03 | Không thể xóa bản ghi đã ở trạng thái Lịch sử | DELETE action | F-094 design |
| BR-094-04 | Bản ghi Lịch sử vẫn hiển thị trong danh sách (không @SQLRestriction) | List query | F-094 design |
| BR-094-05 | Ghi station_history với actionType = DELETE | Audit log | F-097 |
| BR-094-06 | Xác nhận trước khi xóa bằng hộp thoại | UI | UX convention |
| BR-094-07 | Phân quyền qua `data:delete` — SYSTEM_ADMIN bypass, role khác cần được cấp permission | RBAC | PermissionMiddleware |

---

## 6. Mô hình dữ liệu

Tính năng này **không thêm trường mới** vào bảng `coastal_station_vts`. Cơ chế xóa dựa trên cập nhật trường `status` hiện có.

> **Quy ước đánh dấu:**
> - <span style="color:red;font-weight:bold">🔴 Chữ màu đỏ</span> = **Logic thay đổi**.
> - ~~Chữ gạch ngang~~ = **Logic cũ cần loại bỏ**.

### 6.1. Bảng coastal_station_vts — thay đổi logic

- **status:** <span style="color:red;font-weight:bold">🔴 Thêm giá trị thứ 7: "Lịch sử" (ORDINAL value). Khi DELETE DRAFT, status chuyển từ Lưu tạm → Lịch sử.</span>
- ~~**deletedAt:** trường này không được sử dụng trong luồng xóa Đài TTDH.~~
- ~~**@SQLRestriction("deleted_at IS NULL"):** không áp dụng cho CoastalStationVTS.~~
- **isActive:** giữ nguyên (không đổi khi chuyển sang Lịch sử).

### 6.2. Bảng station_history — ghi nhận DELETE

| Cột | Giá trị khi DELETE |
|-----|-------------------|
| entityId | UUID của đài bị xóa |
| actionType | DELETE |
| changedBy | UUID người thực hiện |
| changedAt | Thời điểm xóa |
| details | JSON: `{"previousStatus": "Lưu tạm", "newStatus": "Lịch sử"}` |

---

## 7. API Endpoints

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| DELETE | `/api/v1/stations/coastal/{id}` | Xóa (DRAFT → Lịch sử) | `data:delete` |

**Request:** Không có body.

**Response 200:**
```json
{
  "id": "uuid",
  "code": "DTTDH-00001",
  "status": "Lịch sử",
  "message": "Đài TTDH đã được chuyển sang trạng thái Lịch sử"
}
```

**Response 400:**
```json
{
  "error": "Chỉ có thể xóa Đài TTDH ở trạng thái Lưu tạm"
}
```

---

## 8. Chi tiết nghiệp vụ từng phần

### 8.1. Điều kiện hiển thị nút Xóa

Nút "Xóa" trong dropdown hành động của DataTable chỉ hiển thị khi **đồng thời**:
- `status = "Lưu tạm"`
- Người dùng có quyền xóa (RBAC)
- Người dùng thuộc đơn vị quản lý của bản ghi (hoặc là Cấp Cục)

### 8.2. Hộp thoại xác nhận xóa

- Tiêu đề: "Xác nhận xóa"
- Nội dung: "Bạn có chắc chắn muốn xóa Đài TTDH **[Tên đài]**? Bản ghi sẽ được chuyển sang trạng thái Lịch sử."
- Nút "Hủy" (outlined, `radiusPill`, `height: 40`)
- Nút "Xóa" (màu `statusCritical`, `radiusPill`, `height: 40`)

### 8.3. Sau khi xóa

- Bản ghi chuyển sang trạng thái "Lịch sử"
- Badge trạng thái trên DataTable chuyển sang màu xám đậm (dark gray)
- Nút "Sửa", "Xóa", "Gửi phê duyệt" bị ẩn khỏi dropdown
- Bản ghi vẫn hiển thị trong tất cả các tab của StatusTabs (bao gồm cả tab "Lịch sử")
- Trong màn hình xem chi tiết (F-096): hiển thị badge "Lịch sử" màu xám đậm

### 8.4. Xử lý lỗi

| Tình huống | HTTP Status | Thông báo |
|---|---|---|
| Status ≠ Lưu tạm | 400 | "Chỉ có thể xóa Đài TTDH ở trạng thái Lưu tạm" |
| Status = Lịch sử | 400 | "Đài TTDH này đã ở trạng thái Lịch sử, không thể xóa lại" |
| Không tìm thấy | 404 | "Không tìm thấy Đài TTDH" |
| Không có quyền | 403 | "Bạn không có quyền xóa Đài TTDH này" |
| Không thuộc đơn vị | 403 | "Bạn không có quyền xóa Đài TTDH thuộc đơn vị khác" |

---

## 9. Yêu cầu phi chức năng

### 9.1. Hiệu năng

- DELETE response < 300ms
- Transaction atomic: cập nhật status + ghi station_history trong cùng transaction

### 9.2. Khả năng mở rộng

- Cơ chế status-based delete không phụ thuộc vào số lượng bản ghi
- Không cần index cho `deletedAt` (vì không dùng)

### 9.3. Bảo mật

- Phân quyền RBAC trên endpoint DELETE
- Validation trạng thái phía server (không trust client)
- Chống double-delete: kiểm tra status trước khi cập nhật

### 9.4. Độ tin cậy

- Optimistic locking: dùng `@Version` để tránh race condition khi 2 user cùng xóa
- Transaction rollback nếu ghi history thất bại

### 9.5. Trải nghiệm người dùng

- Nút Xóa chỉ hiển thị khi đủ điều kiện (tránh click rồi mới báo lỗi)
- Hộp thoại xác nhận rõ ràng với tên đài
- Loading spinner trong lúc xử lý
- Thông báo thành công: "Đài TTDH [Tên đài] đã được chuyển sang trạng thái Lịch sử"

### 9.6. Tuân thủ pháp lý

- Dữ liệu không bị xóa vĩnh viễn — tuân thủ yêu cầu lưu trữ hồ sơ hành chính
- Lịch sử DELETE được ghi nhận đầy đủ phục vụ kiểm toán

---

## 10. Yêu cầu giao diện người dùng

> **Nguyên tắc cốt lõi:** Mọi giá trị màu sắc, khoảng cách, kích thước chữ trong giao diện đều được định nghĩa tập trung tại 2 file `frontend/src/theme.ts` (layout, màu nền sidebar/header) và `frontend/src/tokens.ts` (màu chữ, màu trạng thái, thang số). Tuyệt đối không hardcode giá trị hex hay pixel trong component.

### 10.1. Bố cục chung

Màn hình danh sách Đài TTDH dùng chung bố cục toàn hệ thống, bao gồm:

- **Thanh menu trái (sidebar):** rộng 272px, nền `#12468C`. Mục đang chọn tô `#1B84FF`.
- **Thanh tiêu đề trên cùng (header):** cao 64px, nền trắng.
- **Vùng nội dung chính:** nền `#eaf0f6` (`surfacePage`).

### 10.2. Hệ thống màu sắc

| Khi cần... | Dùng token | Màu thực tế |
|---|---|---|
| Nút Xóa (danger action) | `statusCritical` | `#D14343` |
| Nút Hủy (outlined) | `borderDefault` + `textSecondary` | |
| Nền hộp thoại xác nhận | `surfaceCard` | `#FFFFFF` |
| Text xác nhận | `textPrimary` | `#0c2438` |
| Badge "Lịch sử" | `textTertiary` (dark gray) | `#93a3b3` |

### 10.3. Thang số — chỉ dùng giá trị cho phép

**Khoảng cách (spacing):** Nút trong hộp thoại cách nhau `spaceMd` (16px).

**Bo góc (radius):** Nút Xóa và Hủy dùng `radiusPill` (999px).

**Cỡ chữ (font size):** Text xác nhận `fontSizeMd` (13px), tiêu đề hộp thoại `fontSizeLg` (15px).

### 10.4. Style có sẵn

- **Nút Xóa:** màu `statusCritical`, style `primaryButtonStyle` + `danger`
- **Nút Hủy:** outlined, style `secondaryButtonStyle`
- **Hộp thoại:** dùng `cardStyle` (nền trắng, viền 0.5px, bo góc 12px, padding 16px)
- **Icon cảnh báo:** `ExclamationCircleOutlined` màu `statusCritical`

### 10.5. Giới hạn màu nhấn — tối đa 3 lần mỗi màn

Màu `actionPrimary` chỉ xuất hiện tối đa 3 lần trên màn hình danh sách Đài TTDH. Màu `statusCritical` cho nút Xóa không tính vào giới hạn này.

### 10.6. Hộp thoại xác nhận xóa

- **Tiêu đề:** "Xác nhận xóa" (fontSizeLg, fontWeightBold, textPrimary)
- **Icon:** `ExclamationCircleOutlined` màu `statusCritical`, fontSize 24px
- **Nội dung:** "Bạn có chắc chắn muốn xóa Đài TTDH **[Tên đài]**? Bản ghi sẽ được chuyển sang trạng thái Lịch sử."
- **Footer:**
  - Nút "Hủy": `secondaryButtonStyle`, `radiusPill`, `height: 40`
  - Nút "Xóa": `primaryButtonStyle` + màu `statusCritical`, `radiusPill`, `height: 40`

### 10.7. Dropdown hành động (DataTable)

Nút "Xóa" trong dropdown:
- Chỉ hiển thị khi `status === "Lưu tạm"`
- Màu chữ: `statusCritical`
- Icon: `DeleteOutlined`

### 10.8. Các trạng thái giao diện

- **Đang xử lý:** Nút "Xóa" hiển thị loading spinner, bị disable
- **Thành công:** Toast message "Đài TTDH [Tên đài] đã được chuyển sang trạng thái Lịch sử", badge trạng thái cập nhật
- **Thất bại:** Toast message với nội dung lỗi từ server

### 10.9. Phân quyền hiển thị

| Vai trò | Permission | Thấy nút Xóa | Điều kiện |
|---|---|---|---|
| ROLE_SYSTEM_ADMIN | *(bypass)* | ✅ | status = Lưu tạm (mọi đơn vị) |
| ROLE_ADMIN | `data:delete` | ✅ | status = Lưu tạm (mọi đơn vị) |
| ROLE_SPECIALIST | `data:delete` | ✅ | status = Lưu tạm + đơn vị mình |
| ROLE_PORT_OPERATOR | *(không có)* | ❌ | — |
| ROLE_PUBLIC_USER | *(không có)* | ❌ | — |

### 10.10. Giao diện trên điện thoại

Khi màn hình nhỏ hơn 768px:
- Hộp thoại xác nhận thu nhỏ còn 90% chiều rộng màn hình
- Nút Xóa và Hủy xếp dọc (không nằm ngang)
