---
feature-id: F-043
module-id: M-003
document: design-plan
stage: engineering-solution-designer
status: accepted
last-updated: 2026-08-26
source-of-truth:
  - _features/F-043-quan-ly-luong-hang-hai-lich-su/feature-brief.md
  - _features/F-043-quan-ly-luong-hang-hai-lich-su/ba/00-lean-spec.md
---

# Design Plan — F-043 Lịch sử thay đổi Luồng hàng hải (M-003)

## 1. Mục đích và phạm vi

F-043 cung cấp dòng thời gian lịch sử của hồ sơ Luồng hàng hải qua `GET /{id}/history`
(guard `navigationchannel:history`) — endpoint, thứ tự DESC, map tên user **đã implement ở F-038
(commit ed400cf7)**. File này CHỈ chốt phần RIÊNG của F-043: **delta BA flag #3** — bổ sung các
sự kiện `CREATED`/`UPDATED`/`DELETED` cho `NavigationChannel` (hiện chỉ có submit/approve/reject),
theo thứ tự thời gian. KHÔNG lặp lại schema `approval_history` đã chốt ở F-038/F-041.

Thiết kế này chốt: (a) cơ chế sự kiện (enum đã đủ — không migration), (b) 3 điểm ghi sự kiện +
chủ sở hữu work order, (c) xác nhận phía đọc, (d) work orders BE/FE tách file. Mọi nhận định "hiện
trạng" đều được mở và dẫn nguồn `Basename.ext:line`.

## 2. Hiện trạng code (đã verify — anchor)

| Hạng mục | Hiện trạng | Anchor |
|---|---|---|
| Enum sự kiện | `ApprovalHistoryStatus` **ĐÃ có** `CREATED(0)`, `UPDATED(5)`, `DELETED(6)` cùng `PROPOSED(1)`, `APPROVED(3)`, `REJECTED(4)` — không cần mở rộng enum | `ApprovalHistoryStatus.java:5,10,11,6,8,9` |
| Bảng history | `approval_history`: `ref_id`, `ref_type`, `approval_level`, `status` (ORDINAL SMALLINT), `approved_by`, `approved_date`, `reason`, `changed_field`, `previous_value`, `new_value`; index `(ref_type, ref_id, approved_date DESC)` | `ApprovalHistory.java:35-62,16-17` |
| Sự kiện phê duyệt (đã ghi) | submit → `PROPOSED`/LEVEL_0; duyệt C1 → `APPROVED`/LEVEL_1; trả về C1 → `REJECTED`/LEVEL_1; duyệt C2 → `APPROVED`/LEVEL_2; trả về C2 → `REJECTED`/LEVEL_2 | `InfrastructureApprovalService.java:90-91,138-139,126-127,197-198,185-186` |
| Sự kiện tạo/sửa/xóa (CHƯA ghi) | `create` không ghi `CREATED`; `update` không ghi `UPDATED`; `softDelete` không ghi `DELETED` (chưa có caller của `ApprovalHistoryUtils.recordSoftDelete` — grep toàn repo) | `NavigationChannelService.java:81-162,206-335,337-356`; `ApprovalHistoryUtils.java:30-57` |
| Đọc history | `getHistory` trả `List<HistoryEntry>` tất cả sự kiện theo `approved_date DESC`, map tên user (fullName → username → id); `status` trả `getCode()` string; controller guard `navigationchannel:history` | `NavigationChannelService.java:418-438`; `:466-470`; `NavigationChannelController.java:128-132` |
| FE timeline | `HistoryTimeline` **đã có** label/color cho `CREATED`/`UPDATED`/`DELETED`/`PROPOSED`/`APPROVED`/`REJECTED` | `HistoryTimeline.tsx:33-39,50-55,240-254` |
| Pattern sibling | ShipRepairFacilityService ghi `CREATED` khi tạo, `UPDATED` khi sửa, `DELETED` khi xóa | `ShipRepairFacilityService.java:96-105,233-245,258-266` |
| Type FE | `HistoryEntry.id` khai `number` nhưng BE trả UUID string — gap nhỏ | `types/navigationChannel.ts:197` |

## 3. Quyết định thiết kế (SA chốt delta BA flag #3)

### D1 — Cơ chế sự kiện: enum ĐÃ ĐỦ, KHÔNG migration, KHÔNG thêm code `APPROVE_C1`...

- **KHÔNG mở rộng `ApprovalHistoryStatus`** — `CREATED(0)`/`UPDATED(5)`/`DELETED(6)` đã tồn tại
  (`ApprovalHistoryStatus.java:5,10,11`). Bảng `approval_history` đã có đủ cột (`ApprovalHistory.java:35-62`).
