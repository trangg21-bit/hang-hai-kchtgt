---
id: AM-2dc7aa7cd868e0cc
kind: gotcha
topic: antd-v6-drawer-push
tags: []
importance: 0.85
agent: 
created: 2026-08-26T01:17:08.977Z
updated: 2026-08-26T01:24:38.948Z
---

antd v6 Drawer có prop `push` mặc định {distance:180}: Drawer con mở bên trong Drawer cha sẽ gọi parentContext.push() → Drawer cha bị translateX(-180px). Đã xử lý xong cho Anchorage (M-0xx): form con 'Thêm mới khu nước neo buộc tàu' trong AnchorageForm đã CHUYỂN TỪ Drawer lồng SANG Modal (width 950, destroyOnHidden, mask={{closable:false}}, styles.body maxHeight scroll) — giống convention 4 form KCHT khác (DikeRevetment/NavigationChannel/RadarStation/ShipRepair). Token drawerProps (tokens.ts) vẫn giữ `push: false` làm guard cho mọi Drawer CRUD chuẩn. Lưu ý: prop push đặt trên Drawer con KHÔNG ngăn việc đẩy cha — phải tắt ở cha hoặc không dùng Drawer lồng.
