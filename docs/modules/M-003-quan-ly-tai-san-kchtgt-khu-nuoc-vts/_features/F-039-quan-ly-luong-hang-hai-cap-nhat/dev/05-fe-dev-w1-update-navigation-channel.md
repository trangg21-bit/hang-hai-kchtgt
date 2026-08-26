# FE Dev Report — F-039 Cập nhật Luồng hàng hải (Wave 1)

## Scope
Implement WO-F039-FE-1 (design plan F-039, D4): gating nút **Sửa** theo trạng thái phê duyệt trên màn danh sách Luồng hàng hải. Chỉ sửa code FE trong `frontend/src/pages/navigationchannel/**`; không đụng backend.

## File sửa + anchor
| File | Anchor | Thay đổi |
|---|---|---|
| `frontend/src/pages/navigationchannel/NavigationChannelList.tsx` | `:60-66` (module scope, ngay sau `STATUS_TAB_LIST`, trước `TAB_COLOR`) | Thêm hằng số `EDITABLE_APPROVAL_STATUSES: ApprovalStatus[] = ['DRAFT','PENDING_APPROVAL','APPROVED_LEVEL1','REJECTED_LEVEL1','REJECTED_LEVEL2']` — tập trạng thái được phép sửa, khớp D1 design plan (5 giá trị). Dùng `ApprovalStatus` type có sẵn (import `:16`), KHÔNG hardcode string rải rác. Hằng số module scope → không phát sinh dependency mới cho `useCallback`. |
| `frontend/src/pages/navigationchannel/NavigationChannelList.tsx` | `:334` (bên trong `rowActions`, `useCallback` tại `:328`) | Điều kiện hiển thị nút Sửa đổi từ `hasPerm('navigationchannel:update')` → `hasPerm('navigationchannel:update') && EDITABLE_APPROVAL_STATUSES.includes(record.approvalStatus)`. Hồ sơ `APPROVED`/`APPROVED_LEVEL2` (ngoài tập) không còn hiển thị nút Sửa dù có quyền `navigationchannel:update`. Giữ nguyên gating permission cũ. |

Chi tiết `record.approvalStatus` là `ApprovalStatus` (`types/navigationChannel.ts:141`) nên `includes()` type-safe; `rowActions` deps giữ nguyên `[hasPerm, refreshAfterMutation, openModal]`.

## Kiểm chứng trạng thái
- Tập cho phép sửa: `DRAFT`, `PENDING_APPROVAL`, `APPROVED_LEVEL1`, `REJECTED_LEVEL1`, `REJECTED_LEVEL2` — đúng D1/D4.
- Chặn sửa: `APPROVED`, `APPROVED_LEVEL2` (thiết kế: hồ sơ đã duyệt phải tạo mới để thay đổi).
- Modal edit (`NavigationChannelForm.tsx`) không cần guard riêng (D4): nút đã bị chặn ở danh sách; API là biên chặn cuối.

## Output verify (chạy thực tế)
`pnpm` binary không có trên PATH máy này; dùng `npx` resolve đúng binary local trong `frontend/node_modules` (lệnh tương đương `pnpm exec ...`).

```
$ npx tsc --noEmit        (workdir: frontend/)
(no output)
Command exited with code 0

$ npx vite build          (workdir: frontend/)
vite v8.1.5 building client environment for production...
✓ 4044 modules transformed.
✓ built in 1.30s
Command exited with code 0
```
Cả 2 gate pass. Cảnh báo chunk > 500 kB là warning có sẵn to repo (không phải do thay đổi này).

## Ghi chú
- Không hardcode màu/spacing/font-size: thay đổi thuần logic gating, không thêm UI mới.
- Oracle WO-F039-FE-1 (UI test 2 chiều) cần chạy trên môi trường có backend; tại thời điểm này xác nhận bằng typecheck + build pass và rà soát source.
