---
id: F-082
name: "Phê duyệt Cầu cảng"
slug: ui-phe-duyet-cc
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:08:30Z"
last-updated: "2026-07-01T04:08:30Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Phê duyệt Cầu cảng

## Description

Giao diện phê duyệt Cầu cảng cho phép Leader (Lãnh đạo) và Admin xem, phê duyệt hoặc từ chối các cầu cảng có trạng thái CHO_PHE_DUYET trong hệ thống quản lý tài sản cảng biển. Người dùng truy cập vào danh sách cầu cảng (F-078) → lọc theo trạng thái phê duyệt CHO_PHE_DUYET để xem danh sách các cầu cảng đang chờ phê duyệt. Từ danh sách hoặc từ trang chi tiết (F-079), Leader có thể click "Phê duyệt" hoặc "Từ chối" trên một cầu cảng cụ thể. Khi phê duyệt, hệ thống gọi POST /:id/approve → trạng thái chuyển sang DUOC_PHE_DUYET, một bản ghi PheDuyetLog được tạo lưu thông tin người phê duyệt và thời gian phê duyệt. Khi từ chối, hệ thống gọi POST /:id/reject → trạng thái chuyển sang TU_CHOI, bắt buộc phải nhập lý do từ chối (≥ 10 ký tự), và một bản ghi PheDuyetLog được tạo ghi lại lý do từ chối. Trước khi thực hiện bất kỳ hành động nào, hộp thoại xác nhận (confirmation dialog) xuất hiện để đảm bảo người dùng không phê duyệt/từ chối nhầm. Sau khi hoàn tất, thông báo toast thành công được hiển thị và danh sách được làm mới. Nguồn: F-023 backend.

## Business Intent

Đảm bảo quy trình phê duyệt cầu cảng mới hoặc đã được cập nhật được thực hiện đúng quy định, chỉ những cầu cảng được Leader hoặc Admin phê duyệt chính thức mới được đưa vào vận hành thực tế, tạo tính minh bạch và trách nhiệm giải trình.

## Flow Summary

Người dùng (Leader hoặc Admin) truy cập danh sách cầu cảng (F-078) → sử dụng bộ lọc trạng thái phê duyệt CHO_PHE_DUYET để xem danh sách cầu cảng đang chờ phê duyệt → click "Phê duyệt" hoặc "Từ chối" trên một dòng cầu cảng cụ thể (hoặc thực hiện từ trang chi tiết F-079). Nếu chọn "Phê duyệt": hộp thoại xác nhận xuất hiện với thông tin cầu cảng (maCau, tenCau, loại, chiều dài/rộng) → người dùng xác nhận → hệ thống gọi POST /:id/approve → trạng thái chuyển sang DUOC_PHE_DUYET → PheDuyetLog được tạo (ghi nhận người phê duyệt và thời gian) → toast "Phê duyệt thành công" → danh sách làm mới. Nếu chọn "Từ chối": hộp thoại xác nhận xuất hiện kèm form nhập lý do từ chối (bắt buộc ≥ 10 ký tự) → hệ thống validate lý do → gọi POST /:id/reject với payload chứa lý do → trạng thái chuyển sang TU_CHOI → PheDuyetLog được tạo (ghi nhận lý do từ chối) → toast "Từ chối thành công" → danh sách làm mới. Tất cả các bước đều được ghi lại trong lịch sử thay đổi.

## Acceptance Criteria

1. Chỉ các role Leader (Linh dao) và Admin mới thấy nút "Phê duyệt" và "Từ chối" — user thường không thấy các nút này.
2. Danh sách cầu cảng đang chờ phê duyệt được lọc theo trạng thái trangThaiPheDuyet = CHO_PHE_DUYET.
3. Khi click "Phê duyệt", hộp thoại xác nhận xuất hiện hiển thị thông tin: maCau, tenCau, loại cầu cảng, chiều dài, chiều rộng, tên benCang.
4. Khi người dùng xác nhận trong hộp thoại phê duyệt, hệ thống gọi POST /:id/approve.
5. Sau khi phê duyệt thành công, trạng thái trangThaiPheDuyet chuyển từ CHO_PHE_DUYET sang DUOC_PHE_DUYET.
6. Một bản ghi PheDuyetLog được tạo tự động khi phê duyệt, ghi nhận: cauCangId, pheDuyetBy (leader UUID), pheDuyetAt (timestamp), ketQua (DUOC_PHE_DUYET).
7. Khi click "Từ chối", hộp thoại xác nhận xuất hiện kèm form nhập lý do từ chối (text area, bắt buộc ≥ 10 ký tự).
8. Nếu lý do từ chối < 10 ký tự, hệ thống hiển thị lỗi "Lý do từ chối phải có ít nhất 10 ký tự" và không cho phép submit.
9. Sau khi từ chối thành công, trạng thái trangThaiPheDuyet chuyển từ CHO_PHE_DUYET sang TU_CHOI.
10. Một bản ghi PheDuyetLog được tạo tự động khi từ chối, ghi nhận: cauCangId, pheDuyetBy (leader UUID), pheDuyetAt (timestamp), ketQua (TU_CHOI), lyDoTuChoi (≥ 10 ký tự).
11. Toast "Phê duyệt thành công" hiển thị sau khi approve thành công.
12. Toast "Từ chối thành công" hiển thị sau khi reject thành công.
13. Sau khi phê duyệt/từ chối, danh sách cầu cảng được làm mới để phản ánh trạng thái mới.

