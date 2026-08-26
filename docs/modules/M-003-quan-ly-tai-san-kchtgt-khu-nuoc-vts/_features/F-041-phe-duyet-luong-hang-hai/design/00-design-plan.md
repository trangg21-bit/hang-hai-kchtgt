---
feature-id: F-041
module-id: M-003
document: design-plan
stage: engineering-solution-designer
status: accepted
last-updated: 2026-08-26
source-of-truth:
  - _features/F-041-phe-duyet-luong-hang-hai/feature-brief.md
  - _features/F-041-phe-duyet-luong-hang-hai/ba/00-lean-spec.md
---

# Design Plan — F-041 Phê duyệt 2 cấp Luồng hàng hải (M-003)

## 1. Mục đích và phạm vi

F-041 mô tả toàn bộ quy trình phê duyệt 2 cấp cho hồ sơ Luồng hàng hải: submit, duyệt/trả về C1
(Cảng vụ/Chi cục), duyệt/trả về C2 (Cục). Toàn bộ state machine, 5 endpoint, 4-eyes, Rule 14, lý do
bắt buộc, ghi history phê duyệt **đã implement cùng F-038 (commit ed400cf7)** qua
`InfrastructureApprovalService` dùng chung. File này KHÔNG thiết kế lại — **xác nhận hiện trạng bằng
anchor đã mở + liệt kê work order kiểm chứng** (không bịa việc thừa). Mọi nhận định "hiện trạng" đều
dẫn nguồn `Basename.ext:line` trong phiên này.

## 2. Hiện trạng code (đã verify — anchor)

| Hạng mục | Hiện trạng | Anchor |
|---|---|---|
| Submit | `POST /{id}/submit-approval` guard `navigationchannel:update` → `service.submit` → `InfrastructureApprovalService.submit`: chỉ submit từ DRAFT/PROPOSED/REJECTED_LEVEL1/REJECTED_LEVEL2/REJECTED; Rule 14 (cấp Cục → `APPROVED_LEVEL1`, ngược lại `PENDING_APPROVAL`); reset `rejectionReason` + approver; ghi `submittedAt/By`; history `PROPOSED`/LEVEL_0 | `NavigationChannelController.java:78-86`; `NavigationChannelService.java:358-364`; `InfrastructureApprovalService.java:50-95` (guard `:58`, Rule 14 `:60-73`, ghi `:74-87`, history `:90-91`) |
| Duyệt/trả về C1 | `POST /{id}/approve/c1` guard `navigationchannel:approvec1`; `POST /{id}/reject-level-1` cùng guard; 4-eyes (người tạo không tự duyệt `:111`); lý do bắt buộc khi reject `:117`; approve → `APPROVED_LEVEL1` + ghi `approverLevel1`/`approvedDateLevel1`/`level1ApprovalContent` + history `APPROVED`/LEVEL_1; reject → `REJECTED_LEVEL1` + `level1ApprovalContent`=lý do + history `REJECTED`/LEVEL_1 | `NavigationChannelController.java:88-96,108-116`; `NavigationChannelService.java:366-373,387-394`; `InfrastructureApprovalService.java:99-143` |
| Duyệt/trả về C2 | `POST /{id}/approve/c2` guard `navigationchannel:approvec2`; `POST /{id}/reject-level-2`; 4-eyes C2≠C1 `:165` + người tạo `:170`; lý do bắt buộc `:176`; approve → `APPROVED` + `approverLevel2`/`approvedDateLevel2`/`level2ApprovalContent` + history `APPROVED`/LEVEL_2; reject → `REJECTED_LEVEL2` + history `REJECTED`/LEVEL_2 | `NavigationChannelController.java:98-106,118-126`; `NavigationChannelService.java:375-384,396-404`; `InfrastructureApprovalService.java:152-201` |
| Người duyệt từ session | `currentUserId(authentication)` trong controller; DTO `ApprovalRequest` không có field `userId` | `NavigationChannelController.java:159-165`; `ApprovalRequest.java:10-25` |
| Field #50-#57 | Ghi từ workflow qua `BaseApprovableEntity` (submittedAt/By, approverLevel1/2, approvedDateLevel1/2, level1/2ApprovalContent, rejectionReason) | `BaseApprovableEntity.java:44-77`; migration `V20260825120000` (design plan F-038 mục 4-6) |
| History phê duyệt | `InfrastructureApprovalService.recordHistory` ghi bảng `approval_history` (`refType=NAVIGATION_CHANNEL` ordinal 6); các dòng PROPOSED/APPROVED/REJECTED kèm `approvalLevel` | `InfrastructureApprovalService.java:301-320`; `ApprovalHistory.java:35-62` |
| Permission | `navigationchannel:approvec1/approvec2/history/update` đã seed (9 code `navigationchannel:*` tại F-038) | `PermissionSeeder.java:294-310` (grep 9 dòng, design plan F-038 mục 8) |
| FE | `ApprovalActionBar` hiển thị theo trạng thái + quyền; dialog trả về bắt buộc lý do; `HistoryTimeline` trong chi tiết | `NavigationChannelForm.tsx:758-763,771`, `:537-564` |

