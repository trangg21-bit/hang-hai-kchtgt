---
feature-id: F-040
module-id: M-003
document: design-plan
stage: engineering-solution-designer
status: accepted
last-updated: 2026-08-26
source-of-truth:
  - _features/F-040-quan-ly-luong-hang-hai-xoa/feature-brief.md
  - _features/F-040-quan-ly-luong-hang-hai-xoa/ba/00-lean-spec.md
---

# Design Plan — F-040 Xóa (soft delete) Luồng hàng hải (M-003)

## 1. Mục đích và phạm vi

F-040 cho phép user có `navigationchannel:delete` xóa mềm hồ sơ Luồng hàng hải
(`DELETE /api/v1/navigation-channel/{id}` — đã implement ở F-038, commit ed400cf7). File này CHỈ
chốt phần RIÊNG của F-040: **2 gap do BA flag** (quy tắc trạng thái xóa, ghi history `DELETE` qua
`ApprovalHistoryUtils.recordSoftDelete` — utility chưa có caller) + gating nút Xóa trên FE. KHÔNG
lặp lại cơ chế soft delete/audit `deleted_at`/`deleted_by` từ `BaseEntity` đã chốt ở F-038.

Thiết kế này chốt: (a) quy tắc trạng thái được phép xóa, (b) cơ chế ghi history `DELETE`, (c) work
orders BE/FE tách file. Mọi nhận định "hiện trạng" đều được mở và dẫn nguồn `Basename.ext:line`.

## 2. Hiện trạng code (đã verify — anchor)

| Hạng mục | Hiện trạng | Anchor |
|---|---|---|
| Endpoint delete | `DELETE /{id}` guard `navigationchannel:delete`, đọc `userId` từ `Authentication` | `NavigationChannelController.java:70-76`, `:159-165` |
| `service.softDelete` | Guard **chỉ `APPROVED`**: `if (nc.getApprovalStatus() != ApprovalStatus.APPROVED) throw ...`; `nc.softDelete(operatorId)`; xóa GIS khi có `spatialId`; **KHÔNG ghi history `DELETE`** | `NavigationChannelService.java:337-356` (guard `:341`, GIS `:344-347`, save `:349`) |
| Soft delete base | `BaseEntity.softDelete(deletedBy)` gán `deletedAt`/`deletedBy`; filter đọc `deleted_at IS NULL` | `BaseEntity.java:112-115`, `:23` |
| History utility | `ApprovalHistoryUtils.recordSoftDelete(repository, refId, refType, userId, reason)` ghi `status=DELETED`, `approvalLevel=LEVEL_0`, `changedField=EntityFields.DELETED_AT` — **grep toàn repo: không có caller** | `ApprovalHistoryUtils.java:30-57` |
| History enum | `ApprovalHistoryStatus.DELETED(6)` **đã tồn tại** — không cần mở rộng enum | `ApprovalHistoryStatus.java:11` |
| Repository inject | `approvalHistoryRepo` đã inject trong `NavigationChannelService` (dùng ở `getHistory`) | `NavigationChannelService.java:420` |
| Pattern sibling | ShipRepairFacilityService + VtsSystemService: guard `APPROVED`-only + `softDelete` + history `DELETED` | `ShipRepairFacilityService.java:255-267`; `VtsSystemService.java:695-703` |
| FE nút Xóa | Hiển thị theo permission `navigationchannel:delete`, KHÔNG theo trạng thái | `NavigationChannelList.tsx:326-340` |

## 3. Quyết định thiết kế (SA chốt delta BA flag)

### D1 — Quy tắc trạng thái xóa: GIỮ `APPROVED`-only

Chốt **giữ guard `APPROVED`-only** hiện tại (`NavigationChannelService.java:341`) — không mở rộng
sang trạng thái khác:

- **Lý do (trade-off):** 2 module sibling cùng cụm menu KCHT (VTS system, Cơ sở sửa chữa/đóng tàu)
  đều enforce `APPROVED`-only với message tương tự (`ShipRepairFacilityService.java:257-260`,
  `VtsSystemService.java:695-697`); AGENTS.md yêu cầu đồng bộ hành vi giữa các màn cùng menu. Xóa
  hồ sơ chưa duyệt (DRAFT/PENDING/REJECTED) là phá hủy dữ liệu đang xử lý mà không qua phê duyệt —
  không có giá trị nghiệp vụ. Phương án thay thế (cho xóa nhiều trạng thái) bị bác vì lệch sibling
  và tăng rủi ro mất dữ liệu.
- Message: giữ nguyên `"Chỉ có luồng hàng hải đã duyệt mới có thể xóa mềm"` (tiếng Việt có dấu,
  BR-040-01).
- Xóa lại hồ sơ đã xóa / không tồn tại: đã bị chặn bởi filter `deleted_at IS NULL`
  (`BaseEntity.java:23`) → "Không tìm thấy luồng hàng hải với id" — không thêm code.

### D2 — Ghi history `DELETE` (delta BA flag #2)

- Cơ chế: **KHÔNG mở rộng enum, KHÔNG thêm bảng/cột, KHÔNG migration** —
  `ApprovalHistoryStatus.DELETED(6)` đã có (`ApprovalHistoryStatus.java:11`), bảng `approval_history`
  đã có đủ cột (`ApprovalHistory.java:35-62`). Tái dùng **`ApprovalHistoryUtils.recordSoftDelete`**
  — đúng chủ đích tạo ra utility (hiện chưa có caller, grep toàn repo xác nhận).
