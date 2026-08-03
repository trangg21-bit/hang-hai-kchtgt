---
id: F-030
name: Xem chi tiết Cảng cạn
slug: xem-cct
module-id: M-002
status: backend_done
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-03
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Xem chi tiết Cảng cạn

**Tài liệu:** BA Feature Brief
**Feature:** F-030 — Xem chi tiết Cảng cạn
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-03

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Trang chi tiết hiển thị **toàn bộ 25 trường** của một Cảng cạn dưới dạng read-only, chia 4 tab giống F-026 (Thông tin chung | Công bố | Vị trí | File đính kèm). Badge màu cho trạng thái hoạt động và phê duyệt. Các nút hành động trong footer hiển thị theo phân quyền.

> ⏳ **Các cụm thông tin bổ sung sẽ được phát triển trong các giai đoạn sau**, KHÔNG thuộc scope của F-030 hiện tại: **Thông tin quy hoạch**, **Thông tin vận hành khai thác**, **Thông tin bảo trì**, **Thông tin sự cố**. Các tab này sẽ được thêm vào trang chi tiết trong các feature riêng biệt sau khi dữ liệu nền tảng (25 trường) đã ổn định.

### 1.2. Tại sao cần?

- Cung cấp góc nhìn tổng quan, đầy đủ về một Cảng cạn
- Điểm trung tâm để điều hướng đến các chức năng khác: Chỉnh sửa, Xóa, Lịch sử, Phê duyệt
- Hiển thị trực quan trạng thái qua badge màu

### 1.3. Luồng chính

F-083 → click dòng hoặc "Xem chi tiết" → `GET /api/v1/dry-ports/{id}` → 4 tab read-only. Breadcrumb: "Quản lý Cảng cạn > CC-XXXXXX". Footer: nút hành động theo permission.

### 1.4. Các cụm thông tin hoãn triển khai (Deferred)

Các cụm thông tin dưới đây **không nằm trong scope của F-030** và sẽ được phát triển thành các feature riêng sau khi hoàn thiện 25 trường nền tảng:

| # | Cụm thông tin | Feature dự kiến | Mô tả |
|---|--------------|-----------------|-------|
| 1 | **Thông tin quy hoạch** | F-xxx (tbd) | Quyết định quy hoạch, thời hạn quy hoạch, phạm vi quy hoạch, cơ quan phê duyệt |
| 2 | **Thông tin vận hành khai thác** | F-xxx (tbd) | Lưu lượng hàng hóa/năm, số tuyến kết nối, dịch vụ khai thác, đơn vị vận hành |
| 3 | **Thông tin bảo trì** | F-xxx (tbd) | Lịch sử bảo trì, hạng mục bảo trì, chi phí, đơn vị thực hiện, kỳ bảo trì tiếp theo |
| 4 | **Thông tin sự cố** | F-xxx (tbd) | Loại sự cố, thời gian, mức độ nghiêm trọng, biện pháp khắc phục, trạng thái xử lý |

> Các tab tương ứng sẽ được thêm vào trang chi tiết trong các feature này. Hiện tại F-030 chỉ hiển thị 4 tab: Thông tin chung, Công bố, Vị trí, File đính kèm.

---

## 2. Ai dùng? Dùng như thế nào?

### 2.1. Phân quyền theo chức năng

Các thao tác trong tính năng được bảo vệ bởi các quyền (permissions) tương ứng. Người dùng chỉ có thể thực hiện những thao tác mà vai trò của họ được cấp quyền:

| Vai trò | Quyền xem | Quyền thao tác | Phạm vi dữ liệu | Ghi chú |
|---|---|---|---|---|
| system-admin | `dryport:read` | Tất cả thao tác nếu được gán quyền | Toàn bộ hệ thống | Xem thêm audit fields |
| admin (Security) | `dryport:read` | Theo permission được gán | Theo đơn vị được phân công | |
| admin-operation | `dryport:read` | Theo permission được gán | Theo đơn vị được phân công | |
| admin | `dryport:read` | Theo permission được gán | Theo đơn vị quản lý | |
| Lãnh đạo | `dryport:read` | Không có quyền thao tác | Theo đơn vị được phân công | Chỉ xem, không sửa |
| Cán bộ | `dryport:read` | Theo permission được gán | Theo đơn vị công tác | |
| Cá nhân | Không có quyền | Không có quyền | Không | Không truy cập được |

Chi tiết permission:

