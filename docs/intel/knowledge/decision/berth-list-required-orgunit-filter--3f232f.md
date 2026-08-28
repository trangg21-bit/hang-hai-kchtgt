---
id: AM-3f232f612afe8ab6
kind: decision
topic: berth-list-required-orgunit-filter
tags: []
importance: 0.7
agent: 
created: 2026-08-18T03:54:17.226Z
updated: 2026-08-18T03:54:17.226Z
---

BerthList.tsx (Quản lý bến cảng): bộ lọc 'Đơn vị quản lý' đã chuyển sang bắt buộc giống PortListPage (2026-08-18, TRI-1787025218744-5107): state khởi tạo undefined thay vì '__all__', tự chọn mặc định = orgUnitId của user qua /users/me (fallback đơn vị đầu tiên, có nhánh window.parent.kchtOrgUnits), mọi fetch (danh sách, tab counts, port options) gate bằng orgUnitReady, Reset về defaultOrgUnitId.current, label có dấu * đỏ và Select thêm allowClear. '__all__' vẫn map sang undefined trong fetchData/fetchCounts nên không vỡ luồng cũ.
