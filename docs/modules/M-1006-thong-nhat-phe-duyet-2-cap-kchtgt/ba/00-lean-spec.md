---
feature-id: M-1006
document: lean-spec
output-mode: lean
last-updated: 2026-08-21
source-of-truth: QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md
---

# Lean Spec: Thống nhất quy trình phê duyệt 2 cấp KCHT (M-1006)

## 1. Summary

Module M-1006 thống nhất **toàn bộ 28 chức năng phê duyệt Kết cấu hạ tầng hàng hải (KCHT)** về **MỘT quy trình phê duyệt 2 cấp** duy nhất: vòng 1 = Cảng vụ/Chi cục, vòng 2 = Cục — theo tài liệu nghiệp vụ gốc `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root) làm **nguồn sự thật duy nhất** (source of truth). Quy trình **giống hệt nhau cho cả 28 loại**; số vòng duyệt (1 hoặc 2) chỉ phụ thuộc **đơn vị của người gửi**, không phụ thuộc loại (quy tắc 10, 14).

Đây là **spec chung duy nhất** cho quy trình phê duyệt: mọi `feature-brief.md` của các loại KCHT (Port, Berth, Pier, DryPort, WaterZone, BeaconLight, Buoy, CoastalStation*, NavigationChannel, VtsSystem, GIS Point/Line/Polygon, …) **tham chiếu spec này** cho phần trạng thái/phê duyệt thay vì mô tả lại — theo đúng mẫu "one spec every feature references" mà M-001 đã làm với `sa/00-lean-architecture.md`. Phạm vi kỹ thuật (service dùng chung, bảng, endpoint) do SA chốt ở giai đoạn thiết kế; phần này chỉ đặc tả nghiệp vụ + ràng buộc triển khai bắt buộc.

## 2. Scope

### In Scope
- Quy trình phê duyệt 2 cấp dùng chung cho **28 loại KCHT** (danh sách loại do mỗi module con giữ, không liệt kê lại ở đây)
- 7 trạng thái nghiệp vụ + bảng chuyển trạng thái (khớp mục 7 của tài liệu gốc — mỗi dòng = 1 test case)
- Các quy tắc bắt buộc: phân cấp theo đơn vị gửi (quy tắc 14), 4-eyes (chống tự duyệt), từ chối bắt buộc nhập lý do, nhật ký phê duyệt + nhật ký thay đổi đầy đủ, xóa mềm chỉ từ trạng thái Lưu tạm
- Phân quyền dạng `<resource>:<action>` + quyền đặc biệt Admin Cục
- Data scope theo đơn vị (orgUnitId + orgUnitFilter) cho mọi entity nghiệp vụ KCHT
- Ánh xạ 7 trạng thái nghiệp vụ sang `ApprovalStatus` / `ApprovalLevel` (đã chốt — mục 3.2)

### Out of Scope
- **Không** đặc tả lại CRUD của từng loại KCHT (mỗi module con giữ feature-brief riêng) — chỉ đặc tả phần phê duyệt dùng chung
- **Không** thiết kế kỹ thuật (service dùng chung, tên bảng, migration) — thuộc SA
- Quy trình phê duyệt **tài sản** (không phải KCHT) có 2 trạng thái riêng cho "thay đổi nguyên giá" — **không trộn** với quy trình này (quy tắc 13)
- Báo cáo tổng hợp (chỉ tiêu dùng dữ liệu trạng thái Đã duyệt — quy tắc 12, không đặc tả tại đây)
- Tích hợp dữ liệu ngoài: chỉ quy định hành vi (lưu thẳng Đã duyệt), không đặc tả giao thức tích hợp

## 3. Trạng thái nghiệp vụ (7 states) và ánh xạ enum (đã chốt)

### 3.1. 7 trạng thái nghiệp vụ (nguồn: QUY-TRINH mục 1)

| # | Tên trạng thái (nghiệp vụ) | Diễn giải |
|---|---|---|
| 1 | Lưu tạm | Hồ sơ đang soạn dở, chỉ người nhập nhìn thấy, chưa ai duyệt |
| 2 | Chờ Cảng vụ / Chi cục duyệt | Đã gửi đi, đang chờ cấp thứ nhất xử lý (vòng 1) |
| 3 | Chờ Cục duyệt | Chờ cấp Cục xử lý (do cấp Cảng vụ/Chi cục chuyển lên, hoặc do cấp Cục gửi đi — bỏ qua vòng 1) |
| 4 | Bị Cảng vụ / Chi cục trả về | Cấp thứ nhất từ chối, trả lại người nhập |
| 5 | Bị Cục trả về | Cấp cuối từ chối, trả lại người nhập |
| 6 | Đã duyệt | Hoàn tất toàn bộ quy trình, hồ sơ chính thức có hiệu lực |
| 7 | Đã xóa (lịch sử) | Đã xóa mềm (chỉ xóa được khi đang Lưu tạm); lưu để đối chiếu, không hiển thị trên màn hình |

> Quy tắc 2: hồ sơ chỉ có đúng 7 trạng thái trên, không có trạng thái nào khác.

### 3.2. Ánh xạ chính thức sang `ApprovalStatus` / `ApprovalLevel` (đã chốt — user-confirmed 2026-08-21)

Enum hiện có (đã xác minh code): `ApprovalStatus` = DRAFT(0), PROPOSED(1), PENDING_APPROVAL(2), APPROVED_LEVEL1(3), APPROVED_LEVEL2(4), APPROVED(5), REJECTED(6) — `common/entity/ApprovalStatus.java`; `ApprovalLevel` = LEVEL_0(0), LEVEL_1(1), LEVEL_2(2) — `common/enums/ApprovalLevel.java`.

**Ánh xạ CHÍNH THỨC (ngữ nghĩa "cấp đã duyệt xong" — đúng nghĩa tên enum, khớp Buoy + CoastalStationVTS + GIS):**

| Trạng thái nghiệp vụ | `ApprovalStatus` (đã chốt) | Ghi chú |
|---|---|---|
| Lưu tạm | `DRAFT` (0) | Nhất quán với mọi luồng hiện có |
| Chờ Cảng vụ / Chi cục duyệt | `PENDING_APPROVAL` (2) | "Đang chờ phê duyệt" — đúng nghĩa, khớp mọi đường submit hiện có (port/beacon/station đều set PENDING_APPROVAL khi gửi) |
| Chờ Cục duyệt | `APPROVED_LEVEL1` (3) | Vòng 1 đã duyệt xong → đang chờ vòng 2; đúng nghĩa tên enum + khớp `ApprovalStatus.fromString("APPROVED_L1")` |
| Bị Cảng vụ / Chi cục trả về | **`REJECTED_LEVEL1`** (thay thế `REJECTED`; ordinal chốt tại implementation, không trùng `ARCHIVED`=7) | **ĐÃ CHỐT (quyết định 1):** tách `REJECTED` thành 2 giá trị theo vòng; migration ánh xạ dòng REJECTED cũ qua `approval_logs.cap` (`CANG_VU` → `REJECTED_LEVEL1`, `CUC` → `REJECTED_LEVEL2`) |
| Bị Cục trả về | **`REJECTED_LEVEL2`** (thay thế `REJECTED`; ordinal chốt tại implementation, không trùng `ARCHIVED`=7) | như trên |
| Đã duyệt | `APPROVED` (5) | Nhất quán mọi luồng |
| Đã xóa (lịch sử) | **`ARCHIVED` (7)** | **ĐÃ CHỐT (quyết định 2):** bổ sung `ARCHIVED(7)` = "Đã xóa (lịch sử)"; thêm cuối enum, an toàn với `@Enumerated(ORDINAL)` |

- **`APPROVED_LEVEL2` (4) — ĐÃ CHỐT (quyết định 3):** giữ nguyên như giá trị LEGACY, KHÔNG dùng trong luồng thống nhất (chỉ tài liệu hóa, không có migration).
- `REJECTED` (6): bị thay thế bởi `REJECTED_LEVEL1`/`REJECTED_LEVEL2` trong luồng thống nhất (quyết định 1); `PROPOSED` (1): giữ vì tương thích code cũ, không thuộc tập 7 trạng thái.
- `ApprovalLevel`: LEVEL_0 = chưa có quyết định phê duyệt nào; LEVEL_1 = vòng 1 đã ra quyết định (đồng ý hoặc từ chối); LEVEL_2 = vòng 2 đã ra quyết định. Đây là **bộ ghi nhận cấp đã xử lý** (audit/discriminator), KHÔNG phải trạng thái workflow.

> Mọi acceptance criteria trong spec viết theo **tên trạng thái nghiệp vụ**; ánh xạ enum cố định ở bảng trên (SA chỉ thực thi, không đổi ánh xạ).

## 4. Bảng chuyển trạng thái (Transition Table) — khớp QUY-TRINH mục 7

> Mỗi dòng = 1 test case (QA lập case theo bảng này, thêm các ca âm tính mục 4.2).

### 4.1. Chuyển trạng thái hợp lệ

| TT | Từ trạng thái | Hành động | Sang trạng thái | Người thực hiện | Test case |
|---|---|---|---|---|---|
| T01 | (mới — chưa có hồ sơ) | Lưu tạm (tạo mới) | Lưu tạm | Người nhập | TC-01 |
| T02 | (mới) | Gửi duyệt ngay — người gửi cấp Cảng vụ/Chi cục | Chờ Cảng vụ / Chi cục duyệt | Người nhập | TC-02 |
| T03 | (mới) | Gửi duyệt ngay — người gửi cấp Cục (quy tắc 14) | Chờ Cục duyệt | Người nhập | TC-03 |
| T04 | Lưu tạm | Gửi duyệt — người gửi cấp Cảng vụ/Chi cục | Chờ Cảng vụ / Chi cục duyệt | Người nhập | TC-04 |
| T05 | Lưu tạm | Gửi duyệt — người gửi cấp Cục (quy tắc 14) | Chờ Cục duyệt | Người nhập | TC-05 |
| T06 | Chờ Cảng vụ / Chi cục duyệt | Đồng ý (vòng 1) | Chờ Cục duyệt | Lãnh đạo Cảng vụ / Chi cục | TC-06 |
| T07 | Chờ Cảng vụ / Chi cục duyệt | Từ chối (vòng 1) | Bị Cảng vụ / Chi cục trả về (`REJECTED_LEVEL1`) | Lãnh đạo Cảng vụ / Chi cục | TC-07 |
| T08 | Chờ Cục duyệt | Đồng ý (vòng 2) | Đã duyệt | Lãnh đạo Cục | TC-08 |
| T09 | Chờ Cục duyệt | Từ chối (vòng 2) | Bị Cục trả về (`REJECTED_LEVEL2`) | Lãnh đạo Cục | TC-09 |
| T10 | Bị Cảng vụ / Chi cục trả về | Sửa + gửi lại | Chờ Cảng vụ / Chi cục duyệt (luôn vào lại vòng 1) | Người nhập | TC-10 |
| T11 | Bị Cục trả về | Sửa + gửi lại | Chờ Cảng vụ / Chi cục duyệt (luôn vào lại vòng 1) | Người nhập | TC-11 |
| T12 | Đã duyệt | Sửa (Lưu và phê duyệt) | Đã duyệt (`APPROVED`, bản cũ → nhật ký thay đổi) | Người có quyền phê duyệt | TC-12 |
| T13 | Lưu tạm | Xóa | Đã xóa (lịch sử) (`ARCHIVED`) | Người nhập | TC-13 |
| T14 | Bất kỳ | Dữ liệu tích hợp lưu thẳng | Đã duyệt | Hệ thống ngoài (kênh tích hợp) | TC-14 |

> Lưu ý phân cấp (quy tắc 14): khi người gửi thuộc **cấp Cục**, hành động "Gửi duyệt" (T02/T04) đưa hồ sơ thẳng vào "Chờ Cục duyệt" — bỏ qua "Chờ Cảng vụ / Chi cục duyệt".

> **ĐÃ CHỐT (quyết định 5):** gửi lại sau khi bị trả về (T10/T11) **LUÔN vào lại vòng 1** ("Chờ Cảng vụ / Chi cục duyệt") — kể cả khi hồ sơ bị **Cục** trả về (T11).

### 4.2. Chuyển trạng thái CẤM (ca âm tính bắt buộc — nguồn: QUY-TRINH mục 7 "Case test bắt buộc")

| TT | Từ trạng thái | Hành động bị cấm | Lý do / Quy tắc | Test case |
|---|---|---|---|---|
| N01 | Chờ Cảng vụ / Chi cục duyệt | Đồng ý vòng 2 (nhảy vòng trực tiếp → Đã duyệt) | Quy tắc 4 — không nhảy vòng | TC-15 |
| N02 | Chờ Cục duyệt | Hành động vòng 1 (duyệt ngược → Chờ Cảng vụ / Chi cục duyệt) | Quy tắc 4 — không duyệt ngược | TC-16 |
| N03 | Lưu tạm | Gửi duyệt khi thiếu thông tin bắt buộc | Quy tắc 1 + case test bắt buộc | TC-17 |
| N04 | Bất kỳ ≠ Lưu tạm | Xóa | Quy tắc 11 — chỉ xóa khi Lưu tạm | TC-18 |
| N05 | Chờ Cảng vụ / Chi cục duyệt | Người gửi tự duyệt (4-eyes) | Quy tắc chống tự duyệt (mục 6.3) | TC-19 |
| N06 | Chờ Cục duyệt | Người gửi tự duyệt (4-eyes) | như trên | TC-20 |
| N07 | Chờ Cảng vụ / Chi cục duyệt | Từ chối không nhập lý do | Quy tắc từ chối bắt buộc lý do (mục 6.4) | TC-21 |
| N08 | Chờ Cục duyệt | Từ chối không nhập lý do | như trên | TC-22 |
| N09 | Chờ Cảng vụ / Chi cục duyệt, Chờ Cục duyệt | Sửa nội dung (khóa chỉnh sửa khi đang chờ) | Mục 6.7 | TC-23 |
| N10 | Đã duyệt | Gửi duyệt lại (phải dùng "Lưu và phê duyệt") | Mục 6.8 | TC-24 |
| N11 | Bị Cảng vụ / Chi cục trả về, Bị Cục trả về | Gửi lại giữ nguyên nội dung (không sửa) | Quy tắc 6 — bắt buộc sửa rồi gửi lại (mức kiểm soát: DP-7) | TC-25 |

## 5. Use Cases (ca sử dụng) — nguồn: QUY-TRINH mục 5

| UC | Ca sử dụng | Người thực hiện | Điều kiện trước | Kết quả |
|---|---|---|---|---|
| UC-1 | Tạo mới / Lưu tạm hồ sơ | Người nhập | Đã chọn loại KCHT + đơn vị quản lý; chọn công trình cha nếu loại thuộc công trình cấp trên | Hồ sơ ở Lưu tạm, có thể sửa tiếp |
| UC-2 | Gửi duyệt | Người nhập | Đang Lưu tạm (hoặc đang bị trả về), đủ thông tin bắt buộc | Gửi từ cấp Cảng vụ/Chi cục → Chờ Cảng vụ/Chi cục duyệt; từ cấp Cục → Chờ Cục duyệt; hệ thống ghi người + thời điểm gửi |
| UC-3 | Duyệt vòng 1 | Lãnh đạo Cảng vụ / Chi cục | Đang Chờ Cảng vụ / Chi cục duyệt | Đồng ý → Chờ Cục duyệt; Từ chối → Bị Cảng vụ / Chi cục trả về |
| UC-4 | Duyệt vòng 2 | Lãnh đạo Cục | Đang Chờ Cục duyệt | Đồng ý → Đã duyệt; Từ chối → Bị Cục trả về |
| UC-5 | Trả về (từ chối) | Lãnh đạo vòng 1 hoặc vòng 2 | Hồ sơ đang chờ ở vòng tương ứng | Hồ sơ về tay người nhập với trạng thái "Bị … trả về"; lý do từ chối bắt buộc |
| UC-6 | Sửa lại và gửi lại sau khi bị trả về | Người nhập | Đang Bị … trả về | Quay về Chờ Cảng vụ / Chi cục duyệt, lặp lại quy trình |
| UC-7 | Dữ liệu tích hợp lưu thẳng Đã duyệt | Hệ thống ngoài (kênh tích hợp) | Kênh tích hợp hợp lệ | Hồ sơ ở ngay Đã duyệt, không qua 2 vòng (quy tắc 9) |
| UC-8 | Sửa hồ sơ đã duyệt | Người có quyền phê duyệt | Đang Đã duyệt | "Lưu và phê duyệt": bản cũ vào nhật ký thay đổi, hồ sơ cập nhật, giữ Đã duyệt (không duyệt lại) |
| UC-9 | Xóa hồ sơ nháp | Người nhập | Đang Lưu tạm | Chuyển sang Đã xóa (lịch sử); không hiển thị trên màn hình, lưu để đối chiếu |

## 6. Quy tắc nghiệp vụ (Business Rules)

Mã BR dưới đây dùng cho toàn bộ 28 loại KCHT; nguồn cột "Nguồn" trỏ mục tương ứng trong QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md.

| ID | Quy tắc | Nguồn |
|---|---|---|
| BR-001 | Mọi hồ sơ KCHT bắt buộc chọn loại (type) + đơn vị quản lý (orgUnitId) khi tạo | Quy tắc 1 |
| BR-002 | Hồ sơ chỉ có 7 trạng thái (mục 3.1), không có trạng thái khác | Quy tắc 2 |
| BR-003 | Gửi duyệt đưa hồ sơ về trạng thái chờ theo đơn vị người gửi: cấp Cục → Chờ Cục duyệt; còn lại → Chờ Cảng vụ / Chi cục duyệt | Quy tắc 3, 14 |
| BR-004 | Phê duyệt tối đa 2 vòng theo đúng thứ tự, không nhảy vòng: vòng 1 (Cảng vụ/Chi cục) trước, vòng 2 (Cục) sau; không duyệt ngược | Quy tắc 4 |
| BR-005 | Từ chối vòng 1 → Bị Cảng vụ / Chi cục trả về (`REJECTED_LEVEL1`); từ chối vòng 2 → Bị Cục trả về (`REJECTED_LEVEL2`) | Quy tắc 5 |
| BR-006 | Hồ sơ bị trả về bắt buộc sửa rồi gửi lại (hành động "Lưu và gửi duyệt"), không gửi thẳng giữ nguyên; gửi lại LUÔN quay về Chờ Cảng vụ / Chi cục duyệt (vòng 1) — kể cả khi bị Cục trả về (quyết định 5) | Quy tắc 6 |
| BR-007 | Mỗi lần gửi duyệt và mỗi lần duyệt (đồng ý/từ chối) đều ghi người thực hiện + thời điểm (approval log) | Quy tắc 7 |
| BR-008 | Quyền duyệt theo chức vụ: lãnh đạo Cảng vụ/Chi cục chỉ duyệt vòng 1; lãnh đạo Cục duyệt vòng 2 | Quy tắc 8 |
| BR-009 | Lưu thẳng Đã duyệt (không qua 2 vòng) chỉ dành cho dữ liệu tích hợp từ hệ thống ngoài | Quy tắc 9 |
| BR-010 | Quy trình áp dụng giống nhau cho cả 28 loại KCHT — không nhánh rẽ theo loại trong luồng phê duyệt | Quy tắc 10 |
| BR-011 | Mọi thay đổi nội dung hồ sơ đều ghi nhật ký (bản cũ lưu trong change log); chỉ hồ sơ Lưu tạm mới được xóa (→ Đã xóa (lịch sử) = `ARCHIVED`) | Quy tắc 11 |
| BR-012 | Chỉ hồ sơ Đã duyệt mới vào báo cáo tổng hợp | Quy tắc 12 |
| BR-013 | Không trộn quy trình này với quy trình phê duyệt tài sản (có 2 trạng thái "thay đổi nguyên giá") | Quy tắc 13 |
| BR-014 | Phân cấp theo đơn vị gửi: người gửi thuộc cấp Cục → bỏ qua vòng 1, vào thẳng Chờ Cục duyệt; thuộc cấp Cảng vụ/Chi cục trở xuống → đi đủ 2 vòng. **Xác định cấp Cục bằng `OrgUnit.level` (level-based) — không dùng mã đơn vị cứng (quyết định 4)** | Quy tắc 14 |
| BR-015 | 4-eyes: người duyệt KHÔNG được duyệt hồ sơ do chính mình tạo/gửi, ở cả 2 vòng | Mục 2 + quy tắc chống tự duyệt (đã có trong `CoastalStationVTSService.java:149`) |
| BR-016 | Từ chối (cả 2 vòng → `REJECTED_LEVEL1`/`REJECTED_LEVEL2`) bắt buộc nhập lý do (rejectionReason), sau khi trim không rỗng; đề xuất tối thiểu 10 ký tự (khớp `CoastalStationVTSService.rejectStation`) | UC-5 + quy tắc 7 |
| BR-017 | Soft-delete: chỉ xóa mềm khi ở Lưu tạm; bản ghi giữ trong DB (deletedAt + `ApprovalStatus.ARCHIVED` (7)), loại khỏi truy vấn danh sách thường, không hiển thị trên màn hình; ghi 1 bản nhật ký DELETE | Quy tắc 11 + UC-9 |
| BR-018 | Sửa hồ sơ Đã duyệt bằng thao tác "Lưu và phê duyệt": bản cũ vào change log, giữ trạng thái Đã duyệt, không phải duyệt lại | UC-8 |
| BR-019 | Hồ sơ đang Chờ Cảng vụ/Chi cục duyệt hoặc Chờ Cục duyệt: khóa sửa (chỉ đọc); hồ sơ Đã xóa: không sửa, không duyệt, không gửi | Quy tắc 7 + UC-6 (đối chiếu `WebUtilService.getLstAllowUpdate` hệ thống cũ) |
| BR-020 | Mọi quyết định phê duyệt ghi vào bảng approval log dạng INSERT-only (không sửa/xóa log) kèm cấp duyệt (cap/level) | Quy tắc 7 + `ApprovalLog.java` |

### 6.1. Phân cấp theo đơn vị gửi — chi tiết (quy tắc 14)
- **Cách xác định "người gửi thuộc cấp Cục" — ĐÃ CHỐT (quyết định 4): xác định theo `OrgUnit.level` (level-based), KHÔNG dùng mã đơn vị cứng (hardcoded org code).** Đơn vị của người gửi là đơn vị cấp Cục khi `OrgUnit.level` = hằng số cấp Cục (`OrgUnit.java:47`; khai báo `private Integer level;` tại dòng 106; hệ thống cũ tham chiếu mã cấp `AUTH_ORG_ORG_LEVEL_1_CODE = "G17.43"` chỉ để đối chiếu lịch sử). Nếu đơn vị người gửi **là hoặc nằm dưới** cấp Cảng vụ/Chi cục → đi đủ 2 vòng.
- Quyết định số vòng được tính **tại thời điểm gửi duyệt** và ghi vào approval log (kèm cấp duyệt) để truy vết.

### 6.2. Nhật ký (history) bắt buộc
- **Approval log** (bảng `approval_logs` — `ApprovalLog.java`, INSERT-only): mỗi lần gửi duyệt, đồng ý, từ chối → 1 bản ghi `entityType`, `entityId`, `decision`, `reason`, `decidedBy`, `decidedAt`, `cap` (cấp: `CANG_VU`/`CUC`; với từ chối, `decision` ghi `REJECTED_LEVEL1`/`REJECTED_LEVEL2` theo vòng). Gửi duyệt cũng phải ghi 1 bản (người + thời điểm gửi — quy tắc 7).
- **Change log**: mỗi lần sửa nội dung → 1 bản ghi bản CŨ (before-image) kèm người sửa, thời điểm, trường thay đổi (mẫu hiện có: `ChangeLog` ở port, `BeaconHistoryService`/`StationHistoryService` — SA chốt 1 cơ chế chung, DP-8). "Lưu và phê duyệt" (UC-8) bắt buộc ghi bản cũ trước khi cập nhật.
- Audit params (`operatorId`, `createdBy`, `updatedBy`, `deletedBy`…) bắt buộc truyền đầy đủ vào mọi thao tác thay đổi dữ liệu (soft delete, tạo, sửa) theo AGENTS.md.

## 7. Validation Rules (quy tắc kiểm tra đầu vào)

| ID | Quy tắc | Lỗi trả về (message tiếng Việt có dấu — đề xuất) |
|---|---|---|
| VR-001 | Khi tạo: `type` (loại KCHT) + `orgUnitId` bắt buộc, không null | "Phải chọn loại kết cấu hạ tầng và đơn vị quản lý" |
| VR-002 | Gửi duyệt: toàn bộ trường bắt buộc của loại đã điền đủ (validate theo DTO từng loại); không đủ → chặn, giữ nguyên trạng thái | "Chưa điền đủ thông tin bắt buộc" |
| VR-003 | Từ chối: `rejectionReason` bắt buộc, sau trim không rỗng, ≥ 10 ký tự (đề xuất) | "Lý do từ chối là bắt buộc" / "Lý do từ chối phải có ít nhất 10 ký tự" |
| VR-004 | Mọi trường nhập văn bản phải `.trim()` trước khi lưu/gửi (search/form) | — |
| VR-005 | Ghi đơn vị: khi tạo/sửa phải gán `orgUnitId` (cấm NULL với dữ liệu nghiệp vụ) và validate đơn vị trong phạm vi user (`OrgUnitScopeService.allows(...)`) | "Đơn vị quản lý nằm ngoài phạm vi của bạn" |
| VR-006 | `code` bất biến sau khi tạo | — |
| VR-007 | Enum trạng thái lưu DB dạng số nguyên `@Enumerated(EnumType.ORDINAL)` (không lưu chuỗi) | — |
| VR-008 | Mọi thao tác thay đổi dữ liệu phải truyền đủ audit params (operatorId/deletedBy/updatedBy…) | — |
| VR-009 | Xóa chỉ hợp lệ khi trạng thái = Lưu tạm (BR-017); chuyển → Đã xóa (lịch sử) (`ARCHIVED`) | "Chỉ có thể xóa hồ sơ ở trạng thái Lưu tạm" |
| VR-010 | 4-eyes: trước mỗi quyết định duyệt/từ chối, kiểm tra người duyệt ≠ người tạo/gửi | "Bạn không thể phê duyệt bản do chính mình gửi" |
| VR-011 | Identifier/tên cột/tên biến: tiếng Anh chuẩn; message hiển thị: tiếng Việt có dấu | — |

## 8. Phân quyền (Permissions) — mô hình `<resource>:<action>`

Quyền duyệt gắn với **chức vụ** (lãnh đạo Cảng vụ/Chi cục duyệt vòng 1, lãnh đạo Cục duyệt vòng 2), **không phụ thuộc loại KCHT** (quy tắc 8) → đề xuất **1 resource dùng chung `kcht`** cho cả 28 loại (nếu sau này cần tách theo loại thì dùng `kcht.<type>:<action>` — DP-10). Mọi permission phải được seed trong `PermissionSeeder.java` (định dạng `<resource>:<action>`), gán động cho nhóm/tài khoản — không gán vào role.

| Permission (đề xuất) | Thao tác |
|---|---|
| `kcht:create` | Tạo mới / Lưu tạm |
| `kcht:update` | Sửa (Lưu tạm, Bị trả về, Đã duyệt — theo BR-019) |
| `kcht:delete` | Xóa mềm (chỉ Lưu tạm) |
| `kcht:submit` | Gửi duyệt / Lưu và gửi duyệt |
| `kcht:approve_level1` | Duyệt vòng 1 (đồng ý) — lãnh đạo Cảng vụ / Chi cục |
| `kcht:approve_level2` | Duyệt vòng 2 (đồng ý) — lãnh đạo Cục |
| `kcht:reject` | Từ chối (cả 2 vòng; server xác định vòng theo đơn vị/chức vụ người duyệt) |
| `kcht:view` | Xem hồ sơ trong phạm vi đơn vị (data scope) |
| `kcht:view_sensitive` | **Admin Cục**: xem thêm thông tin nhạy cảm (người tạo, người sửa cuối, thời gian tạo/cập nhật) mà tài khoản khác không thấy |

### Ma trận vai trò × thao tác

| Vai trò | create | update | delete | submit | approve L1 | approve L2 | reject | view | view_sensitive |
|---|---|---|---|---|---|---|---|---|---|
| Nhân viên nhập (đơn vị quản lý) | ✓ | ✓ (Lưu tạm / Bị trả về) | ✓ (Lưu tạm) | ✓ | ✗ | ✗ | ✗ | ✓ (đơn vị mình) | ✗ |
| Lãnh đạo Cảng vụ / Chi cục | ✗ | ✓ (Lưu và phê duyệt — nếu được cấp) | ✗ | ✗ | ✓ | ✗ | ✓ (vòng 1) | ✓ (subtree) | ✗ |
| Lãnh đạo Cục | ✗ | ✓ (Lưu và phê duyệt) | ✗ | ✓ (hồ sơ cấp Cục gửi) | ✗ | ✓ | ✓ (vòng 2) | ✓ (full) | ✗ |
| **Admin Cục** | theo cấp | theo cấp | theo cấp | theo cấp | theo cấp | theo cấp | theo cấp | ✓ (full) | **✓** |

> Tài khoản ROLE_SYSTEM_ADMIN vượt qua mọi kiểm tra quyền (theo AGENTS.md). Admin Cục ngoài `kcht:view_sensitive` còn được full data scope qua `orgunit:scope_all`/`admin:all` (mục 9). Máy chủ kiểm tra từng thao tác theo `<resource>:<action>` (`@PreAuthorize` + PermissionMiddleware) — thiếu quyền → 403.

## 9. Data scope theo đơn vị (bắt buộc với mọi entity nghiệp vụ KCHT)

Tuân thủ AGENTS.md "Data Scope Convention" (quyết định nghiệp vụ chốt 2026-08-20):

1. Mọi entity nghiệp vụ KCHT mới/sửa phải có trường đơn vị `orgUnitId` (UUID) + khai `@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")` (cột khác thì đổi condition tương ứng).
2. Controller bắt buộc khai `@DataScope` (class-level) — nếu không filter không bao giờ được kích hoạt.
3. Khi tạo/sửa phải gán đơn vị (từ request hoặc fallback đơn vị user thao tác) — **cấm để NULL**; chiều GHI phải validate `OrgUnitScopeService.Scope.allows(...)` — không gán dữ liệu vào đơn vị ngoài phạm vi.
4. Migration thay đổi schema phải kèm backfill dữ liệu cũ (org_unit_id NULL → gán từ created_by).
5. Phạm vi đọc: đơn vị nào xem dữ liệu đơn vị đó; đơn vị cha xem subtree; Cục xem full (`orgunit:scope_all`/`admin:all`).
6. Hiển thị tên đơn vị qua `OrgUnitCacheService` (entity/request chỉ lưu/truyền `orgUnitId`; response kèm `orgUnitName`); mọi thay đổi đơn vị gọi `evictAfterCommit()`.
7. Ngoại lệ đã chốt: Dashboard trang chủ (không thuộc module này). Ngoại lệ khác phải SA/BA chốt và ghi rõ ở feature-brief từng loại.

