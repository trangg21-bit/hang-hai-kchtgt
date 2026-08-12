---
id: F-048-detail
name: Xem chi tiết Đê/kè
slug: ql-de-ke-xem-chi-tiet
module-id: M-003
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-11T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Xem chi tiết Đê/kè

**Tài liệu:** BA Feature Brief
**Feature:** F-048-detail
**Module:** M-003 — Quản lý tài sản KCHTGT - Khu nước & VTS
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-11

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Trang chi tiết hiển thị toàn bộ thông tin của một công trình đê/kè cụ thể được chọn từ danh sách (F-048), bao gồm dữ liệu cơ bản, kỹ thuật, trạng thái phê duyệt, tọa độ GIS, file đính kèm và các hành động khả dụng theo vai trò. Trang ở chế độ read-only — mọi chỉnh sửa phải thực hiện qua F-045 (Cập nhật Đê/kè).

### 1.2. Tại sao cần tính năng này?

Cung cấp giao diện xem chi tiết để tất cả các bên liên quan — từ Chuyên viên đến Cục trưởng — có thể tiếp cận thông tin chính xác và cập nhật nhất về từng công trình đê/kè. Điều này hỗ trợ ra quyết định nhanh chóng trong vận hành, kiểm toán tuân thủ và báo cáo quản lý.

### 1.3. Luồng hoạt động chính

1. Người dùng click vào mã hoặc tên đê/kè trong danh sách (F-048).
2. Hệ thống gọi GET `/api/v1/dike-revetment/{id}` để lấy toàn bộ thông tin chi tiết.
3. Trang chi tiết hiển thị đầy đủ các nhóm thông tin:
   - Thông tin cơ bản: mã, tên, đơn vị quản lý, cảng biển, địa điểm, loại kết cấu
   - Thông tin kỹ thuật: chiều dài, chiều cao, cao trình đỉnh
   - Thông tin thời gian: ngày xây dựng, ngày khai thác, năm bảo trì
   - Trạng thái: badge màu cho tình trạng và trạng thái phê duyệt
   - Metadata: người tạo, thời gian tạo, người cập nhật (chỉ Admin Cục)
   - Tọa độ GIS + File đính kèm
4. Người dùng có thể thực hiện các hành động theo vai trò:
   - Chỉnh sửa (F-045) — nếu có quyền
   - Phê duyệt / Từ chối (F-047) — Trưởng phòng/Cục trưởng
   - Xem lịch sử (F-049)
5. Breadcrumb: Trang chủ > Quản lý KCHTGT Khu nước & VTS > Đê/kè > [tên công trình].

---

## 2. Ai dùng? Dùng như thế nào?

Quyền thao tác và xem tính năng được áp dụng theo hệ thống phân quyền tập trung của hệ thống. Mỗi vai trò người dùng sẽ có phạm vi truy cập và thao tác khác nhau trên tính năng này, được kiểm soát bởi cơ chế RBAC (Role-Based Access Control).

### 2.1. Logic phân quyền chung

Các thao tác trong tính năng được bảo vệ bởi các quyền (permissions) tương ứng. Người dùng chỉ có thể thực hiện những thao tác mà vai trò của họ được cấp quyền (xem chi tiết tại tính năng Phân quyền). Mọi người dùng đã đăng nhập đều có quyền xem chi tiết — đây là quyền cơ bản nhất.

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

### Mức Must (bắt buộc có)

- **US-D-01:** Là Chuyên viên, tôi muốn xem toàn bộ thông tin chi tiết của một công trình đê/kè để nắm được tình trạng hiện tại phục vụ công tác quản lý.
- **US-D-02:** Là Trưởng phòng, tôi muốn xem đầy đủ các trường kỹ thuật và trạng thái của công trình để kiểm tra thông tin trước khi phê duyệt.
- **US-D-03:** Là Cục trưởng, tôi muốn xem chi tiết và thực hiện phê duyệt/từ chối ngay trên trang chi tiết để tiết kiệm thời gian.

### Mức Should (nên có)

