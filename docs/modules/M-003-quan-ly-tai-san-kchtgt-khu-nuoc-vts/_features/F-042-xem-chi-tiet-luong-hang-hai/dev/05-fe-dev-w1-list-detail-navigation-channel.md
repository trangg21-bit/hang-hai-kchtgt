# FE Dev Report — F-042 Xem chi tiết Luồng hàng hải (Wave 1)

## Scope
**FE đã implement từ F-038 — kiểm chứng, không sửa.** Không có thay đổi code nào trong dispatch này cho F-042.

## Kiểm chứng (anchor đã mở phiên này)
| Hạng mục | Trạng thái | Anchor |
|---|---|---|
| Danh sách (List) | `NavigationChannelList` dùng `ScreenHeader` + `FilterTableLayout` + `DataTable` + `Pagination` từ `frontend/src/components/list-view/` (import `:10-12`); cột #1/#2/#4/#5/#6/#8/#47/#48; `EmptyState` khi rỗng; `scroll={{ x: 'max-content', y: 400 }}` | `frontend/src/pages/navigationchannel/NavigationChannelList.tsx:10-12`, `:510-519` (DataTable JSX) |
| Hành động Xem chi tiết | `rowActions` push action `view` → `openModal('detail', record.id)` khi có `navigationchannel:read` — mở popup/modal trên chính trang danh sách, không route trang mới (đúng convention) | `frontend/src/pages/navigationchannel/NavigationChannelList.tsx:331-332` |
| Detail mode | `isDetailMode = isModalMode ? (mode === 'detail') : (!!id && !isEditMode)`; render detail thay form khi `if (isDetailMode)` | `frontend/src/pages/navigationchannel/NavigationChannelForm.tsx:97`, `:596` |
| Render chi tiết | Các Card `Descriptions`: Hồ sơ chính #1-#21, Tình trạng, Trạng thái & phê duyệt #47-#57, Thông tin liên quan #58-#71, File đính kèm #46, `ApprovalActionBar`, `HistoryTimeline` — dùng `cardStyle`/`spaceMd`/`sectionTitle` token | `frontend/src/pages/navigationchannel/NavigationChannelForm.tsx:698-770` |

## Output verify (chạy thực tế — gate chung toàn FE)
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
(Pnpm binary không có trên PATH máy này; dùng `npx` resolve binary local trong `frontend/node_modules`, tương đương `pnpm exec`.)

## Ghi chú
- Không sửa thêm gì cho F-042 — tránh chạm code F-038 đã chốt.
- Oracle UI (hiển thị detail thực tế với dữ liệu 71 trường) cần backend + dữ liệu; xác nhận hiện tại bằng source anchor + gate build.