> Phân cấp vòng duyệt (quy tắc 14) tái sử dụng chính cây đơn vị này: xác định cấp của đơn vị người gửi bằng `OrgUnit.level` (đã chốt — quyết định 4).

## 10. Hiện trạng code (4 pattern — đã xác minh, là động lực thống nhất)

| # | Pattern | File (anchor) | Hành vi hiện tại | Lệch so với spec thống nhất |
|---|---|---|---|---|
| 1 | 1 cấp dùng chung | `port/service/shared/ApprovalWorkflowService.java:46,71` | PENDING_APPROVAL → APPROVED/REJECTED; reject bắt buộc lý do | Không có vòng L1/L2; Port/Pier/WaterZone/DryPort ủy quyền cho nó (PortApprovalService.java:38, PierApprovalService.java:30, WaterZoneApprovalService.java:30, DryPortApprovalService.java:31) |
| 2 | 2 cấp riêng (bespoke) | `port/service/BerthApprovalService.java:40-56` | `cap=CANG_VU` yêu cầu APPROVED_LEVEL1 → APPROVED_LEVEL2; `cap=CUC` yêu cầu APPROVED_LEVEL2 → APPROVED; từ chối → REJECTED | Đúng 2 cấp nhưng riêng cho Berth; 1 trạng thái REJECTED cho cả 2 vòng trả về; chưa có 4-eyes; submit set APPROVED_LEVEL1 (`BerthService.java:388`) — ngữ nghĩa "cấp đang chờ" (luồng thống nhất dùng ngữ nghĩa "cấp đã duyệt" — mục 3.2) |
| 3 | Beacon không nhất quán | `beacon/service/BeaconLightService.java:400-411`; `beacon/service/BuoyService.java:574-625` | BeaconLight approveL1: PENDING_APPROVAL → "APPROVED" (nhảy thẳng, bỏ vòng 2); Buoy: PENDING_APPROVAL → "APPROVED_L1" → "PUBLISHED" (đủ 2 vòng nhưng status là String) | Trong cùng cụm 2 hành vi khác nhau; status dùng String thay vì `ApprovalStatus` |
| 4 | Station 1 cấp + userId cứng | `station/service/CoastalStation*Service.java` (approveStation/rejectStation); controller cứng `userId = 1L` (`CoastalStationVTSController.java:81,92`; `CoastalStationLRITController.java:96,105`) + TODO "Wave 2" (`CoastalStationVTSController.java:80,91`) | approveStation(boolean) 1 cổng cho cả 2 vòng; 4-eyes đã có (`CoastalStationVTSService.java:149`); từ chối reset về chờ | Không tách vòng 1/vòng 2 ở API; userId không lấy từ security context |
| 5 | 2 cấp tham chiếu thứ hai | `gis/point/service/PointObjectService.java:136-164`, `gis/line/service/LineObjectService.java:146-174`, `gis/polygon/service/PolygonObjectService.java:142-170` | approveL1/approveL2 tách biệt (gate Status.PENDING_APPROVAL) | Là chuẩn 2 cấp thứ 2 — dùng làm tham chiếu nhất quán cho SA |

