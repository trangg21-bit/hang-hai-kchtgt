---
id: F-063
name: "Quan ly He thong VTS - Cap nhat"
slug: quan-ly-he-thong-vts-cap-nhat
module-id: M-003
status: proposed
classification: local
priority: P0
created: "2026-06-30T00:00:00Z"
last-updated: "2026-07-31T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quan ly He thong VTS - Cap nhat

## Mô tả chung

| Nội dung | Mô tả |
|---|---|
| Mục đích | Cho phép Chuyên viên cập nhật thông tin Hệ thống VTS đã tồn tại. Form load sẵn dữ liệu hiện tại, cho phép sửa tất cả các trường. Mọi thay đổi phải được phê duyệt lại trước khi chính thức ghi nhận. |
| Tác nhân | Chuyên viên (A-003) |
| Luồng chính | Chuyên viên chọn Hệ thống VTS → nhấn "Cập nhật" → Form load dữ liệu hiện tại → Sửa các trường cần thay đổi → Hệ thống validate → Lưu → Trạng thái chuyển UNDER_REVIEW → Chờ phê duyệt lại 2 cấp |
| Điều kiện trước | Người dùng có quyền `vts:update`. Bản ghi ở trạng thái PROPOSED / UNDER_REVIEW / REJECTED. |
| Điều kiện sau | Bản ghi cập nhật với trạng thái UNDER_REVIEW, ghi nhận lịch sử thay đổi. |
| Quy tắc nghiệp vụ | Chỉ cập nhật được bản ghi PROPOSED/UNDER_REVIEW/REJECTED. Bản ghi APPROVED không được sửa trực tiếp. Sau cập nhật → phê duyệt lại 2 cấp (C1 → C2). Mọi thay đổi ghi vào change log. |

## Mô tả màn hình

Form Cập nhật giống hệt form Tạo mới (F-062), gồm 4 nhóm:

### Nhóm 1 — Thông tin chung

| STT | Tên trường | Loại điều khiển | Cho phép sửa | Bắt buộc | Giá trị hiển thị | Mô tả |
|---|---|---|---|---|---|---|
| 1 | Đơn vị quản lý | Dropdown (searchable) | **Không** | Có | **Có dữ liệu:** hiển thị giá trị đã lưu (VD: "G17.43 - Cục HH&ĐT VN"). **Không có:** hiển thị "Chưa có dữ liệu" | FK → Organization. Immutable sau khi tạo. |
| 2 | Ghi chú | TextArea + counter | Có | Không | **Có dữ liệu:** hiển thị nội dung + "n/2000" (VD: "1122122222" → "10/2000"). **Không có:** hiển thị placeholder "Nhập ghi chú" + "0/2000" | |

### Nhóm 2 — Thông tin hệ thống VTS

