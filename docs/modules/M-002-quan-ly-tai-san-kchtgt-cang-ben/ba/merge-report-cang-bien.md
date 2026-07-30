# Cảng biển Feature Merge Report

TRI-1785205768654-0f93 — 2026-07-28

## Merged features

| BE Feature | UI Feature(s) Absorbed | Status |
|---|---|---|
| F-008 (ql-cb-tao-moi) | F-070 (ui-ql-cb-tao-moi) | **done** |
| F-009 (ql-cb-cap-nhat) | F-071 (ui-ql-cb-cap-nhat) | **blocked** — permission wall |
| F-010 (ql-cb-xoa) | F-093 (ui-ql-cb-xoa) | **blocked** — permission wall |
| F-011 (phe-duyet-cb) | F-072 (ui-phe-duyet-cb) | **blocked** — permission wall |
| F-012 (xem-cb) | F-069 (ui-xem-cb-chi-tiet) | **blocked** — permission wall |

## Notes

- **F-068 (ui-ql-cb-danh-sach)** missing on disk — not merged into F-012 (as specified in merge mapping)
- **F-008** was successfully written because it is in the explicit permission allowlist (`*docs/modules/M-002-quan-ly-tai-san-kchtgt-cang-ben/_features/F-008-ql-cb-tao-moi/feature-brief.md`)
- **F-009, F-010, F-011, F-012** are blocked by the engineering-worker permission wall despite the glob `*docs/modules/**/feature-brief.md` appearing in the permitted patterns. The explicit allowlist for M-002 only covers F-008 and F-068. Human intervention required to write these files.
- All 5 UI source files (F-069, F-070, F-071, F-072, F-093) have their Consolidation Note from a previous merge run (2026-07-27). This merge adds a second Consolidation Note to each BE feature-brief.
- F-011 (phe-duyet-cb) BE feature-brief has an older `last-updated` date (2026-06-29) compared to the other BE files (2026-07-27), suggesting it was not touched in the previous merge wave.

## What was merged into F-008 (done)

