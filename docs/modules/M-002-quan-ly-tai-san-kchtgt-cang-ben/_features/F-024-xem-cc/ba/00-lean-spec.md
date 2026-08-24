---
feature-id: F-024
document: lean-spec
output-mode: lean
last-updated: 2026-07-29
---

# Xem chi tiết Cầu cảng (View Pier Detail)

## Summary

Trang chi tiết hiển thị toàn bộ thông tin của một Cầu cảng (Pier) ở chế độ read-only, bao gồm 11 nhóm trường dạng collapsible (A–K) và 5 tab dữ liệu liên quan (L–P), badge trạng thái vòng đời, danh sách giấy tờ đính kèm, và nút hành động động theo vai trò. Tất cả người dùng đã đăng nhập đều có quyền xem; trường metadata (createdBy, updatedBy) chỉ hiển thị cho Admin Cục. Trang đóng vai trò trung tâm điều hướng đến chỉnh sửa (F-021), phê duyệt/từ chối (F-023), và lịch sử thay đổi (F-025).

Thành công được đo bằng khả năng hiển thị chính xác toàn bộ thông tin Cầu cảng trong mọi trạng thái (PENDING_APPROVAL, APPROVED_LEVEL1, APPROVED, REJECTED_LEVEL1, REJECTED_LEVEL2, ARCHIVED/soft-deleted) với thời gian tải ≤ 1 giây, badge màu đúng vòng đời, và kiểm soát field-level RBAC chặt chẽ.

## Scope

