# SPEC DÙNG CHUNG: Quy trình phê duyệt 2 cấp KCHT (approval-2-level-spec)

> **Single source of truth cho PHẦN PHÊ DUYỆT của toàn bộ 28 loại Kết cấu hạ tầng hàng hải (KCHT).**
> Mọi `feature-brief.md` của các loại KCHT (Port, Berth, Pier, DryPort, WaterZone, BeaconLight, Buoy,
> CoastalStationVTS/LRIT/Inmarsat/Haiphong/CospasSarsat, BuoyStation, NavigationChannel, VtsSystem,
> GIS Point/Line/Polygon, …) **tham chiếu file này** (`docs/modules/M-1006-thong-nhat-phe-duyet-2-cap-kchtgt/sa/00-lean-architecture.md`)
> cho phần "Trạng thái và phê duyệt" thay vì mô tả lại luồng. Đây là nhánh triển khai (SA chốt) của
> `docs/modules/M-1006-thong-nhat-phe-duyet-2-cap-kchtgt/ba/00-lean-spec.md` — đúng mẫu "one spec every feature references"
> mà M-001 đã làm với `docs/modules/M-001-quan-tri-he-thong/sa/00-lean-architecture.md`.

| Mục | Giá trị |
|---|---|
| Đường dẫn | `docs/modules/M-1006-thong-nhat-phe-duyet-2-cap-kchtgt/sa/00-lean-architecture.md` |
| Nguồn nghiệp vụ | `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root) |
| Nguồn đặc tả | `docs/modules/M-1006-thong-nhat-phe-duyet-2-cap-kchtgt/ba/00-lean-spec.md` (BA) |
| Thiết kế kỹ thuật | `docs/modules/M-1006-thong-nhat-phe-duyet-2-cap-kchtgt/design/00-design-plan.md` (SA) |
| Trạng thái | Chốt (SA) — 2026-08-21 |

## 1. Phạm vi và cách dùng
- Quy trình **giống hệt nhau cho cả 28 loại** — không nhánh rẽ theo loại (quy tắc 10); số vòng duyệt chỉ phụ thuộc **đơn vị của người gửi** (quy tắc 14).
- Feature-brief của một loại KCHT: chỉ khai báo phần RIÊNG (trường dữ liệu, validation theo loại, endpoint) và ghi
  `Phần phê duyệt: theo docs/modules/M-1006-thong-nhat-phe-duyet-2-cap-kchtgt/sa/00-lean-architecture.md` — không chép bảng trạng thái/chuyển trạng thái vào brief.
- Không trộn với quy trình phê duyệt **tài sản** (2 trạng thái "thay đổi nguyên giá" — quy tắc 13).

## 2. 7 trạng thái nghiệp vụ và ánh xạ enum (canonical — SA chốt)
| # | Trạng thái nghiệp vụ | `ApprovalStatus` | Ghi chú |
|---|---|---|---|
| 1 | Lưu tạm | `DRAFT` (0) | Mặc định khi tạo |
| 2 | Chờ Cảng vụ / Chi cục duyệt | `PENDING_APPROVAL` (2) | Submit từ đơn vị cấp dưới Cục |
| 3 | Chờ Cục duyệt | `APPROVED_LEVEL1` (3) | Vòng 1 đã duyệt xong — **level-completed**; cũng là đích khi người gửi cấp Cục submit thẳng (bỏ vòng 1) |
| 4 | Bị Cảng vụ / Chi cục trả về | `REJECTED_LEVEL1` (thay thế `REJECTED`; ordinal chốt khi implement — không xung đột `ARCHIVED(7)`) | Vòng 1 từ chối — user-confirmed split |
| 5 | Bị Cục trả về | `REJECTED_LEVEL2` (như trên) | Vòng 2 từ chối — user-confirmed split |
| 6 | Đã duyệt | `APPROVED` (5) | Duy nhất vào báo cáo tổng hợp (quy tắc 12) |
| 7 | Đã xóa (lịch sử) | `ARCHIVED` (7) — giá trị MỚI cuối enum | Soft-delete; giữ DB, không hiển thị |

> **Canonical:** `APPROVED_LEVEL1` = "vòng 1 đã duyệt xong, đang chờ vòng 2". `APPROVED_LEVEL2` **không dùng**
> trong luồng thống nhất (giữ enum cho ORDINAL + dữ liệu cũ). `PROPOSED`(1) không thuộc luồng thống nhất
> (legacy; engine coi như DRAFT-equivalent ở lần sửa đầu). `ApprovalLevel` chỉ là bộ ghi nhận cấp (audit). `REJECTED`
> được tách (user-confirmed) thành `REJECTED_LEVEL1` (vòng 1 trả về) + `REJECTED_LEVEL2` (vòng 2 trả về) — thay thế
> giá trị REJECTED đơn; migration ánh xạ dữ liệu cũ qua `approval_logs.cap`. `APPROVED_LEVEL2` là legacy, không dùng
> trong luồng thống nhất, không migration.

## 3. Bảng chuyển trạng thái (mỗi dòng = 1 test case)
### 3.1. Hợp lệ
| TT | Từ | Hành động | Sang | Người thực hiện |
|---|---|---|---|---|
| T01 | (mới) | Lưu tạm | Lưu tạm | Người nhập |
| T02 | (mới) | Gửi duyệt — cấp Cảng vụ/Chi cục | Chờ Cảng vụ/Chi cục duyệt | Người nhập |
| T03 | (mới) | Gửi duyệt — cấp Cục (quy tắc 14) | Chờ Cục duyệt | Người nhập |
| T04 | Lưu tạm | Gửi duyệt — cấp Cảng vụ/Chi cục | Chờ Cảng vụ/Chi cục duyệt | Người nhập |
| T05 | Lưu tạm | Gửi duyệt — cấp Cục | Chờ Cục duyệt | Người nhập |
| T06 | Chờ Cảng vụ/Chi cục duyệt | Đồng ý (vòng 1) | Chờ Cục duyệt | Lãnh đạo Cảng vụ/Chi cục |
| T07 | Chờ Cảng vụ/Chi cục duyệt | Từ chối (vòng 1) | Bị Cảng vụ/Chi cục trả về (`REJECTED_LEVEL1`) | Lãnh đạo Cảng vụ/Chi cục |
| T08 | Chờ Cục duyệt | Đồng ý (vòng 2) | Đã duyệt | Lãnh đạo Cục |
| T09 | Chờ Cục duyệt | Từ chối (vòng 2) | Bị Cục trả về (`REJECTED_LEVEL2`) | Lãnh đạo Cục |
| T10 | Bị Cảng vụ/Chi cục trả về (`REJECTED_LEVEL1`) | Sửa + gửi lại | Chờ Cảng vụ/Chi cục duyệt (**vòng 1**) | Người nhập |
| T11 | Bị Cục trả về (`REJECTED_LEVEL2`) | Sửa + gửi lại | Chờ Cảng vụ/Chi cục duyệt (**vòng 1** — user-confirmed) | Người nhập |
| T12 | Đã duyệt | Sửa ("Lưu và phê duyệt") | Đã duyệt (bản cũ → change log) | Người có quyền phê duyệt |
| T13 | Lưu tạm | Xóa | Đã xóa (lịch sử) | Người nhập |
| T14 | Bất kỳ | Dữ liệu tích hợp lưu thẳng | Đã duyệt | Hệ thống ngoài |
### 3.2. Cấm (ca âm tính bắt buộc)
| TT | Từ | Hành động bị cấm | Quy tắc |
|---|---|---|---|
| N01 | Chờ Cảng vụ/Chi cục duyệt | Duyệt vòng 2 nhảy thẳng | Quy tắc 4 |
| N02 | Chờ Cục duyệt | Hành động vòng 1 (duyệt ngược) | Quy tắc 4 |
| N03 | Lưu tạm | Gửi duyệt thiếu thông tin bắt buộc | Quy tắc 1 |
| N04 | ≠ Lưu tạm | Xóa | Quy tắc 11 |
| N05/N06 | Đang chờ (2 vòng) | Người gửi tự duyệt (4-eyes) | Chống tự duyệt |
| N07/N08 | Đang chờ (2 vòng) | Từ chối không nhập lý do | Từ chối bắt buộc lý do |
| N09 | Đang chờ (2 vòng) | Sửa nội dung | Quy tắc 7 — khóa sửa |
| N10 | Đã duyệt | Gửi duyệt lại (phải "Lưu và phê duyệt") | UC-8 |
| N11 | Bị trả về (2 vòng) | Gửi lại giữ nguyên nội dung | Quy tắc 6 |

## 4. Quy tắc bắt buộc (tóm tắt BR-001..BR-020)
1. BR-003/014: người gửi thuộc cấp Cục (`orgUnit.level == 1` — root "Cục Hàng hải và Đường thủy Việt Nam",
   `orgunit/entity/OrgUnit.java:47,106`, `seeder/M001DataSeeder.java:69-91`) → submit thẳng "Chờ Cục duyệt";
   số vòng tính tại thời điểm gửi, ghi vào approval log (kèm cap).
2. BR-004: tối đa 2 vòng, đúng thứ tự, không nhảy vòng / duyệt ngược.
3. BR-005: từ chối vòng 1 → `REJECTED_LEVEL1` (log REJECTED + cap CANG_VU); vòng 2 → `REJECTED_LEVEL2` (log REJECTED + cap CUC).
4. BR-006: bị trả về bắt buộc "Lưu và gửi duyệt" (ghi change log trước khi chuyển trạng thái).
5. BR-007/020: mỗi gửi/duyệt/từ chối ghi 1 bản `approval_logs` INSERT-only (entityType, entityId, decision,
   reason, decidedBy, decidedAt, cap) — không sửa/xóa log.
6. BR-008: quyền theo chức vụ — Cảng vụ/Chi cục duyệt vòng 1, Cục duyệt vòng 2.
7. BR-009: lưu thẳng "Đã duyệt" chỉ cho kênh tích hợp (T14).
8. BR-011/017: mọi thay đổi ghi change log (bản cũ); chỉ Lưu tạm xóa được (soft-delete → ARCHIVED, giữ DB + deletedAt).
9. BR-015: 4-eyes — người duyệt ≠ người tạo/gửi, cả 2 vòng ("Bạn không thể phê duyệt bản do chính mình gửi").
10. BR-016: lý do từ chối bắt buộc, sau trim ≥ 10 ký tự ("Lý do từ chối phải có ít nhất 10 ký tự").
11. BR-018: sửa Đã duyệt bằng "Lưu và phê duyệt" — bản cũ vào change log, giữ Đã duyệt.
12. BR-019: đang chờ → khóa sửa; Đã xóa → không sửa/duyệt/gửi.
13. BR-012: chỉ Đã duyệt vào báo cáo tổng hợp.

## 5. Triển khai kỹ thuật (contract cho implementer)
- **Engine duy nhất:** `port/service/shared/ApprovalWorkflowService.java` (mở rộng 2 cấp: `submit/approveLevel1/
  rejectLevel1/approveLevel2/rejectLevel2/saveAndSubmit/saveAndApprove/softDelete/directApprove` — design plan §4.1).
  Mọi service phê duyệt 28 loại ủy quyền vào engine. Reject targets: `rejectLevel1` → `REJECTED_LEVEL1`,
  `rejectLevel2` → `REJECTED_LEVEL2` (user-confirmed split).
- **Trạng thái:** cột `approval_status` (`@Enumerated(ORDINAL)`) là nguồn sự thật duy nhất; String status / enum hiển thị
  (Buoy `"APPROVED_L1"`, `StationStatus`, GIS `Status`) là giá trị **suy ra** trong response mapper.
- **Nhật ký:** approval log = `approval_logs` (INSERT-only); change log = `change_logs` (mẫu `port/entity/ChangeLog.java`).
- **Data scope:** `orgUnitId` + `@Filter(orgUnitFilter)` + controller `@DataScope`; chiều GHI validate
  `OrgUnitScopeService.allows(...)`; tên đơn vị qua `OrgUnitCacheService` (+ `evictAfterCommit()`).
- **Phân quyền:** `@PreAuthorize` `kcht:<action>` (create/update/delete/submit/approve_level1/approve_level2/reject/
  view/view_sensitive) — seed trong `config/PermissionSeeder.java`; Admin Cục thêm `kcht:view_sensitive` + full scope.
- **Thông điệp:** tiếng Việt có dấu; identifier tiếng Anh chuẩn.

## 6. Tham chiếu chéo
| Tài liệu | Vai trò |
|---|---|
| `docs/modules/M-1006-thong-nhat-phe-duyet-2-cap-kchtgt/ba/00-lean-spec.md` | Đặc tả nghiệp vụ gốc (7 trạng thái, BR, AC-01..25, DP-1..10) |
| `docs/modules/M-1006-thong-nhat-phe-duyet-2-cap-kchtgt/design/00-design-plan.md` | Thiết kế kỹ thuật (engine API, guards, migration, work orders) |
| `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root) | Tài liệu nghiệp vụ gốc của chủ dự án |
| `docs/modules/M-001-quan-tri-he-thong/sa/00-lean-architecture.md` | Mẫu "one spec every feature references" |
