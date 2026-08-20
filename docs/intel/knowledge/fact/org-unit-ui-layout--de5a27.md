---
id: AM-de5a273dce3559b8
kind: fact
topic: org-unit-ui-layout
tags: []
importance: 0.6
agent: 
created: 2026-08-17T06:12:43.332Z
updated: 2026-08-17T06:12:43.332Z
---

Màn Quản lý đơn vị (frontend/src/pages/organizations/UnitList.tsx): cả 3 chế độ Tạo/Sửa/Xem chi tiết nằm chung trong 1 Drawer của UnitList (isViewing/editingOrg). UnitForm.tsx là trang route legacy (/organizations/create, /organizations/:id/edit) không có nút nào trong UI trỏ tới; từ 2026-08-17 form tạo/sửa dùng bố cục 2 cột (Row/Col span 12) khớp thứ tự grid view chi tiết.