## In Scope

- API POST /api/v1/cau-cang/:id/approve cho Leader/Admin.
- API POST /api/v1/cau-cang/:id/reject cho Leader/Admin.
- Hộp thoại xác nhận trước khi phê duyệt hoặc từ chối.
- Form nhập lý do từ chối (bắt buộc ≥ 10 ký tự) khi chọn "Từ chối".
- Chuyển trạng thái: CHO_PHE_DUYET → DUOC_PHE_DUYET (approve) hoặc TU_CHOI (reject).
- Tạo PheDuyetLog khi phê duyệt hoặc từ chối thành công.
- Toast thông báo kết quả và làm mới danh sách.
- Nút phê duyệt/từ chối chỉ hiển thị cho role Leader và Admin.

## Out of Scope

- Phê duyệt/từ chối từ danh sách nhiều cầu cảng cùng lúc (bulk approve/reject).
- Xem lại danh sách các lần phê duyệt/từ chối trước đó từ trang này (chuyển đến F-098 cho lịch sử thay đổi).
- In phiếu phê duyệt/từ chối ra PDF.
- Tự động phê duyệt sau thời gian nhất định (SLA).
- Gửi thông báo email cho người tạo khi cầu cảng được phê duyệt/từ chối.

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Linh dao | approve | Phê duyệt hoặc từ chối cầu cảng (F-082) |
| Linh dao | read | Xem danh sách cầu cảng đang chờ phê duyệt |
| Admin | approve | Phê duyệt hoặc từ chối cầu cảng (F-082) |
| Admin | read | Xem danh sách cầu cảng đang chờ phê duyệt |

## Entities

- **CauCang**: id (UUID), maCau (string unique), tenCau (string), benCangId (UUID FK → BenCang), chieuDai (decimal m), chieuRong (decimal m), loaiCau (enum: DAI_TRO, BIT_NEO, LAN_THANH, DO_BIN_DAU_LOI, THUY_SAN), ghiChu (text), trangThaiHoatDong (enum: HIEN_HANH, TAM_NGUNG), trangThaiPheDuyet (enum: CHO_PHE_DUYET → DUOC_PHE_DUYET hoặc TU_CHOI), orgUnitId (UUID), updatedBy (UUID), updatedAt (auto), deletedAt (nullable)
- **PheDuyetLog**: id (UUID), cauCangId (UUID FK → CauCang), pheDuyetBy (UUID FK → User), pheDuyetAt (auto timestamp), ketQua (enum: DUOC_PHE_DUYET, TU_CHOI), lyDoTuChoi (text, nullable — chỉ có khi ketQua = TU_CHOI, ≥ 10 ký tự)
- **BenCang** (FK): id (UUID), tenBenCang (string), trangThaiHoatDong (enum: HIEN_HANH)

## Business Rules

1. Chỉ các role Leader (Linh dao) và Admin mới có quyền phê duyệt hoặc từ chối cầu cảng — các role khác không thấy nút hành động.
2. Chỉ cầu cảng có trạng thái trangThaiPheDuyet = CHO_PHE_DUYET mới được phép phê duyệt hoặc từ chối — cầu cảng đã DUOC_PHE_DUYET hoặc TU_CHOI không thể thay đổi trạng thái phê duyệt.
3. Khi phê duyệt (approve): trạng thái chuyển ngay thành DUOC_PHE_DUYET, bản ghi PheDuyetLog được tạo với ketQua = DUOC_PHE_DUYET — không cần nhập lý do.
4. Khi từ chối (reject): trạng thái chuyển ngay thành TU_CHOI, bản ghi PheDuyetLog được tạo với ketQua = TU_CHOI và lyDoTuChoi phải có độ dài ≥ 10 ký tự — hệ thống không cho phép từ chối nếu lý do quá ngắn.
5. Mọi thao tác phê duyệt/từ chối đều được ghi nhận vào LichSuThayDoi của cầu cảng (INT-003).
6. PheDuyetBy được lấy từ đăng nhập hiện tại của người dùng — không cho phép người khác phê duyệt thay.

## Testing Strategy

Kiểm thử đơn vị cho service methods approve() và reject() xác nhận: chỉ role Leader/Admin mới có quyền, trạng thái chỉ thay đổi khi hiện tại là CHO_PHE_DUYET, tạo PheDuyetLog đúng cấu trúc với ketQua và lyDoTuChoi (cho reject), và lý do từ chối phải ≥ 10 ký tự. Kiểm thử integration cho endpoints POST /:id/approve và POST /:id/reject với các trường hợp: phê duyệt thành công cho cầu cảng CHO_PHE_DUYET, từ chối với lý do đủ 10 ký tự, từ chối với lý do < 10 ký tự (phải lỗi), phê duyệt cho cầu cảng đã DUOC_PHE_DUYET (phải lỗi). Kiểm thử UI cho flow phê duyệt: Hộp thoại xác nhận hiển thị đúng thông tin, nút Phê duyệt hiển thị cho Leader, form lý do từ chối với validation ≥ 10 ký tự, toast sau khi hoàn tất, và danh sách làm mới. Kiểm thử RBAC: user không phải Leader/Admin không thấy nút phê duyệt/từ chối.
