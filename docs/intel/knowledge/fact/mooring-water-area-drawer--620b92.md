---
id: AM-620b92de5841425f
kind: fact
topic: mooring-water-area-drawer
tags: []
importance: 0.8
agent: 
created: 2026-08-26T04:05:55.783Z
updated: 2026-08-26T04:05:55.783Z
---

Khu nước neo buộc tàu (AnchorageForm) 2026-08-26: user yêu cầu đổi popup Modal 'Thêm mới khu nước neo buộc tàu' thành DRAWER không đẩy Drawer cha. Đã sửa: AnchorageForm.tsx Modal → Drawer (placement right, width 950, push={false}, maskClosable={false}, destroyOnHidden, onClose, footer Lưu, styles.body scroll) + gỡ import Modal dư. QUAN TRỌNG: token drawerProps (tokens.ts:392) TRƯỚC ĐÂY CHƯA có push:false (memory cũ ghi 'vẫn giữ push:false' là SAI) → đã thêm push:false vào drawerProps làm guard chung — mọi Drawer CRUD spread drawerProps (create/edit/detail anchorage + các module khác) giờ không bị đẩy khi Drawer con lồng. Verify: npm run build exit 0. Tri: TRI-1787717104280-ef81.
