---
id: F-041
name: Phe duyet Luong hang hai
slug: phe-duyet-luong-hang-hai
module-id: M-003
status: implemented
classification: local
priority: P0
created: 2026-06-29T00:00:00Z
last-updated: 2026-08-26T02:59:34Z
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Phê duyệt Luồng hàng hải

**Tài liệu:** Tài liệu chức năng — phần riêng theo template 7 section.
**Chức năng:** F-041 — Phê duyệt Luồng hàng hải 2 cấp (C1: Cảng vụ/Chi cục → C2: Cục).
**Module:** M-003 — Quản lý tài sản KCHTGT khu nước & VTS.
**Loại:** Chức năng có bước phê duyệt 2 cấp.
**Tham chiếu:** Cơ chế phê duyệt dùng chung `InfrastructureApprovalService` (common/service) + 71 trường entity `NavigationChannel` và các field phê duyệt #47-#57 tại F-038 (`feature-brief.md`, `ba/00-lean-spec.md`, `design/00-design-plan.md` mục 6). File này CHỈ mô tả phần RIÊNG của F-041.

## 1. Mô tả ngắn

Chức năng F-041 mô tả toàn bộ quy trình phê duyệt 2 cấp cho hồ sơ Luồng hàng hải: gửi phê duyệt (submit), phê duyệt/trả về cấp Cảng vụ/Chi cục (C1), phê duyệt/trả về cấp Cục (C2). Người duyệt được xác định từ phiên đăng nhập (Authentication), không nhận từ body request. Quy trình áp dụng 4-eyes principle (người tạo không tự duyệt; người duyệt C2 không trùng người duyệt C1) và Rule 14 (người gửi thuộc cấp Cục → hồ sơ vào thẳng trạng thái chờ Cục duyệt). Lý do bắt buộc khi trả về. Mỗi bước ghi lịch sử vào bảng `approval_history` dùng chung (xem F-043).

## 2. Trường dữ liệu

