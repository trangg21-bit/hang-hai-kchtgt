---
feature-id: F-042
module-id: M-003
document: design-plan
stage: engineering-solution-designer
status: accepted
last-updated: 2026-08-26
source-of-truth:
  - _features/F-042-xem-chi-tiet-luong-hang-hai/feature-brief.md
  - _features/F-042-xem-chi-tiet-luong-hang-hai/ba/00-lean-spec.md
---

# Design Plan — F-042 Danh sách / Chi tiết Luồng hàng hải (M-003)

## 1. Mục đích và phạm vi

F-042 là màn hình đọc: danh sách phân trang + bộ lọc + StatusTabs + chi tiết 71 trường của hồ sơ
Luồng hàng hải. Toàn bộ endpoint đọc, filter, data scope và FE list/detail **đã implement cùng
F-038 (commit ed400cf7)**. File này KHÔNG thiết kế lại — **xác nhận hiện trạng bằng anchor đã mở +
liệt kê work order kiểm chứng + gap nhỏ có chủ sở hữu rõ** (không bịa việc thừa). Mọi nhận định
"hiện trạng" đều dẫn nguồn `Basename.ext:line` trong phiên này.

## 2. Hiện trạng code (đã verify — anchor)

| Hạng mục | Hiện trạng | Anchor |
|---|---|---|
| Endpoint đọc | `GET /` (list, guard `navigationchannel:read`), `GET /{id}` (detail), `GET /search` (6 filter), `GET /approval-status/{status}` (tab nhanh) | `NavigationChannelController.java:44-49,51-58,134-138,140-157` |
| Search service | `searchDocuments`: filter `orgUnitId`/`seaportId`/`provinceId`/`conditionStatus`/`keyword`/`approvalStatus`; sort `created_at DESC`; trả `SearchResultResponse` | `NavigationChannelService.java:483-504`; repository `NavigationChannelRepository.java:37` |
| Data scope đọc | `@DataScope` class-level → `DataScopeAspect` bật `orgUnitFilter` + `recordSecurityLevelFilter` | `NavigationChannelController.java:25`; `NavigationChannel.java:20-21` |
| Detail response | `toResponse(nc, includeDetails)` trả 71 trường + routeDetails + coordinateList + attachments + `orgUnitName` qua `OrgUnitCacheService` | `NavigationChannelService.java:511-635,660-663` |
| FE list | `NavigationChannelList.tsx`: cột #4/#5/#6/#8/#47/#48 (`:280-320`), StatusTabs (`:50-54`), filter `OrgUnitTreeSelect` giữ `orgUnitId` (`:352-366`), phân trang | `NavigationChannelList.tsx` |
| FE detail | `NavigationChannelForm.tsx` chế độ detail: #1-#46 read-only, #47-#71 read-only + `ApprovalStatusBadge`, khối `ApprovalActionBar` + `HistoryTimeline`, null → "—" | `NavigationChannelForm.tsx:700-790,722,758-771` |
| Metadata nhạy cảm | Hiển thị theo quyền `navigationchannel:read:restricted`/`read:confidential` (seed sẵn) | `PermissionSeeder.java:294-310` (design plan F-038 mục 8) |

## 3. Quyết định thiết kế (xác nhận + gap nhỏ)

1. **Giữ nguyên** endpoint, filter set, data scope, cột danh sách, nhóm chi tiết — khớp BA brief
   (triage BA verdict `Low risk`, không có điểm lệch hành vi).
2. **Gap nhỏ — có chủ sở hữu, không làm trùng:**
   - Gating nút Sửa/Xóa theo trạng thái ở danh sách → nằm ở **WO-F039-FE-1 / WO-F040-FE-1**
     (design plan F-039 mục 5 / F-040 mục 5) — F-042 chỉ kiểm chứng, không sửa.
   - Type `HistoryEntry.id: number` (FE) vs UUID string (BE) → nằm ở **WO-F043-FE-1**
     (design plan F-043 mục 5) — F-042 không sửa.
3. **KHÔNG migration, KHÔNG đổi DTO/entity** cho F-042 — toàn bộ nguồn đọc đã chốt F-038
   (`navigation_channel` + bảng con + `approval_history` + `infrastructure_attachments`).

## 4. Mapping acceptance criteria

| AC | Thiết kế đáp ứng | Oracle kiểm chứng |
|---|---|---|
| AC-042-01..07 | Hiện trạng mục 2 | Chạy TS-042-01..07 (UI/integration/security) theo lean-spec |

## 5. Work orders — kiểm chứng (không thay đổi code, trừ khi test phát hiện lệch)

### Backend (kiểm chứng)
| WO | File | Nội dung | Oracle |
|---|---|---|---|
| WO-F042-BE-V1 | `src/test/java/.../navigationchannel/` (integration test mới) | Test: list mặc định page 0/size 20 sort `created_at` DESC chỉ hồ sơ chưa xóa; search kết hợp 6 filter (filter rỗng bị bỏ qua); tab `PENDING_APPROVAL` chỉ trả đúng trạng thái; user đơn vị con chỉ thấy subtree (data scope); GET `/{id}` ngoài phạm vi → 403/không tìm thấy; thiếu `navigationchannel:read` → 403 | Toàn bộ test pass (`mvn test`); lệch hành vi → báo SA/PMO, không tự sửa |

### Frontend (kiểm chứng)
| WO | File | Nội dung | Oracle |
|---|---|---|---|
| WO-F042-FE-V1 | `frontend/src/pages/navigationchannel/NavigationChannelList.tsx`, `NavigationChannelForm.tsx` (kiểm chứng) | Kiểm chứng 4 trạng thái bảng: loading/error/empty/data; cột đủ #4/#5/#6/#8/#47/#48; StatusTabs đếm đúng; filter đơn vị là cây giữ `orgUnitId`; chi tiết đủ #1-#71, #47-#71 read-only, null → "—", không placeholder #58-#71 | UI test theo TS-042-01..05; lệch → báo SA/PMO |

## 6. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Test kiểm chứng phát hiện lệch filter/scope chưa biết | Thấp | Test là biên phát hiện; lệch → báo cáo, không tự sửa |
| Gating Sửa/Xóa (F-039/F-040) làm thay đổi danh sách F-042 | Không | Work order FE gating thuộc F-039/F-040 — F-042 không chạm file ngoài kiểm chứng |

## 7. Ràng buộc bắt buộc (nhắc lại cho implementer)

- KHÔNG sửa `NavigationChannelController`/`Service`/DTO/entity/repository cho F-042.
- KHÔNG hardcode màu/spacing/font trong mọi UI mới nếu có điều chỉnh — dùng `theme.ts`/`tokens.ts`
  preset + list-view components.
- Message test assert tiếng Việt có dấu; tên test/class English chuẩn.
- KHÔNG chạy backend; kiểm chứng bằng `mvn test` (focused) + `mvn -DskipTests compile`.