F-008 feature-brief.md received the following from F-070 (ui-ql-cb-tao-moi):
- **UI Flow subsection** under Flow Summary with component names (`CangBienCreatePage`), API endpoints (`POST /api/v1/cang-bien`), React Hook Form + Zod details, and toast/navigation flow
- **Acceptance Criteria** AC7-AC12 (UI-specific, prefixed `[UI]`): form fields, VN-36 regex, GPS range validation, submit flow, 409 duplicate handling, RBAC gating
- **Roles + Permissions** replaced with F-070's richer 6-role table (Admin, Lãnh đạo, Chuyên viên Cục, Chuyên viên Cảng vụ, Doanh nghiệp cảng, Nhân viên vận hành)
- **Business Rules** table with BR-001 through BR-005 (merged from F-070's IDs)
- **UI Scope** section enhanced with component name, API endpoints, field-level details, validation rules, toast messages, navigation, and RBAC
- **Consolidation Note** appended

---

## Blocked merges — full merged content follows for human application

Below are the complete merged feature-brief.md files for F-009, F-010, F-011, and F-012.
Copy each block into its corresponding file:

- `docs/modules/M-002-quan-ly-tai-san-kchtgt-cang-ben/_features/F-009-ql-cb-cap-nhat/feature-brief.md`
- `docs/modules/M-002-quan-ly-tai-san-kchtgt-cang-ben/_features/F-010-ql-cb-xoa/feature-brief.md`
- `docs/modules/M-002-quan-ly-tai-san-kchtgt-cang-ben/_features/F-011-phe-duyet-cb/feature-brief.md`
- `docs/modules/M-002-quan-ly-tai-san-kchtgt-cang-ben/_features/F-012-xem-cb/feature-brief.md`

---

### F-009 ← F-071: Quản lý Cảng biển - Cập nhật

```markdown
---
id: F-009
name: Quản lý Cảng biển - Cập nhật
slug: ql-cb-cap-nhat
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:19Z
last-updated: 2026-07-28
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Cảng biển - Cập nhật

## Description

Tính năng cho phép người dùng có thẩm quyền cập nhật thông tin của một Cảng biển đã tồn tại trong hệ thống, bao gồm thay đổi tên cảng, vị trí địa lý, diện tích, khả năng tiếp nhận tàu và các thuộc tính kỹ thuật khác, với cơ chế kiểm tra trùng lặp và ghi nhật ký thay đổi đầy đủ.

## Business Intent

Thông tin Cảng biển thay đổi theo thời gian do quá trình mở rộng, cải tạo hoặc tái cấu trúc hạ tầng; việc cho phép cập nhật thông tin chính xác giúp đảm bảo cơ sở dữ liệu cảng luôn phản ánh đúng tình trạng thực tế, hỗ trợ hiệu quả cho công tác quy hoạch, điều phối hoạt động cảng và báo cáo theo yêu cầu của cơ quan quản lý nhà nước.

## Flow Summary

### BE Flow

Người dùng đăng nhập vào hệ thống, tìm kiếm và chọn Cảng biển cần cập nhật từ danh sách. Hệ thống hiển thị biểu mẫu với tất cả thông tin hiện tại được điền sẵn. Người dùng chỉnh sửa các trường cần thay đổi, bao gồm tên cảng, tọa độ GPS, diện tích, hoặc khả năng tiếp nhận tàu. Hệ thống tự động kiểm tra tính hợp lệ của các trường đã thay đổi và phát hiện xung đột nếu mã cảng (không thể thay đổi) bị trùng với Cảng biển khác. Sau khi lưu, hệ thống ghi nhận nhật ký thay đổi, cập nhật trường updatedAt và gửi thông báo cập nhật thành công cho người dùng.

### UI Flow

Người dùng điều hướng đến trang chi tiết (F-069) hoặc danh sách (F-068), click "Chỉnh sửa" trên một Cảng biển. Hệ thống gọi `GET /api/v1/cang-bien/:id` để tải dữ liệu hiện tại, sau đó pre-fill form CangBienEditPage. Form gồm 7 trường: maCang (readonly, disabled), tenCang, tinhThanhPho, viDo, kinhDo, dienTich, khaNangTiepNhan. Validation inline qua React Hook Form + Zod: maCang readonly (không thể sửa), GPS range [-90, 90] / [-180, 180], dienTich [0, 5000]. Người dùng chỉnh sửa các trường được phép → click "Cập nhật" → gọi `PUT /api/v1/cang-bien/:id`. Sau khi cập nhật thành công, `trangThaiPheDuyet` tự động reset về `CHỜ_PHÊ_DUYỆT` (cần phê duyệt lại), bản ghi LichSuThayDoi được tạo tự động ghi nhận mọi field thay đổi. Toast "Cập nhật thành công — chờ phê duyệt lại" hiển thị, điều hướng về danh sách.

## Acceptance Criteria

1. Người dùng có vai trò "Admin" hoặc "Quản lý cảng" có thể truy cập chức năng cập nhật Cảng biển từ danh sách hoặc từ trang chi tiết Cảng biển.
2. Các trường không thể thay đổi: mã cảng; tất cả các trường khác đều có thể chỉnh sửa với điều kiện tuân thủ validation rules.
3. Hệ thống hiển thị cảnh báo khi người dùng cố gắng cập nhật Cảng biển đang trong quá trình phê duyệt hoặc đã bị xóa mềm.
4. Mỗi lần cập nhật thành công, hệ thống tự động ghi nhận nhật ký thay đổi với thông tin: trường nào thay đổi, giá trị cũ, giá trị mới, người cập nhật và thời gian cập nhật.
5. [UI] Form pre-fill đúng dữ liệu hiện tại từ `GET /api/v1/cang-bien/:id` — maCang hiển thị disabled/readonly, tất cả field khác hiển thị giá trị hiện tại và có thể chỉnh sửa.
6. [UI] Validation inline: maCang readonly (disabled field), viDo [-90, 90], kinhDo [-180, 180], dienTich [0, 5000] — lỗi hiển thị inline ngay khi blur.
7. [UI] Submit thành công gọi `PUT /api/v1/cang-bien/:id`, `trangThaiPheDuyet` tự động reset về `CHỜ_PHÊ_DUYỆT`, toast "Cập nhật thành công — chờ phê duyệt lại", điều hướng về danh sách.
8. [UI] Sau cập nhật, `LichSuThayDoi` record được tạo tự động ghi nhận tất cả field thay đổi (có thể xem qua F-094).
9. [UI] Chỉ người dùng có quyền 'cangbien:update' mới thấy nút "Chỉnh sửa" trên danh sách và trang chi tiết.

## In Scope

- Giao diện tra cứu và chọn Cảng biển cần cập nhật
- Biểu mẫu cập nhật với dữ liệu hiện tại được điền sẵn
- Validation cho các trường có thể thay đổi
- Kiểm tra xung đột dữ liệu trước khi lưu
- Ghi nhật ký thay đổi vào bảng lịch sử
- Thông báo kết quả cập nhật cho người dùng
- Form pre-fill từ API response (React Hook Form + Zod)
- Inline validation (readonly maCang, range GPS, max dienTich)
- Auto-reset `trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT` sau cập nhật
- Tự động tạo `LichSuThayDoi` record
- Toast thông báo thành công/lỗi

## Out of Scope

- Thay đổi mã Cảng biển sau khi đã tạo (không cho phép)
- Quy trình phê duyệt thay đổi lớn (thuộc F-011)
- Xóa Cảng biển (thuộc F-010)
- Lịch sử xem lại tất cả phiên bản cập nhật (thuộc F-013)
- Xuất báo cáo lịch sử cập nhật
- Import hàng loạt cập nhật từ file

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Admin | Full | Cập nhật, chỉnh sửa, xóa tất cả Cảng biển |
| Lãnh đạo | Full + Phê duyệt | Cập nhật, chỉnh sửa, xóa, phê duyệt/từ chối tất cả Cảng biển |
| Chuyên viên Cục | CRUD | Cập nhật Cảng biển của Cục mình |
| Chuyên viên Cảng vụ | CRUD | Cập nhật Cảng biển của Cảng vụ mình |
| Doanh nghiệp cảng | CRUD | Cập nhật Cảng biển của đơn vị mình |

## Entities

- **CangBien**: id (UUID), maCang (string, unique, read-only), tenCang (string), tinhThanh (string), toDo (JSON: {lat, lng}), dienTich (decimal), khaNangTiepNhanTau (string), trangThai (enum: cho_phe_duyet, hien_hanh, tam_ngung, da_xoa), ghiChu (text), createdAt (timestamp), updatedAt (timestamp)
- **LichSuThayDoi**: id (UUID), cangBienId (UUID), truongDuocCapNhat (string), giaTriCu (text), giaTriMoi (text), nguoiCapNhat (UUID), thoiGianCapNhat (timestamp)

## Business Rules

1. Mã cảng không được phép cập nhật sau khi Cảng biển đã được tạo; mọi yêu cầu thay đổi mã cảng phải thông qua quy trình hủy bỏ và tạo lại.
2. Tọa độ GPS phải nằm trong khoảng chấp nhận được: vĩ độ -90 đến 90, kinh độ -180 đến 180.
3. Diện tích cảng phải là giá trị dương, đơn vị km², không vượt quá 5000 km².
4. Nhật ký thay đổi phải được ghi nhận tự động cho mọi lần cập nhật, không cho phép xóa hoặc sửa nhật ký.

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | maCang không thể thay đổi sau khi tạo (readonly) | maCang | Entity spec, F-071 |
| BR-002 | viDo [-90, 90], kinhDo [-180, 180], dienTich [0, 5000] | GPS + Diện tích | Entity spec |
| BR-003 | `trangThaiPheDuyet` tự động reset về `CHỜ_PHÊ_DUYỆT` sau khi cập nhật | Cập nhật | F-071, F-009 |
| BR-004 | `LichSuThayDoi` được tạo tự động khi cập nhật, ghi nhận tất cả field thay đổi | Lịch sử | F-071, INT-003 |

## UI Scope

- **Component:** `CangBienEditPage` — React Hook Form + Zod schema, pre-fill từ `GET /api/v1/cang-bien/:id`
- **API endpoints:** `GET /api/v1/cang-bien/:id` (load data), `PUT /api/v1/cang-bien/:id` (update)
- **Fields:** maCang (readonly/disabled), tenCang (string), tinhThanhPho (string), viDo (BigDecimal, [-90, 90]), kinhDo (BigDecimal, [-180, 180]), dienTich (BigDecimal, [0, 5000]), khaNangTiepNhan (BigDecimal)
- **Validation inline:** maCang readonly (disabled field), GPS range, dienTich max — lỗi hiển thị inline onBlur
- **State reset:** Sau `PUT /api/v1/cang-bien/:id` → `trangThaiPheDuyet` tự động reset về `CHỜ_PHÊ_DUYỆT`
- **Audit log:** `LichSuThayDoi` record tự động tạo, ghi nhận tất cả field thay đổi (oldValue → newValue)
- **Toast:** "Cập nhật thành công — chờ phê duyệt lại" (thành công); lỗi validation/409 hiển thị tương ứng
- **Navigation:** Từ danh sách (F-068) hoặc trang chi tiết (F-069) → nút "Chỉnh sửa" → `CangBienEditPage` → sau submit → về danh sách
- **RBAC:** Chỉ role có `cangbien:update` mới thấy nút "Chỉnh sửa"

## Testing Strategy

Kiểm thử đơn vị cho các quy tắc validation của từng trường có thể cập nhật; kiểm thử tích hợp cho luồng cập nhật Cảng biển qua API với các trường hợp cập nhật hợp lệ, không hợp lệ, và xung đột; kiểm thử giao diện cho biểu mẫu cập nhật bao gồm validation thời gian thực; kiểm thử nhật ký thay đổi bằng cách xác nhận dữ liệu được ghi đầy đủ sau mỗi lần cập nhật.

Cypress E2E: điều hướng đến trang chi tiết → click "Chỉnh sửa" → pre-fill xác minh dữ liệu hiện tại → thay đổi các trường (tenCang, tinhThanhPho, dienTich) → submit → xác nhận toast "Cập nhật thành công — chờ phê duyệt lại" → xác nhận điều hướng về danh sách → click "Lịch sử" → xác nhận LichSuThayDoi record được tạo. Negative test: maCang không thể sửa (readonly field disabled); điền viDo = -100 → lỗi range; điền dienTich = 6000 → lỗi max.

## Consolidation Note

Merged with UI feature F-071 (ui-ql-cb-cap-nhat) — TRI-1785205768654-0f93, 2026-07-28
```

---

### F-010 ← F-093: Quản lý Cảng biển - Xóa

```markdown
---
id: F-010
name: Quản lý Cảng biển - Xóa
slug: ql-cb-xoa
module-id: M-002
status: done
classification: local
priority: high
created: 2026-06-16T04:40:19Z
last-updated: 2026-07-28
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý Cảng biển - Xóa

## Description

Tính năng cho phép người dùng có thẩm quyền xóa một Cảng biển khỏi hệ thống quản lý tài sản KCHTGT cảng-bến, áp dụng cơ chế xóa mềm (soft delete) để bảo tồn dữ liệu lịch sử và tuân thủ quy định lưu trữ hồ sơ hạ tầng giao thông, đồng thời đảm bảo các điều kiện ràng buộc liên quan được kiểm tra trước khi thực hiện xóa.

## Business Intent

Việc xóa Cảng biển khỏi hệ thống chỉ được thực hiện khi cảng chấm dứt hoạt động vĩnh viễn hoặc được tái cấu trúc thành đơn vị khác; cơ chế xóa mềm giúp duy trì tính toàn vẹn của dữ liệu lịch sử, phục vụ công tác kiểm toán và báo cáo thống kê, đồng thời cho phép khôi phục nếu có sai sót trong quá trình xóa.

## Flow Summary

### BE Flow

Người dùng đăng nhập vào hệ thống, tìm kiếm và chọn Cảng biển cần xóa từ danh sách hoặc trang chi tiết. Hệ thống hiển thị thông tin Cảng biển kèm cảnh báo về hậu quả của việc xóa. Người dùng xác nhận hành động xóa bằng cách nhập tên Cảng biển để xác nhận. Hệ thống kiểm tra điều kiện xóa: Cảng biển không được có dữ liệu liên quan chưa được xử lý (nếu có), không nằm trong quá trình phê duyệt. Nếu vượt qua kiểm tra, hệ thống đánh dấu Cảng biển là "đã xóa" (soft delete), ghi nhật ký xóa, và cập nhật trạng thái hiển thị trong danh sách.

### UI Flow

Người dùng (Leadership: Admin hoặc Lãnh đạo) điều hướng đến trang chi tiết (F-069) hoặc danh sách (F-068) và click "Xóa". Hệ thống gọi kiểm tra child count: `GET /api/v1/cang-bien/:id/children` — nếu `BenCang > 0` hoặc `VungNuoc > 0`, trả về HTTP 409 với thông báo "Cảng này có X BenCang và Y VungNuoc liên kết, không thể xóa", không cho phép xóa. Nếu không có bản ghi con, hiển thị confirmation dialog (CangBienDeletePage) với thông tin: mã cảng, tên cảng, ngày tạo, yêu cầu xác nhận (nhập "XÓA" hoặc tên cảng). Xác nhận đúng → gọi `DELETE /api/v1/cang-bien/:id` → server set `deletedAt = now()` (soft delete) → toast "Đã xóa thành công" → điều hướng về danh sách. Xác nhận sai hoặc đóng dialog → không xóa, không thay đổi gì.

## Acceptance Criteria

1. Chỉ người dùng có vai trò "Admin" hoặc "Quản lý cảng" mới có thể thực hiện thao tác xóa Cảng biển.
2. Hệ thống yêu cầu xác nhận xóa bằng cách nhập tên Cảng biển vào hộp thoại xác nhận trước khi thực hiện xóa.
3. Hệ thống kiểm tra điều kiện ràng buộc trước khi xóa: nếu Cảng biển đang có dữ liệu liên quan (tàu, lịch sử vận hành) chưa được xử lý, hệ thống hiển thị cảnh báo và ngăn xóa.
4. Sau khi xóa thành công, Cảng biển không còn hiển thị trong danh sách mặc định nhưng vẫn được lưu trữ với trạng thái "đã xóa" và có thể khôi phục trong thời hạn quy định.
5. [UI] Chỉ Admin và Lãnh đạo mới thấy và thực hiện được hành động "Xóa" — các role khác không thấy nút xóa.
6. [UI] Trước khi xóa, hệ thống gọi `GET /api/v1/cang-bien/:id/children` kiểm tra số lượng bản ghi con (BenCang/VungNuoc) — nếu > 0, hiển thị toast lỗi 409 "Cảng này có X BenCang và Y VungNuoc liên kết, không thể xóa".
7. [UI] Nếu không có bản ghi con, hiển thị confirmation dialog yêu cầu xác nhận (nhập "XÓA" hoặc tên cảng).
8. [UI] Xác nhận đúng → gọi `DELETE /api/v1/cang-bien/:id` → server set `deletedAt = now()` (soft delete) → toast "Đã xóa thành công" → điều hướng về danh sách (F-068).
9. [UI] Xác nhận sai hoặc đóng dialog → không thực hiện xóa, không có thay đổi nào.
10. [UI] Soft delete pattern: bản ghi vẫn tồn tại trong DB với `deletedAt != null`, không xuất hiện trong danh sách mặc định.

## In Scope

- Giao diện chọn và xác nhận xóa Cảng biển
- Kiểm tra điều kiện ràng buộc (dữ liệu liên quan, trạng thái)
- Xác nhận xóa bằng cách nhập tên Cảng biển
- Xóa mềm (soft delete) với ghi nhật ký
- Khôi phục Cảng biển đã xóa trong thời hạn cho phép
- Cập nhật trạng thái hiển thị trong danh sách
- Kiểm tra child count (BenCang/VungNuoc) trước xóa (`GET /api/v1/cang-bien/:id/children`)
- Confirmation dialog với xác nhận có chủ đích
- HTTP 409 nếu tồn tại bản ghi con
- Toast thông báo thành công/lỗi
- Điều hướng về danh sách sau xóa

## Out of Scope

- Xóa cứng Cảng biển khỏi cơ sở dữ liệu
- Xóa hàng loạt nhiều Cảng biển cùng lúc
- Xóa Cảng biển kèm dữ liệu liên quan (cascade delete)
- Phê duyệt xóa bởi cấp quản lý cao hơn (thuộc F-011)
- Xuất báo cáo lịch sử xóa
- Khôi phục bản ghi đã xóa (restore)
- Thông báo email khi xóa

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Admin | Full + Xóa | Xóa mềm tất cả Cảng biển |
| Lãnh đạo | Full + Xóa | Xóa mềm tất cả Cảng biển |
| Chuyên viên Cục | CRUD | Không có quyền xóa |
| Chuyên viên Cảng vụ | CRUD | Không có quyền xóa |
| Doanh nghiệp cảng | CRUD | Không có quyền xóa |
| Nhân viên vận hành | Read-only | Không có quyền xóa |

## Entities

- **CangBien**: id (UUID), maCang (string, unique), tenCang (string), tinhThanh (string), toDo (JSON: {lat, lng}), dienTich (decimal), khaNangTiepNhanTau (string), trangThai (enum: cho_phe_duyet, hien_hanh, tam_ngung, da_xoa), ghiChu (text), createdAt (timestamp), updatedAt (timestamp), deletedAt (timestamp, nullable), deletedBy (UUID, nullable)
- **BenCang**: id (UUID), cangBienId (UUID) — foreign key (child guard check)
- **VungNuoc**: id (UUID), cangBienId (UUID) — foreign key (child guard check)

## Business Rules

1. Xóa Cảng biển áp dụng cơ chế xóa mềm (soft delete) — trạng thái chuyển thành "da_xoa", trường deletedAt và deletedBy được tự động điền.
2. Không cho phép xóa Cảng biển đang có dữ liệu liên quan chưa được xử lý hoặc đang trong quá trình phê duyệt thay đổi.
3. Cảng biển bị xóa có thể được khôi phục trong vòng 90 ngày kể từ ngày xóa; sau thời hạn này dữ liệu chỉ được xử lý theo quy định lưu trữ.
4. Nhật ký xóa phải ghi nhận đầy đủ: ai xóa, khi nào xóa, lý do xóa (nếu có).

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | Chỉ Admin và Lãnh đạo mới có quyền xóa mềm Cảng biển | Xóa | F-093, RBAC |
| BR-002 | Nếu tồn tại BenCang hoặc VungNuoc liên kết, xóa mềm bị chặn (HTTP 409) | Child guard | F-093, F-010 |
| BR-003 | Soft delete: set `deletedAt = now()` thay vì xóa bản ghi khỏi DB | Xóa mềm | F-093 |
| BR-004 | Cần xác nhận có chủ đích (nhập "XÓA" hoặc tên cảng) trước khi xóa | Xác nhận | F-093 |

## UI Scope

- **Component:** `CangBienDeletePage` — confirmation dialog yêu cầu nhập "XÓA" hoặc tên cảng
- **API endpoints:** `GET /api/v1/cang-bien/:id/children` (child count check), `DELETE /api/v1/cang-bien/:id` (soft delete)
- **Child guard:** Trước xóa, gọi `GET /api/v1/cang-bien/:id/children` — nếu BenCang > 0 hoặc VungNuoc > 0 → HTTP 409, toast "Cảng này có X BenCang và Y VungNuoc liên kết, không thể xóa"
- **Confirmation dialog:** Hiển thị mã cảng, tên cảng, ngày tạo; yêu cầu nhập chính xác tên cảng hoặc "XÓA" để xác nhận
- **Soft delete:** `DELETE /api/v1/cang-bien/:id` → server set `deletedAt = now()` — bản ghi vẫn tồn tại trong DB, không hiển thị trong danh sách mặc định
- **Toast:** "Đã xóa thành công" (thành công); "Cảng này có X BenCang và Y VungNuoc liên kết, không thể xóa" (409)
- **Navigation:** Sau xóa → điều hướng về danh sách (F-068). Xác nhận sai hoặc đóng dialog → không thay đổi
- **RBAC:** Chỉ Admin và Lãnh đạo thấy nút "Xóa"; các role khác không thấy

## Testing Strategy

Kiểm thử đơn vị cho quy tắc xóa mềm và kiểm tra điều kiện ràng buộc; kiểm thử tích hợp cho luồng xóa Cảng biển với các trường hợp: xóa thành công, xóa bị chặn do dữ liệu liên quan, và xóa khi không có quyền; kiểm thử giao diện cho hộp thoại xác nhận xóa; kiểm thử khôi phục Cảng biển đã xóa trong thời hạn cho phép.

Cypress E2E: đăng nhập Leadership → điều hướng đến chi tiết một cảng → click "Xóa" → xác minh confirmation dialog hiển thị → nhập tên chính xác → xác nhận → toast "Đã xóa thành công" → xác nhận điều hướng về danh sách với cảng không còn trong danh sách. Negative test: click "Xóa" trên cảng có BenCang/VungNuoc con → 409 → toast lỗi "Cảng này có X BenCang và Y VungNuoc liên kết, không thể xóa"; nhập sai tên trong dialog → không xóa. Test nhân viên vận hành: xác minh không thấy nút xóa.

## Consolidation Note

Merged with UI feature F-093 (ui-ql-cb-xoa) — TRI-1785205768654-0f93, 2026-07-28
```

---

### F-011 ← F-072: Phê duyệt Cảng biển

```markdown
---
id: F-011
name: Phê duyệt Cảng biển
slug: phe-duyet-cb
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:19Z
last-updated: 2026-07-28
locked-fields: []
consumed_by_modules: []
---
# Feature: Phê duyệt Cảng biển

## Description

Tính năng cho phép người dùng có vai trò Quản trị viên hoặc người được ủy quyền phê duyệt thông tin Cảng biển mới được tạo hoặc cập nhật, bao gồm xem chi tiết, đánh giá tính hợp lệ, chấp thuận hoặc từ chối yêu cầu cùng lý do cụ thể, nhằm đảm bảo chất lượng dữ liệu cảng biển trong hệ thống quản lý tài sản KCHTGT.

## Business Intent

Việc phê duyệt Cảng biển là bước kiểm soát chất lượng bắt buộc trước khi thông tin cảng được kích hoạt hoạt động trong hệ thống; quy trình này đảm bảo mọi Cảng biển đăng ký đều tuân thủ quy chuẩn kỹ thuật, có đủ thông tin pháp lý và kỹ thuật, đồng thời tạo cơ sở minh bạch cho công tác quản lý nhà nước về hạ tầng giao thông đường thủy.

## Flow Summary

### BE Flow

Sau khi Cảng biển được tạo mới hoặc cập nhật, hệ thống tự động chuyển trạng thái sang "Chờ phê duyệt" và thông báo đến người dùng có vai trò phê duyệt. Người dùng đăng nhập, truy cập vào danh sách Cảng biển chờ phê duyệt, chọn một Cảng cần xem xét. Hệ thống hiển thị đầy đủ thông tin Cảng biển kèm lịch sử thay đổi nếu là cập nhật. Người dùng đánh giá tính hợp lệ, chọn "Chấp thuận" hoặc "Từ chối" cùng lý do (bắt buộc khi từ chối). Hệ thống cập nhật trạng thái Cảng biển thành "Hiện hành" (nếu chấp thuận) hoặc quay lại "Chỉnh sửa" (nếu từ chối), ghi nhật ký phê duyệt và thông báo cho người tạo.

### UI Flow

Người dùng (Lãnh đạo) điều hướng đến trang "Phê duyệt" (CangBienApprovalPage) từ menu hoặc danh sách. Trang tải danh sách các cảng biển có `trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT` qua API `GET /api/v1/cang-bien?status=CHO_PHE_DUYET`. Mỗi bản ghi hiển thị thông tin tóm tắt (maCang, tenCang, tinhThanhPho, ngày tạo, ngày cập nhật). Người dùng chọn một bản ghi và click "Phê duyệt" hoặc "Từ chối". Nhấp "Phê duyệt" → confirmation dialog → xác nhận → gọi `POST /:id/approve` → `trangThaiPheDuyet = ĐƯỢC_PHÊ_DUYỆT` + PheDuyetLog được tạo (trạng thái = DUOC_PHE_DUYỆT) + toast "Đã phê duyệt thành công". Nhấp "Từ chối" → form nhập lý do (required ≥10 ký tự) → confirmation dialog → xác nhận → gọi `POST /:id/reject?reason=...` → `trangThaiPheDuyet = TỪ_CHỐI` + PheDuyetLog được tạo (trạng thái = TỪ_CHỐI + lý do) + toast "Đã từ chối". Sau mỗi hành động, danh sách được làm mới.

## Acceptance Criteria

1. Chỉ người dùng có vai trò "Quản trị viên" hoặc "Người phê duyệt" mới thấy và thực hiện được danh sách Cảng biển chờ phê duyệt.
2. Hệ thống hiển thị đầy đủ thông tin Cảng biển chờ phê duyệt kèm lịch sử thay đổi (nếu là cập nhật) cho người phê duyệt xem xét.
3. Người phê duyệt phải cung cấp lý do khi chọn "Từ chối"; lý do chấp thuận là tùy chọn nhưng khuyến khích nhập.
4. Sau khi phê duyệt, trạng thái Cảng biển được cập nhật tương ứng ("Hiện hành" hoặc "Chỉnh sửa") và người tạo nhận được thông báo kết quả.
5. [UI] Trang chỉ hiển thị các bản ghi có `trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT` (pending list filter) — gọi `GET /api/v1/cang-bien?status=CHO_PHE_DUYET`.
6. [UI] Nhấp "Phê duyệt" → confirmation dialog → gọi `POST /:id/approve` → trạng thái chuyển `ĐƯỢC_PHÊ_DUYỆT`, PheDuyetLog được tạo (trạng thái = DUOC_PHE_DUYỆT), toast "Đã phê duyệt thành công".
7. [UI] Nhấp "Từ chối" → form nhập lý do (required, tối thiểu 10 ký tự) → confirmation dialog → gọi `POST /:id/reject?reason=...` → trạng thái chuyển `TỪ_CHỐI`, PheDuyetLog được tạo (trạng thái = TỪ_CHỐI + lý do), toast "Đã từ chối".
8. [UI] Lý do từ chối tối thiểu 10 ký tự — nếu ít hơn, hệ thống hiển thị lỗi "Lý do từ chối phải có ít nhất 10 ký tự".
9. [UI] Chỉ người dùng có vai trò Lãnh đạo/Admin mới thấy và thực hiện được các hành động Phê duyệt/Từ chối (RBAC `@auth.check('cangbien:approve')`).
10. [UI] PheDuyetLog được lưu trữ bền vững với thông tin: cangBienId, nguoiPheDuyet, trangThai, lyDo (nếu từ chối), createdAt.

## In Scope

- Danh sách Cảng biển chờ phê duyệt (tạo mới và cập nhật)
- Trang chi tiết Cảng biển chờ phê duyệt với đầy đủ thông tin
- Giao diện phê duyệt: chấp thuận hoặc từ chối
- Trường nhập lý do từ chối (bắt buộc)
- Cập nhật trạng thái Cảng biển sau phê duyệt
- Ghi nhật ký phê duyệt với thông tin người phê duyệt và thời gian
- Thông báo kết quả phê duyệt đến người tạo
- Danh sách cảng biển chờ phê duyệt (filter status = CHỜ_PHÊ_DUYỆT)
- Hành động Phê duyệt (`POST /:id/approve`)
- Hành động Từ chối (`POST /:id/reject`, reason ≥ 10 ký tự)
- Confirmation dialog trước mỗi hành động
- PheDuyetLog tự động tạo khi phê duyệt hoặc từ chối
- Toast thông báo thành công/lỗi
- Làm mới danh sách sau mỗi hành động

## Out of Scope

- Phê duyệt xóa Cảng biển
- Phê duyệt hàng loạt nhiều Cảng biển cùng lúc
- Tự động phê duyệt dựa trên quy tắc (không cần con người)
- Phê duyệt bởi nhiều cấp (multi-level approval)
- Xuất báo cáo phê duyệt ra file Excel/PDF
- Chỉnh sửa thông tin cảng (thuộc F-071)
- Xóa mềm cảng (thuộc F-093)
- Thông báo email khi phê duyệt/từ chối

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Admin | Full + Phê duyệt | Xem danh sách chờ, Phê duyệt, Từ chối tất cả Cảng biển |
| Lãnh đạo | Full + Phê duyệt | Xem danh sách chờ, Phê duyệt, Từ chối tất cả Cảng biển |
| Chuyên viên Cục | CRUD | Không thấy hành động Phê duyệt/Từ chối, chỉ xem danh sách |
| Chuyên viên Cảng vụ | CRUD | Không thấy hành động Phê duyệt/Từ chối, chỉ xem danh sách |
| Nhân viên vận hành | Read-only | Không thấy danh sách chờ, không có quyền phê duyệt |

## Entities

- **CangBien**: id (UUID), maCang (string, unique), tenCang (string), tinhThanh (string), toDo (JSON: {lat, lng}), dienTich (decimal), khaNangTiepNhanTau (string), trangThai (enum: cho_phe_duyet, hien_hanh, tam_ngung, da_xoa), ghiChu (text), createdAt (timestamp), updatedAt (timestamp), pendingApproval (boolean), rejectedReason (text, nullable)
- **PheDuyetLog**: id (UUID), cangBienId (UUID), nguoiPheDuyet (UUID), quyetDinh (enum: chap_thuan, tu_choi), lyDo (text), thoiGianPheDuyet (timestamp)

## Business Rules

1. Cảng biển mới tạo có trạng thái mặc định "Chờ phê duyệt" và chỉ được chuyển thành "Hiện hành" sau khi được phê duyệt bởi người có thẩm quyền.
2. Lý do từ chối là trường bắt buộc; nếu không nhập lý do từ chối, hệ thống không cho phép hoàn tất thao tác từ chối.
3. Mỗi Cảng biển chỉ cần một lần phê duyệt duy nhất để chuyển sang trạng thái "Hiện hành"; không áp dụng phê duyệt đa cấp.
4. Nhật ký phê duyệt phải được lưu trữ vĩnh viễn, không cho phép xóa hoặc sửa sau khi đã ghi nhận.

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | Chỉ Lãnh đạo/Admin mới thực hiện được hành động Phê duyệt/Từ chối | Phê duyệt | F-072, RBAC |
| BR-002 | Phê duyệt → `trangThaiPheDuyet = ĐƯỢC_PHÊ_DUYỆT`, tạo PheDuyetLog (DUOC_PHE_DUYỆT) | Phê duyệt | F-072, F-011 |
| BR-003 | Từ chối → `trangThaiPheDuyet = TỪ_CHỐI`, tạo PheDuyetLog (TU_CHOI + lý do ≥ 10 ký tự) | Từ chối | F-072, F-011 |
| BR-004 | PheDuyetLog được lưu trữ bền vững, truy vấn được qua `GET /:id/history` | Lịch sử phê duyệt | F-072, F-013 |

## UI Scope

- **Component:** `CangBienApprovalPage` — danh sách pending + hành động Phê duyệt/Từ chối
- **API endpoints:** `GET /api/v1/cang-bien?status=CHO_PHE_DUYET` (list), `POST /api/v1/cang-bien/:id/approve` (phê duyệt), `POST /api/v1/cang-bien/:id/reject?reason=...` (từ chối)
- **Pending list filter:** Chỉ hiển thị bản ghi có `trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT`
- **Phê duyệt flow:** Click "Phê duyệt" → confirmation dialog → `POST /:id/approve` → `trangThaiPheDuyet = ĐƯỢC_PHÊ_DUYỆT` → PheDuyetLog (DUOC_PHE_DUYỆT) → toast "Đã phê duyệt thành công" → refresh list
- **Từ chối flow:** Click "Từ chối" → form nhập lý do ≥10 ký tự → confirmation dialog → `POST /:id/reject?reason=...` → `trangThaiPheDuyet = TỪ_CHỐI` → PheDuyetLog (TU_CHOI) → toast "Đã từ chối" → refresh list
- **Validation:** Lý do từ chối tối thiểu 10 ký tự — nếu ít hơn, lỗi "Lý do từ chối phải có ít nhất 10 ký tự"
- **RBAC:** Chỉ Lãnh đạo/Admin mới thấy và thực hiện hành động `cangbien:approve`; Chuyên viên Cục/Cảng vụ chỉ xem danh sách, không thấy nút hành động; Nhân viên vận hành không thấy danh sách này

## Testing Strategy

Kiểm thử đơn vị cho quy tắc kiểm tra quyền phê duyệt và validation lý do từ chối; kiểm thử tích hợp cho luồng phê duyệt Cảng biển với các trường hợp: chấp thuận thành công, từ chối với lý do, từ chối không lý do (bị chặn); kiểm thử giao diện cho trang danh sách chờ phê duyệt và trang phê duyệt chi tiết; kiểm thử thông báo đến người tạo sau khi phê duyệt.

Cypress E2E: đăng nhập với tài khoản Leadership → điều hướng đến trang "Phê duyệt" → xác minh danh sách chỉ hiển thị bản ghi pending → click "Phê duyệt" trên một bản ghi → xác nhận confirmation dialog → toast "Đã phê duyệt thành công" → xác nhận bản ghi chuyển sang ĐƯỢC_PHÊ_DUYỆT. Negative test: click "Từ chối" → nhập lý do < 10 ký tự → lỗi validation → toast lỗi "Lý do từ chối phải có ít nhất 10 ký tự". Test PheDuyetLog: click "Lịch sử" → xác nhận log phê duyệt được tạo và hiển thị đúng thông tin người phê duyệt và thời gian.

## Consolidation Note

Merged with UI feature F-072 (ui-phe-duyet-cb) — TRI-1785205768654-0f93, 2026-07-28
```

---

### F-012 ← F-069: Xem chi tiết Cảng biển

```markdown
---
id: F-012
name: Xem chi tiết Cảng biển
slug: xem-cb
module-id: M-002
status: done
classification: local
priority: critical
created: 2026-06-16T04:40:19Z
last-updated: 2026-07-28
locked-fields: []
consumed_by_modules: []
---
# Feature: Xem chi tiết Cảng biển

## Description

Tính năng cho phép người dùng xem thông tin chi tiết của một Cảng biển bao gồm các trường dữ liệu cơ bản, vị trí trên bản đồ, trạng thái hiện tại, thông tin người tạo và người cập nhật cuối, hỗ trợ tìm kiếm và lọc theo mã cảng, tên cảng, tỉnh/thành phố, và trạng thái hoạt động.

## Business Intent

Việc cung cấp thông tin chi tiết về Cảng biển giúp các bên liên quan — từ cán bộ quản lý đến đối tác logistics — có thể tra cứu nhanh chóng, chính xác và đầy đủ các thông tin kỹ thuật, pháp lý về cảng, phục vụ cho công tác điều phối vận tải biển, lập kế hoạch logistics và báo cáo quản lý nhà nước.

## Flow Summary

### BE Flow

Người dùng đăng nhập vào hệ thống, truy cập vào mục quản lý Cảng biển và sử dụng thanh tìm kiếm để tra cứu theo mã cảng, tên cảng, hoặc tỉnh/thành phố. Hệ thống hiển thị danh sách kết quả tra cứu kèm thông tin tóm tắt (mã cảng, tên cảng, tỉnh, trạng thái). Người dùng click vào một Cảng biển trong danh sách để xem trang chi tiết. Trang chi tiết hiển thị đầy đủ các trường thông tin: mã cảng, tên, vị trí địa lý với bản đồ, diện tích, khả năng tiếp nhận tàu, trạng thái, người tạo, người cập nhật cuối cùng. Người dùng có thể quay lại danh sách hoặc chuyển sang các chức năng khác (cập nhật, xóa) nếu có quyền.

### UI Flow

Người dùng nhấp vào "Xem chi tiết" trên hàng tương ứng trong danh sách (F-068), hệ thống gọi `GET /api/v1/cang-bien/:id` để tải dữ liệu. Trang CangBienDetailPage hiển thị breadcrumb "Quản lý cảng biển > Chi tiết cảng [maCang]". Các trường được hiển thị trong các nhóm: thông tin cơ bản (maCang, tenCang, tinhThanhPho), địa lý (viDo, kinhDo dưới dạng ±XX.XXXXXX, dienTich), khả năng (khaNangTiepNhan), trạng thái (badge màu: CHỜ_PHÊ_DUYỆT = vàng, ĐƯỢC_PHÊ_DUYỆT = xanh lá, TỪ_CHỐI = đỏ). Nếu có đính kèm, danh sách file hiển thị với tên, định dạng, dung lượng và nút Download/Print (PDF/DOCX/JPEG, max 10MB/file). Hành động Phê duyệt/Từ chối chỉ hiện cho Lãnh đạo. Nhấp "Chỉnh sửa" chuyển đến F-071, "Xóa" mở hộp thoại xác nhận F-093, "Lịch sử" mở F-094. Breadcrumb cho phép quay lại danh sách. Responsive: desktop ≥1024px, tablet ≥768px, mobile cột đơn.

## Acceptance Criteria

1. Người dùng có quyền "Xem" có thể tra cứu Cảng biển theo mã cảng, tên cảng, hoặc tỉnh/thành phố với kết quả trả về trong vòng 3 giây.
2. Trang chi tiết hiển thị đầy đủ tất cả các trường thông tin của Cảng biển, bao gồm tọa độ GPS được hiển thị trên bản đồ tích hợp.
3. Các trường thông tin nhạy cảm hoặc không liên quan đến vai trò người dùng được ẩn hoặc không hiển thị theo cơ chế phân quyền.
4. Danh sách tra cứu hiển thị tối đa 50 kết quả mỗi trang, có phân trang và sắp xếp theo tên hoặc thời gian tạo.
5. [UI] Trang hiển thị đầy đủ các trường của entity CangBien với định dạng: GPS là ±XX.XXXXXX (5 chữ số thập phân), `trangThaiPheDuyet` là badge (vàng=CHO, xanh=DUOC, đỏ=TU_CHOI), `trangThaiHoatDong` hiển thị rõ ràng.
6. [UI] Phần đính kèm hiển thị danh sách các file (PDF/DOCX/JPEG, tối đa 10MB/file) với nút Download và Print cho từng file.
7. [UI] Các hành động Phê duyệt và Từ chối chỉ hiển thị cho người dùng có vai trò Lãnh đạo; các hành động khác hiển thị đúng theo phân quyền CRUD.
8. [UI] Breadcrumb điều hướng hiển thị "Quản lý cảng biển > Chi tiết cảng [maCang]", cho phép quay lại danh sách hoặc trang trước.
9. [UI] Nút "Chỉnh sửa" mở trang F-071 với form được pre-fill từ dữ liệu hiện tại; "Lịch sử" mở F-094; "Xóa" mở hộp thoại xác nhận F-093.
10. [UI] Responsive trên desktop (≥ 1024px) và tablet (≥ 768px); layout chuyển thành cột đơn trên mobile.

## In Scope

- Thanh tìm kiếm với bộ lọc theo mã cảng, tên cảng, tỉnh/thành, trạng thái
- Bảng danh sách kết quả với phân trang và sắp xếp
- Trang chi tiết Cảng biển hiển thị đầy đủ thông tin
- Tích hợp bản đồ hiển thị tọa độ GPS
- Hiển thị thông tin người tạo và người cập nhật cuối
- Điều hướng đến các chức năng cập nhật/xóa (nếu có quyền)
- Hiển thị đầy đủ tất cả trường của entity CangBien
- Định dạng GPS ±XX.XXXXXX
- Badge trạng thái màu (vàng, xanh lá, đỏ)
- Danh sách đính kèm (PDF/DOCX/JPEG, max 10MB) với Download + Print
- Hành động Phê duyệt/Từ chối (chỉ Lãnh đạo)
- Breadcrumb điều hướng
- Responsive design (desktop, tablet, mobile)

## Out of Scope

- Tạo mới Cảng biển (thuộc F-008)
- Cập nhật Cảng biển (thuộc F-009)
- Xóa Cảng biển (thuộc F-010)
- Xuất dữ liệu Cảng biển ra file Excel/PDF
- Lịch sử thay đổi chi tiết của Cảng biển (thuộc F-013)
- Phê duyệt Cảng biển (thuộc F-011)
- Chỉnh sửa trực tiếp tại trang chi tiết (điều hướng đến F-071)
- Bản đồ GPS tương tác (chỉ hiển thị tọa độ text)
- Tích hợp bản đồ OpenLayers/Leaflet

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Admin | Full | Xem chi tiết, chỉnh sửa, xóa, phê duyệt tất cả Cảng biển |
| Lãnh đạo | Full + Phê duyệt | Xem chi tiết, chỉnh sửa, xóa, phê duyệt/từ chối tất cả Cảng biển; thấy nút Phê duyệt |
| Chuyên viên Cục | CRUD | Xem chi tiết, chỉnh sửa Cảng biển của Cục mình; không thấy nút Phê duyệt |
| Nhân viên vận hành | Read-only | Chỉ xem chi tiết, không có hành động chỉnh sửa, xóa, phê duyệt |
| Doanh nghiệp cảng | CRUD | Xem chi tiết, chỉnh sửa Cảng biển của đơn vị mình |

## Entities

- **CangBien**: id (UUID), maCang (string, unique), tenCang (string), tinhThanh (string), toDo (JSON: {lat, lng}), dienTich (decimal), khaNangTiepNhanTau (string), trangThai (enum: cho_phe_duyet, hien_hanh, tam_ngung, da_xoa), ghiChu (text), createdAt (timestamp), updatedAt (timestamp), createdBy (UUID), updatedBy (UUID, nullable)
- **Attachment**: id (UUID), cangBienId (UUID), fileName (string), fileType (PDF/DOCX/JPEG), fileSize (bytes, max 10MB), uploadedAt, uploadedBy (UUID)

## Business Rules

1. Tọa độ GPS của Cảng biển được hiển thị trên bản đồ tích hợp với mức zoom phù hợp để xác định vị trí chính xác.
2. Chỉ Cảng biển có trạng thái "Hiện hành" hoặc "Tạm ngừng" được hiển thị trong kết quả tìm kiếm mặc định; Cảng "Chờ phê duyệt" và "Đã xóa" chỉ hiển thị khi người dùng bật tùy chọn xem tất cả.
3. Phân quyền hiển thị: Nhân viên vận hành chỉ xem được các trường cơ bản (mã, tên, tỉnh, trạng thái); các trường kỹ thuật mở rộng chỉ hiển thị cho vai trò Quản lý cảng trở lên.
4. Kết quả tìm kiếm được cập nhật thời gian thực (live search) với độ trễ không quá 500ms.

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | maCang tuân thủ định dạng VN-36, độ dài 6-10 ký tự, duy nhất toàn hệ thống | Hiển thị chi tiết | Entity spec, F-069 |
| BR-002 | viDo [-90, 90], kinhDo [-180, 180], dienTich [0, 5000] | Hiển thị chi tiết | Entity spec |
| BR-003 | Badge trạng thái: CHỜ_PHÊ_DUYỆT = vàng, ĐƯỢC_PHÊ_DUYỆT = xanh lá, TỪ_CHỐI = đỏ | Hiển thị chi tiết | F-069 |
| BR-004 | Đính kèm chỉ hỗ trợ PDF, DOCX, JPEG, tối đa 10MB/file | Đính kèm | F-069 |

## UI Scope

- **Component:** `CangBienDetailPage` — hiển thị đầy đủ thông tin cảng biển, label-value layout
- **API endpoint:** `GET /api/v1/cang-bien/:id`
- **Display:** 15 trường entity CangBien, GPS định dạng ±XX.XXXXXX (5 chữ số thập phân), badge trạng thái màu (vàng/xanh lá/đỏ), đính kèm PDF/DOCX/JPEG (max 10MB)
- **Attachments:** Danh sách file với tên, định dạng, dung lượng, nút Download và Print cho từng file
- **Actions:** "Chỉnh sửa" → F-071, "Xóa" → hộp thoại F-093, "Lịch sử" → F-094, Phê duyệt/Từ chối (chỉ Lãnh đạo)
- **Breadcrumb:** "Quản lý cảng biển > Chi tiết cảng [maCang]"
- **Navigation:** Từ danh sách (F-068) → click row → CangBienDetailPage
- **Responsive:** Desktop ≥1024px, tablet ≥768px, mobile cột đơn
- **RBAC:** Lãnh đạo thấy nút Phê duyệt/Từ chối; Admin đầy đủ quyền; Chuyên viên Cục/Cảng vụ thấy nút Chỉnh sửa cho cảng thuộc đơn vị mình; Nhân viên vận hành chỉ xem (read-only)

## Testing Strategy

Kiểm thử đơn vị cho các hàm tra cứu và lọc; kiểm thử tích hợp cho API trả về danh sách và chi tiết Cảng biển; kiểm thử giao diện cho thanh tìm kiếm, bảng phân trang, trang chi tiết và bản đồ tích hợp; kiểm thử phân quyền cho các vai trò khác nhau để xác nhận trường nào được hiển thị; kiểm thử hiệu năng với 1000 Cảng biển để đảm bảo thời gian tra cứu dưới 3 giây.

Cypress E2E: điều hướng từ danh sách → chi tiết → xác minh breadcrumb → click hành động "Chỉnh sửa" → xác nhận điều hướng đến F-071 → click "Xóa" → xác nhận dialog F-093 → click "Lịch sử" → xác nhận F-094. Negative test: xác minh hành động Phê duyệt/Từ chối không hiển thị cho người dùng không phải Leadership. Test responsive: viewport desktop (1440px), tablet (768px), mobile (375px) — layout chuyển đúng.

## Consolidation Note

Merged with UI feature F-069 (ui-xem-cb-chi-tiet) — TRI-1785205768654-0f93, 2026-07-28
```
