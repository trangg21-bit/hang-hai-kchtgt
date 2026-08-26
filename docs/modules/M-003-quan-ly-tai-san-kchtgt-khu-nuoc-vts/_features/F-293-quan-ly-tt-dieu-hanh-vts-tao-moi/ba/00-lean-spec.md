---
feature-id: F-293
document: lean-spec
output-mode: lean
module-id: M-003
last-updated: 2026-08-26
---
# Tạo mới Trung tâm điều hành VTS
## Bối cảnh

Trung tâm điều hành VTS là **thực thể #12** trong `SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md`: cấp 1 dưới
**Hệ thống VTS**, đồng thời là **cha** của Trạm Radar, Hệ thống AIS, Hệ thống CCTV, Hệ thống SCADA,
Hệ thống truyền dẫn và Hệ thống phụ trợ VTS (thực thể #13–18, khóa ngoại `FK_TT_DH_VTS`).

> **Lý do bộ tài liệu này ra đời (26/08/2026):** màn hình và API của Trung tâm điều hành VTS **đã
> được xây dựng xong** nhưng chưa từng có feature-brief / lean-spec / ma trận trường ở bất kỳ module
> nào — ngược quy trình. Bộ F-293…F-298 bổ sung phần đặc tả còn thiếu, lấy ma trận 41 trường do
> nghiệp vụ cung cấp làm gốc, và ghi rõ những chỗ code hiện tại **chưa đáp ứng**.

Quy trình phê duyệt áp dụng: **2 cấp chuẩn** theo `docs/conventions/approval-2-level-spec.md`
(7 trạng thái, quy tắc 8 chống tự duyệt, quy tắc 11 xóa mềm, quy tắc 12 điều kiện sửa, quy tắc 14
phân cấp theo đơn vị gửi).

## Summary

Cho phép người dùng có `vtsoperationcenter:create` tạo hồ sơ Trung tâm điều hành VTS. Mã trung tâm `TTDH-{seq}` do hệ thống tự sinh và bất biến. Hồ sơ tạo ra ở trạng thái **Lưu tạm** (`DRAFT`); người dùng có thể lưu tạm, gửi phê duyệt, hoặc lưu-và-phê-duyệt nếu có thẩm quyền cấp Cục (quy tắc 14).
## Scope

| | Items |
|---|---|
| In scope | Form 5 tab (Thông tin chung · Thông tin khác · Thông tin vị trí · File đính kèm · Lịch sử & Phê duyệt); tự sinh mã; validate trường bắt buộc; đính kèm tệp ≤10MB; 3 nút chân form theo `infrastructure-screen-template.md` §3.6. |
| Out of scope | Nhập liệu hàng loạt; sao chép hồ sơ; các nhóm #28–#41 (xem Quyết định mở (b)). |
| Assumptions | Quy trình phê duyệt 2 cấp và bảng `infrastructure_history` đã có sẵn dùng chung. Ma trận trường lấy từ đặc tả nghiệp vụ do PMO cung cấp 26/08/2026, **không** suy ra từ code. |
## 4. Ma trận dữ liệu
Đây là **ma trận gốc** của Trung tâm điều hành VTS (41 trường). Các feature còn lại
trong bộ F-293…F-298 tham chiếu về đây thay vì chép lại.

| # | Tên trường | Loại điều khiển | Trường kỹ thuật | Danh sách | Bộ lọc | Chi tiết | Tạo mới | Sửa | Hiện trạng code |
|---|---|---|---|---|---|---|---|---|---|
| | **Thông tin cơ bản** |  |  | | | | | | |
| 1 | Đơn vị quản lý (bắt buộc khi tạo) | SelectOrgCode | `orgUnitId` | ✅ | ✅ | ✅ | ✅ | ✅ | Đã có. |
| 2 | Thuộc cảng biển | SelectKcht (CB) | `portId` | ✅ | ✅ | ✅ | ✅ | ✅ | Đã có. |
| 3 | Thuộc hệ thống VTS | SelectKcht (ATHH, VTS) | `vtsSystemId` | ✅ | ✅ | ✅ | ✅ | ✅ | Đã có. Quan hệ cha theo `SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md` (thực thể #12). |
| 4 | Mã trung tâm điều hành VTS | Input (disabled, tự sinh `TTDH-{seq}`) | `code` | ✅ | ✅ | ✅ | ✅ | ✅ | Đã có. Bất biến sau khi tạo. |
| 5 | Tên trung tâm điều hành VTS (bắt buộc) | InputTextArea | `name` | ✅ | ✅ | ✅ | ✅ | ✅ | Đã có. |
| 6 | Địa điểm (Tỉnh/TP) (bắt buộc) | SelectCateOther | `provinceId` | ✅ | ✅ | ✅ | ✅ | ✅ | Đã có. |
| 7 | Địa điểm chi tiết | InputTextArea | `detailedLocation` | — | — | ✅ | ✅ | ✅ | Đã có. |
| 8 | Tình trạng (bắt buộc) | SelectAppParams | `conditionStatus` | ✅ | ✅ | ✅ | ✅ | ✅ | Đã có (`ConditionStatus`). |
| | **Thông tin khác** |  |  | | | | | | |
| 9 | Vùng phủ sóng | InputTextArea | `coverage` | — | — | ✅ | ✅ | ✅ | Đã có. |
| 10 | Ghi chú | InputTextArea | `note` | — | — | ✅ | ✅ | ✅ | Đã có. |
| | **Vị trí (GIS)** |  |  | | | | | | |
| 11 | Loại đối tượng | Select (Điểm/Đường/Vùng) | `geometryType` | — | — | ✅ | ✅ | ✅ | Đã có ở form. |
| 12 | Biểu tượng | Select | `symbolId` | — | — | ✅ | ✅ | ✅ | Đã có ở form. |
| 13 | Hệ quy chiếu | Text | `coordinateReferenceSystem` | — | — | ✅ | ✅ | ✅ | **THIẾU** — chưa có cột trong entity. |
| 14 | Quy tắc hiển thị | Text | `displayRule` | — | — | ✅ | ✅ | ✅ | Đã có ở form. |
| 15 | Tọa độ | LongLatTable | `spatialId` + bảng tọa độ | — | — | ✅ | ✅ | ✅ | **THIẾU** bảng tọa độ nhiều điểm; hiện chỉ có `spatialId`. |
| | **File đính kèm** |  |  | | | | | | |
| 16 | File đính kèm | UploadFileTable | `infrastructure_attachment` | — | — | ✅ | ✅ | ✅ | Đã có. |
| | **Trạng thái & Kiểm toán (chỉ Chi tiết/Danh sách)** |  |  | | | | | | |
| 17 | Trạng thái | Badge (read-only) | `approvalStatus` | ✅ | ✅ | ✅ | — | — | Đã có. Bộ lọc qua StatusTabs. |
| 18 | Ngày cập nhật | Text (read-only) | `updatedAt` | ✅ | ✅ | ✅ | — | — | Cột đã có; **bộ lọc khoảng ngày ĐÃ BỔ SUNG 26/08/2026**. |
| 19 | Cán bộ cập nhật | Text (read-only) | `updatedBy` | ✅ | — | ✅ | — | — | Đã có. |
| 20 | Ngày gửi phê duyệt | Text (read-only) | `submittedAt` | ✅ | — | ✅ | — | — | **THIẾU** — xem Quyết định mở (a). |
| 21 | Cán bộ gửi phê duyệt | Text (read-only) | `submittedBy` | ✅ | — | ✅ | — | — | **THIẾU** — xem Quyết định mở (a). |
| 22 | Ngày phê duyệt cấp Cảng vụ/Chi cục | Text (read-only) | `approvedDateLevel1` | ✅ | — | ✅ | — | — | Entity đã có; **chưa lên bảng danh sách** — xem Quyết định mở (a). |
| 23 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | Text (read-only) | `approverLevel1` | ✅ | — | ✅ | — | — | Entity đã có; **chưa lên bảng danh sách** — xem Quyết định mở (a). |
| 24 | Nội dung phê duyệt (cấp Cảng vụ/Chi cục) | Text (read-only) | `level1ApprovalContent` | — | — | ✅ | — | — | **THIẾU** — chưa có cột trong entity. |
| 25 | Ngày phê duyệt cấp Cục | Text (read-only) | `approvedDateLevel2` | ✅ | — | ✅ | — | — | Entity đã có; **chưa lên bảng danh sách** — xem Quyết định mở (a). |
| 26 | Cán bộ phê duyệt cấp Cục | Text (read-only) | `approverLevel2` | ✅ | — | ✅ | — | — | Entity đã có; **chưa lên bảng danh sách** — xem Quyết định mở (a). |
| 27 | Nội dung phê duyệt (cấp Cục) | Text (read-only) | `level2ApprovalContent` | — | — | ✅ | — | — | **THIẾU** — chưa có cột trong entity. |
| | **Kết cấu hạ tầng khác thuộc trung tâm điều hành VTS** |  |  | | | | | | |
| 28 | Tên kết cấu hạ tầng | Text (read-only) | con của TTĐH VTS | — | — | ✅ | — | — | **THIẾU** — xem Quyết định mở (b). |
| 29 | Loại kết cấu hạ tầng | Dropdown (bộ lọc) | Radar/AIS/CCTV/SCADA/Truyền dẫn/Phụ trợ | — | — | ✅ | — | — | **THIẾU** — xem Quyết định mở (b). |
| | **Thông tin vận hành khai thác** |  |  | | | | | | |
| 30 | Mã kế hoạch | Text (read-only) | module vận hành | — | — | ✅ | — | — | **THIẾU** — xem Quyết định mở (b). |
| 31 | Tên kế hoạch | Text (read-only) | module vận hành | — | — | ✅ | — | — | **THIẾU** — xem Quyết định mở (b). |
| 32 | Ngày bắt đầu | Text (read-only) | module vận hành | — | — | ✅ | — | — | **THIẾU** — xem Quyết định mở (b). |
| 33 | Ngày kết thúc | Text (read-only) | module vận hành | — | — | ✅ | — | — | **THIẾU** — xem Quyết định mở (b). |
| | **Thông tin bảo trì** |  |  | | | | | | |
| 34 | Mã kế hoạch | Text (read-only) | module bảo trì | — | — | ✅ | — | — | **THIẾU** — xem Quyết định mở (b). |
| 35 | Tên kế hoạch | Text (read-only) | module bảo trì | — | — | ✅ | — | — | **THIẾU** — xem Quyết định mở (b). |
| 36 | Thời gian bắt đầu | Text (read-only) | module bảo trì | — | — | ✅ | — | — | **THIẾU** — xem Quyết định mở (b). |
| 37 | Thời gian kết thúc | Text (read-only) | module bảo trì | — | — | ✅ | — | — | **THIẾU** — xem Quyết định mở (b). |
| | **Thông tin sự cố** |  |  | | | | | | |
| 38 | Mã sự cố | Text (read-only) | module sự cố | — | — | ✅ | — | — | **THIẾU** — xem Quyết định mở (b). |
| 39 | Loại sự cố | Text (read-only) | module sự cố | — | — | ✅ | — | — | **THIẾU** — xem Quyết định mở (b). |
| 40 | Địa điểm | Text (read-only) | module sự cố | — | — | ✅ | — | — | **THIẾU** — xem Quyết định mở (b). |
| 41 | Thời gian | Text (read-only) | module sự cố | — | — | ✅ | — | — | **THIẾU** — xem Quyết định mở (b). |

**Chú giải:** ✅ = có mặt · — = không áp dụng.

## ⚠️ Hai quyết định còn mở — phải chốt TRƯỚC khi code

| # | Vấn đề | Vì sao phải chốt | Trạng thái |
|---|---|---|---|
| **(a)** | Ma trận đánh `Danh sách = TRUE` cho 6 trường kiểm toán (#20–#23, #25–#26: ngày + cán bộ của cả 3 mốc gửi/duyệt C1/duyệt C2). | Trái `docs/conventions/infrastructure-screen-template.md` — template quy định bảng danh sách chỉ gồm STT · Tên-Mã · Đơn vị · Địa điểm · Tình trạng · Trạng thái · Cán bộ cập nhật · Thao tác. **Không màn KCHT nào** trong 28 loại đang hiển thị 6 cột này. Thêm vào sẽ làm bảng tràn ngang và lệch chuẩn toàn hệ thống. | ⏳ **CHỜ CHỐT** |
| **(b)** | 14 trường ở 4 nhóm #28–#41 (KCHT trực thuộc, vận hành khai thác, bảo trì, sự cố) lấy dữ liệu từ đâu. | Chưa có API nào cung cấp. Nhóm #28–29 là quan hệ cha–con nội bộ KCHT (TTĐH VTS là cha của Radar/AIS/CCTV/SCADA/Truyền dẫn/Phụ trợ — thực thể #13–18 trong `SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md`) nên làm được ngay; ba nhóm còn lại phụ thuộc module vận hành/bảo trì/sự cố **chưa xác định**. | ⏳ **CHỜ CHỐT** |

Khi chưa chốt, các trường liên quan giữ nguyên trạng thái *chưa triển khai* và **không** được suy diễn từ code.

## Business Rules

| BR-ID | Rule |
|---|---|
| BR-293-01 | Mã trung tâm do hệ thống sinh theo `TTDH-{seq}`, **không** nhận từ client và bất biến sau khi tạo. |
| BR-293-02 | Bắt buộc: Đơn vị quản lý, Tên trung tâm, Địa điểm (Tỉnh/TP), Tình trạng. |
| BR-293-03 | Đơn vị quản lý phải nằm trong phạm vi dữ liệu được phân quyền của người tạo (DataScope). |
| BR-293-04 | Hồ sơ mới luôn ở trạng thái `DRAFT`; **cấm** tạo thẳng ở trạng thái khác. |
| BR-293-05 | Nút “Lưu và phê duyệt” chỉ hiện với người có `vtsoperationcenter:approvec2` (quy tắc 14). |
| BR-293-06 | Dropdown “Thuộc hệ thống VTS” và “Thuộc cảng biển” chỉ liệt kê bản ghi `APPROVED` (quy tắc APPROVED ONLY). |

## Acceptance Criteria

| AC-ID | Tình huống | Given / When / Then |
|---|---|---|
| AC-293-01 | Tạo thành công ở Lưu tạm | Given người dùng có `vtsoperationcenter:create` và đã điền đủ 4 trường bắt buộc; When bấm “Lưu tạm”; Then hồ sơ được tạo với `approvalStatus = DRAFT` và mã `TTDH-…` tự sinh. |
| AC-293-02 | Thiếu trường bắt buộc | Given chưa chọn Đơn vị quản lý; When bấm lưu; Then form báo lỗi tại trường đó, không gọi API. |
| AC-293-03 | Tạo và gửi phê duyệt | Given người gửi thuộc cấp Cảng vụ/Chi cục; When bấm “Lưu và gửi phê duyệt”; Then hồ sơ chuyển `PENDING_APPROVAL`. |
| AC-293-04 | Quy tắc 14 | Given người gửi thuộc cấp Cục; When bấm “Lưu và gửi phê duyệt”; Then hồ sơ vào thẳng `APPROVED_LEVEL1` (bỏ vòng 1). |
| AC-293-05 | Ngoài phạm vi đơn vị | Given chọn đơn vị quản lý ngoài phạm vi được phân quyền; When gọi API; Then HTTP 403. |
| AC-293-06 | Thiếu quyền | Given người dùng không có `vtsoperationcenter:create`; When gọi API; Then HTTP 403; UI không hiện nút “Thêm mới”. |

## Non-Functional Requirements

| # | Yêu cầu |
|---|---|
| 1 | Danh sách trả về trong < 1s với 10.000 bản ghi (đã có chỉ mục trên `org_unit_id`, `approval_status`). |
| 2 | Tìm kiếm tiếng Việt **không dấu** qua `immutable_unaccent` (`normalizeSearchText` ở frontend). |
| 3 | Mọi thao tác ghi đều nằm trong một transaction cùng với bản ghi nhật ký. |
| 4 | Phân quyền `<resource>:<action>` với `resource = vtsoperationcenter`; DataScope theo đơn vị. |
| 5 | Giao diện tuân thủ `infrastructure-screen-template.md` và `list-screen-ui-standard.md`. |

## Pipeline Triage

| Mục | Đánh giá |
|---|---|
| Implementation clear? | **Một phần** — nhóm #1–#27 rõ; nhóm #28–#41 chờ Quyết định mở (b). |
| Documentation risk | **High** — tính năng đã code trước khi có đặc tả; bộ tài liệu này là bổ sung ngược. |
| Dependency | Hệ thống VTS (cha) · Cảng biển · các KCHT con #13–18 · module vận hành/bảo trì/sự cố (chưa xác định). |
