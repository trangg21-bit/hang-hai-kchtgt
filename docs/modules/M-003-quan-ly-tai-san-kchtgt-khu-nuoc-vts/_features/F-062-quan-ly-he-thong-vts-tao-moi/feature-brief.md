---
id: F-062
name: "Quan ly He thong VTS - Tao moi"
slug: quan-ly-he-thong-vts-tao-moi
module-id: M-003
status: proposed
classification: local
priority: P0
created: "2026-06-30T00:00:00Z"
last-updated: "2026-07-31T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quan ly He thong VTS - Tao moi

## Mô tả chung

| Nội dung | Mô tả |
|---|---|
| Mục đích | Cho phép Chuyên viên tạo mới hồ sơ Hệ thống VTS (Vessel Traffic Service) với đầy đủ thông tin chung, thông tin hệ thống, danh sách vùng VTS trực thuộc và file đính kèm. |
| Tác nhân | Chuyên viên (A-003) |
| Luồng chính | Chuyên viên đăng nhập → chọn "Thêm mới hệ thống VTS" → điền form 4 nhóm thông tin → Hệ thống validate → Lưu với trạng thái PROPOSED → Chờ phê duyệt 2 cấp |
| Điều kiện trước | Người dùng có quyền `vts:create` |
| Điều kiện sau | Bản ghi tạo với trạng thái PROPOSED, hiển thị trong danh sách chờ phê duyệt |
| Quy tắc nghiệp vụ | Mã hệ thống VTS duy nhất toàn hệ thống. Trạng thái mặc định PROPOSED. Phê duyệt 2 cấp: Trưởng phòng (C1) → Cục trưởng (C2). |

## Mô tả màn hình

### Nhóm 1 — Thông tin chung

| STT | Tên trường | Loại điều khiển | Cho phép sửa | Bắt buộc | Giá trị mặc định / Placeholder | Mô tả |
|---|---|---|---|---|---|---|
| 1 | Đơn vị quản lý | Dropdown (searchable) | Có | Có | Placeholder: "Chọn đơn vị quản lý" | Lấy từ danh mục đơn vị. Mặc định: "G17.43 - Cục HH&ĐT VN" |
| 2 | Ghi chú | TextArea + counter | Có | Không | max 2000, placeholder: "Nhập ghi chú" | Hiển thị "0/2000" |

### Nhóm 2 — Thông tin hệ thống VTS

| STT | Tên trường | Loại điều khiển | Cho phép sửa | Bắt buộc | Giá trị mặc định / Placeholder | Mô tả |
|---|---|---|---|---|---|---|
| 1 | Đơn vị chủ quản | Dropdown (searchable) | Có | Có | Placeholder: "Chọn đơn vị chủ quản" | FK → Organization |
| 2 | Đơn vị vận hành | Dropdown (searchable) | Có | Có | Placeholder: "Chọn đơn vị vận hành" | FK → Organization |
| 3 | Thuộc cảng biển | Dropdown (searchable) | Có | Không | Placeholder: "Chọn cảng biển" | FK → Port, có thể để trống |
| 4 | Mã hệ thống VTS | Text input + counter | Có | Có | max 50, unique, placeholder: "Nhập mã hệ thống VTS" | Validate trùng trước khi lưu. Hiển thị "0/50" |
| 5 | Tên hệ thống VTS | Text input + counter | Có | Có | max 255, placeholder: "Nhập tên hệ thống VTS" | Hiển thị "0/255" |
| 6 | Địa điểm (Tỉnh/TP) | Dropdown (searchable) | Có | Có | Placeholder: "Chọn địa điểm" | Danh sách 63 tỉnh/thành phố |
| 7 | Địa điểm chi tiết | Text input + counter | Có | Không | max 500, placeholder: "Nhập địa điểm chi tiết" | Hiển thị "0/500" |
| 8 | Thời gian bắt đầu hoạt động | DatePicker | Có | Không | Placeholder: "Chọn thời gian bắt đầu hoạt động" | Định dạng DD/MM/YYYY |
| 9 | Phạm vi áp dụng | TextArea + counter | Có | Không | max 2000, placeholder: "Nhập phạm vi áp dụng" | Hiển thị "0/2000" |
| 10 | Thông báo hàng hải | TextArea + counter | Có | Không | max 2000, placeholder: "Nhập thông báo hàng hải" | Hiển thị "0/2000" |
| 11 | Tình trạng | Dropdown | Có | Có | Mặc định: "Đang hoạt động" | Options: "Đang hoạt động", "Dừng hoạt động", "Đang bảo trì", "Đang xây dựng" |
| 12 | Mức độ phụ trách | Text input + counter | Có | Không | max 255, placeholder: "Nhập mức độ phụ trách" | |
| 13 | Nguồn gốc | Text input + counter | Có | Không | max 255, placeholder: "Nhập nguồn gốc" | |
| 14 | Đối tác | Text input + counter | Có | Không | max 255, placeholder: "Nhập đối tác" | |

