---
feature-id: F-294
document: lean-spec
output-mode: lean
module-id: M-003
last-updated: 2026-08-26
---
# Cập nhật Trung tâm điều hành VTS
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

Cho phép cập nhật hồ sơ Trung tâm điều hành VTS theo **quy tắc 12** (`approval-2-level-spec.md` mục 3.9): sửa được khi `DRAFT` / `REJECTED_LEVEL1` / `REJECTED_LEVEL2`; **cấm** sửa khi đang chờ duyệt; hồ sơ **Đã duyệt** chỉ người có quyền phê duyệt cấp 2 mới sửa được, qua thao tác “Lưu và phê duyệt” (T12).
## Scope

| | Items |
|---|---|
| In scope | Sửa toàn bộ trường ở nhóm #1–#16 trừ mã trung tâm; ghi nhật ký thay đổi từng trường. |
| Out of scope | Đổi mã trung tâm; đổi trạng thái phê duyệt trực tiếp; các nhóm #28–#41. |
| Assumptions | Quy trình phê duyệt 2 cấp và bảng `infrastructure_history` đã có sẵn dùng chung. Ma trận trường lấy từ đặc tả nghiệp vụ do PMO cung cấp 26/08/2026, **không** suy ra từ code. |
## 4. Ma trận dữ liệu
Các trường có **Sửa = TRUE** (16 trường):