**Kết luận hiện trạng:** enum dùng chung đã hỗ trợ 2 cấp, nhưng 5 cụm triển khai lệch nhau (1 cấp / 2 cấp / String status / userId cứng). M-1006 đưa về **1 service engine chung** (SA thiết kế) + spec này làm chuẩn hành vi duy nhất. Phần spec KHÔNG chốt thiết kế service — SA chốt; nhưng hành vi phải khớp 100% bảng mục 4.

## 11. ACCEPTANCE CRITERIA (QA oracle — viết theo tên trạng thái nghiệp vụ; ánh xạ enum cố định tại mục 3.2)

> Cách đọc: mỗi hàng = 1 tiêu chí Given/When/Then. QA dùng làm oracle; "kết quả quan sát được" là trạng thái hồ sơ, bản ghi log, mã lỗi/message trả về.

| ID | Given | When | Then (oracle) | Liên kết |
|---|---|---|---|---|
| AC-01 | User có `kcht:create` tại đơn vị X tạo hồ sơ KCHT với đủ `type` + `orgUnitId`, chọn "Lưu tạm" | Gửi yêu cầu tạo | Hồ sơ tồn tại ở trạng thái **Lưu tạm** (ánh xạ `DRAFT`), chỉ user phạm vi đơn vị X thấy; chưa có bản ghi approval log | T01/TC-01, BR-001 |
| AC-02 | Hồ sơ Lưu tạm, người gửi thuộc đơn vị cấp Cảng vụ/Chi cục, đủ trường bắt buộc | "Gửi duyệt" | Trạng thái = **Chờ Cảng vụ / Chi cục duyệt**; approval log có 1 bản ghi gửi duyệt (actor + thời điểm) | T04/TC-04, BR-003/007 |
| AC-03 | Hồ sơ Lưu tạm, **người gửi thuộc cấp Cục** | "Gửi duyệt" | Trạng thái = **Chờ Cục duyệt** trực tiếp (bỏ qua vòng 1) — không bao giờ đi qua Chờ Cảng vụ / Chi cục duyệt | T05/TC-05, BR-014 |
| AC-04 | Hồ sơ Lưu tạm thiếu trường bắt buộc | "Gửi duyệt" | Bị chặn (4xx), message tiếng Việt "chưa điền đủ thông tin bắt buộc", trạng thái không đổi, không ghi log gửi | N03/TC-17, VR-002 |
| AC-05 | Hồ sơ Chờ Cảng vụ / Chi cục duyệt; actor = lãnh đạo Cảng vụ/Chi cục có `kcht:approve_level1`, khác người gửi | "Đồng ý" | Trạng thái = **Chờ Cục duyệt**; approval log: decision APPROVED, cap `CANG_VU`, actor + thời điểm | T06/TC-06, BR-004/008 |
| AC-06 | Hồ sơ Chờ Cảng vụ / Chi cục duyệt | "Từ chối" kèm lý do (≥10 ký tự) | Trạng thái = **Bị Cảng vụ / Chi cục trả về** (`REJECTED_LEVEL1`); rejectionReason lưu đúng; approval log ghi decision REJECTED_LEVEL1 + cap `CANG_VU` | T07/TC-07, BR-005/016 |
| AC-07 | Hồ sơ Chờ Cục duyệt; actor = lãnh đạo Cục có `kcht:approve_level2`, khác người gửi | "Đồng ý" | Trạng thái = **Đã duyệt**; approval log APPROVED + cap `CUC` | T08/TC-08, BR-004/008 |
| AC-08 | Hồ sơ Chờ Cục duyệt | "Từ chối" kèm lý do | Trạng thái = **Bị Cục trả về** (`REJECTED_LEVEL2`); log REJECTED_LEVEL2 + cap `CUC` | T09/TC-09, BR-005/016 |
| AC-09 | Hồ sơ đang chờ (bất kỳ vòng nào) | "Từ chối" với lý do trống/sau trim rỗng | Bị chặn, message "Lý do từ chối là bắt buộc", trạng thái không đổi, không ghi log | N07/N08/TC-21/22, BR-016 |
| AC-10 | Người tạo/gửi hồ sơ tự thực hiện duyệt vòng 1 | "Đồng ý" (vòng 1) | Bị chặn (403/422), message "Bạn không thể phê duyệt bản do chính mình gửi", trạng thái không đổi | N05/TC-19, BR-015 |
| AC-11 | Người tạo/gửi hồ sơ tự thực hiện duyệt vòng 2 | "Đồng ý" (vòng 2) | Bị chặn, cùng message, trạng thái không đổi | N06/TC-20, BR-015 |
| AC-12 | Hồ sơ Chờ Cảng vụ / Chi cục duyệt | Actor có `kcht:approve_level2` duyệt thẳng | Bị chặn — **không nhảy vòng** (Chờ Cảng vụ / Chi cục duyệt → Đã duyệt là bất hợp lệ); trạng thái không đổi | N01/TC-15, BR-004 |
| AC-13 | Hồ sơ Chờ Cục duyệt | Hành động vòng 1 (duyệt/từ chối cấp Cảng vụ/Chi cục) | Bị chặn — **không duyệt ngược**; trạng thái không đổi | N02/TC-16, BR-004 |
| AC-14 | Hồ sơ Bị Cảng vụ / Chi cục trả về hoặc Bị Cục trả về | "Sửa và gửi duyệt lại" | Trạng thái = **Chờ Cảng vụ / Chi cục duyệt** — quyết định 5: re-submit LUÔN vào lại vòng 1, kể cả sau khi bị Cục trả về; change log ghi bản sửa | T10/T11/TC-10/11, BR-006 |
| AC-15 | Hồ sơ Đã duyệt; actor có quyền phê duyệt | "Lưu và phê duyệt" (sửa) | Hồ sơ cập nhật, trạng thái GIỮ **Đã duyệt** (không duyệt lại); bản cũ có trong change log | T12/TC-12, BR-018 |
| AC-16 | Hồ sơ Lưu tạm | "Xóa" | Hồ sơ → **Đã xóa (lịch sử)** (`ARCHIVED`): vẫn còn trong DB (deletedAt + trạng thái ARCHIVED), KHÔNG xuất hiện trong danh sách thường, không thể gửi/duyệt/sửa; có bản ghi nhật ký DELETE với deletedBy | T13/TC-13, BR-017 |
| AC-17 | Hồ sơ KHÔNG ở Lưu tạm (Chờ duyệt/Đã duyệt/Bị trả về/Đã xóa) | "Xóa" | Bị chặn, message "Chỉ có thể xóa hồ sơ ở trạng thái Lưu tạm", trạng thái không đổi | N04/TC-18, BR-017 |
| AC-18 | Kênh tích hợp hợp lệ đẩy hồ sơ từ hệ thống ngoài | Hệ thống nhận dữ liệu tích hợp | Hồ sơ lưu thẳng **Đã duyệt**, không qua 2 vòng, không tạo approval log của user; không thể tái hiện bằng thao tác UI thường | T14/TC-14, BR-009 |
| AC-19 | Chạy AC-01→AC-17 trên **từng loại** trong 28 loại KCHT | Thực thi luồng đầy đủ | Hành vi trạng thái/chuyển trạng thái/validation/history **giống hệt nhau**; luồng phê duyệt không có nhánh rẽ theo loại | BR-010 |
| AC-20 | Bất kỳ chuyển trạng thái nào xảy ra (gửi/duyệt/từ chối/sửa/xóa) | Kiểm tra audit | Approval log + change log ghi đủ actor + thời điểm + (from/to hoặc bản cũ); approval log **INSERT-only** — không có UPDATE/DELETE trên approval_logs | BR-007/011/020 |
| AC-21 | User không có `kcht:approve_level1`/`approve_level2`/`reject` | Gọi endpoint duyệt/từ chối | 403 Forbidden; không thay đổi trạng thái | BR-008, mục 8 |
| AC-22 | Admin Cục xem hồ sơ (có `kcht:view_sensitive`) | Mở chi tiết | Thấy thêm người tạo, người sửa cuối, thời gian tạo/cập nhật; user thường không thấy | Mục 8 |
| AC-23 | User đơn vị X tạo hồ sơ gán `orgUnitId` = đơn vị Y ngoài phạm vi (hoặc NULL) | Lưu/gửi | Bị chặn (validate scope); không ghi hồ sơ ngoài phạm vi | Mục 9, VR-005 |
| AC-24 | User đơn vị X mở danh sách | Lọc danh sách | Chỉ thấy hồ sơ của X + subtree (orgUnitFilter); Cục (scope_all) thấy full | Mục 9 |
| AC-25 | Hồ sơ bất kỳ | Kiểm tra trạng thái hiện tại | Luôn thuộc đúng 1 trong 7 trạng thái nghiệp vụ — ánh xạ enum tương ứng `DRAFT`, `PENDING_APPROVAL`, `APPROVED_LEVEL1`, `REJECTED_LEVEL1`, `REJECTED_LEVEL2`, `APPROVED`, `ARCHIVED`; không xuất hiện `REJECTED`/`APPROVED_LEVEL2`/`PROPOSED` trong luồng thống nhất (tập đóng) | BR-002 |

