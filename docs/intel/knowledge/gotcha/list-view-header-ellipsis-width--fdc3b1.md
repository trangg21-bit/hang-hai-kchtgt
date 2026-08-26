---
id: AM-fdc3b18251aed780
kind: gotcha
topic: list-view-header-ellipsis-width
tags: []
importance: 0.8
agent: 
created: 2026-08-20T08:28:19.726Z
updated: 2026-08-20T08:31:05.746Z
---

Gotcha UI list-view: DataTable (frontend/src/components/list-view/DataTable.tsx) mặc định ellipsis:true cho MỌI cột (chỉ tắt khi khai báo ellipsis:false) và header viết hoa toàn bộ (uppercase, single-line) → header 'ĐỊA ĐIỂM (TỈNH/TP)' bị cắt '...' khi width cột < ~162px. Đã fix 2026-08-20 CHỈ trên màn Quản lý cảng cạn (frontend/src/pages/port/DryPortList.tsx): STT 55→70, Địa điểm (Tỉnh/TP) 150→220. USER CHỐT: KHÔNG đụng BuoyListPage/BuoyStationList/BeaconList (đã revert nguyên trạng 60/170, 60/170, 60/150 theo yêu cầu). Lưu ý: app/dryport/DryPortListPage.tsx là file legacy KHÔNG được import.