| STT | Tên trường | Loại điều khiển | Cho phép sửa | Bắt buộc | Giá trị hiển thị | Mô tả |
|---|---|---|---|---|---|---|
| 1 | Đơn vị chủ quản | Dropdown (searchable) | Có | Có | **Có dữ liệu:** hiển thị giá trị đã lưu. **Không có:** hiển thị placeholder "Chọn đơn vị chủ quản" | FK → Organization |
| 2 | Đơn vị vận hành | Dropdown (searchable) | Có | Có | **Có dữ liệu:** hiển thị giá trị đã lưu. **Không có:** hiển thị placeholder "Chọn đơn vị vận hành" | FK → Organization |
| 3 | Thuộc cảng biển | Dropdown (searchable) | Có | Không | **Có dữ liệu:** hiển thị giá trị đã lưu. **Không có:** hiển thị placeholder "Chọn cảng biển" | FK → Port |
| 4 | Mã hệ thống VTS | Text input (read-only) | **Không** | Có | **Có dữ liệu:** hiển thị mã (VD: "VTS-000002"). **Không có:** hiển thị "Chưa có dữ liệu" | Immutable sau khi tạo |
| 5 | Tên hệ thống VTS | Text input + counter | Có | Có | **Có dữ liệu:** hiển thị tên + "n/255" (VD: "vts demo 034" → "12/255"). **Không có:** hiển thị placeholder "Nhập tên hệ thống VTS" + "0/255" | |
| 6 | Địa điểm (Tỉnh/TP) | Dropdown (searchable) | Có | Có | **Có dữ liệu:** hiển thị tỉnh đã chọn. **Không có:** hiển thị placeholder "Chọn địa điểm" | Danh sách 63 tỉnh/thành phố |
| 7 | Địa điểm chi tiết | Text input + counter | Có | Không | **Có dữ liệu:** hiển thị nội dung + "n/500". **Không có:** hiển thị placeholder "Nhập địa điểm chi tiết" + "0/500" | |
| 8 | Thời gian bắt đầu hoạt động | DatePicker | Có | Không | **Có dữ liệu:** hiển thị ngày (VD: "17/04/2026"). **Không có:** hiển thị placeholder "Chọn thời gian bắt đầu hoạt động" | Định dạng DD/MM/YYYY |
| 9 | Phạm vi áp dụng | TextArea + counter | Có | Không | **Có dữ liệu:** hiển thị nội dung + "n/2000" (VD: "Việt Nam" → "8/2000"). **Không có:** hiển thị placeholder "Nhập phạm vi áp dụng" + "0/2000" | |
| 10 | Thông báo hàng hải | TextArea + counter | Có | Không | **Có dữ liệu:** hiển thị nội dung + "n/2000". **Không có:** hiển thị placeholder "Nhập thông báo hàng hải" + "0/2000" | |
| 11 | Tình trạng | Dropdown | Có | Có | **Có dữ liệu:** hiển thị giá trị đã lưu. **Không có:** hiển thị placeholder "Chọn tình trạng" | Options: "Đang hoạt động", "Dừng hoạt động", "Đang bảo trì", "Đang xây dựng" |
| 12 | Mức độ phụ trách | Text input + counter | Có | Không | **Có dữ liệu:** hiển thị nội dung + "n/255". **Không có:** hiển thị placeholder "Nhập mức độ phụ trách" + "0/255" | |
| 13 | Nguồn gốc | Text input + counter | Có | Không | **Có dữ liệu:** hiển thị nội dung + "n/255". **Không có:** hiển thị placeholder "Nhập nguồn gốc" + "0/255" | |
| 14 | Đối tác | Text input + counter | Có | Không | **Có dữ liệu:** hiển thị nội dung + "n/255". **Không có:** hiển thị placeholder "Nhập đối tác" + "0/255" | |

### Nhóm 3 — Danh sách vùng VTS

| STT | Tên trường | Loại điều khiển | Cho phép sửa | Bắt buộc | Giá trị hiển thị | Mô tả |
|---|---|---|---|---|---|---|
| 1 | Bảng vùng VTS | Dynamic table | Có | Không | **Có dữ liệu:** hiển thị danh sách (VD: 1 dòng: VTS-000002-000001, vts vn, Đang khai thác/vận hành). **Không có:** hiển thị "Không có dữ liệu" | Button "Thêm vùng VTS" → thêm dòng. Mỗi dòng: Mã vùng, Tên vùng, Tình trạng (dropdown), nút Xóa. |

### Nhóm 4 — File đính kèm

| STT | Tên trường | Loại điều khiển | Cho phép sửa | Bắt buộc | Giá trị hiển thị | Mô tả |
|---|---|---|---|---|---|---|
| 1 | Danh sách file | Upload + table | Có | Không | **Có dữ liệu:** hiển thị danh sách file (STT, Tên file, nút Xóa). **Không có:** hiển thị "Không có dữ liệu" | Button "Tải file lên" → thêm file. |

## Luồng thao tác