## 12. Non-Functional Requirements

| Lĩnh vực | Yêu cầu |
|---|---|
| Performance | API danh sách < 500ms (phân trang); thao tác duyệt/từ chối < 200ms; không N+1 khi load hồ sơ + history |
| Security | Mọi endpoint phê duyệt có `@PreAuthorize` theo `<resource>:<action>`; enum lưu ORDINAL; trim đầu vào; message lỗi tiếng Việt có dấu |
| Reliability | Approval log INSERT-only (bất biến); chuyển trạng thái có kiểm tra điều kiện tiên quyết (không cho trạng thái bất hợp lệ dù gọi trực tiếp API); idempotent: thao tác lặp trên trạng thái sai bị chặn, không ghi log thừa |
| Audit/Logging | Nhật ký phê duyệt + thay đổi đầy đủ (mục 6.2); truy vết ai duyệt, lúc nào, cấp nào |
| UX | Trạng thái hiển thị bằng tên nghiệp vụ tiếng Việt có dấu; tab lọc trạng thái; không hardcode màu/spacing (theo theme.ts/tokens.ts) |

## 13. Decision Points — SA chốt; các mục đánh dấu **ĐÃ CHỐT** do user xác nhận (không thay đổi)

| DP | Vấn đề | Trạng thái | Quyết định / Đề xuất BA | Phương án thay thế |
|---|---|---|---|---|
| DP-1 | Ngữ nghĩa `APPROVED_LEVEL1` cho trạng thái chờ | **ĐÃ CHỐT** (quyết định 3) | Ngữ nghĩa "cấp đã duyệt xong": Chờ Cảng vụ/Chi cục duyệt = `PENDING_APPROVAL`; Chờ Cục duyệt = `APPROVED_LEVEL1`; `APPROVED_LEVEL2` giữ LEGACY, KHÔNG dùng trong luồng thống nhất (không migration) | Phương án B (ngữ nghĩa "cấp đang chờ", khớp Berth) — **bị bác** |
| DP-2 | Trạng thái thứ 7 "Đã xóa (lịch sử)" | **ĐÃ CHỐT** (quyết định 2) | Bổ sung `ARCHIVED(7)` vào `ApprovalStatus` = "Đã xóa (lịch sử)" | — |
| DP-3 | Phân biệt 2 trạng thái trả về | **ĐÃ CHỐT** (quyết định 1) | Tách `REJECTED` thành `REJECTED_LEVEL1` (vòng 1) / `REJECTED_LEVEL2` (vòng 2); ordinal chốt tại implementation (không trùng `ARCHIVED`=7); migration ánh xạ dòng REJECTED cũ qua `approval_logs.cap` | Discriminator `cap`/`rejectedLevel` trên REJECTED đơn — **bị bác** |
| DP-4 | Xác định "người gửi thuộc cấp Cục" (quy tắc 14) | **ĐÃ CHỐT** (quyết định 4) | Xác định bằng `OrgUnit.level` (level-based) | Mã đơn vị cứng (hardcoded org code) — **bị bác** |
| DP-5 | Entity đang dùng 2 cột trạng thái (String status + ApprovalStatus) | còn mở | `ApprovalStatus` là nguồn sự thật duy nhất của workflow; enum hiển thị riêng (nếu có) suy ra từ nó | Giữ 2 cột và đồng bộ — rủi ro drift |
| DP-6 | Độ dài tối thiểu lý do từ chối | còn mở | 10 ký tự (khớp CoastalStationVTSService hiện tại) | Chỉ yêu cầu không rỗng |
| DP-7 | "Bắt buộc sửa rồi gửi lại" (quy tắc 6) kiểm soát đến đâu | còn mở | Tối thiểu: hành động "Lưu và gửi duyệt" (có save → change log); tùy chọn: diff nội dung so với bản trả về | Chỉ chặn ở mức state machine |
| DP-8 | Cơ chế change log chung | còn mở | 1 bảng/thực thể change log dùng chung theo mẫu `ChangeLog` (port) | Giữ riêng từng module (BeaconHistoryService/StationHistoryService…) |
| DP-9 | `PROPOSED`(1) trong luồng thống nhất | **ĐÃ CHỐT** (hệ quả quyết định 3) | Không dùng `PROPOSED`; dùng `PENDING_APPROVAL` cho "Chờ Cảng vụ / Chi cục duyệt" | Dùng `PROPOSED` — **bị bác** |
| DP-10 | Granularity resource phân quyền | còn mở | Resource dùng chung `kcht` (quyền theo chức vụ, không theo loại) | `kcht.<type>:<action>` cho từng loại (28× permissions) |

