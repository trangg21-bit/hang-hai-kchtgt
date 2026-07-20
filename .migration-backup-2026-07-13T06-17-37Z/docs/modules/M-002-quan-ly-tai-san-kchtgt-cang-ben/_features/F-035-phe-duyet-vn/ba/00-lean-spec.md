---
feature-id: F-035
document: lean-spec
output-mode: lean
last-updated: 2026-06-27
---
# Phê duyệt Vùng nước

## Summary

Vùng nước sau khi tạo mới hoặc cập nhật phải trải qua quy trình phê duyệt hai cấp bắt buộc (Cấp 1 — Trưởng phòng Quản lý Cảng; Cấp 2 — Cục) trước khi được kích hoạt vào hệ thống. Tính năng cung cấp giao diện cho từng cấp phê duyệt xem xét đầy đủ thông tin địa lý, điều kiện hải văn, ra quyết định Chấp thuận hoặc Từ chối kèm lý do bắt buộc, ghi nhật ký bất biến và thông báo kết quả đến người tạo. Thành công khi 100% Vùng nước trạng thái "Đã kích hoạt" đều đã qua đủ hai cấp phê duyệt có thẩm quyền với nhật ký đầy đủ.

## Scope

| | Items |
|---|---|
| In scope | Danh sách Vùng nước chờ phê duyệt theo từng cấp; Trang chi tiết kèm lịch sử thay đổi; Giao diện Chấp thuận / Từ chối tại Cấp 1 (Trưởng phòng); Giao diện Chấp thuận / Từ chối tại Cấp 2 (Cục); Trường lý do từ chối bắt buộc ở mỗi cấp; Chuyển trạng thái tự động giữa các cấp; Ghi PheDuyetLog bất biến; Thông báo kết quả đến người tạo; Chỉnh sửa và gửi lại khi bị từ chối |
| Out of scope | Phê duyệt tự động dựa trên quy tắc; Tích hợp với hệ thống nghiệp vụ bên ngoài Cục; Bỏ qua Cấp 1 trong trường hợp đặc biệt; Phê duyệt xóa Vùng nước; Phê duyệt hàng loạt; Xuất báo cáo phê duyệt |
| Assumptions | Vùng nước ở trạng thái "Chờ phê duyệt Cấp 1" được tạo bởi F-032 (tạo mới) hoặc F-033 (cập nhật); Thông báo dùng cơ chế notification nội bộ đã có sẵn trong platform; Trưởng phòng Quản lý Cảng ánh xạ vào vai trò Lãnh đạo (A-002); Cục ánh xạ vào vai trò Chuyên viên cấp Cục hoặc Lãnh đạo Cục (A-002/A-003 với org-unit = Cục) |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Lãnh đạo Cấp 1 (A-002, org=Cảng) | Xem danh sách Vùng nước chờ phê duyệt Cấp 1 | Biết các mục cần xử lý mà không phải tìm thủ công | Must Have |
| US-002 | Lãnh đạo Cấp 1 (A-002, org=Cảng) | Xem chi tiết Vùng nước kèm lịch sử thay đổi tại Cấp 1 | Có đủ ngữ cảnh địa lý, hải văn để ra quyết định chính xác | Must Have |
| US-003 | Lãnh đạo Cấp 1 (A-002, org=Cảng) | Chấp thuận Vùng nước tại Cấp 1 | Chuyển hồ sơ lên Cấp 2 để xét duyệt tiếp | Must Have |
| US-004 | Lãnh đạo Cấp 1 (A-002, org=Cảng) | Từ chối Vùng nước tại Cấp 1 kèm lý do bắt buộc | Trả hồ sơ về người tạo kèm hướng dẫn chỉnh sửa | Must Have |
| US-005 | Lãnh đạo Cấp 2 (A-002, org=Cục) | Xem danh sách Vùng nước chờ phê duyệt Cấp 2 | Biết các mục Cấp 1 đã duyệt cần xét thêm cấp Cục | Must Have |
| US-006 | Lãnh đạo Cấp 2 (A-002, org=Cục) | Chấp thuận Vùng nước tại Cấp 2 | Kích hoạt Vùng nước vào trạng thái "Đã kích hoạt" | Must Have |
| US-007 | Lãnh đạo Cấp 2 (A-002, org=Cục) | Từ chối Vùng nước tại Cấp 2 kèm lý do bắt buộc | Trả hồ sơ về Cấp 1 để xử lý lại | Must Have |
| US-008 | Chuyên viên Cảng (A-003/A-004) | Nhận thông báo kết quả phê duyệt từ mỗi cấp | Biết ngay trạng thái hồ sơ và hành động cần làm tiếp theo | Must Have |
| US-009 | Chuyên viên Cảng (A-003/A-004) | Chỉnh sửa và gửi lại Vùng nước bị từ chối | Tiếp tục quy trình sau khi khắc phục vấn đề | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001 | Chỉ Lãnh đạo Cấp 1 thấy danh sách Cấp 1 | Given người dùng vai trò Lãnh đạo (A-002) tại org Cảng; When truy cập module phê duyệt Vùng nước Cấp 1; Then thấy danh sách Vùng nước trạng thái "Chờ phê duyệt Cấp 1" | Chuyên viên / Người dùng tại Cảng không thấy menu này |
| AC-002 | US-001 | Người không có quyền bị chặn tại Cấp 1 | Given người dùng vai trò Chuyên viên (A-003); When cố truy cập URL danh sách phê duyệt Cấp 1; Then nhận HTTP 403 Forbidden | Áp dụng cả API endpoint |
| AC-003 | US-002 | Xem chi tiết kèm lịch sử khi là cập nhật tại Cấp 1 | Given Vùng nước chờ phê duyệt Cấp 1 do cập nhật; When người phê duyệt mở chi tiết; Then hiển thị toàn bộ thông tin (địa lý, hải văn, khả năng thông hành) VÀ tab lịch sử thay đổi (delta field-by-field) | |
| AC-004 | US-002 | Xem chi tiết khi là tạo mới tại Cấp 1 | Given Vùng nước chờ phê duyệt Cấp 1 do tạo mới; When người phê duyệt mở chi tiết; Then hiển thị đầy đủ thông tin; tab lịch sử rỗng hoặc ẩn | |
| AC-005 | US-003 | Chấp thuận Cấp 1 thành công | Given Vùng nước trạng thái "Chờ phê duyệt Cấp 1"; When Lãnh đạo Cấp 1 chọn Chấp thuận và xác nhận; Then trạng thái chuyển "Chờ phê duyệt Cấp 2", PheDuyetLog Cấp 1 được ghi, thông báo gửi Lãnh đạo Cấp 2 | |
| AC-006 | US-004 | Từ chối Cấp 1 thành công khi có lý do | Given Lãnh đạo Cấp 1 nhập lý do từ chối; When chọn Từ chối và xác nhận; Then trạng thái Vùng nước chuyển "Chờ chỉnh sửa", PheDuyetLog Cấp 1 ghi nhận, thông báo kèm lý do gửi người tạo | |
| AC-007 | US-004 | Từ chối Cấp 1 bị chặn khi thiếu lý do | Given Lãnh đạo Cấp 1 chọn Từ chối nhưng để trống lý do; When cố xác nhận; Then hệ thống hiển thị lỗi validation, không lưu, không thay đổi trạng thái | Validation phía client VÀ server |
| AC-008 | US-005 | Chỉ Lãnh đạo Cấp 2 thấy danh sách Cấp 2 | Given người dùng vai trò Lãnh đạo (A-002) tại org Cục; When truy cập module phê duyệt Vùng nước Cấp 2; Then thấy danh sách Vùng nước trạng thái "Chờ phê duyệt Cấp 2" | Lãnh đạo Cấp 1 không thấy danh sách Cấp 2 của Cục |
| AC-009 | US-006 | Chấp thuận Cấp 2 thành công | Given Vùng nước trạng thái "Chờ phê duyệt Cấp 2"; When Lãnh đạo Cấp 2 chọn Chấp thuận và xác nhận; Then trạng thái chuyển "Đã kích hoạt", PheDuyetLog Cấp 2 được ghi, thông báo gửi người tạo | |
| AC-010 | US-007 | Từ chối Cấp 2 thành công khi có lý do | Given Lãnh đạo Cấp 2 nhập lý do từ chối; When chọn Từ chối và xác nhận; Then trạng thái chuyển "Chờ phê duyệt Cấp 1", PheDuyetLog Cấp 2 ghi nhận, thông báo gửi Lãnh đạo Cấp 1 và người tạo | |
| AC-011 | US-007 | Từ chối Cấp 2 bị chặn khi thiếu lý do | Given Lãnh đạo Cấp 2 chọn Từ chối nhưng để trống lý do; When cố xác nhận; Then hệ thống hiển thị lỗi validation, không lưu, không thay đổi trạng thái | Validation phía client VÀ server |
| AC-012 | US-008 | Thông báo kết quả phê duyệt đến người tạo | Given phê duyệt hoàn tất ở bất kỳ cấp nào (chấp thuận hoặc từ chối); When hệ thống xử lý xong; Then người tạo nhận thông báo trong hệ thống kèm kết quả và lý do (nếu từ chối) | |
| AC-013 | US-009 | Chỉnh sửa và gửi lại sau từ chối | Given Vùng nước trạng thái "Chờ chỉnh sửa"; When người tạo chỉnh sửa và gửi lại; Then trạng thái chuyển về "Chờ phê duyệt Cấp 1" | |
| AC-014 | US-003/004/006/007 | Nhật ký phê duyệt bất biến | Given PheDuyetLog đã được ghi; When bất kỳ người dùng (kể cả Admin) cố xóa/sửa; Then hệ thống từ chối; log không thay đổi | |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Vùng nước mới tạo hoặc cập nhật luôn bắt đầu ở trạng thái "Chờ phê duyệt Cấp 1" | Tất cả VungNuoc | Không có ngoại lệ |
| BR-002 | Chỉ khi Cấp 1 Chấp thuận thì hồ sơ mới chuyển sang "Chờ phê duyệt Cấp 2" | Luồng Cấp 1 → Cấp 2 | Không có ngoại lệ; không bỏ qua Cấp 1 |
| BR-003 | Nếu Cấp 2 từ chối, trạng thái quay về "Chờ phê duyệt Cấp 1" để xem xét lại | Luồng từ chối Cấp 2 | Không có ngoại lệ |
| BR-004 | Chỉ khi cả Cấp 1 và Cấp 2 đều Chấp thuận thì Vùng nước mới chuyển sang "Đã kích hoạt" | Trạng thái cuối | Không có ngoại lệ |
| BR-005 | Lý do từ chối là bắt buộc ở cả hai cấp; hệ thống chặn lưu khi thiếu | US-004, US-007, AC-007, AC-011 | Không có ngoại lệ |
| BR-006 | PheDuyetLog là bất biến sau khi ghi; không được xóa hoặc sửa | PheDuyetLog | Không có ngoại lệ kể cả Admin |
| BR-007 | Quyền phê duyệt Cấp 1 chỉ thuộc Lãnh đạo (A-002) tại đơn vị Cảng; Cấp 2 thuộc Lãnh đạo (A-002) tại đơn vị Cục | RBAC + org-unit filter | Quản trị hệ thống (A-001) không tự động có quyền phê duyệt nghiệp vụ |
| BR-008 | Mọi thay đổi trạng thái Vùng nước đều được ghi nhận vào lịch sử | Audit trail | Không có ngoại lệ |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Tải trang chi tiết Vùng nước kèm lịch sử thay đổi | ≤ 2 giây (p95, mạng nội bộ) |
| Security | Kiểm tra phân quyền (RBAC + org-unit) tại cả API layer và UI; không lộ dữ liệu chờ phê duyệt cho vai trò không có quyền | HTTP 403 trả đúng; không trả 200 với body rỗng |
| Reliability | Ghi PheDuyetLog phải atomic với cập nhật trạng thái VungNuoc trong cùng transaction | 0% log mất khi transaction thành công |
| Audit/Logging | Mọi hành động phê duyệt (Cấp 1 và Cấp 2: chấp thuận/từ chối) ghi vào PheDuyetLog với người phê duyệt, org-unit, timestamp, quyết định, lý do | Lưu vĩnh viễn; không xóa được |
| Operability | Thông báo kết quả đến người liên quan trong thời gian thực hoặc polling ≤ 30 giây | Người nhận không cần refresh thủ công |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001, AC-002 | Phân quyền: Lãnh đạo Cấp 1 thấy danh sách; Chuyên viên nhận 403 | Security / Integration |
| TS-002 | AC-003 | Chi tiết Vùng nước cập nhật: delta lịch sử hiển thị đúng | Integration |
| TS-003 | AC-004 | Chi tiết Vùng nước tạo mới: không có lịch sử thay đổi | Integration |
| TS-004 | AC-005, AC-008, AC-009 | Luồng happy-path đầy đủ: Cấp 1 approve → Cấp 2 approve → "Đã kích hoạt" + log + thông báo | E2E |
| TS-005 | AC-006, AC-012 | Cấp 1 từ chối có lý do: trạng thái → "Chờ chỉnh sửa", thông báo kèm lý do | Integration / E2E |
| TS-006 | AC-007 | Cấp 1 từ chối thiếu lý do: validation chặn cả client và server | Unit / Integration |
| TS-007 | AC-010, AC-012 | Cấp 2 từ chối có lý do: trạng thái → "Chờ phê duyệt Cấp 1", thông báo đúng người | Integration / E2E |
| TS-008 | AC-011 | Cấp 2 từ chối thiếu lý do: validation chặn cả client và server | Unit / Integration |
| TS-009 | AC-013 | Chỉnh sửa và gửi lại sau từ chối: trạng thái → "Chờ phê duyệt Cấp 1" | Integration |
| TS-010 | AC-014 | Nhật ký bất biến: Admin cố xóa PheDuyetLog bị từ chối | Security / Unit |
| TS-011 | AC-008 | Phân quyền Cấp 2: chỉ Lãnh đạo org Cục thấy danh sách Cấp 2 | Security / Integration |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes | YeuCauPheDuyetVN / PheDuyetLog là entity mới hoặc cần tách biệt khỏi Cảng biển; trạng thái VungNuoc có transition mới (cho_phe_duyet_c1 → cho_phe_duyet_c2 → da_kich_hoat / cho_chinh_sua); workflow hai cấp là bounded context mới so với F-011 (một cấp) |
| Architecture affected? | Yes | RBAC phải hỗ trợ org-unit filter (Cấp 1 = Cảng, Cấp 2 = Cục) — phức tạp hơn F-011; notification service cần gửi đến nhiều bên; PheDuyetLog cần immutability constraint tại DB layer |
| Implementation clear? | No | SA cần xác định: cơ chế phân biệt Cấp 1 vs Cấp 2 trong permission matrix, cách implement multi-level workflow, immutability cho PheDuyetLog, cơ chế notification đa người nhận |
| **Verdict** | `Ready for solution architecture` | Domain model mới (PheDuyetLog, YeuCauPheDuyetVN) + multi-level workflow + org-unit RBAC cần SA quyết định kiến trúc |