- **KHÔNG thêm code `APPROVE_C1`/`APPROVE_C2`/`REJECT_C1`/`REJECT_C2`** — duyệt/trả về tiếp tục
  dùng `APPROVED`/`REJECTED` + `approvalLevel` LEVEL_1/LEVEL_2 (pattern dùng chung M-1006 cho 28 loại
  KCHT, `InfrastructureApprovalService.java:126-127,138-139,185-186,197-198`; FE label map đã khớp,
  `HistoryTimeline.tsx:50-55`). Tạo code mới sẽ phá label map FE và lệch spec dùng chung — bác.
- Nếu sau này cần phân biệt hiển thị "Duyệt C1" vs "Duyệt C2", FE suy từ `approvalLevel` (đã có trong
  `HistoryEntry`), KHÔNG đổi backend.

### D2 — 3 điểm ghi sự kiện (thứ tự thời gian tự nhiên qua `approved_date`)

| Sự kiện | Vị trí ghi (method) | Cơ chế | Chủ sở hữu work order |
|---|---|---|---|
| `CREATED`/LEVEL_0 | cuối `service.create`, sau lần `repo.save` đầu thành công | `approvalHistoryRepo.save(ApprovalHistory.builder()...status(ApprovalHistoryStatus.CREATED).approvedBy(userId).reason("Tạo mới luồng hàng hải")...)` — pattern `ShipRepairFacilityService.java:96-105`; `approved_date` tự gán qua `@PrePersist` (`ApprovalHistory.java:70-75`) | **WO-F043-BE-1** |
| `UPDATED`/LEVEL_0 | cuối `service.update`, sau `save`, chỉ khi `hasFieldChanges` | Ghi kèm `changedField`/`previousValue`/`newValue` từ diff — chi tiết + cơ chế tại **WO-F039-BE-1** (design plan F-039 mục 5) — F-043 KHÔNG làm lại | F-039 |
| `DELETED`/LEVEL_0 | cuối `service.softDelete`, sau `save` | `ApprovalHistoryUtils.recordSoftDelete(approvalHistoryRepo, id, InfrastructureType.NAVIGATION_CHANNEL, operatorId, "Xóa luồng hàng hải")` — chi tiết tại **WO-F040-BE-1** (design plan F-040 mục 5) | F-040 |

Cả 3 điểm ghi đều nằm trong method `@Transactional` sẵn có → cùng transaction với thao tác chính
(không dòng history mồ côi). Với `create`: ghi sau `repo.save` đầu tiên (codegen + children) và trước
`return` — nếu GIS create thất bại sau đó, cả transaction rollback cả dòng history (đúng).

### D3 — Phía đọc: giữ nguyên, không đổi

- `getHistory` (`NavigationChannelService.java:418-438`) đã trả mọi sự kiện (mọi `status`) theo
  `approved_date DESC` + map tên user — tự nhiên hiển thị cả CREATED/UPDATED/DELETED lẫn phê duyệt.
- `getApprovalHistory` = delegate (`:466-470`); guard `navigationchannel:history` (`:128-132`);
  data scope qua `@DataScope` (`:25`).
- Hồ sơ không có sự kiện → `[]` (BR-043-05); hồ sơ không tồn tại/đã xóa → filter `deleted_at IS NULL`
  chặn (BR-043-05).

### D4 — FE

- `HistoryTimeline` đã render label/color đủ cho 6 code (`HistoryTimeline.tsx:50-55,33-39`) — **không
  cần sửa component**.
- Gap nhỏ: sửa type `HistoryEntry.id` từ `number` → `string` (BE trả UUID)
  (`types/navigationChannel.ts:197`) — **WO-F043-FE-1**.
- Kiểm chứng timeline trong chi tiết (`NavigationChannelForm.tsx:771`) hiển thị đủ chuỗi
  CREATED → PROPOSED → APPROVED/REJECTED → (UPDATED) → DELETED theo thứ tự giảm dần.

## 4. Mapping acceptance criteria

