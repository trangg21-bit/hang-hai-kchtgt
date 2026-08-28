---
feature-id: F-296
document: lean-spec
output-mode: lean
module-id: M-003
last-updated: 2026-08-26
---
# Phê duyệt Trung tâm điều hành VTS
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

Quy trình phê duyệt **2 cấp** cho Trung tâm điều hành VTS theo `approval-2-level-spec.md`: Gửi duyệt → Cảng vụ/Chi cục duyệt (vòng 1) → Cục duyệt (vòng 2). Từ chối ở bất kỳ vòng nào đều bắt buộc lý do ≥10 ký tự.
## Scope

| | Items |
|---|---|
| In scope | 4 thao tác: gửi duyệt, duyệt C1, duyệt C2, từ chối (C1/C2); ghi vết người + thời điểm; chống tự duyệt 4 mắt. |
| Out of scope | Ủy quyền phê duyệt; phê duyệt hàng loạt; nhắc hạn phê duyệt. |
| Assumptions | Quy trình phê duyệt 2 cấp và bảng `infrastructure_history` đã có sẵn dùng chung. Ma trận trường lấy từ đặc tả nghiệp vụ do PMO cung cấp 26/08/2026, **không** suy ra từ code. |
## 4. Ma trận dữ liệu
| # | Tên trường | Trường kỹ thuật | Ghi ở bước nào | Hiện trạng code |
|---|---|---|---|---|
| 11 | Trạng thái phê duyệt | `approvalStatus` | Mọi bước | Đã có (`ApprovalStatusBadge`) |
| 14 | Ngày gửi phê duyệt | `submittedAt` | Gửi duyệt | Đã có |
| 15 | Cán bộ gửi phê duyệt | `submittedBy` | Gửi duyệt | Đã có |
| 16 | Ngày phê duyệt cấp Cảng vụ/Chi cục | `approvedDateLevel1` | Duyệt C1 | Đã có |
| 17 | Cán bộ phê duyệt cấp Cảng vụ/Chi cục | `approverLevel1` | Duyệt C1 | Đã có |
| 18 | Nội dung phê duyệt cấp Cảng vụ/Chi cục | `approvalReasonLevel1` | Duyệt C1 | Đã có |
| 19 | Ngày phê duyệt cấp Cục | `approvedDateLevel2` | Duyệt C2 | Đã có |
| 20 | Cán bộ phê duyệt cấp Cục | `approverLevel2` | Duyệt C2 | Đã có |
| 21 | Nội dung phê duyệt cấp Cục | `approvalReasonLevel2` | Duyệt C2 | Đã có |
| — | Lý do từ chối | `rejectionReason` | Từ chối C1/C2 | Đã có |

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
| BR-296-01 | 7 trạng thái chuẩn: `DRAFT`(0) → `PENDING_APPROVAL`(2) → `APPROVED_LEVEL1`(3) → `APPROVED`(5); trả về `REJECTED_LEVEL1`(8) / `REJECTED_LEVEL2`(9); xóa `ARCHIVED`(7). **Cấm** mã legacy `PROPOSED`/`APPROVED_LEVEL2`/`REJECTED`. |
| BR-296-02 | **Quy tắc 14**: người gửi thuộc cấp Cục → hồ sơ vào thẳng `APPROVED_LEVEL1`, bỏ vòng 1. |
| BR-296-03 | **Quy tắc 8 (4 mắt)**: người duyệt không được là người gửi; người duyệt vòng 2 không được trùng người duyệt vòng 1. |
| BR-296-04 | **Quy tắc 5**: từ chối bắt buộc nhập lý do tối thiểu 10 ký tự. |
| BR-296-05 | Không được “nhảy vòng” (`PENDING_APPROVAL` → `APPROVED`) và không được duyệt ngược. |
| BR-296-06 | Mỗi lần gửi/duyệt/từ chối đều ghi người thực hiện + thời điểm vào `infrastructure_history`. |

## Acceptance Criteria

| AC-ID | Tình huống | Given / When / Then |
|---|---|---|
| AC-296-01 | Gửi duyệt | Given hồ sơ `DRAFT`; When bấm Gửi phê duyệt; Then chuyển `PENDING_APPROVAL`, ghi `submittedAt`/`submittedBy`. |
| AC-296-02 | Duyệt vòng 1 | Given hồ sơ `PENDING_APPROVAL`, user có `vtsoperationcenter:approvec1` và khác người gửi; When duyệt; Then chuyển `APPROVED_LEVEL1`, ghi `approverLevel1`/`approvedDateLevel1`. |
| AC-296-03 | Duyệt vòng 2 | Given hồ sơ `APPROVED_LEVEL1`, user có `vtsoperationcenter:approvec2` và khác người duyệt vòng 1; When duyệt; Then chuyển `APPROVED`. |
| AC-296-04 | Chống tự duyệt | Given người duyệt trùng người gửi; When duyệt; Then bị từ chối. |
| AC-296-05 | Từ chối thiếu lý do | Given lý do <10 ký tự; When từ chối; Then bị từ chối với thông báo “Lý do từ chối phải có ít nhất 10 ký tự”. |
| AC-296-06 | Quy tắc 14 | Given người gửi thuộc cấp Cục; When gửi duyệt; Then hồ sơ vào thẳng `APPROVED_LEVEL1`. |
| AC-296-07 | Nhảy vòng | Given hồ sơ `PENDING_APPROVAL`; When gọi thẳng duyệt C2; Then bị từ chối. |

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