### Nhóm 3 — Danh sách vùng VTS

| STT | Tên trường | Loại điều khiển | Cho phép sửa | Bắt buộc | Giá trị mặc định / Placeholder | Mô tả |
|---|---|---|---|---|---|---|
| 1 | Bảng vùng VTS | Dynamic table | Có | Không | Mặc định: trống, hiển thị "Không có dữ liệu" | Button "Thêm vùng VTS" → thêm dòng mới gồm: Mã vùng VTS, Tên vùng VTS, Tình trạng (dropdown), Thao tác (nút Xóa). Có thể thêm nhiều dòng. |

### Nhóm 4 — File đính kèm

| STT | Tên trường | Loại điều khiển | Cho phép sửa | Bắt buộc | Giá trị mặc định / Placeholder | Mô tả |
|---|---|---|---|---|---|---|
| 1 | Danh sách file | Upload + table | Có | Không | Mặc định: trống, hiển thị "Không có dữ liệu" | Button "Tải file lên" → thêm file. Bảng hiển thị: STT, Tên file, Thao tác (nút Xóa). Hỗ trợ PDF, ảnh, Word. |

## Luồng thao tác

1. Chuyên viên truy cập danh sách Hệ thống VTS → chọn "Thêm mới"
2. Form hiển thị 4 nhóm: Thông tin chung → Thông tin hệ thống VTS → Danh sách vùng VTS → File đính kèm
3. Người dùng điền các trường bắt buộc: Đơn vị quản lý, Đơn vị chủ quản, Đơn vị vận hành, Mã hệ thống VTS, Tên hệ thống VTS, Địa điểm (Tỉnh/TP), Tình trạng
4. Hệ thống validate: mã duy nhất, required fields, maxlength
5. Lưu thành công → trạng thái PROPOSED → hiển thị toast "Tạo mới hệ thống VTS thành công"
6. Chuyển về danh sách, bản ghi mới hiển thị với trạng thái "Chờ phê duyệt"

## Acceptance Criteria

- [x] Form hiển thị đầy đủ 4 nhóm thông tin theo đúng thứ tự
- [x] Các trường bắt buộc có dấu * đỏ: Đơn vị quản lý, Đơn vị chủ quản, Đơn vị vận hành, Mã hệ thống VTS, Tên hệ thống VTS, Địa điểm (Tỉnh/TP), Tình trạng
- [x] Validate mã hệ thống VTS duy nhất — nếu trùng hiển thị lỗi "Mã hệ thống VTS đã tồn tại"
- [x] Trạng thái mặc định = PROPOSED
- [x] Danh sách vùng VTS và File đính kèm có thể để trống khi tạo mới
- [x] Sau khi tạo thành công, hiển thị toast và quay về danh sách

## Entities

| Entity | Table | Mô tả |
|---|---|---|
| HeThongVTS | he_thong_vts | Entity chính, 20 trường |
| VungVTS | vung_vts | Danh sách vùng VTS trực thuộc (1-N) |
| HeThongVTSAttachment | he_thong_vts_attachment | File đính kèm (1-N) |
| PheDuyetLichSu | phe_duyet_lich_su | Lịch sử phê duyệt (1-N) |