- **US-D-04:** Là Chuyên viên, tôi muốn tải xuống các file đính kèm của công trình để phục vụ công tác kiểm tra thực tế.
- **US-D-05:** Là Chuyên viên, tôi muốn xem lịch sử thay đổi ngay từ trang chi tiết để biết ai đã thay đổi gì và khi nào.
- **US-D-06:** Là người dùng, tôi muốn có breadcrumb điều hướng rõ ràng để dễ dàng quay lại danh sách.

### Mức Could (có thể có sau)

- **US-D-07:** Là Chuyên viên, tôi muốn xem vị trí công trình trên bản đồ từ trang chi tiết.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

**AC-D-01 — Hiển thị đầy đủ thông tin:** Trang chi tiết hiển thị tất cả các trường của entity `dike_revetment`: ma, dikeRevetmentName, orgUnitId, cangBienId, donViVanHanhId, location, locationDetail, dikeRevetmentType, length, height, crestElevation, constructionDate, commissioningDate, lastMaintenanceYear, status, note, approvalStatus, isApprovedLevel1/2, approverLevel1/2, approvedDateLevel1/2, rejectionReason, createdAt, updatedAt, createdBy, updatedBy. Nếu API lỗi, hiển thị thông báo lỗi và nút "Thử lại".

**AC-D-02 — Badge trạng thái:** Tình trạng và trạng thái phê duyệt hiển thị dưới dạng badge màu:
- Tình trạng: Đang khai thác/vận hành (xanh lá), Chưa khai thác/vận hành (cam), Dừng khai thác/vận hành (đỏ)
- Trạng thái: PROPOSED (vàng), UNDER_REVIEW (xanh dương), APPROVED (xanh lá), REJECTED (đỏ)

**AC-D-03 — Danh sách file đính kèm:** File đính kèm hiển thị tên file, kích thước, loại file và ngày upload. Mỗi file có nút "Tải xuống". Nếu không có file, hiển thị "Không có file đính kèm".

**AC-D-04 — Hành động theo trạng thái:** Các nút hành động hiển thị động:
- PROPOSED: "Sửa" (nếu có quyền), "Gửi duyệt" (cùng đơn vị), "Phê duyệt" (Cấp Cục)
- UNDER_REVIEW: "Phê duyệt C2" (Cục trưởng), "Từ chối" (người duyệt)
- APPROVED: "Sửa" (nếu có quyền đặc biệt)
- REJECTED: "Sửa" (cùng đơn vị)
Nếu người dùng không có quyền, nút tương ứng bị ẩn.

**AC-D-05 — Breadcrumb điều hướng:** Breadcrumb: Trang chủ > Quản lý KCHTGT Khu nước & VTS > Đê/kè > [tên công trình]. Click "Đê/kè" quay lại danh sách F-048.

**AC-D-06 — Metadata cho Admin Cục:** Admin Cục thấy được: người tạo, thời gian tạo, người sửa, thời gian sửa, người duyệt C1/C2, ngày duyệt C1/C2. Vai trò khác: các trường này bị ẩn.

**AC-D-07 — Cảnh báo trạng thái:** 
- PROPOSED/UNDER_REVIEW: "Công trình chưa được phê duyệt, không khả dụng trong các module khác"
- APPROVED: "Công trình đã được phê duyệt, đang khả dụng"
- REJECTED: "Công trình bị từ chối: [lý do]"

---

## 5. Quy tắc nghiệp vụ (Business Rules)

**BR-D-01 — Xem được ở mọi trạng thái:** Công trình ở bất kỳ trạng thái nào (PROPOSED, UNDER_REVIEW, APPROVED, REJECTED) đều có thể xem chi tiết.

**BR-D-02 — Dữ liệu read-only:** Trang chi tiết là chế độ xem. Mọi chỉnh sửa phải thực hiện qua F-045. Không có trường nào cho phép nhập liệu trực tiếp.

**BR-D-03 — Phê duyệt từ trang chi tiết:** Trưởng phòng/Cục trưởng có thể phê duyệt hoặc từ chối ngay từ trang chi tiết (F-047).

**BR-D-04 — Dữ liệu làm mới tự động:** Thông tin được làm mới mỗi khi truy cập, không cache.

