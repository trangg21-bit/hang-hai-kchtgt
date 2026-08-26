# FE Dev Report — F-040 Xóa (soft delete) Luồng hàng hải (Wave 1)

## Scope
Implement WO-F040-FE-1 (design plan F-040, D3): gating nút **Xóa** theo trạng thái phê duyệt trên màn danh sách Luồng hàng hải — xóa mềm chỉ dành cho hồ sơ `APPROVED`. Chỉ sửa code FE trong `frontend/src/pages/navigationchannel/**`.

## File sửa + anchor
| File | Anchor | Thay đổi |
|---|---|---|
| `frontend/src/pages/navigationchannel/NavigationChannelList.tsx` | `:337` (bên trong `rowActions`) | Điều kiện hiển thị nút Xóa đổi từ `hasPerm('navigationchannel:delete')` → `hasPerm('navigationchannel:delete') && record.approvalStatus === 'APPROVED'`. Hồ sơ `DRAFT`/`PENDING_APPROVAL`/`REJECTED_*` không còn hiển thị nút Xóa dù có quyền `navigationchannel:delete`. Khớp guard backend `APPROVED`-only (`NavigationChannelService.java:341` theo design plan F-040 D1). |

So sánh trước/sau:
```
trước: if (hasPerm('navigationchannel:delete')) {
sau:   if (hasPerm('navigationchannel:delete') && record.approvalStatus === 'APPROVED') {
```
`record.approvalStatus` là `ApprovalStatus` (`types/navigationChannel.ts:141`) — so sánh literal type-safe.

## Kiểm chứng trạng thái
- Nút Xóa hiển thị: chỉ `APPROVED`.
- Nút Xóa ẩn: `DRAFT`, `PROPOSED`, `PENDING_APPROVAL`, `APPROVED_LEVEL1`, `APPROVED_LEVEL2`, `REJECTED`, `REJECTED_LEVEL1`, `REJECTED_LEVEL2` — khớp D1 (giữ guard `APPROVED`-only đồng bộ 2 module sibling VTS/Cơ sở sửa chữa).

## Output verify (chạy thực tế)
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

## Finding (báo SA/PMO — không sửa ngoài phạm vi)
Design plan F-040 D3 ghi "UI giữ popup xác nhận hiện có", nhưng code hiện tại (delete handler trong `rowActions`, trước/sau edit) gọi thẳng `navigationChannelCRUD.delete(record.id)` **không có** `Popconfirm`/`Modal.confirm` xác nhận trước khi xóa. Không tồn tại popup xác nhận để "giữ". Đề xuất: SA xác nhận có thêm popup xác nhận xóa (pattern list-screen chuẩn dự án) ở wave sau; FE wave này chỉ thực hiện gating theo WO.

## Ghi chú
- Không hardcode màu/spacing/font-size; thay đổi thuần logic gating.
- Oracle WO-F040-FE-1 (UI test 2 chiều) cần backend; xác nhận hiện tại bằng typecheck + build pass + rà soát source.
