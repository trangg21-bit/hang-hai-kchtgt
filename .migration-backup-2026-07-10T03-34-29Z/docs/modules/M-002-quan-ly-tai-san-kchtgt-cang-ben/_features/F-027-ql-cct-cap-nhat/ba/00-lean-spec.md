---
feature-id: F-027
document: lean-spec
output-mode: lean
last-updated: 2026-06-27
---
# Quản lý Cảng cạn - Cập nhật

## Summary
Người dùng có thẩm quyền cần chỉnh sửa thông tin của một Cảng cạn đã tồn tại trong hệ thống (tên, địa chỉ, diện tích, năng lực, dịch vụ, giấy tờ pháp lý) do có thay đổi thực tế về điều kiện vận hành. Hệ thống hiển thị giá trị hiện tại, cho phép chỉnh sửa các trường được phép, kiểm tra hợp lệ, cảnh báo trạng thái đặc biệt, và tự động ghi nhật ký thay đổi đầy đủ sau mỗi lần lưu thành công. Thành công khi mọi cập nhật đều có lịch sử biến động chính xác, các trường quan trọng kích hoạt phê duyệt lại đúng quy trình, và dữ liệu đảm bảo tính nhất quán cho công tác kiểm toán.

## Scope

| | Items |
|---|---|
| In scope | Cập nhật thông tin Cảng cạn (tên, địa chỉ, tọa độ, loại hình, diện tích, năng lực xử lý, dịch vụ, ghi chú); Ghi nhật ký thay đổi tự động (giá trị trước/sau, người thực hiện, thời gian); Cảnh báo trạng thái đặc biệt (đang phê duyệt, đã xóa mềm); Kích hoạt phê duyệt lại khi thay đổi năng lực hoặc loại hình; Kiểm tra hợp lệ dữ liệu trước khi lưu |
| Out of scope | Tạo mới Cảng cạn (F-026); Xóa mềm Cảng cạn (F-028); Phê duyệt Cảng cạn (F-029); Xem chi tiết (F-030); Xem lịch sử thay đổi (F-031) |
| Assumptions | Mã Cảng cạn (ma) là trường định danh bất biến; Trạng thái hợp lệ để cập nhật: "chờ phê duyệt", "bị từ chối", "đã kích hoạt"; Người dùng đã xác thực trước khi truy cập chức năng; Hệ thống ghi nhận tài khoản đăng nhập tự động làm người thực hiện |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Chuyên viên (A-003) | Chỉnh sửa thông tin Cảng cạn đang hoạt động | Dữ liệu luôn phản ánh thực tế vận hành | Must Have |
| US-002 | Chuyên viên (A-003) | Nhận cảnh báo khi Cảng cạn đang trong quy trình phê duyệt | Tránh xung đột dữ liệu và quy trình | Must Have |
| US-003 | Chuyên viên (A-003) | Hệ thống tự động ghi nhật ký mọi thay đổi | Đảm bảo truy vết và kiểm toán | Must Have |
| US-004 | Chuyên viên / Lãnh đạo (A-003/A-002) | Thay đổi năng lực hoặc loại hình kích hoạt phê duyệt lại | Đảm bảo thay đổi quan trọng được kiểm duyệt | Must Have |
| US-005 | Quản trị viên (A-001) | Cập nhật mọi trường ngoại trừ mã định danh | Kiểm soát toàn diện thông tin tài sản | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001 | Cập nhật thành công trường thông tin cơ bản | Given Cảng cạn ở trạng thái hợp lệ (chờ PD / bị từ chối / đã kích hoạt); When Chuyên viên thay đổi tên, địa chỉ, ghi chú và nhấn Lưu; Then Hệ thống lưu giá trị mới, hiển thị thông báo thành công, trạng thái không đổi | Các trường tên, địa chỉ, loại hình là bắt buộc |
| AC-002 | US-001 | Từ chối lưu khi trường bắt buộc để trống | Given Form cập nhật đang mở; When Người dùng xóa trống trường "tên" hoặc "địa chỉ" và nhấn Lưu; Then Hệ thống hiển thị lỗi validation inline, không lưu dữ liệu | Lỗi phải hiển thị tại trường tương ứng |
| AC-003 | US-001 | Không được thay đổi mã Cảng cạn | Given Form cập nhật hiển thị; When Người dùng cố gắng chỉnh sửa trường mã (ma); Then Trường mã hiển thị dạng read-only, không nhận input | Mã là trường định danh bất biến |
| AC-004 | US-002 | Cảnh báo khi Cảng cạn đang trong quy trình phê duyệt | Given Cảng cạn có trạng thái "đang phê duyệt"; When Người dùng mở form cập nhật; Then Hệ thống hiển thị banner cảnh báo "Cảng cạn đang trong quá trình phê duyệt — thay đổi có thể ảnh hưởng đến kết quả phê duyệt" | Cảnh báo không ngăn thao tác, chỉ thông báo |
| AC-005 | US-002 | Cảnh báo khi Cảng cạn đã bị xóa mềm | Given Cảng cạn có trạng thái "đã xóa" (soft-delete); When Người dùng cố gắng mở form cập nhật; Then Hệ thống hiển thị thông báo lỗi "Không thể cập nhật Cảng cạn đã bị xóa", form không mở | Cảng cạn đã xóa mềm không được cập nhật |
| AC-006 | US-003 | Ghi nhật ký thay đổi tự động sau mỗi lần lưu thành công | Given Người dùng đã lưu thay đổi thành công; When Hệ thống xử lý xong; Then Bản ghi LichSuCangCan mới được tạo với: cangCanId, ngayThayDoi (timestamp hiện tại), nguoiThucHien (từ session), noiDungTruoc (giá trị cũ), noiDungSau (giá trị mới), loaiThayDoi | Nhật ký phải có đủ 6 trường bắt buộc |
| AC-007 | US-003 | Ghi nhận đúng giá trị trước và sau thay đổi | Given Cảng cạn có tên cũ "Cảng A"; When Người dùng đổi thành "Cảng A Mở Rộng" và lưu; Then Bản ghi nhật ký có noiDungTruoc = "Cảng A", noiDungSau = "Cảng A Mở Rộng" | Ghi nhận theo từng trường thay đổi |
| AC-008 | US-004 | Kích hoạt phê duyệt lại khi thay đổi năng lực xử lý | Given Cảng cạn ở trạng thái "đã kích hoạt"; When Người dùng thay đổi trường nangLxuLy và lưu; Then Trạng thái Cảng cạn chuyển sang "chờ phê duyệt lại", thông báo cho người dùng, ghi nhật ký | Áp dụng cho cả thay đổi loại hình |
| AC-009 | US-004 | Kích hoạt phê duyệt lại khi thay đổi loại hình | Given Cảng cạn ở trạng thái "đã kích hoạt"; When Người dùng thay đổi trường loaiHinh và lưu; Then Trạng thái chuyển sang "chờ phê duyệt lại", yêu cầu phê duyệt mới được tạo | Không áp dụng khi Cảng cạn đang ở trạng thái "chờ phê duyệt" |
| AC-010 | US-005 | Cập nhật thất bại khi Cảng cạn không ở trạng thái hợp lệ | Given Cảng cạn ở trạng thái "đang xử lý khóa" hoặc trạng thái không hợp lệ khác; When Người dùng nhấn Lưu; Then Hệ thống trả lỗi "Không thể cập nhật ở trạng thái hiện tại", không thực hiện thay đổi | Cần định nghĩa rõ danh sách trạng thái hợp lệ |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Mã Cảng cạn (ma) là trường bất biến — không được phép thay đổi sau khi tạo | AC-003, US-001 | Không có ngoại lệ |
| BR-002 | Chỉ Cảng cạn ở trạng thái "chờ phê duyệt", "bị từ chối" hoặc "đã kích hoạt" mới được cập nhật | AC-001, AC-010 | Quản trị viên (A-001) có thể được phép cập nhật trạng thái ngoại lệ theo quy trình riêng |
| BR-003 | Trường tên (ten), địa chỉ (diaChi) và loại hình (loaiHinh) là bắt buộc khi cập nhật | AC-002 | Không có ngoại lệ |
| BR-004 | Thay đổi năng lực xử lý (nangLxuLy) hoặc loại hình (loaiHinh) phải kích hoạt quy trình phê duyệt lại | AC-008, AC-009 | Không áp dụng khi Cảng cạn đã ở trạng thái "chờ phê duyệt" hoặc "chờ phê duyệt lại" |
| BR-005 | Hệ thống tự động ghi nhật ký thay đổi (LichSuCangCan) sau mỗi lần lưu thành công | AC-006, AC-007 | Ghi nhận theo từng trường thay đổi, không phải toàn bộ entity |
| BR-006 | Người thực hiện cập nhật được xác định tự động từ tài khoản đăng nhập hiện tại | AC-006 | Không được tự nhập tay người thực hiện |
| BR-007 | Hệ thống hiển thị cảnh báo (không chặn) khi Cảng cạn đang trong quy trình phê duyệt | AC-004 | Chỉ cảnh báo, không ngăn cập nhật |
| BR-008 | Cảng cạn đã bị xóa mềm không được phép cập nhật | AC-005 | Không có ngoại lệ |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | API cập nhật trả về response (bao gồm ghi nhật ký) | <= 2 giây trong điều kiện tải bình thường |
| Security | Chỉ người dùng có vai trò Chuyên viên (A-003), Lãnh đạo (A-002) hoặc Quản trị viên (A-001) được gọi endpoint cập nhật | Kiểm tra phân quyền tại tầng API; 401/403 cho yêu cầu không hợp lệ |
| Reliability | Ghi nhật ký thay đổi phải là atomic với thao tác cập nhật chính | Transaction rollback nếu bất kỳ bước nào thất bại; dữ liệu không được ở trạng thái inconsistent |
| Audit/Logging | Mọi thao tác cập nhật thành công phải có bản ghi LichSuCangCan với đầy đủ 6 trường bắt buộc | 100% thao tác cập nhật thành công có nhật ký |
| Operability | N/A | N/A |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001 | Cập nhật thành công tên và địa chỉ Cảng cạn đang kích hoạt | Happy path |
| TS-002 | AC-002 | Lưu khi bỏ trống trường tên bắt buộc — kỳ vọng lỗi validation | Negative |
| TS-003 | AC-003 | Thử thay đổi mã Cảng cạn — kỳ vọng trường read-only | Negative |
| TS-004 | AC-004 | Mở form cập nhật Cảng cạn đang phê duyệt — kỳ vọng cảnh báo | Edge case |
| TS-005 | AC-005 | Mở form cập nhật Cảng cạn đã xóa mềm — kỳ vọng lỗi chặn | Negative |
| TS-006 | AC-006, AC-007 | Kiểm tra bản ghi LichSuCangCan sau cập nhật thành công | Audit |
| TS-007 | AC-008 | Thay đổi nangLxuLy của Cảng cạn đã kích hoạt — kỳ vọng chuyển trạng thái "chờ PD lại" | Business rule |
| TS-008 | AC-009 | Thay đổi loaiHinh của Cảng cạn đã kích hoạt — kỳ vọng chuyển trạng thái "chờ PD lại" | Business rule |
| TS-009 | AC-010 | Cập nhật Cảng cạn ở trạng thái không hợp lệ — kỳ vọng lỗi 400/422 | Negative |
| TS-010 | AC-006 | Ghi nhật ký bị lỗi giữa chừng — toàn bộ transaction phải rollback | Reliability |
| TS-011 | AC-001 | Cập nhật nhiều trường cùng lúc trong một lần lưu | Happy path |
| TS-012 | AC-001 | Người dùng không có quyền cập nhật — kỳ vọng 403 Forbidden | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | CangCan và LichSuCangCan đã được định nghĩa trong F-026 (tạo mới); feature này chỉ thêm lệnh update và ghi nhật ký trên entity có sẵn |
| Architecture affected? | Yes | Cần thiết kế transaction boundary (update + audit log atomic), logic kích hoạt phê duyệt lại, và endpoint PUT/PATCH mới với phân quyền |
| Implementation clear? | No | Cần SA quyết định: cấu trúc audit log (per-field diff vs snapshot), cơ chế kích hoạt phê duyệt lại (synchronous vs event), và mapping vai trò actor-registry sang permission |
| **Verdict** | `Ready for solution architecture` | Không có domain model mới; tuy nhiên cần SA cho transaction design và permission mapping |