| | Items |
|---|---|
| In scope | Hiển thị 11 nhóm thông tin dạng collapsible (A: Thông tin cơ bản, B: Kỹ thuật, C: Trạng thái, D: Thời điểm & kiểm định, E: Số lượng & sản lượng, F: Phương án bảo đảm ATHH, G: Công bố mở/đưa vào sử dụng, H: Thông tin GIS, I: Phạm vi & Tọa độ GIS, J: Giấy tờ đính kèm, K: Hành động); 5 tab dữ liệu liên quan (L: Phê duyệt, M: KCHT thuộc cầu cảng, N: Vận hành khai thác, O: Bảo trì, P: Sự cố); Badge trạng thái hoạt động (OPERATIONAL=xanh lá, SUSPENDED=vàng) và phê duyệt (PENDING_APPROVAL=vàng, APPROVED_LEVEL1=vàng, APPROVED=xanh dương, REJECTED_LEVEL1/REJECTED_LEVEL2=đỏ, ARCHIVED=xám); Hyperlink đến Bến cảng cha (Berth) và Cảng biển cha (Port); Danh sách giấy tờ đính kèm với nút Tải xuống/In; Nút hành động động theo trạng thái và vai trò (Chỉnh sửa, Phê duyệt, Từ chối, Lịch sử); Breadcrumb: Trang chủ > Quản lý KCHT > Quản lý Cầu cảng > [pierName]; Kiểm soát hiển thị metadata (createdBy, updatedBy) chỉ cho Admin Cục; Loading skeleton khi đang tải; Cảnh báo trạng thái theo vòng đời; Responsive (≤ 768px) |
| Out of scope | Tạo mới Cầu cảng (F-020); Cập nhật Cầu cảng (F-021); Xóa Cầu cảng (F-022); Phê duyệt Cầu cảng (F-023) — chỉ điều hướng từ F-024; Lịch sử thay đổi chi tiết (F-025) — chỉ điều hướng từ F-024; Quản lý giấy tờ (upload/xóa) — chỉ xem và tải xuống; Chỉnh sửa trực tiếp trên trang chi tiết (read-only) |
| Assumptions | Người dùng đã đăng nhập và có quyền xem cơ bản; Cầu cảng đã tồn tại trong hệ thống (được tạo qua F-020); Bến cảng cha (Berth) và Cảng biển cha (Port) đã tồn tại nhưng có thể đã bị xóa/không khả dụng; API GET chi tiết trả về JOIN đầy đủ (BenCang, GiayTo) |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-024-01 | Nhân viên vận hành (Staff) | Xem toàn bộ thông tin chi tiết của một Cầu cảng để nắm tình trạng hiện tại phục vụ công tác vận hành | Tra cứu nhanh thông số kỹ thuật và trạng thái hoạt động | Must Have |
| US-024-02 | Quản lý tài sản (Asset Manager) | Xem đầy đủ các trường kỹ thuật và trạng thái của Cầu cảng để kiểm tra thông tin trước khi chỉnh sửa | Kiểm tra dữ liệu hiện tại trước khi cập nhật (F-021) | Must Have |
| US-024-03 | Lãnh đạo (Leader) | Xem chi tiết Cầu cảng và phê duyệt/từ chối ngay trên trang chi tiết để tiết kiệm thời gian | Thực hiện phê duyệt (F-023) không cần chuyển trang | Must Have |
| US-024-04 | Nhân viên vận hành (Staff) | Tải xuống hoặc in các giấy tờ đính kèm của Cầu cảng để phục vụ công tác kiểm tra thực tế | Tiếp cận tài liệu gốc ngoại tuyến | Should Have |
| US-024-05 | Quản lý tài sản (Asset Manager) | Xem lịch sử thay đổi của Cầu cảng ngay từ trang chi tiết để biết ai đã thay đổi gì và khi nào | Truy xuất nhanh audit trail (F-025) | Should Have |
| US-024-06 | Người dùng (User) | Có breadcrumb điều hướng rõ ràng để dễ dàng quay lại danh sách hoặc trang Bến cảng cha | Điều hướng trực quan, không bị lạc | Should Have |
| US-024-07 | Người dùng (User) | Xem trước (preview) file ảnh JPEG trực tiếp trên trang chi tiết thay vì phải tải xuống | Tiết kiệm thời gian xem nhanh tài liệu ảnh | Could Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-024-01 | US-024-01, US-024-02 | Hiển thị đầy đủ thông tin Cầu cảng | Given người dùng đã đăng nhập; When truy cập trang chi tiết Cầu cảng (GET `/api/v1/cau-cang/:id`); Then trang hiển thị tất cả các trường: pierCode, pierName, berthId (tên + link), portId (tên + link), orgUnitId, navigationChannelId, province, detailedLocation, constructionGrade, structureType, operationalFunction, conditionStatus, length, width, currentWaterDepth, designBedElevation, publishedVesselDWT, designLoad, operationalStatus (badge), approvalStatus (badge), documents list, metadata (nếu là Admin Cục) | Nếu API trả về lỗi, hiển thị thông báo lỗi và nút "Thử lại" |
| AC-024-02 | US-024-01 | Link đến Bến cảng cha | Given trang chi tiết Cầu cảng đang hiển thị; When nhìn vào trường berthId; Then hiển thị tên Bến cảng dạng hyperlink trỏ đến trang chi tiết BenCang; If Bến cảng cha không tồn tại hoặc đã bị xóa; Then hiển thị tên kèm cảnh báo "(không khả dụng)" | Áp dụng tương tự cho portId |
| AC-024-03 | US-024-01 | Badge trạng thái theo vòng đời | Given trang chi tiết Cầu cảng hiển thị; When xem trường operationalStatus và approvalStatus; Then operationalStatus hiển thị badge: OPERATIONAL=xanh lá, SUSPENDED=vàng; Then approvalStatus hiển thị badge: PENDING_APPROVAL=vàng, APPROVED_LEVEL1=vàng, APPROVED=xanh dương, REJECTED_LEVEL1/REJECTED_LEVEL2=đỏ; Then ARCHIVED hiển thị badge xám | Màu sắc theo design token statusOperational/statusWarning/... từ tokens.ts |
| AC-024-04 | US-024-04 | Danh sách giấy tờ đính kèm | Given trang chi tiết Cầu cảng; When xem nhóm J (Giấy tờ đính kèm); Then hiển thị bảng danh sách file gồm: tên file, kích thước, loại file, ngày upload; Then mỗi file có nút "Tải xuống" và nút "In"; If không có file đính kèm; Then hiển thị "Không có giấy tờ đính kèm" | Tải file ≤ 3s cho file ≤ 10MB |
| AC-024-05 | US-024-03 | Hành động theo trạng thái và vai trò | Given trang chi tiết Cầu cảng; When approvalStatus = PENDING_APPROVAL hoặc APPROVED_LEVEL1 và người dùng là Leader/Admin; Then hiển thị nút "Phê duyệt" và "Từ chối"; When approvalStatus = APPROVED, REJECTED_LEVEL1 hoặc REJECTED_LEVEL2; Then ẩn nút phê duyệt/từ chối, hiển thị "Chỉnh sửa" (nếu có quyền); If người dùng không có quyền tương ứng; Then nút tương ứng bị ẩn | Nút hành động cố định cuối trang, dạng pill |
| AC-024-06 | US-024-06 | Breadcrumb điều hướng | Given người dùng ở trang chi tiết Cầu cảng; When xem breadcrumb; Then hiển thị: Trang chủ > Quản lý KCHT Hàng Hải > Quản lý cầu cảng > [pierName]; When click "Quản lý cầu cảng"; Then quay lại danh sách (F-078) | Click tên Bến cảng trong breadcrumb hoặc chi tiết quay lại trang chi tiết BenCang nếu có quyền |
| AC-024-07 | US-024-01 | Metadata cho Admin Cục | Given trang chi tiết Cầu cảng hiển thị; If người dùng là Admin Cục; Then hiển thị trường createdBy, createdAt, updatedBy, updatedAt; If người dùng là vai trò khác; Then các trường metadata bị ẩn hoàn toàn khỏi giao diện | Kiểm soát cả frontend và API response |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-024-01 | Cầu cảng ở bất kỳ trạng thái nào (PENDING_APPROVAL, APPROVED_LEVEL1, APPROVED, REJECTED_LEVEL1, REJECTED_LEVEL2, ARCHIVED/soft-deleted) đều có thể xem chi tiết. Trang luôn hiển thị trạng thái hiện tại, không phải lịch sử cũ | AC-024-01 | Không có ngoại lệ |
| BR-024-02 | Trang chi tiết hoàn toàn read-only. Mọi chỉnh sửa phải thực hiện qua F-021 (Cập nhật Cầu cảng). Không có trường nào trên trang cho phép nhập liệu trực tiếp | AC-024-01 | Không có ngoại lệ |
| BR-024-03 | Leader/Admin có thể phê duyệt hoặc từ chối Cầu cảng ngay từ trang chi tiết khi approvalStatus = PENDING_APPROVAL hoặc APPROVED_LEVEL1. Hành động này có thể chuyển hướng đến F-023 để xác nhận trước khi thực hiện | AC-024-05 | Không có ngoại lệ |
| BR-024-04 | Bến cảng cha (Berth) hiển thị dưới dạng hyperlink. Nếu Bến cảng cha đã bị xóa hoặc không còn hoạt động (SUSPENDED), hiển thị kèm tag "(không khả dụng)" nhưng vẫn cho phép xem thông tin Cầu cảng | AC-024-02 | Áp dụng tương tự cho Cảng biển cha (Port) |
| BR-024-05 | Thông tin trên trang chi tiết được làm mới mỗi khi người dùng truy cập (không cache dữ liệu chi tiết giữa các lần truy cập), đảm bảo luôn hiển thị dữ liệu mới nhất | AC-024-01 | Không áp dụng cho browser cache tĩnh (CSS/JS assets) |
| BR-024-06 | Các nút hành động trên trang chi tiết thay đổi theo trạng thái hiện tại của Cầu cảng (lifecycle status). Điều này đảm bảo người dùng không thực hiện được hành động không phù hợp với giai đoạn hiện tại trong vòng đời | AC-024-05 | Không có ngoại lệ |
| BR-024-07 | Nếu approvalStatus = PENDING_APPROVAL, APPROVED_LEVEL1, REJECTED_LEVEL1 hoặc REJECTED_LEVEL2, trang chi tiết hiển thị cảnh báo "Cầu cảng chưa được phê duyệt, không khả dụng trong các module khác". Nếu approvalStatus = APPROVED, hiển thị "Cầu cảng đã được phê duyệt, đang khả dụng" | AC-024-03 | Không có ngoại lệ |
| BR-024-08 | Nếu Bến cảng cha (Berth) hoặc Cảng biển cha (Port) không còn hoạt động (bị xóa, SUSPENDED), operationalStatus của Cầu cảng tự động chuyển sang SUSPENDED. Trang chi tiết hiển thị cảnh báo "Cầu cảng tạm ngừng hoạt động do Bến cảng/Cảng biển cha không còn khả dụng" | AC-024-02 | Chỉ hiển thị cảnh báo, không thay đổi dữ liệu Cầu cảng tại thời điểm xem |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Thời gian tải trang chi tiết (bao gồm JOIN Berth và documents) | ≤ 1 giây (p95) |
| Performance | Tải file đính kèm | ≤ 3 giây cho file tối đa 10MB |
| Security | Phân quyền RBAC trên tất cả API; JWT token bắt buộc | HTTP 403 khi không có quyền |
| Security | Metadata (createdBy, updatedBy) chỉ hiển thị cho Admin Cục — kiểm soát cả frontend và API response | 0 field leak cho vai trò không được phép |
| Reliability | Dữ liệu được làm mới mỗi khi truy cập, không cache dữ liệu cũ. Nếu Bến cảng cha bị xóa, vẫn hiển thị thông tin Cầu cảng với cảnh báo | 100% availability |
| UX | Giao diện responsive (≤ 768px: sidebar hamburger, card xếp dọc, floating action bar); Loading skeleton khi đang tải; Collapsible sections (nhóm D–G thu gọn mặc định, A–C mở rộng); Alert trạng thái theo vòng đời | WCAG 2.1 AA |
| Compliance | Hiển thị đầy đủ thông tin theo quy định quản lý KCHTGT; Dữ liệu tải trọng tuân thủ Thông tư 48/2017/TT-BGTVT | 100% |
| Audit | Mọi lần truy cập GET chi tiết Cầu cảng (userId, pierId, timestamp) được ghi log | 100% access events logged |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-024-01 | AC-024-01 | Happy path: Người dùng có quyền xem chi tiết Cầu cảng — tất cả trường hiển thị đúng, API trả về JOIN đầy đủ (Berth, Port, documents) | Integration |
| TS-024-02 | AC-024-03 | Badge rendering: Kiểm tra màu badge cho từng tổ hợp operationalStatus × approvalStatus (OPERATIONAL + APPROVED, SUSPENDED + PENDING, etc.) | UI |
| TS-024-03 | AC-024-02 | Parent Berth link: Click tên Bến cảng cha → điều hướng đến trang chi tiết BenCang; Nếu Berth bị xóa → hiển thị "(không khả dụng)" | Integration + UI |
| TS-024-04 | AC-024-05 | Action button visibility: Leader/Admin thấy nút Phê duyệt + Từ chối khi PENDING; Asset Manager không thấy; Sau khi APPROVED, chỉ còn nút Chỉnh sửa | Security/RBAC |
| TS-024-05 | AC-024-07 | Metadata visibility: Admin Cục thấy createdBy/updatedBy; Vai trò Staff/Asset Manager không thấy 4 trường metadata | Security/RBAC |
| TS-024-06 | BR-024-01 | Soft-deleted pier: Cầu cảng có deletedAt != null vẫn hiển thị chi tiết, badge xám DA_XOA, không có nút hành động | Integration |
| TS-024-07 | AC-024-01 | Loading state: Trang hiển thị skeleton loading trong khi chờ API response | UI |
| TS-024-08 | AC-024-04 | Empty documents: Cầu cảng không có giấy tờ đính kèm → hiển thị "Không có giấy tờ đính kèm", không crash | UI |
| TS-024-09 | AC-024-01 | Error state: API GET trả về lỗi (network timeout, 500) → hiển thị thông báo lỗi + nút "Thử lại" | Negative/UI |
| TS-024-10 | AC-024-07 | Non-Admin role: Staff xem chi tiết — API response không chứa trường createdBy, updatedBy, createdAt, updatedAt | Security/API |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Read-only feature — CauCang entity đã được định nghĩa bởi F-020; không thêm aggregate/event mới |
| Architecture affected? | No | GET endpoint pattern đã có tiền lệ (F-016 detail BenCang); field-level RBAC đã triển khai ở F-007/F-009; tab data dùng chung endpoint query pattern |
| Implementation clear? | Yes | Detail page pattern rõ ràng: GET + JOIN Berth/Port + documents query + role-based field projection; collapsible groups và tab UI dùng FormCrud component với formMode=DETAIL |
| **Verdict** | `Ready for Technical Lead planning` | Read-only detail feature với pattern đã có; không có quyết định kiến trúc mới; implementation approach rõ ràng từ các detail page trước đó (F-016 BenCang detail) |