> **Quyết định 5** (re-submit LUÔN vào lại vòng 1) không phải DP mở — đã áp dụng trực tiếp vào bảng chuyển trạng thái (T10/T11), BR-006 và AC-14.

## 14. References

| Tài liệu | Vai trò |
|---|---|
| `QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md` (workspace root) | **Nguồn sự thật nghiệp vụ** — 7 trạng thái, 14 quy tắc, bảng chuyển trạng thái mục 7, 9 ca sử dụng |
| `docs/modules/M-001-quan-tri-he-thong/sa/00-lean-architecture.md` | Mẫu "one spec every feature references" |
| `src/main/java/com/hanghai/kchtg/common/entity/ApprovalStatus.java`, `common/enums/ApprovalLevel.java` | Enum dùng chung (đã xác minh) |
| `port/service/shared/ApprovalWorkflowService.java`, `port/service/BerthApprovalService.java`, `beacon/service/BeaconLightService.java`, `beacon/service/BuoyService.java`, `station/service/CoastalStationVTSService.java` (+ controllers), `gis/{point,line,polygon}/service/*ObjectService.java` | Hiện trạng 4 pattern (mục 10) |
| `docs/intel/_intake/TRI-1787276836028-292a.json` | Intake record: seam claims + done-oracle |
| `AGENTS.md` | Conventions: phân quyền `<resource>:<action>` + PermissionSeeder, Data Scope Convention, enums ORDINAL, naming (English code / Vietnamese UI) |