- Vị trí: cuối `service.softDelete`, sau `repo.save(nc)` (`NavigationChannelService.java:349`), trong
  cùng transaction (`@Transactional` sẵn tại `:336`) — thất bại bất kỳ phần nào rollback cả xóa lẫn
  history.
- Gọi:
  ```java
  ApprovalHistoryUtils.recordSoftDelete(approvalHistoryRepo, id,
          InfrastructureType.NAVIGATION_CHANNEL, operatorId, "Xóa luồng hàng hải");
  ```
  Utility tự ghi `status=DELETED`, `approvalLevel=LEVEL_0`, `approvedBy=operatorId`,
  `changedField=EntityFields.DELETED_AT`, `previousValue="null"`, `newValue="đã xóa mềm"`.
- Import bổ sung duy nhất: `com.hanghai.kchtg.common.util.ApprovalHistoryUtils`
  (`approvalHistoryRepo` + `InfrastructureType` đã có).

### D3 — FE gating nút Xóa theo trạng thái

- `NavigationChannelList.tsx:326-340`: nút Xóa chỉ hiển thị khi có `navigationchannel:delete` **VÀ**
  `record.approvalStatus === 'APPROVED'` (khớp D1). UI giữ popup xác nhận hiện có.

## 4. Mapping acceptance criteria

| AC | Thiết kế đáp ứng | Oracle kiểm chứng |
|---|---|---|
| AC-040-01/02 | D1 (giữ guard `APPROVED`) | DELETE `APPROVED` → `deleted_at`/`deleted_by` ghi; DELETE `DRAFT` → 400-family message, DB không đổi |
| AC-040-03/04 | Giữ nguyên (filter đọc) | Hồ sơ đã xóa biến mất khỏi list/search; GET/PUT/DELETE lại → "Không tìm thấy" |
| AC-040-05 | Giữ nguyên (GIS cleanup) | `gis_spatial_object` không còn bản ghi |
| BR-040-06 (history) | D2 | DELETE `APPROVED` → 1 dòng `approval_history` `status` ordinal 6, `ref_type` ordinal 6 (NAVIGATION_CHANNEL), `approval_level` 0, `approved_by`=operatorId, `reason`="Xóa luồng hàng hải" |
| AC-040-06 | Giữ nguyên (permission) | Thiếu `navigationchannel:delete` → 403 |

## 5. Work orders — tách file BE/FE (disjoint)

### Backend
| WO | File | Nội dung | Oracle |
|---|---|---|---|
| WO-F040-BE-1 | `src/main/java/com/hanghai/kchtg/navigationchannel/service/NavigationChannelService.java` | D2: sau `repo.save(nc)` (`:349`) gọi `ApprovalHistoryUtils.recordSoftDelete(approvalHistoryRepo, id, InfrastructureType.NAVIGATION_CHANNEL, operatorId, "Xóa luồng hàng hải")`; thêm import `ApprovalHistoryUtils`. GIỮ nguyên guard `:341` (D1) và GIS cleanup `:344-347` | `mvn -DskipTests compile`; integration test: (1) xóa `APPROVED` → `deleted_at` set + 1 dòng history DELETED đúng refType/level/approvedBy; (2) xóa `DRAFT` → 400-family, KHÔNG có dòng history mới; (3) xóa hồ sơ có `spatialId` → GIS bị xóa + history vẫn ghi |

Thứ tự thực thi: WO-F040-BE-1 (độc lập).

### Frontend
| WO | File | Nội dung | Oracle |
|---|---|---|---|
| WO-F040-FE-1 | `frontend/src/pages/navigationchannel/NavigationChannelList.tsx` | D3: gating nút Xóa (`:326-340`) theo `record.approvalStatus === 'APPROVED'`; giữ popup xác nhận | UI test: hồ sơ `DRAFT` không hiển thị nút Xóa dù có `navigationchannel:delete`; hồ sơ `APPROVED` hiển thị |

## 6. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| History ghi ngoài transaction → dòng mồ côi khi save thất bại | Thấp | Gọi trong cùng method `@Transactional` (`:336`) |
| FE gating sai → user thấy nút nhưng API chặn | Thấp | FE gating khớp D1; API là biên chặn cuối (BR-040-01) |
| `recordSoftDelete` nhận `reason` rỗng → fallback "Xóa bản ghi" (utility tự xử lý) | Không | Luôn truyền reason cụ thể "Xóa luồng hàng hải" |

## 7. Ràng buộc bắt buộc (nhắc lại cho implementer)

- Tên field/API English chuẩn; message UI tiếng Việt có dấu (giữ message BR-040-01).
- KHÔNG hardcode enum string — dùng `ApprovalStatus.APPROVED`, `InfrastructureType.NAVIGATION_CHANNEL`
  (không viết số 6).
- Tái dùng `ApprovalHistoryUtils.recordSoftDelete` — không tự dựng `ApprovalHistory.builder()` ở
  method này.
- KHÔNG xóa cứng, KHÔNG đổi schema, KHÔNG chạy backend (xác nhận `mvn -DskipTests compile`).
- KHÔNG sửa file thuộc F-038 đã chốt ngoài `NavigationChannelService.softDelete`.