1. Chuyên viên chọn Hệ thống VTS từ danh sách → nhấn "Cập nhật"
2. Hệ thống kiểm tra: nếu trạng thái = APPROVED → từ chối, hiển thị lỗi "Không thể cập nhật bản ghi đã phê duyệt"
3. Nếu hợp lệ → mở form load sẵn toàn bộ dữ liệu 4 nhóm
4. Mã hệ thống VTS hiển thị read-only (không cho sửa)
5. Chuyên viên sửa các trường cần thiết
6. Hệ thống validate: required fields, maxlength
7. Lưu thành công → trạng thái chuyển UNDER_REVIEW → ghi change log → toast "Cập nhật hệ thống VTS thành công"
8. Chuyển về danh sách, bản ghi hiển thị trạng thái "Chờ phê duyệt"

## Acceptance Criteria

- [x] Form load đầy đủ dữ liệu hiện tại của 4 nhóm thông tin
- [x] Mã hệ thống VTS hiển thị read-only, không cho phép sửa
- [x] Chỉ cập nhật được bản ghi PROPOSED / UNDER_REVIEW / REJECTED
- [x] Bản ghi APPROVED bị từ chối cập nhật với thông báo lỗi
- [x] Sau khi cập nhật → trạng thái chuyển UNDER_REVIEW
- [x] Mọi thay đổi được ghi vào change log
- [x] Có thể thêm/xóa vùng VTS và file đính kèm

## Entities

| Entity | Table | Mô tả |
|---|---|---|
| HeThongVTS | he_thong_vts | Entity chính (20 trường — xem F-062) |
| VungVTS | vung_vts | Danh sách vùng VTS (1-N) |
| HeThongVTSAttachment | he_thong_vts_attachment | File đính kèm (1-N) |
| HeThongVTSChangeLog | he_thong_vts_change_log | Lịch sử thay đổi (old/new value) |
| PheDuyetLichSu | phe_duyet_lich_su | Lịch sử phê duyệt |

## Business Rules

| ID | Rule | Applies-to |
|---|---|---|
| BR-063-01 | Chỉ cập nhật bản ghi PROPOSED / UNDER_REVIEW / REJECTED | HeThongVTS.trangThai |
| BR-063-02 | Bản ghi APPROVED không cho phép cập nhật trực tiếp | HeThongVTS.trangThai |
| BR-063-03 | Mã hệ thống VTS (code) immutable — không cho sửa sau khi tạo | HeThongVTS.code |
| BR-063-04 | Sau cập nhật thông tin/vùng VTS/file đính kèm khi bản ghi đang ở `Đang xem xét` (UNDER_REVIEW) hoặc sau C1 → trạng thái chuyển về PROPOSED (Chờ phê duyệt), yêu cầu phê duyệt lại 2 cấp từ C1 | HeThongVTS.trangThai |
| BR-063-05 | Phê duyệt 2 cấp: Trưởng phòng/Chi cục/Cảng vụ (C1) → Cục trưởng/Lãnh đạo Cục (C2) | HeThongVTS |
| BR-063-06 | Mọi thay đổi được ghi vào HeThongVTSChangeLog / ApprovalHistory (old_value → new_value) | ChangeLog |
| BR-063-07 | Thêm mới hoặc xóa file đính kèm tại bản ghi đang ở `Đang xem xét` (UNDER_REVIEW) sẽ tự động reset trạng thái về `Chờ phê duyệt` (PROPOSED) để đảm bảo tính toàn vẹn của hồ sơ trình duyệt | HeThongVTSAttachment |

## Roles + Permissions

| Role | Permission | Ghi chú |
|---|---|---|
| A-003 (Chuyên viên) | `vts:update` | Cập nhật bản ghi PROPOSED/UNDER_REVIEW/REJECTED |
| A-002 (Lãnh đạo) | `vts:approve:c1` | Phê duyệt C1 (UNDER_REVIEW → chờ C2) |
| A-002 (Cục trưởng) | `vts:approve:c2` | Phê duyệt C2 → APPROVED |

## Dependencies

- F-062 (Tạo mới): dùng chung form, khác trạng thái đầu ra
- F-065 (Phê duyệt): sau cập nhật cần phê duyệt lại
- DESIGN.md: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/DESIGN.md
- BA Spec: docs/modules/M-003-quan-ly-tai-san-kchtgt-khu-nuoc-vts/ba/00-lean-spec.md
