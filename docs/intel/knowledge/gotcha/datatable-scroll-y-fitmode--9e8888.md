---
id: AM-9e8888f8c3904ccc
kind: gotcha
topic: datatable-scroll-y-fitmode
tags: []
importance: 0.7
agent: 
created: 2026-08-22T03:43:05.075Z
updated: 2026-08-22T03:43:05.075Z
---

DataTable (frontend/src/components/list-view/DataTable.tsx) chỉ kích hoạt chế độ fit (thân bảng co sát nội dung, thanh phân trang nằm ngay dưới bản ghi cuối) khi scroll.y là SỐ (vd 550 như PortListPage). Truyền chuỗi 'calc(100vh - 450px)' khiến fit-mode bị bỏ qua → thân bảng luôn cao cố định, phân trang cách bản ghi cuối một khoảng trống. 2026-08-22 đã đổi BuoyStationList + BuoyListPage sang y: 550 theo chuẩn Cảng biển.