**BR-D-05 — Hiển thị theo vòng đời:** Nút hành động thay đổi theo trạng thái hiện tại, đảm bảo người dùng không thực hiện được hành động không phù hợp.

---

## 6. Vòng đời và liên kết

> ⚠ **QUAN TRỌNG CHO DEVELOPER:** Trang Xem chi tiết là **điểm trung tâm** để xem thông tin và điều hướng đến các tính năng khác. Xem sơ đồ vòng đời đầy đủ tại F-044 mục 6.1.

### 6.1. Trạng thái hiển thị

| Trạng thái | Badge | Hành động có thể thực hiện |
|---|---|---|
| PROPOSED | Vàng | Sửa (QLTS), Gửi duyệt, Phê duyệt (Cục) |
| UNDER_REVIEW | Xanh dương | Phê duyệt C2 (Cục trưởng), Từ chối |
| APPROVED | Xanh lá | Sửa (có quyền đặc biệt) |
| REJECTED | Đỏ | Sửa & gửi lại |

### 6.2. Quan hệ với các tính năng khác

F-048-detail là trang đích sau khi tạo mới (F-044) hoặc click từ danh sách (F-048). Từ đây điều hướng đến: Sửa (F-045), Phê duyệt (F-047), Lịch sử (F-049).

---

## 7. Mô hình dữ liệu

Tính năng này chỉ đọc dữ liệu, không tạo hay sửa bảng. Bảng được truy vấn: `dike_revetment` + JOIN `dike_revetment_attachment`.

---

## 8. API Endpoints

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| GET | `/api/v1/dike-revetment/{id}` | Lấy toàn bộ thông tin chi tiết | `dikerevetment:read` |
| GET | `/api/v1/dike-revetment/{id}/attachments` | Lấy danh sách file đính kèm | `dikerevetment:read` |

---

## 9. Chi tiết nghiệp vụ

### 9.1. Trang chi tiết — nhóm thông tin

#### A. Thông tin cơ bản — mở rộng mặc định

| STT | Tên trường | Loại hiển thị | Mô tả |
| --- | --- | --- | --- |
| 1 | Mã đê kè | Text (read-only) | `ma`, tự động sinh, không sửa được |
| 2 | Tên đê kè | Text (read-only) | `dikeRevetmentName` |
| 3 | Đơn vị quản lý | Text (read-only) | `orgUnitId` (join tên) |
| 4 | Thuộc cảng biển | Text (read-only) | `cangBienId` (join tên) — nếu có |
| 5 | Đơn vị vận hành | Text (read-only) | `donViVanHanhId` (join tên) — nếu có |
| 6 | Địa điểm | Text (read-only) | `location` (Tỉnh/TP) |
| 7 | Địa điểm chi tiết | Text (read-only) | `locationDetail` |
| 8 | Loại kết cấu | Text (read-only) | Đê chắn sóng / Đê chắn cát / Kè hướng dòng / Kè bảo vệ bờ |

#### B. Thông tin kỹ thuật — mở rộng mặc định

| STT | Tên trường | Loại hiển thị | Mô tả |
| --- | --- | --- | --- |
| 9 | Chiều dài | Number (read-only) | Hiển thị kèm đơn vị mét (m) |
| 10 | Chiều cao | Number (read-only) | Hiển thị kèm đơn vị mét (m) |
| 11 | Cao trình đỉnh | Number (read-only) | Hiển thị kèm đơn vị mét (m) |

#### C. Thông tin thời gian — thu gọn mặc định

| STT | Tên trường | Loại hiển thị |
| --- | --- | --- |
| 12 | Thời điểm xây dựng | Text (read-only) |
| 13 | Thời điểm đưa vào khai thác | Text (read-only) |
| 14 | Năm bảo trì gần nhất | Text (read-only) |

#### D. Trạng thái — mở rộng mặc định

| STT | Tên trường | Loại hiển thị |
| --- | --- | --- |
| 15 | Tình trạng | Badge (read-only) |
| 16 | Trạng thái phê duyệt | Badge (read-only) |
| 17 | Ghi chú | Text (read-only) |

#### E. Tab: Thông tin phê duyệt — thu gọn mặc định

