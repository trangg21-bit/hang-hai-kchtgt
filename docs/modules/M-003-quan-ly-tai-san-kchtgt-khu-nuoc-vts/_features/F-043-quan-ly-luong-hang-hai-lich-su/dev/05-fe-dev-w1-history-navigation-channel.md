# FE Dev Report — F-043 Lịch sử Luồng hàng hải (Wave 1)

## Scope
Implement WO-F043-FE-1 (design plan F-043, D4): đổi `HistoryEntry.id: number` → `id: string` + kiểm chứng (WO-F043-FE-V1) timeline lịch sử hiển thị label tiếng Việt cho CREATED/UPDATED/DELETED + APPROVED/REJECTED.

## File sửa + anchor
| File | Anchor | Thay đổi |
|---|---|---|
| `frontend/src/types/navigationChannel.ts` | `:231` (interface `HistoryEntry`, khối Approval `:227-237`) | `id: number` → `id: string`. Backend `GET /{id}/history` trả UUID string; type cũ `number` sai contract API. |

### Tác động type (đã rà soát toàn repo)
- `navigationChannelService.ts:110-112` — `getHistory(id): Promise<HistoryEntry[]>`: chỉ map response qua `toArray<HistoryEntry>(res.data)`, không dùng `id` kiểu số → an toàn.
- `NavigationChannelForm.tsx:101` — state `history` khai `useState<any[]>([])`; `HistoryTimeline` nhận prop `history` không đụng `entry.id` → không đổi hành vi render.
- `components/shared/HistoryTimeline.tsx:4-6` — interface nội bộ `id?: string | number` chấp nhận cả 2 → tương thích.
- Các `HistoryEntry` khác (`vtsSystem.ts`, `dikeRevetment.ts`, `shipRepairFacility.ts`, `radarStation.ts`) là type riêng từng module, không dùng chung → không bị ảnh hưởng.

## Kiểm chứng label + thứ tự (WO-F043-FE-V1 — source verified)
| Hạng mục | Trạng thái | Anchor |
|---|---|---|
| Label tiếng Việt | `STATUS_LABEL_MAP`: `CREATED:'Tạo mới'`, `UPDATED:'Cập nhật'`, `APPROVED:'Phê duyệt'`, `REJECTED:'Từ chối'`, `DELETED:'Xóa mềm'`, `PROPOSED:'Chờ duyệt'`, `PENDING_APPROVAL:'Chờ phê duyệt'` — đủ mọi sự kiện | `frontend/src/components/shared/HistoryTimeline.tsx:33-39` |
| Màu sự kiện | `STATUS_COLOR_MAP` cover CREATED/UPDATED/DELETED/APPROVED/REJECTED/PROPOSED/PENDING_APPROVAL | `frontend/src/components/shared/HistoryTimeline.tsx:25-31` |
| Render path | `displayStatus = STATUS_LABEL_MAP[status] || status`; `translateFieldText` dịch `changedField`/`previousValue`/`newValue` sang tiếng Việt; `id` không được dùng trong render | `frontend/src/components/shared/HistoryTimeline.tsx:239-268` (label `:246`) |
| Thứ tự mới nhất trên cùng | Component render theo thứ tự mảng `history` nhận từ API; backend `GET /{id}/history` sort `approved_date DESC` (design plan F-043 WO-F043-BE-V1) — FE không cần sort lại | `NavigationChannelForm.tsx:771-786` (gọi `getHistory`) |
| Sự kiện UPDATED/DELETED | Chỉ phát sinh khi F-039/F-040 BE merged (ghi history qua `ApprovalHistoryStatus.UPDATED/DELETED`) — BE là dispatch riêng, UI test end-to-end phải chạy sau khi BE xong | — |

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
(Pnpm binary không có trên PATH máy này; dùng `npx` resolve binary local trong `frontend/node_modules`, tương đương `pnpm exec`.)

## Ghi chú
- Oracle "timeline render không đổi hành vi" thỏa: `id` không được đọc trong render path.
- Oracle UI (tạo→sửa→xóa cho 3 sự kiện) phụ thuộc BE F-039/F-040 (ghi UPDATED/DELETED); đã xác nhận label/màu/render path sẵn sàng, chờ BE merge để chạy E2E.
