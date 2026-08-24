---
id: F-009
name: Quản lý Cảng biển - Cập nhật
slug: ql-cb-cap-nhat
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:19Z
last-updated: 2026-08-23
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Quản lý Cảng biển - Cập nhật

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu `docs/feature-brief-template.md`)
**Chức năng:** F-009 — Quản lý Cảng biển - Cập nhật
**Module:** M-002 — Quản lý tài sản KCHTGT - Cảng & Bến
**Loại:** chức năng có bước phê duyệt (cập nhật → duyệt lại theo quy trình 2 cấp)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + quy trình phê duyệt `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

---

## 1. Mô tả ngắn

Cho phép người dùng có thẩm quyền (`port:update`) cập nhật thông tin của một Cảng biển đã tồn tại: tên cảng, vị trí địa lý, chỉ số tổng hợp, tọa độ GPS và công trình KCHT. Form điền sẵn (pre-fill) từ API; mã cảng (`portCode`) là read-only. Mỗi lần cập nhật thành công, trạng thái phê duyệt được đưa về trạng thái chờ duyệt và phải được duyệt lại (quy trình 2 cấp); hệ thống tự động ghi nhật ký thay đổi (change log).

## 2. Trường dữ liệu

Cấu trúc theo entity `Port` (bảng `ports`) — danh sách trường **khớp 100%** sheet `QL Cảng biển` — file `HH_Tính năng & danh sách các trường thông tin.xlsx` (nguồn sự thật đã được xác nhận): tên trường, loại điều khiển và cờ hiển thị tại 5 màn hình (Danh sách / Bộ lọc / Xem chi tiết / Tạo mới / Sửa) lấy nguyên theo Excel. Quy ước cột Bắt buộc: **Có*** = bắt buộc khi Gửi phê duyệt. Điểm khác biệt của F-009 so với F-008: `portCode` và `orgUnitId` là **read-only trên màn Sửa** (Excel: cột Sửa vẫn hiển thị nhưng điều khiển `Text (read-only)`); sau mỗi lần cập nhật phải duyệt lại.

| STT | Tên trường (theo Excel) | Loại điều khiển (theo Excel) | Bắt buộc | Danh sách | Bộ lọc | Xem chi tiết | Tạo mới | Sửa | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| | **Thông tin chung** | | | | | | | | |
| 1 | Mã cảng biển | Text (read-only, tự sinh CB-XXXXXX) | Có (hệ thống tự sinh) | Không | Có | Có | Có | Có | `portCode` — **read-only, bất biến**; backend từ chối payload đổi mã |
| 2 | Đơn vị quản lý (bắt buộc khi gửi duyệt) | Select | Có* | Có | Có | Có | Có | Có | `orgUnitId` — read-only trên màn Sửa; validate trong phạm vi user (tài liệu nền mục 3.3) |
| 3 | Nhóm cảng biển | Select | Không | Có | Có | Có | Có | Có | `portGroup` |
| 4 | Tên cảng biển (bắt buộc) | Text | Có | Có | Có | Có | Có | Có | `portName` — bắt buộc |
| 5 | Tỉnh/Thành phố (bắt buộc khi gửi duyệt) | Select | Có* | Có | Có | Có | Có | Có | `province` |
| 6 | Địa điểm chi tiết | Text | Không | Không | Không | Có | Có | Có | `detailedLocation` |
| 7 | Phân cấp cảng biển (bắt buộc khi gửi duyệt) | Select | Có* | Có | Có | Có | Có | Có | `portClass` — phân cấp I/II/III |
| 8 | Phạm vi vùng nước | TextArea | Không | Không | Không | Có | Có | Có | `waterAreaScope` |
| | **Chỉ số tổng hợp** | | | | | | | | |
| 9 | Tổng số bến cảng | Number | Không | Không | Không | Có | Có | Có | `totalBerths` |
| 10 | Tổng số khu neo đậu, khu chuyển tải | Number | Không | Không | Không | Có | Có | Có | `totalAnchoragesTransshipment` |
| 11 | Tổng số tuyến luồng HH công cộng | Number | Không | Không | Không | Có | Có | Có | `totalPublicChannels` |
| 12 | Tổng số tuyến luồng HH chuyên dùng | Number | Không | Không | Không | Có | Có | Có | `totalDedicatedChannels` |
| 13 | Tổng chiều dài luồng HH công cộng (km) | Number | Không | Không | Không | Có | Có | Có | `totalPublicChannelLength` |
| 14 | Tổng chiều dài luồng HH chuyên dùng (km) | Number | Không | Không | Không | Có | Có | Có | `totalDedicatedChannelLength` |
| 15 | Tổng số phao tiêu, báo hiệu HH trên luồng | Number | Không | Không | Không | Có | Có | Có | `totalBuoysBeacons` |
| 16 | Tổng số đê, kè | Number | Không | Không | Không | Có | Có | Có | `totalDikes` |
| 17 | Tổng chiều dài hệ thống đê, kè (km) | Number | Không | Không | Không | Có | Có | Có | `totalDikeLength` |
| 18 | Tổng số đèn biển, đăng, tiêu độc lập | Number | Không | Không | Không | Có | Có | Có | `totalLighthouses` |
| 19 | Số lượng bến phao | Number | Không | Không | Không | Có | Có | Có | `buoyBerthCount` |
| 20 | Số lượng khu neo đậu | Number | Không | Không | Không | Có | Có | Có | `anchorageCount` |
| 21 | Số lượng khu chuyển tải | Number | Không | Không | Không | Có | Có | Có | `transshipmentCount` |
| 22 | Các khu nước, vùng nước khác | TextArea | Không | Không | Không | Có | Có | Có | `otherWaterAreas` |
| | **Thông tin GIS** | | | | | | | | |
| 23 | Loại đối tượng GIS | Select | Không | Không | Không | Có | Có | Có | `coordinateSystem`/`displayRule`/`mapSymbolId`/`spatialId` |
| 24 | Biểu tượng | Select | Không | Không | Không | Có | Có | Có | (GIS) |
| 25 | Hệ quy chiếu | Select | Không | Không | Không | Có | Có | Có | (GIS) |
| 26 | Quy tắc hiển thị | Text | Không | Không | Không | Có | Có | Có | (GIS) |
| | **Tọa độ GPS** | | | | | | | | |
| 27 | Tọa độ GPS (bắt buộc ≥1 khi gửi duyệt) | Bảng con (Vĩ độ, Kinh độ) | Có* | Không | Không | Có | Có | Có | `coordinates[]` — GPS phải cung cấp cùng nhau (paired); ≥ 1 tọa độ khi gửi duyệt lại |
| | **Công trình KCHT trực thuộc** | | | | | | | | |
| 28 | Công trình KCHT | Bảng con (STT, Tên, Số lượng) | Không | Không | Không | Có | Có | Có | `infrastructure[]` — tên bắt buộc, số lượng > 0 |
| | **File đính kèm** | | | | | | | | |
| 29 | File đính kèm | Upload | Không | Không | Không | Có | Có | Có | `attachments[]` — quản lý tại F-008/F-012; màn Sửa hiển thị danh sách |
| | **Ghi chú & Trạng thái** | | | | | | | | |
| 30 | Ghi chú | TextArea | Không | Không | Không | Có | Có | Có | `remarks` |
| 31 | Trạng thái | Select | Không (read-only) | Có | Có | Không | Không | Không | `operationalStatus` — theo Excel chỉ hiển thị ở Danh sách/Bộ lọc |
| | **Thông tin kiểm toán (chỉ Admin Cục)** | | | | | | | | |
| 32 | Người cập nhật | Text (read-only) | Không (read-only) | Có | Không | Không | Không | Không | Kiểm toán — chỉ Admin Cục |
| 33 | Ngày cập nhật | Text (read-only) | Không (read-only) | Có | Có | Không | Không | Không | Kiểm toán — chỉ Admin Cục |
| | **Kết cấu hạ tầng thuộc cầu cảng** | | | | | | | | |
| 34 | Tên kết cấu hạ tầng | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 35 | Loại kết cấu hạ tầng | Dropdown (bộ lọc) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| | **Thông tin quy hoạch** | | | | | | | | |
| 36 | Số quyết định quy hoạch | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 37 | Ngày quyết định quy hoạch | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| | **Thông tin vận hành khai thác** | | | | | | | | |
| 38 | Mã kế hoạch | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 39 | Tên kế hoạch | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 40 | Ngày bắt đầu | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 41 | Ngày kết thúc | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| | **Thông tin bảo trì** | | | | | | | | |
| 42 | Mã kế hoạch | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 43 | Tên kế hoạch | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 44 | Thời gian bắt đầu | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 45 | Thời gian kết thúc | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| | **Thông tin sự cố** | | | | | | | | |
| 46 | Mã sự cố | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 47 | Loại sự cố | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 48 | Địa điểm | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |
| 49 | Thời gian | Text (read-only) | Không (read-only) | Không | Không | Có | Không | Không | Chỉ Xem chi tiết |

## 3. Trạng thái và phê duyệt

- Theo tài liệu nền mục 3.5 (các trạng thái enum `ApprovalStatus` — 10 giá trị có label) và quy trình 2 cấp tại `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md`.
- **Sau mỗi lần cập nhật thành công:** hồ sơ được đưa về trạng thái chờ duyệt và **phải duyệt lại** (không giữ trạng thái đã duyệt cũ) — mọi cập nhật đều phải qua phê duyệt để đảm bảo toàn vẹn dữ liệu.
- Chỉ được cập nhật khi hồ sơ ở trạng thái cho phép sửa (Lưu tạm / bị trả về — theo file chuẩn); cảnh báo khi cảng đang trong quá trình phê duyệt hoặc đã bị xóa mềm.
- Mỗi lần cập nhật: ghi change log (bản cũ trước khi cập nhật) + đầy đủ thông tin kiểm toán (operatorId, updatedBy, updatedAt).

## 4. Quy tắc và phân quyền riêng

> Chỉ ghi quy tắc **chưa có** trong tài liệu nền.

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-009-01 | `portCode` không thể thay đổi sau khi tạo (read-only, server từ chối nếu payload đổi mã) | Update |
| BR-009-02 | Tọa độ GPS phải cung cấp cùng nhau: latitude [-90, 90], longitude [-180, 180] | Update |
| BR-009-03 | Cập nhật thành công → reset trạng thái về chờ duyệt, phải duyệt lại (quy trình 2 cấp) | Update |
| BR-009-04 | Tự động tạo change log cho mọi thay đổi (bản cũ lưu trước khi cập nhật) | Update |
| BR-009-05 | Trùng `portCode`/lỗi xung đột → HTTP 409, không ghi đè | Update |

### 4.2. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Xem cảng để cập nhật (pre-fill) | `port:read` |
| Cập nhật Cảng biển | `port:update` |

| Vai trò điển hình | Thao tác |
|---|---|
| system-admin / ROLE_SUPER_ADMIN | Toàn quyền |
| Admin, Lãnh đạo | Cập nhật, Xem |
| Chuyên viên Cục / Chuyên viên Cảng vụ / Doanh nghiệp cảng | Cập nhật trong phạm vi đơn vị mình |
| Nhân viên vận hành | Xem (không cập nhật) |

**Admin Cục:** không có đặc biệt ngoài mặc định tài liệu nền mục 3.2 — full quyền + xem metadata người tạo/người sửa/thời gian.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Không — dùng các trạng thái enum `ApprovalStatus`; cập nhật reset về trạng thái chờ duyệt |
| 2 | Có bước phê duyệt không | Có — mọi cập nhật phải duyệt lại (quy trình 2 cấp) |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị (orgUnitId — tài liệu nền mục 3.3) |
| 4 | Trường chỉ hiện trong điều kiện nào | Không |
| 5 | Quyền riêng | `port:update` (kèm `port:read` để pre-fill) |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không |
| 7 | Tải lên tệp | Không (đính kèm quản lý tại F-008/F-012) |
| 8 | Giao diện khác mẫu chung | Không |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/v1/ports/{id}` | Lấy thông tin hiện tại để pre-fill form | `port:read` |
| PUT | `/api/v1/ports/{id}` | Cập nhật Cảng biển (kèm coordinates[], infrastructure[]); trả về bản ghi với trạng thái chờ duyệt + change log | `port:update` |

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `ports`:** cấu trúc giống F-008 (mục 7) — không thêm trường mới ở F-009; `portCode` bất biến.

**Bảng `change_log` (nhật ký thay đổi — dùng chung module):** id (UUID PK), entityType, entityId (UUID), changeType (UPDATE), changedField, oldValue, newValue, changedBy (UUID), changedAt — ghi tự động mỗi lần cập nhật (bản cũ trước khi cập nhật).