## 3. Quyết định thiết kế (xác nhận — không có delta)

1. **Giữ nguyên** state machine 2 cấp + Rule 14 + 4-eyes + lý do bắt buộc — khớp 100% BA brief
   (không có điểm lệch hành vi, triage BA verdict `Low risk`).
2. **Sự kiện history dùng `APPROVED`/`REJECTED` + `approvalLevel` 1/2** (KHÔNG tạo code
   `APPROVE_C1`/`REJECT_C1`...) — đúng pattern dùng chung M-1006 cho 28 loại KCHT và đúng label map
   FE có sẵn (`HistoryTimeline.tsx:50-55`). Chi tiết ghi sự kiện tạo/sửa/xóa nằm ở F-043.
3. **KHÔNG migration, KHÔNG đổi enum** cho F-041 — bảng `approval_history` + `ApprovalStatus` 10 giá
   trị + 5 endpoint đều đã đủ.
4. Tương tác với F-039: sau khi F-039 reset hồ sơ về `DRAFT` (sửa), hồ sơ submit lại được bình
   thường qua BR-041-01 (DRAFT trong tập cho phép) — không cần thay đổi gì ở approval service.

## 4. Mapping acceptance criteria

| AC | Thiết kế đáp ứng | Oracle kiểm chứng |
|---|---|---|
| AC-041-01..11 | State machine hiện tại (mục 2) | Chạy TS-041-01..09 (integration/security) theo lean-spec |

## 5. Work orders — kiểm chứng (không thay đổi code BE, trừ khi test phát hiện lệch)

### Backend (kiểm chứng)
| WO | File | Nội dung | Oracle |
|---|---|---|---|
| WO-F041-BE-V1 | `src/test/java/.../navigationchannel/` (integration test mới) | Test đủ chuỗi: submit Cảng vụ → `PENDING_APPROVAL`; submit cấp Cục → `APPROVED_LEVEL1` (Rule 14); duyệt C1 → `APPROVED_LEVEL1` + #52-#54 + history; reject C1 thiếu lý do → 400-family; người tạo tự duyệt → 400-family 4-eyes; reject C1 có lý do → `REJECTED_LEVEL1` + history `REJECTED`/LEVEL_1; C2 trùng C1 → 400-family; duyệt C2 → `APPROVED` + #55-#57 + history; reject C2 → `REJECTED_LEVEL2`; submit lại sau reject → timestamp refresh + reset approver; thiếu `approvec1`/`approvec2` → 403 | Toàn bộ test pass (runner `mvn test`); nếu test phát hiện lệch hành vi → báo SA/PMO, KHÔNG tự sửa approval service |

### Frontend (kiểm chứng)
| WO | File | Nội dung | Oracle |
|---|---|---|---|
| WO-F041-FE-V1 | `frontend/src/pages/navigationchannel/NavigationChannelForm.tsx` (kiểm chứng, không sửa trừ khi lệch) | Kiểm chứng `ApprovalActionBar` (`:758-763`) hiển thị đúng nút theo trạng thái + quyền; dialog trả về (`:553-560`) bắt buộc lý do trước khi gọi reject; message lỗi tiếng Việt hiển thị từ `ApiResponse` | UI test: hồ sơ `PENDING_APPROVAL` hiện nút Duyệt C1/Trả về C1 cho user có `approvec1`; reject không nhập lý do → bị chặn bởi UI |

## 6. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Test kiểm chứng phát hiện lệch hành vi chưa biết | Thấp | Test là biên phát hiện; lệch → báo cáo, không tự sửa (F-041 không có delta theo BA) |
| F-039 reset DRAFT ảnh hưởng luồng submit lại | Không | BR-041-01 đã cho phép submit từ DRAFT — kiểm chứng bằng TS-041-08 |

## 7. Ràng buộc bắt buộc (nhắc lại cho implementer)

- KHÔNG sửa `InfrastructureApprovalService`, `ApprovalStatus`, endpoint, permission — đã chốt F-038/F-041.
- Message test assert tiếng Việt có dấu; tên test/class English chuẩn.
- KHÔNG chạy backend; kiểm chứng bằng `mvn test` (focused test) + `mvn -DskipTests compile`.
