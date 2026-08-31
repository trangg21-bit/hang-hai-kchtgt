---
feature-id: F-298
document: lean-spec
output-mode: lean
module-id: M-003
last-updated: 2026-08-26
---
# Lịch sử thay đổi Trung tâm điều hành VTS
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

Hiển thị nhật ký thay đổi của hồ sơ Trung tâm điều hành VTS sau khi đã được phê duyệt bước cuối (Đã duyệt / `APPROVED`): cập nhật từng trường thông tin, tọa độ GIS, biểu tượng, tải lên / xóa tài liệu đính kèm. Dữ liệu lấy từ bảng dùng chung `infrastructure_history` với `refType = VTS_OPERATION_CENTER`.
## Scope

| | Items |
|---|---|
| In scope | Dòng thời gian 2 cột; diff từng trường `<giá trị cũ> → <giá trị mới>` với tên trường tiếng Việt; phân trang. |
| Out of scope | Khôi phục về phiên bản cũ; so sánh hai phiên bản bất kỳ; xuất nhật ký ra tệp. |
| Assumptions | Quy trình phê duyệt 2 cấp và bảng `infrastructure_history` đã có sẵn dùng chung. Ma trận trường lấy từ đặc tả nghiệp vụ do PMO cung cấp 26/08/2026, **không** suy ra từ code. |
## 4. Ma trận dữ liệu
| # | Tên trường | Trường kỹ thuật | Vai trò |
|---|---|---|---|
| 1 | Thời điểm | `approvedDate` | Hiển thị `HH:mm DD/MM/YYYY` |
| 2 | Hành động | `status` | Badge: Tạo mới / Chỉnh sửa / Xóa |
| 3 | Cấp phê duyệt | `approvalLevel` | LEVEL_2 |
| 4 | Cán bộ thực hiện | `approvedBy` | Hiển thị **họ và tên**, không hiển thị UUID |
| 5 | Trường thay đổi | `changedField` | Tên trường **tiếng Việt** rõ nghĩa |
| 6 | Giá trị cũ → mới | `previousValue` / `newValue` | Diff trực quan; bỏ qua khi `ov === nv` |
| 7 | Lý do | `reason` | Ghi chú lý do thay đổi |

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
| BR-298-01 | Nhật ký chỉ đọc, không sửa/xóa được. |
| BR-298-02 | Ghi vào bảng dùng chung `infrastructure_history` sau khi hồ sơ đã được phê duyệt bước cuối (`APPROVED`), `refType = VTS_OPERATION_CENTER`. Không ghi log chuyển trạng thái khi đang ở vòng duyệt. |
| BR-298-03 | Gom nhóm các thay đổi trong cùng 1 giây của cùng 1 người; lọc bỏ trường rỗng và trường không đổi (`ov === nv`). |
| BR-298-04 | Hiển thị **họ và tên** cán bộ, không phơi UUID ra giao diện. |
| BR-298-05 | Tên trường trong diff phải là nhãn tiếng Việt của ma trận, không phải tên cột CSDL. |

## Acceptance Criteria

| AC-ID | Tình huống | Given / When / Then |
|---|---|---|
| AC-298-01 | Xem nhật ký | Given hồ sơ có ≥1 thay đổi; When mở tab Lịch sử; Then thấy dòng thời gian giảm dần theo thời điểm. |
| AC-298-02 | Diff trường | Given đổi Tên trung tâm; When xem nhật ký; Then thấy “Tên trung tâm điều hành VTS: <cũ> → <mới>”. |
| AC-298-03 | Vết từ chối | Given hồ sơ bị trả về; When xem nhật ký; Then thấy lý do từ chối trong khung cảnh báo riêng. |
| AC-298-04 | Không rò UUID | Given nhật ký bất kỳ; When xem; Then cột cán bộ hiển thị họ tên, không có chuỗi UUID. |
| AC-298-05 | Bỏ trường không đổi | Given lưu mà không đổi gì; When xem nhật ký; Then không sinh dòng nhật ký rỗng. |

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