### HeThongVTS fields (20 fields)

| Field | Type | Required | Default | Note |
|---|---|---|---|---|
| id | Long (PK) | — | Auto | |
| organizationId | Long (FK) | Có | — | Đơn vị quản lý |
| owningOrgId | Long (FK) | Có | — | Đơn vị chủ quản |
| operatingOrgId | Long (FK) | Có | — | Đơn vị vận hành |
| portId | Long (FK) | Không | null | Thuộc cảng biển |
| code | String | Có | — | Mã hệ thống VTS, max 50, unique |
| tenHeThong | String | Có | — | Tên hệ thống, max 255 |
| province | String | Có | — | Địa điểm Tỉnh/TP |
| address | String | Không | null | Địa điểm chi tiết, max 500 |
| viTri | String | Không | null | Vị trí, max 500 (giữ từ entity cũ) |
| operationStartDate | LocalDate | Không | null | Thời gian bắt đầu hoạt động |
| scope | String | Không | null | Phạm vi áp dụng, max 2000 |
| maritimeNotice | String | Không | null | Thông báo hàng hải, max 2000 |
| tinhTrang | String | Có | "Đang hoạt động" | Tình trạng, max 50 |
| mucDoPhuTrach | String | Không | null | Mức độ phụ trách, max 255 |
| nguonGoc | String | Không | null | Nguồn gốc, max 255 |
| doiTac | String | Không | null | Đối tác, max 255 |
| note | String | Không | null | Ghi chú, max 2000 |
| trangThai | Enum | — | PROPOSED | Trạng thái phê duyệt |
| isDeleted | Boolean | — | false | Soft delete |

### VungVTS fields

| Field | Type | Required | Default | Note |
|---|---|---|---|---|
| id | Long (PK) | — | Auto | |
| heThongVTSId | Long (FK) | — | — | FK → HeThongVTS |
| code | String | Có | — | Mã vùng VTS |
| name | String | Có | — | Tên vùng VTS |
| status | String | Có | "Đang hoạt động" | Tình trạng |

## Business Rules

| ID | Rule | Applies-to |
|---|---|---|
| BR-062-01 | Mã hệ thống VTS (code) duy nhất toàn hệ thống, max 50 ký tự | HeThongVTS.code |
| BR-062-02 | Trạng thái mặc định = PROPOSED | HeThongVTS.trangThai |
| BR-062-03 | Tên hệ thống VTS bắt buộc, max 255 | HeThongVTS.tenHeThong |
| BR-062-04 | Đơn vị quản lý, đơn vị chủ quản, đơn vị vận hành bắt buộc | HeThongVTS |
| BR-062-05 | Địa điểm Tỉnh/TP bắt buộc | HeThongVTS.province |
| BR-062-06 | Tình trạng bắt buộc, mặc định "Đang hoạt động" | HeThongVTS.tinhTrang |
| BR-062-07 | Danh sách vùng VTS và file đính kèm không bắt buộc khi tạo mới | VungVTS, Attachment |
| BR-062-08 | Phê duyệt 2 cấp: Trưởng phòng (C1) → Cục trưởng (C2) | HeThongVTS |

## Roles + Permissions

| Role | Permission | Ghi chú |
|---|---|---|
| A-003 (Chuyên viên) | `vts:create` | Tạo mới, chỉnh sửa bản ghi PROPOSED/UNDER_REVIEW/REJECTED |
| A-002 (Lãnh đạo) | `vts:approve:c1` | Phê duyệt C1 (PROPOSED → UNDER_REVIEW) |
| A-002 (Cục trưởng) | `vts:approve:c2` | Phê duyệt C2 (UNDER_REVIEW → APPROVED) |

## Dependencies

- DESIGN.md: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/DESIGN.md
- BA Spec: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/ba/00-lean-spec.md
- F-065 (Phê duyệt), F-066 (Xem chi tiết)
