---
feature-id: F-295
document: lean-spec
output-mode: lean
module-id: M-003
last-updated: 2026-08-26
---
# Xóa Trung tâm điều hành VTS
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

Xóa mềm hồ sơ Trung tâm điều hành VTS theo **quy tắc 11** (`approval-2-level-spec.md` mục 3.6): **chỉ xóa được hồ sơ đang Lưu tạm** (`DRAFT`), do người nhập thực hiện. Hồ sơ chuyển sang “Đã xóa (lịch sử)”, không xóa khỏi CSDL.
## Scope

| | Items |
|---|---|
| In scope | Xóa mềm hồ sơ `DRAFT`; gán `deletedAt`/`deletedBy` từ session; ẩn khỏi mọi màn đọc. |
| Out of scope | Xóa cứng; xóa hàng loạt; khôi phục hồ sơ đã xóa qua UI. |
| Assumptions | Quy trình phê duyệt 2 cấp và bảng `infrastructure_history` đã có sẵn dùng chung. Ma trận trường lấy từ đặc tả nghiệp vụ do PMO cung cấp 26/08/2026, **không** suy ra từ code. |
## 4. Ma trận dữ liệu
| # | Tên trường | Trường kỹ thuật | Vai trò | Hiện trạng |
|---|---|---|---|---|
| 1 | Thời điểm xóa | `deletedAt` | Hệ thống ghi | Đã có (`BaseEntity`) |
| 2 | Người xóa | `deletedBy` | Hệ thống ghi từ session | Đã có (`BaseEntity`) |
| 3 | Trạng thái — điều kiện xóa | `approvalStatus` | Hệ thống kiểm tra | Chỉ `DRAFT` (0) |
| 4 | Đối tượng bản đồ | `spatialId` | Hệ thống xử lý | Xóa `GisSpatialObject` kèm theo |

> Ma trận 41 trường đầy đủ (cả 5 cột Danh sách / Bộ lọc / Chi tiết / Tạo mới / Sửa)
> xem `F-293-quan-ly-tt-dieu-hanh-vts-tao-moi/ba/00-lean-spec.md`.

## ⚠️ Hai quyết định còn mở — phải chốt TRƯỚC khi code

| # | Vấn đề | Vì sao phải chốt | Trạng thái |
|---|---|---|---|
| **(a)** | Ma trận đánh `Danh sách = TRUE` cho 6 trường kiểm toán (#20–#23, #25–#26: ngày + cán bộ của cả 3 mốc gửi/duyệt C1/duyệt C2). | Trái `docs/conventions/infrastructure-screen-template.md` — template quy định bảng danh sách chỉ gồm STT · Tên-Mã · Đơn vị · Địa điểm · Tình trạng · Trạng thái · Cán bộ cập nhật · Thao tác. **Không màn KCHT nào** trong 28 loại đang hiển thị 6 cột này. Thêm vào sẽ làm bảng tràn ngang và lệch chuẩn toàn hệ thống. | ⏳ **CHỜ CHỐT** |
| **(b)** | 14 trường ở 4 nhóm #28–#41 (KCHT trực thuộc, vận hành khai thác, bảo trì, sự cố) lấy dữ liệu từ đâu. | Chưa có API nào cung cấp. Nhóm #28–29 là quan hệ cha–con nội bộ KCHT (TTĐH VTS là cha của Radar/AIS/CCTV/SCADA/Truyền dẫn/Phụ trợ — thực thể #13–18 trong `SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md`) nên làm được ngay; ba nhóm còn lại phụ thuộc module vận hành/bảo trì/sự cố **chưa xác định**. | ⏳ **CHỜ CHỐT** |

Khi chưa chốt, các trường liên quan giữ nguyên trạng thái *chưa triển khai* và **không** được suy diễn từ code.

## Business Rules

| BR-ID | Rule |
|---|---|
| BR-295-01 | Chỉ xóa mềm được hồ sơ `DRAFT` (0) — quy tắc 11. Trạng thái khác (kể cả `APPROVED`) → lỗi “Chỉ có thể xóa hồ sơ ở trạng thái Lưu tạm”. |
| BR-295-02 | Backend chặn bằng `InfrastructureApprovalService.assertDeletable()`; frontend dùng `canDeleteApprovalRecord()`. **CẤM** tự viết lại điều kiện. |
| BR-295-03 | Xóa là xóa mềm; hồ sơ chuyển “Đã xóa (lịch sử)”, giữ lại để đối chiếu. |
| BR-295-04 | Ghi nhật ký `DELETED` vào `infrastructure_history`. |
| BR-295-05 | Cấm xóa khi trung tâm **còn KCHT con** (Radar/AIS/CCTV/SCADA/Truyền dẫn/Phụ trợ) đang tham chiếu — tránh mồ côi khóa ngoại `FK_TT_DH_VTS`. |

## Acceptance Criteria

| AC-ID | Tình huống | Given / When / Then |
|---|---|---|
| AC-295-01 | Xóa hồ sơ nháp | Given hồ sơ `DRAFT`, user có `vtsoperationcenter:delete`; When gọi DELETE; Then `deletedAt`/`deletedBy` được ghi, HTTP 200. |
| AC-295-02 | Từ chối trạng thái khác | Given hồ sơ `APPROVED` hoặc `PENDING_APPROVAL`; When gọi DELETE; Then bị từ chối, dữ liệu không đổi. |
| AC-295-03 | Ẩn khỏi đọc | Given hồ sơ đã xóa mềm; When gọi danh sách/tìm kiếm/chi tiết; Then không xuất hiện. |
| AC-295-04 | Còn KCHT con | Given trung tâm còn ít nhất 1 Radar/AIS/CCTV tham chiếu; When gọi DELETE; Then bị từ chối kèm số lượng bản ghi con. |
| AC-295-05 | Thiếu quyền | Given user thiếu `vtsoperationcenter:delete`; Then HTTP 403; UI không hiện nút Xóa. |

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
