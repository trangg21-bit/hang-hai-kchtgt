---
id: AM-b382808c730142b4
kind: decision
topic: orgunit-filter-required-pier-dryport
tags: []
importance: 0.7
agent: 
created: 2026-08-18T03:58:02.949Z
updated: 2026-08-18T04:00:44.130Z
---

2026-08-18, TRI-1787025378037-2483: áp dụng 'Đơn vị quản lý bắt buộc giống Cảng biển' cho Cầu cảng (PierList.tsx) và Cảng cạn (DryPortList.tsx). PierList ĐÃ có sẵn chọn mặc định nên chỉ thêm dấu * + allowClear. DryPortList bổ sung: orgUnitReady + defaultOrgUnitId ref + defaultOrgApplied ref, tự chọn mặc định từ /users/me (fallback đơn vị đầu / '__all__'), gate fetch, reset về mặc định, label *. LƯU Ý CẬP NHẬT: options ĐVQL của DryPortList đã thêm mục 'Tất cả' (value '__all__') cho đồng bộ với BerthList/PierList/PortListPage; fetchData map '__all__' → undefined khi gọi API (nếu không backend nhận orgUnitId='__all__' → lọc sai). Tab counts của DryPortList vẫn KHÔNG scope theo orgUnitId (khác 3 màn kia) — tồn đọng chưa sửa.