Hiển thị dạng bảng, danh sách các lần phê duyệt của Trưởng phòng/Cục trưởng:

| Cột | Mô tả |
|---|---|
| Nội dung phê duyệt | Mô tả nội dung phê duyệt (phê duyệt mới, phê duyệt sau sửa...) |
| Ngày phê duyệt | Ngày giờ phê duyệt (dd/MM/yyyy HH:mm) |
| Cán bộ phê duyệt | Họ tên cán bộ thực hiện phê duyệt |

#### F. GIS — thu gọn mặc định

| STT | Tên trường | Loại hiển thị |
| --- | --- | --- |
| 24 | Loại đối tượng | Text (read-only) |
| 25 | Biểu tượng | Icon (read-only) |
| 26 | Hệ quy chiếu | Text (read-only) — WGS_84 |
| 27 | Quy tắc hiển thị | Text (read-only) — Độ/Phút/Giây |
| 28 | Tọa độ GIS | Table (read-only) — danh sách điểm |

#### G. File đính kèm — mở rộng mặc định

| STT | Tên trường | Loại hiển thị |
| --- | --- | --- |
| 29 | Danh sách file | Table (read-only) — tên file, kích thước, loại, ngày upload |
| G1 | Nút "Tải xuống" | Button |
| G2 | Nút "In" | Button |

#### H. Metadata — chỉ Admin Cục

| STT | Tên trường | Loại hiển thị |
| --- | --- | --- |
| 30 | Người tạo | Text (read-only) |
| 31 | Thời gian tạo | Text (read-only) |
| 32 | Người cập nhật | Text (read-only) |
| 33 | Thời gian cập nhật | Text (read-only) |

#### I. Nhóm Hành động — luôn hiển thị, cố định cuối trang

| STT | Tên trường | Loại hiển thị | Mô tả |
| --- | --- | --- | --- |
| I1 | Nút "Chỉnh sửa" | Button | Chỉnh sửa thông tin đê/kè. Chỉ Admin, Chuyên viên cùng đơn vị. Điều kiện: PROPOSED/REJECTED + cùng đơn vị; APPROVED + Cấp Cục. |
| I2 | Nút "Gửi phê duyệt" | Button | Gửi yêu cầu phê duyệt. Chỉ Chuyên viên cùng đơn vị + PROPOSED/REJECTED. |
| I3 | Nút "Phê duyệt" | Button | Phê duyệt trực tiếp. Chỉ Cấp Cục + PROPOSED. |
| I4 | Nút "Từ chối" | Button | Từ chối phê duyệt. Trưởng phòng + PROPOSED; Cục trưởng + UNDER_REVIEW. |
| I5 | Nút "Lịch sử" | Button | Xem lịch sử thay đổi của đê/kè. Tất cả người dùng. |

---

## 10. Yêu cầu phi chức năng

- Tải trang chi tiết ≤ 1 giây
- File đính kèm ≤ 3 giây/file (tối đa 10MB)
- Responsive, loading skeleton, empty state
- Tuân thủ WCAG 2.1 AA

---

## 11. Yêu cầu giao diện

### 11.1. Bố cục

Dùng chung bố cục hệ thống: sidebar 272px (#12468C), header 64px, nền #eaf0f6.

### 11.2. Màu badge

| Trạng thái | Màu |
|---|---|
| PROPOSED | #FAAD14 (vàng) |
| UNDER_REVIEW | #1890FF (xanh dương) |
| APPROVED | #52C41A (xanh lá) |
| REJECTED | #FF4D4F (đỏ) |
| Đang khai thác/vận hành | #52C41A (xanh lá) |
| Chưa khai thác/vận hành | #FAAD14 (cam) |
| Dừng khai thác/vận hành | #FF4D4F (đỏ) |

### 11.3. Màn hình

1. **ScreenHeader:** breadcrumb "Đê/kè > [tên công trình]"
2. **Info cards:** nhóm A+B+D mở rộng mặc định, C+E+F thu gọn
3. **File đính kèm:** bảng + nút Tải xuống/In
4. **Action bar:** cố định cuối trang (I1-I5)

### 11.4. Mobile

- Card xếp dọc toàn màn hình
- Action bar → floating bar
