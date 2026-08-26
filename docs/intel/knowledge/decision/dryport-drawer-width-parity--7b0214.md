---
id: AM-7b0214328ede7bb1
kind: decision
topic: dryport-drawer-width-parity
tags: []
importance: 0.8
agent: 
created: 2026-08-26T06:22:36.277Z
updated: 2026-08-26T06:22:36.277Z
---

Cảng cạn (DryPortListPage.tsx) 2026-08-26 — đã bỏ size={1000} ở 3 drawer Thêm mới/Chỉnh sửa/Chi tiết (chỉ giữ history 880) để kế thừa drawerProps width:'50%' (tokens.ts:392) — khớp Berth/Anchorage vốn không override size. Chuẩn size drawer nhóm KCHT: create/edit/detail = width 50% qua drawerProps (Berth/Anchorage/DryPort), riêng PortListPage vẫn override create/edit=1000, detail lồng=950, map=900, history=880 — Port là màn cũ chưa đồng bộ, nếu user muốn chuẩn hóa tiếp phải sửa PortListPage. Verify: npm run build + npx tsc --noEmit exit 0.