| # | Tên trường | Loại điều khiển | Trường kỹ thuật | Hiện trạng code |
|---|---|---|---|---|
| 1 | Đơn vị quản lý (bắt buộc khi tạo) | SelectOrgCode | `orgUnitId` | Đã có. |
| 2 | Thuộc cảng biển | SelectKcht (CB) | `portId` | Đã có. |
| 3 | Thuộc hệ thống VTS | SelectKcht (ATHH, VTS) | `vtsSystemId` | Đã có. Quan hệ cha theo `SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md` (thực thể #12). |
| 4 | Mã trung tâm điều hành VTS | Input (disabled, tự sinh `TTDH-{seq}`) | `code` | Đã có. Bất biến sau khi tạo. |
| 5 | Tên trung tâm điều hành VTS (bắt buộc) | InputTextArea | `name` | Đã có. |
| 6 | Địa điểm (Tỉnh/TP) (bắt buộc) | SelectCateOther | `provinceId` | Đã có. |
| 7 | Địa điểm chi tiết | InputTextArea | `detailedLocation` | Đã có. |
| 8 | Tình trạng (bắt buộc) | SelectAppParams | `conditionStatus` | Đã có (`ConditionStatus`). |
| 9 | Vùng phủ sóng | InputTextArea | `coverage` | Đã có. |
| 10 | Ghi chú | InputTextArea | `note` | Đã có. |
| 11 | Loại đối tượng | Select (Điểm/Đường/Vùng) | `geometryType` | Đã có ở form. |
| 12 | Biểu tượng | Select | `symbolId` | Đã có ở form. |
| 13 | Hệ quy chiếu | Text | `coordinateReferenceSystem` | **THIẾU** — chưa có cột trong entity. |
| 14 | Quy tắc hiển thị | Text | `displayRule` | Đã có ở form. |
| 15 | Tọa độ | LongLatTable | `spatialId` + bảng tọa độ | **THIẾU** bảng tọa độ nhiều điểm; hiện chỉ có `spatialId`. |
| 16 | File đính kèm | UploadFileTable | `infrastructure_attachment` | Đã có. |

> Ma trận 41 trường đầy đủ xem `F-293-quan-ly-tt-dieu-hanh-vts-tao-moi/ba/00-lean-spec.md`.

## ⚠️ Hai quyết định còn mở — phải chốt TRƯỚC khi code

| # | Vấn đề | Vì sao phải chốt | Trạng thái |
|---|---|---|---|
| **(a)** | Ma trận đánh `Danh sách = TRUE` cho 6 trường kiểm toán (#20–#23, #25–#26: ngày + cán bộ của cả 3 mốc gửi/duyệt C1/duyệt C2). | Trái `docs/conventions/infrastructure-screen-template.md` — template quy định bảng danh sách chỉ gồm STT · Tên-Mã · Đơn vị · Địa điểm · Tình trạng · Trạng thái · Cán bộ cập nhật · Thao tác. **Không màn KCHT nào** trong 28 loại đang hiển thị 6 cột này. Thêm vào sẽ làm bảng tràn ngang và lệch chuẩn toàn hệ thống. | ⏳ **CHỜ CHỐT** |
| **(b)** | 14 trường ở 4 nhóm #28–#41 (KCHT trực thuộc, vận hành khai thác, bảo trì, sự cố) lấy dữ liệu từ đâu. | Chưa có API nào cung cấp. Nhóm #28–29 là quan hệ cha–con nội bộ KCHT (TTĐH VTS là cha của Radar/AIS/CCTV/SCADA/Truyền dẫn/Phụ trợ — thực thể #13–18 trong `SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md`) nên làm được ngay; ba nhóm còn lại phụ thuộc module vận hành/bảo trì/sự cố **chưa xác định**. | ⏳ **CHỜ CHỐT** |

Khi chưa chốt, các trường liên quan giữ nguyên trạng thái *chưa triển khai* và **không** được suy diễn từ code.

## Business Rules

| BR-ID | Rule |
|---|---|
| BR-294-01 | Điều kiện sửa theo **quy tắc 12**: `DRAFT`/`REJECTED_LEVEL1`/`REJECTED_LEVEL2` cần `vtsoperationcenter:update`; `APPROVED` cần `vtsoperationcenter:approvec2`; `PENDING_APPROVAL`/`APPROVED_LEVEL1`/`ARCHIVED` **cấm sửa**. |
| BR-294-02 | Sửa hồ sơ `APPROVED` **giữ nguyên** trạng thái `APPROVED`, bản cũ ghi vào nhật ký (T12). **CẤM** hạ về `DRAFT`. |
| BR-294-03 | Mã trung tâm bất biến. |
| BR-294-04 | Sửa hồ sơ bị trả về xong thì gửi lại → `PENDING_APPROVAL`. |
| BR-294-05 | Mọi thay đổi ghi `infrastructure_history` với `changedField` / `previousValue` / `newValue`. |

## Acceptance Criteria

| AC-ID | Tình huống | Given / When / Then |
|---|---|---|
| AC-294-01 | Sửa hồ sơ Lưu tạm | Given hồ sơ `DRAFT`, user có `vtsoperationcenter:update`; When lưu thay đổi; Then cập nhật thành công, trạng thái vẫn `DRAFT`. |
| AC-294-02 | Cấm sửa khi chờ duyệt | Given hồ sơ `PENDING_APPROVAL` hoặc `APPROVED_LEVEL1`; When gọi PUT; Then bị từ chối với thông báo “Không thể sửa hồ sơ đang trong quy trình phê duyệt”; UI ẩn nút Chỉnh sửa. |
| AC-294-03 | Sửa hồ sơ Đã duyệt (T12) | Given hồ sơ `APPROVED`, user có `vtsoperationcenter:approvec2`; When lưu qua “Lưu và phê duyệt”; Then nội dung cập nhật, trạng thái **vẫn** `APPROVED`, bản cũ vào nhật ký. |
| AC-294-04 | Thiếu quyền duyệt trên hồ sơ Đã duyệt | Given hồ sơ `APPROVED`, user chỉ có `vtsoperationcenter:update`; Then UI **không** hiện nút Chỉnh sửa; gọi API trực tiếp trả 403. |
| AC-294-05 | Sửa hồ sơ bị trả về | Given hồ sơ `REJECTED_LEVEL1`; When sửa và gửi lại; Then chuyển `PENDING_APPROVAL`, xóa lý do từ chối cũ. |

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