Body request phê duyệt `ApprovalRequest` (ApprovalRequest.java:10-25):

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | `status` (Quyết định) | Có | String enum | `@NotBlank` "Trạng thái không được để trống". Giá trị hợp lệ: `APPROVED`/`APPROVE` (duyệt), `REJECTED`/`REJECT`/`REJECTED_LEVEL1`/`REJECTED_LEVEL2` (trả về) — service chuyển thành `ApprovalStatus.REJECTED.name()` khi reject. |
| 2 | `reason` (Lý do / nội dung) | Có khi trả về | String | Bắt buộc khi reject ("Lý do từ chối là bắt buộc"); khi duyệt lưu làm nội dung phê duyệt (#54/#57). |
| 3 | `approvalLevel` | Không | Enum | Không dùng để quyết định cấp: endpoint `/reject-level-1` luôn reject ở LEVEL_1, `/reject-level-2` luôn reject ở LEVEL_2 (NavigationChannelService.java:387-404). |
| — | Người duyệt (`userId`) | — | Không có trong DTO | Luôn lấy từ `Authentication` trong controller (`currentUserId`), không nhận từ body — BR-041-06. |

Các trường hệ thống ghi sau mỗi bước (read-only, #47-#57): `approvalStatus`, `submittedAt`/`submittedBy` (#50/#51), `level1ApprovedAt`/`level1ApprovedBy`/`level1ApprovalContent` (#52-#54), `level2ApprovedAt`/`level2ApprovedBy`/`level2ApprovalContent` (#55-#57), `approverLevel1`/`approverLevel2`/`approvedDateLevel1`/`approvedDateLevel2`/`rejectionReason`.

## 3. Trạng thái và phê duyệt

Trạng thái lưu dạng số theo enum `ApprovalStatus` (ApprovalStatus.java:4-13): `DRAFT`=0, `PROPOSED`=1, `PENDING_APPROVAL`=2 (Chờ Cảng vụ/Chi cục duyệt), `APPROVED_LEVEL1`=3 (Chờ Cục duyệt), `APPROVED`=5 (Đã duyệt), `REJECTED_LEVEL1`=8 (Bị Cảng vụ/Chi cục trả về), `REJECTED_LEVEL2`=9 (Bị Cục trả về). (`APPROVED_LEVEL2`=4, `REJECTED`=6, `ARCHIVED`=7 là legacy, không dùng trong luồng này.)

**State machine (InfrastructureApprovalService.java:53-230):**

| Bước | Điều kiện trước | Hành động | Kết quả | Ghi chú |
|---|---|---|---|---|
| Submit (`POST /{id}/submit-approval`) | `DRAFT`/`PROPOSED`/`REJECTED_LEVEL1`/`REJECTED_LEVEL2`/`REJECTED` | Kiểm tra cấp đơn vị người gửi (Rule 14) | Cấp Cảng vụ/Chi cục → `PENDING_APPROVAL`; cấp Cục → `APPROVED_LEVEL1` | Xóa `rejectionReason`; ghi `submittedAt`/`submittedBy` (refresh cả khi gửi lại); reset approver C1/C2; history `PROPOSED` |
| Duyệt C1 (`POST /{id}/approve/c1`) | `PENDING_APPROVAL` (hoặc `PROPOSED`) | 4-eyes: người tạo không tự duyệt | `APPROVED_LEVEL1`; ghi `approverLevel1`/`approvedDateLevel1`/`level1ApprovalContent` (#52-#54); history `APPROVED` level 1 | |
| Trả về C1 (`POST /{id}/reject-level-1`) | `PENDING_APPROVAL` | 4-eyes + lý do bắt buộc | `REJECTED_LEVEL1`; ghi `level1ApprovalContent` = lý do (#54); history `REJECTED` level 1 | Reset `approverLevel1`/`approvedDateLevel1` |
| Duyệt C2 (`POST /{id}/approve/c2`) | `APPROVED_LEVEL1` | 4-eyes: C2 ≠ C1; người tạo không tự duyệt | `APPROVED`; ghi `approverLevel2`/`approvedDateLevel2`/`level2ApprovalContent` (#55-#57); history `APPROVED` level 2 | |
| Trả về C2 (`POST /{id}/reject-level-2`) | `APPROVED_LEVEL1` | 4-eyes + lý do bắt buộc | `REJECTED_LEVEL2`; ghi `level2ApprovalContent` = lý do (#57); history `REJECTED` level 2 | Reset `approverLevel2`/`approvedDateLevel2` |

- **4-eyes (chống tự duyệt):** người tạo hồ sơ không được tự duyệt ở cả C1 và C2 — "Bạn không thể phê duyệt bản do chính mình gửi (4-eyes principle)" (InfrastructureApprovalService.java:117-120, 186-189); người duyệt C2 không được trùng người duyệt C1 — "Người phê duyệt C2 không được trùng với người phê duyệt C1 (4-eyes principle)" (InfrastructureApprovalService.java:180-183).
- **Lý do trả về bắt buộc:** reject thiếu `reason` → `IllegalArgumentException` "Lý do từ chối là bắt buộc" (InfrastructureApprovalService.java:133-135, 196-198).
- **Người duyệt từ Authentication:** controller đọc `currentUserId(authentication)` (NavigationChannelController.java:63-72) và truyền vào service; DTO không có field userId — BR-041-06 (lỗi B1 đã sửa ở F-038: không bind approver từ body).
- **Gửi lại sau trả về:** hồ sơ `REJECTED_LEVEL1`/`REJECTED_LEVEL2` gọi submit lại được; `submittedAt`/`submittedBy` được refresh.
- Hồ sơ sau khi duyệt xong (`APPROVED`) không còn endpoint phê duyệt nào khả dụng; muốn thay đổi phải tạo hồ sơ mới (thao tác sửa hồ sơ `APPROVED` là vấn đề PMO chốt ở F-039 mục 3).

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (Business Rules)

| ID | Quy tắc | Áp dụng |
|---|---|---|
| BR-041-01 | Chỉ submit được từ `DRAFT`/`PROPOSED`/`REJECTED_LEVEL1`/`REJECTED_LEVEL2`/`REJECTED`; trạng thái khác → lỗi "Chỉ có thể gửi duyệt hồ sơ ở trạng thái Lưu tạm hoặc Bị trả về". | Submit |
| BR-041-02 | Rule 14: người gửi thuộc cấp Cục (OrgUnitRank.DEPARTMENT hoặc level == 1) → hồ sơ vào thẳng `APPROVED_LEVEL1`; ngược lại → `PENDING_APPROVAL`. | Submit |
| BR-041-03 | Duyệt C1 chỉ từ `PENDING_APPROVAL` (hoặc `PROPOSED`); sai trạng thái → lỗi tiếng Việt. | Approve C1 / Reject C1 |
| BR-041-04 | Duyệt C2 chỉ từ `APPROVED_LEVEL1`; sai trạng thái → lỗi tiếng Việt. | Approve C2 / Reject C2 |
| BR-041-05 | 4-eyes: người tạo hồ sơ không tự duyệt (C1/C2); người duyệt C2 không trùng người duyệt C1. | Approve/Reject |
| BR-041-06 | Người duyệt xác định từ `Authentication` (session), không nhận từ body request. | Approve/Reject/Submit |
| BR-041-07 | Trả về (reject) bắt buộc có lý do; lý do được trim và lưu vào `rejectionReason` + `level1/2ApprovalContent` (#54/#57). | Reject |
| BR-041-08 | Mỗi bước ghi history vào `approval_history` (`refType=NAVIGATION_CHANNEL`): submit → `PROPOSED`, duyệt → `APPROVED`, trả về → `REJECTED`, kèm `approvalLevel` LEVEL_1/LEVEL_2 và lý do. | Submit/Approve/Reject |
| BR-041-09 | Duyệt/trả về ghi `level*ApprovalContent` cả hai nhánh (approve lưu nội dung, reject lưu lý do trim). | Approve/Reject |

### 4.2. Acceptance Criteria

| AC-ID | Given | When | Then | Oracle |
|---|---|---|---|---|
| AC-041-01 | Hồ sơ `DRAFT`, user thuộc Cảng vụ/Chi cục, có `navigationchannel:update` | Gọi submit-approval | Hồ sơ chuyển `PENDING_APPROVAL`; `submittedAt`/`submittedBy` ghi từ session; history `PROPOSED` | DB: `approval_status`=2, `submitted_by`=user id, có dòng approval_history. |
| AC-041-02 | Hồ sơ `DRAFT`, user thuộc cấp Cục | Gọi submit-approval | Hồ sơ vào thẳng `APPROVED_LEVEL1` (Rule 14) | DB: `approval_status`=3. |
| AC-041-03 | Hồ sơ `PENDING_APPROVAL`, user có `navigationchannel:approvec1`, không phải người tạo | Gọi approve/c1 với `status=APPROVED` | Hồ sơ chuyển `APPROVED_LEVEL1`; ghi #52-#54; history `APPROVED` level 1 | DB: `approver_level1`=user id, `level1_approval_content`=reason. |
| AC-041-04 | Hồ sơ `PENDING_APPROVAL` | Gọi reject-level-1 không có lý do | API từ chối "Lý do từ chối là bắt buộc", trạng thái không đổi | HTTP 400-family; không có dòng history mới. |
| AC-041-05 | Hồ sơ `PENDING_APPROVAL`, người gọi là người tạo | Gọi approve/c1 | API từ chối "Bạn không thể phê duyệt bản do chính mình gửi (4-eyes principle)" | HTTP 400-family; trạng thái không đổi. |
| AC-041-06 | Hồ sơ `PENDING_APPROVAL` | Gọi reject-level-1 có lý do | Hồ sơ chuyển `REJECTED_LEVEL1`; `level1ApprovalContent`=lý do; history `REJECTED` level 1 | DB: `approval_status`=8. |
| AC-041-07 | Hồ sơ `APPROVED_LEVEL1`, người duyệt C2 trùng người duyệt C1 | Gọi approve/c2 | API từ chối "Người phê duyệt C2 không được trùng với người phê duyệt C1 (4-eyes principle)" | HTTP 400-family; trạng thái không đổi. |
| AC-041-08 | Hồ sơ `APPROVED_LEVEL1`, user có `navigationchannel:approvec2`, thỏa 4-eyes | Gọi approve/c2 với `status=APPROVED` | Hồ sơ chuyển `APPROVED`; ghi #55-#57; history `APPROVED` level 2 | DB: `approval_status`=5, `approver_level2`=user id. |
| AC-041-09 | Hồ sơ `APPROVED_LEVEL1` | Gọi reject-level-2 có lý do | Hồ sơ chuyển `REJECTED_LEVEL2`; history `REJECTED` level 2 | DB: `approval_status`=9. |
| AC-041-10 | Hồ sơ `REJECTED_LEVEL1`/`REJECTED_LEVEL2` | Gọi submit-approval lại | Hồ sơ gửi lại được; `submittedAt`/`submittedBy` refresh; reset approver | DB: trạng thái mới + thời gian submit mới. |
| AC-041-11 | User thiếu permission tương ứng | Gọi approve/c1, approve/c2, reject-level-1, reject-level-2 | HTTP 403 | Permission `navigationchannel:approvec1`/`approvec2`. |

### 4.3. User Stories

- **US-041-01:** Là Chuyên viên, tôi muốn gửi hồ sơ Luồng hàng hải đi phê duyệt để thay đổi dữ liệu được kiểm soát 2 cấp.
- **US-041-02:** Là Lãnh đạo Cảng vụ/Chi cục, tôi muốn duyệt hoặc trả về hồ sơ cấp 1 (kèm lý do khi trả về) để kiểm soát nghiệp vụ trước khi gửi Cục.
- **US-041-03:** Là Lãnh đạo Cục/Admin Cục, tôi muốn duyệt hoặc trả về hồ sơ cấp 2 để ra quyết định cuối cùng và truy vết trách nhiệm.
- **US-041-04:** Là người thao tác, tôi muốn hệ thống chặn tự duyệt hồ sơ mình tạo và chặn trùng người duyệt C1/C2 để đảm bảo nguyên tắc 4 mắt.

### 4.4. Phân quyền riêng

| Thao tác | Quyền (`<resource>:<action>`) |
|---|---|
| Gửi phê duyệt (submit) | `navigationchannel:update` |
| Duyệt/trả về cấp Cảng vụ/Chi cục | `navigationchannel:approvec1` |
| Duyệt/trả về cấp Cục | `navigationchannel:approvec2` |

| Vai trò | Submit | Duyệt C1 | Duyệt C2 | Ghi chú |
|---|---|---|---|---|
| Chuyên viên thuộc đơn vị | Có (hồ sơ trong scope) | Không | Không | Bị giới hạn theo `orgUnitId`. |
| Lãnh đạo Cảng vụ/Chi cục | Có nếu được gán quyền | Có | Không | Duyệt C1 cho hồ sơ trong phạm vi; không tự duyệt hồ sơ mình tạo. |
| Lãnh đạo Cục / Admin Cục | Có nếu được gán quyền | Có nếu được gán quyền | Có | Duyệt C2; C2 không trùng C1; xem metadata nhạy cảm theo quyền. |
| Quản trị hệ thống | Có | Có | Có | ROLE_SYSTEM_ADMIN vượt qua mọi kiểm tra quyền. |
| Người không có quyền tương ứng | Không | Không | Không | API trả 403 Forbidden. |

**Admin Cục:** với F-041, Admin Cục có thể duyệt cấp 2 (và cấp 1 nếu được gán quyền) cho hồ sơ trong phạm vi Cục; vẫn phải tuân thủ 4-eyes (không tự duyệt hồ sơ mình tạo, C2 ≠ C1) và data scope chung.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có. Workflow số: `DRAFT`(0) → `PENDING_APPROVAL`(2) hoặc `APPROVED_LEVEL1`(3, Rule 14) → `APPROVED_LEVEL1`(3) → `APPROVED`(5); trả về: `REJECTED_LEVEL1`(8)/`REJECTED_LEVEL2`(9), gửi lại được. Không dùng `PROPOSED`(1)/`APPROVED_LEVEL2`(4)/`REJECTED`(6)/`ARCHIVED`(7) trong luồng. |
| 2 | Có bước phê duyệt không | Có. 2 cấp: Cảng vụ/Chi cục (`navigationchannel:approvec1`) → Cục (`navigationchannel:approvec2`); các trường #47-#57 read-only do hệ thống ghi. |
| 3 | Lọc cha-con / theo đơn vị | Theo đơn vị. Hồ sơ phải đọc được trong phạm vi đơn vị user mới xử lý được (entity `@Filter(orgUnitFilter)` NavigationChannel.java:22 + controller `@DataScope` NavigationChannelController.java:25). Duyệt không gán đơn vị mới; `orgUnitId` của hồ sơ giữ nguyên. |
| 4 | Trường chỉ hiện trong điều kiện nào | Nút Duyệt/Trả về chỉ hiển thị theo trạng thái hồ sơ và quyền (ApprovalActionBar — NavigationChannelForm.tsx:759); dialog trả về bắt buộc nhập lý do. |
| 5 | Quyền riêng | `navigationchannel:approvec1` (C1), `navigationchannel:approvec2` (C2), `navigationchannel:update` (submit). |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Không. Tất cả endpoint phê duyệt yêu cầu đăng nhập, RBAC và data scope. |
| 7 | Tải lên tệp | Không. |
| 8 | Giao diện khác mẫu chung | Không tạo layout riêng; dùng `ApprovalActionBar`/`ApprovalModal`/`ApprovalStatusBadge` shared; không mô tả hardcode màu/spacing/font. |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/v1/navigation-channel/{id}/submit-approval` | Gửi hồ sơ đi phê duyệt; ghi #50-#51; Rule 14 quyết định trạng thái đích. | `navigationchannel:update` |
| POST | `/api/v1/navigation-channel/{id}/approve/c1` | Phê duyệt cấp Cảng vụ/Chi cục; ghi #52-#54. | `navigationchannel:approvec1` |
| POST | `/api/v1/navigation-channel/{id}/reject-level-1` | Trả về cấp Cảng vụ/Chi cục (bắt buộc lý do); ghi #54. | `navigationchannel:approvec1` |
| POST | `/api/v1/navigation-channel/{id}/approve/c2` | Phê duyệt cấp Cục; ghi #55-#57. | `navigationchannel:approvec2` |
| POST | `/api/v1/navigation-channel/{id}/reject-level-2` | Trả về cấp Cục (bắt buộc lý do); ghi #57. | `navigationchannel:approvec2` |
| GET | `/api/v1/navigation-channel/{id}/history` | Lịch sử các bước phê duyệt (chi tiết F-043). | `navigationchannel:history` |

Body các endpoint approve/reject: `ApprovalRequest { approvalLevel?, status, reason? }`; `userId` không nằm trong body.

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Không có thay đổi schema mới cho F-041. Lịch sử phê duyệt ghi vào bảng `approval_history` dùng chung (`ref_type = InfrastructureType.NAVIGATION_CHANNEL` ordinal 6, `ref_id` = navigation_channel.id) qua `InfrastructureApprovalService.recordHistory` (InfrastructureApprovalService.java:312-320). Các cột phê duyệt `submitted_at`/`submitted_by`/`level1_approval_content`/`level2_approval_content` và `approver_level1`/`approver_level2`/`approved_date_level1`/`approved_date_level2`/`rejection_reason` đã chốt tại migration `V20260825120000` (design/00-design-plan.md mục 4-6). Không thêm cột, không thêm index.