| AC | Thiết kế đáp ứng | Oracle kiểm chứng |
|---|---|---|
| AC-043-01 | D3 (đọc DESC) + sự kiện F-041 | Chuỗi submit→C1→C2 → 3 sự kiện đúng thứ tự; thêm CREATED → 4 sự kiện |
| AC-043-02 | Giữ nguyên (reject có `reason`) | Sự kiện `REJECTED`/LEVEL_1 có `reason` |
| AC-043-03/04 | Giữ nguyên | `[]` khi không có sự kiện; lỗi tiếng Việt khi không tồn tại |
| AC-043-05/06 | Giữ nguyên | 403 thiếu `navigationchannel:history`; chặn ngoài phạm vi |
| BR-043-07 (CREATED/UPDATED/DELETED) | D2 | Tạo → 1 dòng `CREATED` (status ordinal 0, LEVEL_0); sửa → 1 dòng `UPDATED` (ordinal 5); xóa → 1 dòng `DELETED` (ordinal 6) — cả 3 theo `approved_date` đúng thứ tự |

## 5. Work orders — tách file BE/FE (disjoint)

### Backend
| WO | File | Nội dung | Oracle |
|---|---|---|---|
| WO-F043-BE-1 | `src/main/java/com/hanghai/kchtg/navigationchannel/service/NavigationChannelService.java` | D2-CREATED: cuối `create` (`:157-160`, trước `return toResponse(nc)`) ghi `ApprovalHistory` `status=CREATED`/`approvalLevel=LEVEL_0`/`approvedBy=userId`/`reason="Tạo mới luồng hàng hải"` (pattern `ShipRepairFacilityService.java:96-105`). Import `ApprovalHistoryStatus` (đã có), `ApprovalLevel` (đã có). KHÔNG đụng `update`/`softDelete` (thuộc F-039/F-040) | `mvn -DskipTests compile`; integration: tạo mới → 1 dòng `approval_history` `ref_type` ordinal 6, `status` ordinal 0, `approval_level` 0, `approved_by`=userId; tạo thất bại (write-scope) → KHÔNG có dòng history |
| WO-F043-BE-V1 | `src/test/java/.../navigationchannel/` (integration test) | Kiểm chứng đủ chuỗi timeline: CREATED → PROPOSED → APPROVED/LEVEL_1 → APPROVED/LEVEL_2 → (sửa → UPDATED) → (xóa → DELETED); assert thứ tự `approved_date` DESC qua `GET /{id}/history`; `[]` khi chưa có sự kiện; 403 thiếu `navigationchannel:history` | Toàn bộ test pass (`mvn test`); lệch → báo SA/PMO |

Thứ tự thực thi: WO-F043-BE-1 độc lập; test V1 chạy sau khi F-039/F-040 BE merged (cần UPDATED/DELETED).

### Frontend
| WO | File | Nội dung | Oracle |
|---|---|---|---|
| WO-F043-FE-1 | `frontend/src/types/navigationChannel.ts` | D4: đổi `HistoryEntry.id: number` → `id: string` (`:197`) | `pnpm exec tsc --noEmit` pass; timeline render không đổi hành vi |
| WO-F043-FE-V1 | `frontend/src/pages/navigationchannel/NavigationChannelForm.tsx` (kiểm chứng) | Kiểm chứng `HistoryTimeline` (`:771`) hiển thị đủ sự kiện CREATED/UPDATED/DELETED + phê duyệt với label tiếng Việt, mới nhất trên cùng | UI test: sau tạo→sửa→xóa, timeline có 3 sự kiện đúng label "Tạo mới"/"Cập nhật"/"Xóa mềm" |

## 6. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Ghi CREATED sau save đầu nhưng rollback do GIS → history biến mất | Không (đúng) | Cùng transaction — rollback sạch cả 2 |
| Trùng dòng history khi retry codegen collision | Thấp | Ghi CREATED **sau** block retry (`:147-155`), chỉ 1 lần |
| FE label thiếu code mới | Không | Label/color đã có sẵn (`HistoryTimeline.tsx:50-55,33-39`) — kiểm chứng ở V1 |

## 7. Ràng buộc bắt buộc (nhắc lại cho implementer)

- Tên field/API English chuẩn; message/label UI tiếng Việt có dấu.
- KHÔNG hardcode enum string — dùng `ApprovalHistoryStatus.CREATED`, `ApprovalLevel.LEVEL_0`,
  `InfrastructureType.NAVIGATION_CHANNEL` (không viết số 0/6).
- Enum xuống DB giữ ORDINAL SMALLINT; KHÔNG thêm giá trị `ApprovalHistoryStatus`/`ApprovalStatus`.
- KHÔNG migration cho F-043 (bảng `approval_history` đã đủ).
- KHÔNG sửa `InfrastructureApprovalService` (sự kiện phê duyệt đã đúng); KHÔNG đụng `update`/`softDelete`
  của `NavigationChannelService` (thuộc F-039/F-040).
- KHÔNG chạy backend; xác nhận bằng `mvn -DskipTests compile` + test theo oracle.