| Permission | Hiển thị / Hành động |
|---|---|
| `dryport:read` | Xem trang chi tiết |
| `dryport:update` | Nút "Chỉnh sửa" → F-027. **Với APPROVED: cần thêm `dryport:approve`** |
| `dryport:delete` | Nút "Xóa" → F-028 |
| `dryport:approve` | Nút "Phê duyệt" / "Từ chối" (chỉ khi PENDING) |
| `dryport:history` | Nút "Lịch sử" → F-031 |

> Phân quyền do M-001 quản lý. Các permission trên được gán động cho vai trò thông qua module M-001.

### 2.2. Logic phân quyền đặc biệt cho tài khoản Admin Cục

Đối với tài khoản **Admin Cục**, áp dụng logic phân quyền đặc biệt sau:

- **Xem full dữ liệu:** Admin Cục có quyền xem toàn bộ dữ liệu Cảng cạn, không giới hạn phạm vi đơn vị hay khu vực.
- **Xem thông tin người tạo:** Admin Cục thấy được `createdBy` (họ tên, tên đăng nhập) của bản ghi Cảng cạn.
- **Xem thời gian tạo:** Admin Cục thấy được `createdAt` (timestamp) của bản ghi.
- **Xem thông tin người chỉnh sửa:** Admin Cục thấy được `updatedBy` (họ tên, tên đăng nhập) của lần cập nhật cuối cùng.
- **Xem thời gian cập nhật:** Admin Cục thấy được `updatedAt` (timestamp) của lần cập nhật cuối cùng.

> Các trường audit này chỉ hiển thị với tài khoản Admin Cục. Với các vai trò khác, các trường này bị ẩn khỏi giao diện (xem Section 10.7).

---

## 3. User Stories

### Must
- **US-030-01:** Xem toàn bộ 25 trường Cảng cạn, chia 4 tab.
- **US-030-02:** Badge trạng thái: CHUA_KHAI_THAC / VAN_HANH và NHAP / PENDING / APPROVED / REJECTED / Lịch sử.
- **US-030-03:** Breadcrumb "Quản lý Cảng cạn > CC-XXXXXX", bấm quay lại F-083.

### Should
- **US-030-04:** Danh sách file đính kèm với nút tải xuống.
- **US-030-05:** Nút hành động footer theo phân quyền.

### Could
- **US-030-06:** Xem tọa độ trên bản đồ preview nhúng.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

### Nhóm 1: Hiển thị

**AC-030-01:** `GET /api/v1/dry-ports/{id}` → hiển thị đủ 25 trường, 4 tab giống F-026 Section 10.
**AC-030-02:** Badge màu: CHUA_KHAI_THAC (xám), VAN_HANH (xanh lá) cho tinhTrang; NHAP (xám), PENDING (vàng), APPROVED (xanh đậm), REJECTED (đỏ), Lịch sử (xám đậm) cho approvalStatus.
**AC-030-03:** Breadcrumb: "Quản lý Cảng cạn > CC-XXXXXX" — bấm "Quản lý Cảng cạn" → F-083.

### Nhóm 2: Hành động

**AC-030-04:** Footer hiển thị nút theo permission: [Chỉnh sửa] nếu `dryport:update`, [Xóa] nếu `dryport:delete` (chỉ hiện khi trạng thái NHAP), [Lịch sử] nếu `dryport:history`.
**AC-030-05:** Nếu `approvalStatus=PENDING` + `dryport:approve` → thêm [Phê duyệt] [Từ chối] (gọi trực tiếp API của F-029).

### Nhóm 3: File & Lỗi

**AC-030-06:** File đính kèm: danh sách tên, kích thước, ngày upload, nút [Tải xuống].
**AC-030-07:** ID không tồn tại → 404. Trạng thái Lịch sử → hiển thị ở chế độ chỉ xem, badge "Lịch sử", không có nút hành động.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng cho | Nguồn |
|---|---|---|---|
| BR-030-01 | Hiển thị đầy đủ 25 trường — không ẩn trường nào với người có `dryport:read`. | Trang chi tiết | Nghiệp vụ |
| BR-030-02 | Badge màu nhất quán toàn hệ thống. | Toàn bộ UI | UX |
| BR-030-03 | Admin Cục: xem thêm createdBy, createdAt, updatedBy, updatedAt. Vai trò khác: ẩn. | Trang chi tiết | RBAC |
| BR-030-04 | Bản ghi ở trạng thái Lịch sử → hiển thị ở chế độ chỉ xem, có badge "Lịch sử", không nút hành động nào. | Trang chi tiết | Nghiệp vụ |
| BR-030-05 | Trang chi tiết là read-only — mọi chỉnh sửa phải qua F-027. | Trang chi tiết | Thiết kế |