---

## BA -> Handoff Summary

**Verdict:** Ready for solution architecture

**Phases completed:** BA only

**Triage rationale:** F-027 chỉ thêm thao tác cập nhật trên entity CangCan đã tồn tại từ F-026 — không có aggregate hoặc bounded context mới. Tuy nhiên cần SA quyết định cơ chế audit log (per-field diff vs full snapshot), transaction atomicity, và cách kích hoạt quy trình phê duyệt lại.

**Business goal:** Duy trì tính chính xác của cơ sở dữ liệu Cảng cạn bằng cách cho phép người có thẩm quyền cập nhật thông tin khi có thay đổi thực tế, đồng thời đảm bảo mọi thay đổi đều có lịch sử truy vết.

**Scope in:**
- Cập nhật tất cả trường ngoại trừ mã định danh
- Ghi nhật ký tự động (giá trị trước/sau, người thực hiện)
- Cảnh báo trạng thái đặc biệt (phê duyệt, xóa mềm)
- Kích hoạt phê duyệt lại cho thay đổi quan trọng (năng lực, loại hình)
- Validation dữ liệu đầu vào

**Key business rules:** BR-001: mã bất biến; BR-002: chỉ cập nhật ở trạng thái hợp lệ; BR-004: kích hoạt phê duyệt lại khi đổi năng lực/loại hình; BR-005: audit log atomic với update; BR-008: không cập nhật Cảng cạn đã xóa mềm

**Actors:** Chuyên viên (A-003) — thao tác chính; Lãnh đạo (A-002) — phê duyệt lại; Quản trị viên (A-001) — quyền đầy đủ

**Domain highlights (Phase 2 not run):** N/A

**UI/UX impact:** Yes — form cập nhật với hiển thị giá trị hiện tại/mới, cảnh báo trạng thái, feedback validation inline

**Screen types:** Form cập nhật Cảng cạn (edit form với read-only mã, editable các trường còn lại, banner cảnh báo trạng thái)

**Open items (non-blocking):** Danh sách đầy đủ trạng thái Cảng cạn hợp lệ để cập nhật cần xác nhận từ business; Cơ chế kích hoạt phê duyệt lại (synchronous trong transaction vs async event) — SA quyết định; Định nghĩa "trường quan trọng" có thể mở rộng trong tương lai