---

## 6. Mô hình dữ liệu

> Kế thừa toàn bộ F-026 Section 6. Không thêm bảng mới.

Trang chi tiết gọi `GET /api/v1/dry-ports/{id}` trả về DryPortResponse gồm 25 trường + danh sách tọa độ + danh sách file đính kèm.

---

## 7. API Endpoints

| Method | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/dry-ports/{id}` | Lấy chi tiết Cảng cạn | `dryport:read` |
| POST | `/api/v1/dry-ports/{id}/approve` | Phê duyệt (từ F-030, nếu PENDING) | `dryport:approve` |
| POST | `/api/v1/dry-ports/{id}/reject?reason=` | Từ chối (từ F-030, nếu PENDING) | `dryport:approve` |

---

## 8. Chi tiết nghiệp vụ

### 8.1. Mở trang chi tiết

Từ F-083: click dòng hoặc dropdown → "Xem chi tiết". GET trả về toàn bộ dữ liệu. Hiển thị 4 tab. Tab đầu tiên (Thông tin chung) active mặc định.

### 8.2. Badge trạng thái

Hiển thị ở đầu trang, bên cạnh tên cảng cạn. 2 badge: tinhTrang + approvalStatus.

### 8.3. Hành động footer

Nút hiển thị động theo permission. Phê duyệt/Từ chối gọi API trực tiếp (không cần chuyển trang) → toast → refresh trạng thái.

### 8.4. Các tab tương lai (Deferred)

4 cụm thông tin "Quy hoạch", "Vận hành khai thác", "Bảo trì", "Sự cố" sẽ được bổ sung sau dưới dạng tab bổ sung trong trang chi tiết. Các tab này chưa có trong scope hiện tại — khi triển khai sẽ tuân theo cùng pattern: GET API riêng → hiển thị read-only → badge trạng thái nếu có.

---

## 9. Yêu cầu phi chức năng

- **Hiệu năng:** GET ≤500ms; approve/reject ≤1s
- **Bảo mật:** HTTPS; RBAC từng nút hành động
- **UX:** Responsive; loading skeleton; breadcrumb điều hướng

---

## 10. Yêu cầu giao diện

> Token từ `theme.ts` + `tokens.ts`. KHÔNG hardcode.

### 10.1. Layout tổng thể

- **Header:** "CC-XXXXXX — [Tên cảng cạn]" + 2 badge trạng thái (tinhTrang + approvalStatus)
- **Breadcrumb:** "Quản lý Cảng cạn > CC-XXXXXX" — bấm "Quản lý Cảng cạn" → F-083
- **Body:** 4 tab read-only, tab Thông tin chung active mặc định
- **Footer:** nút hành động `borderRadius: radiusPill`, `height: 40`

### 10.2. Badge trạng thái

| Badge | Giá trị | Màu |
|-------|--------|-----|
| Tình trạng | `CHUA_KHAI_THAC` | `textTertiary` (xám) |
| Tình trạng | `VAN_HANH` | `statusOperational` (xanh lá) |
| Phê duyệt | `NHAP` | `textTertiary` (xám) |
| Phê duyệt | `PENDING` | `statusWarning` (vàng) |
| Phê duyệt | `APPROVED` | `statusOperational` (xanh đậm) |
| Phê duyệt | `REJECTED` | `statusDanger` (đỏ) |
| Phê duyệt | Lịch sử (đã xóa) | `textTertiary` (xám đậm) |

### 10.3. Tab Thông tin chung (15 trường — read-only)

Hiển thị dạng label-value, 2 cột (Row/Col).

| # | Trường | Nguồn dữ liệu | Hiển thị khi null |
|---|---|---|---|
| 1 | Đơn vị quản lý | `orgUnitId` → resolve tên | "—" |
| 2 | Đơn vị khai thác | `donViKhaiThac` | "—" |
| 3 | Khu vực | `khuVuc` | "—" |
| 4 | Mã cảng cạn | `dryPortCode` | — (luôn có) |
| 5 | Tên cảng cạn | `dryPortName` | — (luôn có) |
| 6 | Tỉnh/TP | `provinceId` → resolve tên | "—" |
| 7 | Địa chỉ chi tiết | `diaChiChiTiet` | "—" |
| 8 | Hành lang vận tải | `hanhLangVanTai` | "—" |
| 9 | Công suất khai thác (TEU) | `teuCapacity` | "—" |
| 10 | Tổng diện tích (m²) | `area` | "—" |
| 11 | Diện tích kho (m²) | `dienTichKho` | "—" |
| 12 | Diện tích bãi (m²) | `dienTichBai` | "—" |
| 13 | Phương thức kết nối | `phuongThucKetNoi` | "—" |
| 14 | Tình trạng | `tinhTrang` (CHUA_KHAI_THAC/VAN_HANH) | Badge xám |
| 15 | Ghi chú | `ghiChu` | "—" |

### 10.4. Tab Công bố (4 trường — read-only)

| # | Trường | Nguồn dữ liệu | Hiển thị khi null |
|---|---|---|---|
| 16 | Thời điểm công bố | `thoiDiemCongBo` | "Chưa có thông tin" |
| 17 | Quyết định công bố số | `quyetDinhCongBoSo` | "Chưa có thông tin" |
| 18 | Ngày ra quyết định | `ngayRaQuyetDinh` | "Chưa có thông tin" |
| 19 | Đơn vị ra quyết định | `donViRaQuyetDinh` | "Chưa có thông tin" |

### 10.5. Tab Vị trí (5 trường + bảng tọa độ — read-only)

| # | Trường | Nguồn dữ liệu | Hiển thị khi null |
|---|---|---|---|
| 20 | Loại đối tượng | `loaiDoiTuong` (DIEM/DUONG/VUNG) | "—" |
| 21 | Biểu tượng | `mapSymbolId` → resolve tên | "—" |
| 22 | Hệ quy chiếu | `heQuyChieu` | "—" |
| 23 | Quy tắc hiển thị | `quyTacHienThi` | "—" |
| 24 | Tọa độ | `dry_port_coordinates` → bảng | "Chưa có tọa độ" |

Bảng tọa độ: STT, Kinh độ (E), Vĩ độ (N). Dạng bảng con read-only, không nút thêm/xóa.

### 10.6. Tab File đính kèm

| # | Trường | Nguồn dữ liệu | Hiển thị khi null |
|---|---|---|---|
| 25 | File đính kèm | `dry_port_attachments` → danh sách | "Chưa có file đính kèm" |

Mỗi file hiển thị: tên file, kích thước (KB/MB), ngày upload, nút [Tải xuống].

### 10.7. Audit (chỉ Admin Cục)

Admin Cục xem thêm ở cuối tab Thông tin chung:

| Trường | Nguồn |
|--------|-------|
| Người tạo | `createdBy` → resolve username |
| Ngày tạo | `createdAt` (dd/MM/yyyy HH:mm) |
| Cập nhật lần cuối | `updatedBy` → resolve username |
| Ngày cập nhật | `updatedAt` (dd/MM/yyyy HH:mm) |

### 10.8. Phân quyền hiển thị

Giao diện tự động ẩn/hiện các thành phần dựa trên vai trò người dùng:

| Vai trò | Thấy thành phần nào | Ghi chú |
|---|---|---|
| system-admin | Toàn bộ 25 trường + audit fields + tất cả nút hành động | Có tất cả quyền nếu được gán |
| admin (Security) | 25 trường + nút hành động theo permission | Ẩn audit fields |
| admin-operation | 25 trường + nút hành động theo permission | Ẩn audit fields |
| admin | 25 trường + nút hành động theo permission | Ẩn audit fields |
| Lãnh đạo | 25 trường (read-only), không nút hành động | Chỉ xem |
| Cán bộ | 25 trường + nút hành động theo permission | Ẩn audit fields |
| Admin Cục | 25 trường + audit fields (createdBy, createdAt, updatedBy, updatedAt) + tất cả nút hành động | Logic đặc biệt (xem mục 2.2) |

### 10.9. Giao diện trên điện thoại

Khi màn hình nhỏ hơn 768px:

- Layout 2 cột chuyển thành 1 cột
- Tab điều hướng thu nhỏ, scroll ngang
- Modal thu nhỏ còn 90% chiều rộng màn hình
- Bảng tọa độ chuyển thành dạng thẻ (card)

### 10.10. UX

- `marginBottom: spaceFormField`, `borderRadius: radiusPill`, `height:40` cho mọi nút
- Loading skeleton khi GET đang chạy
- Toast lỗi `statusDanger` nếu GET thất bại (404, 500)
- Trạng thái rỗng (empty state) với icon và hướng dẫn khi không có dữ liệu

---

## Implementation Status

| Layer | Status |
|-------|--------|
| Backend | Done |
| Frontend | Pending |
